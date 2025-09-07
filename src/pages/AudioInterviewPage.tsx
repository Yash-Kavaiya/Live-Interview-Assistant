import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { GoogleGenAI, Modality } from '@google/genai'
import { 
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff, 
  Settings, ArrowLeft, Clock, Brain, Pause, Play,
  MessageSquare, BarChart3, Monitor, MonitorOff,
  PictureInPicture, Maximize2, Volume2, VolumeX,
  Send, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

interface InterviewState {
  isActive: boolean
  isPaused: boolean
  currentQuestion: number
  totalQuestions: number
  timeElapsed: number
  videoEnabled: boolean
  audioEnabled: boolean
  screenSharing: boolean
  viewMode: 'camera' | 'screen' | 'split'
  aiConnected: boolean
  isAiSpeaking: boolean
  isRecording: boolean
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  hasAudio?: boolean
  audioUrl?: string
}

function AudioInterviewPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const screenRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const geminiSessionRef = useRef<any>(null)
  
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentInput, setCurrentInput] = useState('')
  
  const [interviewState, setInterviewState] = useState<InterviewState>({
    isActive: false,
    isPaused: false,
    currentQuestion: 1,
    totalQuestions: 5,
    timeElapsed: 0,
    videoEnabled: true,
    audioEnabled: true,
    screenSharing: false,
    viewMode: 'camera',
    aiConnected: false,
    isAiSpeaking: false,
    isRecording: false
  })
  
  const role = searchParams.get('role') || 'software-engineer'
  const difficulty = searchParams.get('difficulty') || 'mid'
  
  const API_KEY = 'AIzaSyB8_Wd0uOiVMrIiobdb5EhmuZ9DeNQq-yU'

  // Format display names
  const roleDisplay = role.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
  
  const difficultyDisplay = difficulty.charAt(0).toUpperCase() + difficulty.slice(1)

  // Add message to conversation
  const addMessage = (role: 'user' | 'assistant', content: string, hasAudio?: boolean, audioUrl?: string) => {
    setMessages(prev => [...prev, {
      role,
      content,
      timestamp: new Date(),
      hasAudio,
      audioUrl
    }])
  }

  // Convert audio data to playable blob
  const convertToWav = (rawData: string, mimeType: string) => {
    try {
      const buffer = atob(rawData)
      const arrayBuffer = new ArrayBuffer(buffer.length)
      const view = new Uint8Array(arrayBuffer)
      for (let i = 0; i < buffer.length; i++) {
        view[i] = buffer.charCodeAt(i)
      }
      return new Blob([arrayBuffer], { type: 'audio/wav' })
    } catch (error) {
      console.error('Error converting audio:', error)
      return null
    }
  }

  // Play audio response
  const playAudioBlob = (blob: Blob) => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    
    const audio = new Audio(URL.createObjectURL(blob))
    audioRef.current = audio
    
    audio.onplay = () => setInterviewState(prev => ({ ...prev, isAiSpeaking: true }))
    audio.onended = () => setInterviewState(prev => ({ ...prev, isAiSpeaking: false }))
    audio.onerror = () => setInterviewState(prev => ({ ...prev, isAiSpeaking: false }))
    
    audio.play().catch(console.error)
  }

  // Initialize Gemini Live API
  const connectToGemini = async () => {
    try {
      console.log('🔄 Connecting to Gemini Live API...')
      
      const ai = new GoogleGenAI({ apiKey: API_KEY })

      const session = await ai.live.connect({
        model: 'models/gemini-2.0-flash-exp',
        callbacks: {
          onopen: () => {
            console.log('✅ Connected to Gemini Live API')
            setInterviewState(prev => ({ ...prev, aiConnected: true }))
            
            // Wait a moment before sending initial prompt
            setTimeout(() => {
              console.log('📤 Sending initial interview prompt...')
              try {
                session.sendClientContent({
                  turns: [{
                    role: 'user',
                    parts: [{ 
                      text: `You are an AI interviewer conducting a ${difficultyDisplay} level ${roleDisplay} interview. Please start with a warm professional greeting and ask your first interview question. Be encouraging and provide constructive feedback. Keep responses concise and focused.` 
                    }]
                  }]
                })
              } catch (error) {
                console.error('❌ Error sending initial prompt:', error)
              }
            }, 1000)
          },
          onmessage: (message) => {
            console.log('📨 Received message from Gemini:', message)
            
            if (message.serverContent?.modelTurn?.parts) {
              let textContent = ''
              let hasAudio = false
              let audioUrl = ''
              
              for (const part of message.serverContent.modelTurn.parts) {
                if (part?.text) {
                  textContent += part.text
                }
                if (part?.inlineData && part.inlineData.data && part.inlineData.mimeType) {
                  hasAudio = true
                  const audioBlob = convertToWav(part.inlineData.data, part.inlineData.mimeType)
                  if (audioBlob) {
                    audioUrl = URL.createObjectURL(audioBlob)
                    playAudioBlob(audioBlob)
                  }
                }
              }
              
              if (textContent || hasAudio) {
                addMessage('assistant', textContent || '*Audio response*', hasAudio, audioUrl)
                setInterviewState(prev => ({ 
                  ...prev, 
                  currentQuestion: prev.currentQuestion + (textContent.includes('?') ? 1 : 0)
                }))
              }
            }
          },
          onerror: (error) => {
            console.error('❌ Gemini API Error:', error)
            addMessage('assistant', `Connection error: ${error.message || 'Unknown error'}. Please try starting the interview again.`)
            setInterviewState(prev => ({ ...prev, aiConnected: false }))
          },
          onclose: (event) => {
            console.log('🔌 Gemini session closed:', event)
            setInterviewState(prev => ({ ...prev, aiConnected: false }))
            if (interviewState.isActive) {
              addMessage('assistant', 'Connection lost. Please restart the interview.')
            }
          },
        },
        config: {
          responseModalities: [Modality.TEXT], // Start with text only for debugging
          // speechConfig: {
          //   voiceConfig: {
          //     prebuiltVoiceConfig: {
          //       voiceName: 'Aoede',
          //     }
          //   }
          // }
        }
      })

      geminiSessionRef.current = session
      console.log('✅ Gemini session established successfully')
      
    } catch (error) {
      console.error('❌ Failed to connect to Gemini:', error)
      addMessage('assistant', `Failed to connect to AI: ${error.message || 'Unknown error'}. Please check your internet connection and try again.`)
      setInterviewState(prev => ({ ...prev, aiConnected: false }))
    }
  }

  // Send message to AI
  const sendMessage = async () => {
    if (!currentInput.trim() || !geminiSessionRef.current || !interviewState.aiConnected) {
      console.warn('❌ Cannot send message: missing input, session, or not connected')
      return
    }

    const messageToSend = currentInput.trim()
    addMessage('user', messageToSend)
    setCurrentInput('')

    try {
      console.log('📤 Sending message to Gemini:', messageToSend)
      await geminiSessionRef.current.sendClientContent({
        turns: [{
          role: 'user',
          parts: [{ text: messageToSend }]
        }]
      })
      console.log('✅ Message sent successfully')
    } catch (error) {
      console.error('❌ Failed to send message:', error)
      addMessage('assistant', `Error sending message: ${error.message}. Please try again.`)
    }
  }

  // Initialize camera and start interview
  useEffect(() => {
    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        })
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      } catch (error) {
        console.error('Failed to access camera:', error)
      }
    }

    initCamera()
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop())
      }
      if (geminiSessionRef.current) {
        geminiSessionRef.current.close()
      }
    }
  }, [])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (interviewState.isActive && !interviewState.isPaused) {
      interval = setInterval(() => {
        setInterviewState(prev => ({
          ...prev,
          timeElapsed: prev.timeElapsed + 1
        }))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [interviewState.isActive, interviewState.isPaused])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startInterview = async () => {
    console.log('🎬 Starting interview...')
    setInterviewState(prev => ({ ...prev, isActive: true }))
    addMessage('assistant', 'Starting interview... Connecting to AI interviewer...')
    
    try {
      await connectToGemini()
    } catch (error) {
      console.error('❌ Failed to start interview:', error)
      addMessage('assistant', `Failed to start interview: ${error.message}`)
      setInterviewState(prev => ({ ...prev, isActive: false }))
    }
  }

  const endInterview = () => {
    setInterviewState(prev => ({ 
      ...prev, 
      isActive: false, 
      isPaused: false,
      aiConnected: false 
    }))
    if (geminiSessionRef.current) {
      geminiSessionRef.current.close()
    }
  }

  const togglePause = () => {
    setInterviewState(prev => ({ ...prev, isPaused: !prev.isPaused }))
  }

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !interviewState.videoEnabled
        setInterviewState(prev => ({ ...prev, videoEnabled: !prev.videoEnabled }))
      }
    }
  }

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !interviewState.audioEnabled
        setInterviewState(prev => ({ ...prev, audioEnabled: !prev.audioEnabled }))
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI Interview Practice</h1>
              <p className="text-muted-foreground">
                {roleDisplay} • {difficultyDisplay} Level • {messages.length} exchanges
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant={interviewState.aiConnected ? 'default' : 'secondary'}>
              {interviewState.aiConnected ? 'AI Connected' : 'AI Disconnected'}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {formatTime(interviewState.timeElapsed)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Panel */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Video Feed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {!interviewState.videoEnabled && (
                    <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                      <VideoOff className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Controls */}
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant={interviewState.videoEnabled ? 'default' : 'destructive'}
                    size="sm"
                    onClick={toggleVideo}
                  >
                    {interviewState.videoEnabled ? (
                      <Video className="w-4 h-4" />
                    ) : (
                      <VideoOff className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant={interviewState.audioEnabled ? 'default' : 'destructive'}
                    size="sm"
                    onClick={toggleAudio}
                  >
                    {interviewState.audioEnabled ? (
                      <Mic className="w-4 h-4" />
                    ) : (
                      <MicOff className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant={interviewState.isAiSpeaking ? 'default' : 'outline'}
                    size="sm"
                    disabled
                  >
                    {interviewState.isAiSpeaking ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Interview Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Interview Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.min(interviewState.currentQuestion, interviewState.totalQuestions)}/{interviewState.totalQuestions}</span>
                  </div>
                  <Progress 
                    value={(Math.min(interviewState.currentQuestion, interviewState.totalQuestions) / interviewState.totalQuestions) * 100} 
                    className="h-2"
                  />
                </div>
                
                <Separator />
                
                <div className="flex justify-center gap-2">
                  {!interviewState.isActive ? (
                    <Button onClick={startInterview} className="w-full">
                      <Play className="w-4 h-4 mr-2" />
                      Start Interview
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={togglePause}
                        disabled={!interviewState.aiConnected}
                      >
                        {interviewState.isPaused ? (
                          <Play className="w-4 h-4" />
                        ) : (
                          <Pause className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={endInterview}
                      >
                        <PhoneOff className="w-4 h-4 mr-2" />
                        End Interview
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conversation Panel */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  AI Interview Conversation
                  {interviewState.isAiSpeaking && (
                    <Badge variant="default" className="ml-auto">
                      <Volume2 className="w-3 h-3 mr-1" />
                      Speaking
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              
              {/* Messages */}
              <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      {interviewState.aiConnected 
                        ? "AI is preparing your first interview question..." 
                        : "Click 'Start Interview' to begin your AI-powered practice session."
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
                              : 'bg-gray-100 border'
                          }`}
                        >
                          <div className="text-sm font-medium mb-1">
                            {message.role === 'user' ? 'You' : 'AI Interviewer'}
                          </div>
                          <div className="text-sm">{message.content}</div>
                          {message.hasAudio && (
                            <div className="mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (message.audioUrl) {
                                    const audio = new Audio(message.audioUrl)
                                    audio.play()
                                  }
                                }}
                                className="text-xs"
                              >
                                <Volume2 className="w-3 h-3 mr-1" />
                                Play Audio
                              </Button>
                            </div>
                          )}
                          <div className="text-xs mt-2 opacity-70">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input Area */}
                <div className="border-t pt-4">
                  <div className="flex gap-2">
                    <Textarea
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={interviewState.aiConnected ? "Type your response..." : "Start the interview to respond"}
                      disabled={!interviewState.aiConnected || interviewState.isPaused}
                      className="resize-none"
                      rows={2}
                    />
                    <Button 
                      onClick={sendMessage}
                      disabled={!interviewState.aiConnected || !currentInput.trim() || interviewState.isPaused}
                      size="sm"
                      className="self-end"
                    >
                      {interviewState.isAiSpeaking ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Press Enter to send • AI will respond with both text and voice
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AudioInterviewPage
