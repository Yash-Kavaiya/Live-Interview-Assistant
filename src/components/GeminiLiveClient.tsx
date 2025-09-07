import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality, MediaResolution } from '@google/genai';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Send, Volume2, VolumeX, Phone, PhoneOff, Play, Square } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  hasAudio?: boolean;
  audioUrl?: string;
}

export function GeminiLiveClient() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [audioSupported, setAudioSupported] = useState(false);

  const sessionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const API_KEY = 'AIzaSyB8_Wd0uOiVMrIiobdb5EhmuZ9DeNQq-yU';

  useEffect(() => {
    // Check if audio is supported
    setAudioSupported(!!navigator.mediaDevices?.getUserMedia);
    
    return () => {
      // Cleanup on unmount
      if (sessionRef.current) {
        sessionRef.current.close();
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
    };
  }, []);

  const addMessage = (role: 'user' | 'assistant', content: string, hasAudio?: boolean, audioUrl?: string) => {
    setMessages(prev => [...prev, {
      role,
      content,
      timestamp: new Date(),
      hasAudio,
      audioUrl
    }]);
  };

  const convertToWav = (rawData: string, mimeType: string) => {
    try {
      const buffer = atob(rawData);
      const arrayBuffer = new ArrayBuffer(buffer.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < buffer.length; i++) {
        view[i] = buffer.charCodeAt(i);
      }
      return new Blob([arrayBuffer], { type: 'audio/wav' });
    } catch (error) {
      console.error('Error converting audio:', error);
      return null;
    }
  };

  const playAudioBlob = (blob: Blob) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    
    const audio = new Audio(URL.createObjectURL(blob));
    currentAudioRef.current = audio;
    
    audio.onplay = () => setIsPlayingAudio(true);
    audio.onended = () => setIsPlayingAudio(false);
    audio.onerror = () => setIsPlayingAudio(false);
    
    audio.play().catch(console.error);
  };

  const connectToGemini = async () => {
    try {
      setConnectionStatus('connecting');
      setError(null);

      const ai = new GoogleGenAI({
        apiKey: API_KEY,
      });

      const session = await ai.live.connect({
        model: 'models/gemini-2.0-flash-exp',
        callbacks: {
          onopen: () => {
            console.log('Connected to Gemini Live API with Audio Support');
            setConnectionStatus('connected');
            setIsConnected(true);
            addMessage('assistant', 'Hello! I\'m your AI interview assistant with full audio support. I can speak to you and understand your voice. What role are you preparing for today?');
          },
          onmessage: (message) => {
            console.log('Received message:', message);
            
            if (message.serverContent?.modelTurn?.parts) {
              let textContent = '';
              let hasAudio = false;
              let audioUrl = '';
              
              for (const part of message.serverContent.modelTurn.parts) {
                if (part?.text) {
                  textContent += part.text;
                }
                if (part?.inlineData && part.inlineData.data && part.inlineData.mimeType) {
                  hasAudio = true;
                  const audioBlob = convertToWav(part.inlineData.data, part.inlineData.mimeType);
                  if (audioBlob) {
                    audioUrl = URL.createObjectURL(audioBlob);
                    // Auto-play audio response
                    playAudioBlob(audioBlob);
                  }
                }
              }
              
              if (textContent || hasAudio) {
                addMessage('assistant', textContent || '*Audio response*', hasAudio, audioUrl);
              }
            }
            
            // Handle transcriptions
            if (message.serverContent?.inputTranscription?.text) {
              console.log('Input transcription:', message.serverContent.inputTranscription.text);
            }
            
            if (message.serverContent?.outputTranscription?.text) {
              console.log('Output transcription:', message.serverContent.outputTranscription.text);
            }
          },
          onerror: (error) => {
            console.error('Gemini Live API Error:', error);
            setError(error.message || 'Connection error occurred');
            setConnectionStatus('error');
          },
          onclose: (event) => {
            console.log('Connection closed:', event.reason);
            setIsConnected(false);
            setConnectionStatus('disconnected');
          },
        },
        config: {
          responseModalities: [Modality.AUDIO, Modality.TEXT],
          mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Zephyr',
              }
            }
          },
          systemInstruction: {
            parts: [{
              text: `You are a professional AI interview assistant with voice capabilities. 
              - Conduct mock interviews with audio responses
              - Ask relevant questions based on the user's role
              - Be encouraging and provide constructive feedback
              - Use natural speech patterns when responding with audio
              - Keep responses concise but helpful`
            }]
          }
        }
      });

      sessionRef.current = session;

    } catch (error) {
      console.error('Failed to connect to Gemini Live API:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect');
      setConnectionStatus('error');
    }
  };

  const disconnect = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !sessionRef.current) return;

    const messageToSend = currentMessage.trim();
    addMessage('user', messageToSend);
    setCurrentMessage('');

    try {
      await sessionRef.current.sendClientContent({
        turns: [{
          role: 'user',
          parts: [{
            text: messageToSend
          }]
        }]
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Gemini Live Interview Assistant</span>
            <div className="flex items-center gap-2">
              <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
                {connectionStatus}
              </Badge>
              {!isConnected ? (
                <Button 
                  onClick={connectToGemini} 
                  disabled={connectionStatus === 'connecting'}
                  size="sm"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
                </Button>
              ) : (
                <Button 
                  onClick={disconnect} 
                  variant="destructive"
                  size="sm"
                >
                  <PhoneOff className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
              Error: {error}
            </div>
          )}

          {/* Chat Messages */}
          <div className="bg-gray-50 rounded-lg p-4 min-h-[400px] max-h-[500px] overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {isConnected 
                  ? "Connected! Start chatting with your AI interview assistant." 
                  : "Connect to Gemini Live API to start your mock interview session."
                }
              </div>
            ) : (
              messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white border'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">
                      {message.role === 'user' ? 'You' : 'AI Assistant'}
                    </div>
                    <div className="text-sm">{message.content}</div>
                    <div className={`text-xs mt-2 opacity-70 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <div className="flex gap-2">
            <Textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "Type your message..." : "Connect to start chatting"}
              disabled={!isConnected}
              className="resize-none"
              rows={2}
            />
            <Button 
              onClick={sendMessage}
              disabled={!isConnected || !currentMessage.trim()}
              size="sm"
              className="self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            This is a live connection to Google's Gemini AI for interview practice. 
            Messages are processed in real-time.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
