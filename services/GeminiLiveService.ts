import {
  GoogleGenAI,
  LiveServerMessage,
  MediaResolution,
  Modality,
  Session,
  BidiGenerateContentSetup,
} from '@google/genai';
import { MediaProcessor } from './MediaProcessor.js';
import { AudioProcessor } from './AudioProcessor.js';

export interface GeminiConfig {
  model?: string;
  responseModalities?: Modality[];
  mediaResolution?: MediaResolution;
  voiceName?: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private mediaProcessor: MediaProcessor;
  private audioProcessor: AudioProcessor;
  private activeSessions: Map<string, Session> = new Map();

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    this.mediaProcessor = new MediaProcessor();
    this.audioProcessor = new AudioProcessor();
  }

  async createSession(config: GeminiConfig = {}): Promise<Session> {
    const defaultConfig: BidiGenerateContentSetup = {
      model: config.model || 'models/gemini-2.5-flash-preview-native-audio-dialog',
      generationConfig: {
        responseModalities: config.responseModalities || [
          Modality.TEXT,
          Modality.AUDIO,
        ],
        mediaResolution: config.mediaResolution || MediaResolution.MEDIA_RESOLUTION_MEDIUM,
        temperature: config.temperature || 0.7,
        maxOutputTokens: config.maxOutputTokens || 8192,
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: config.voiceName || 'Zephyr',
            },
          },
        },
      },
      systemInstruction: config.systemInstruction ? {
        parts: [{ text: config.systemInstruction }],
        role: 'system',
      } : undefined,
      contextWindowCompression: {
        triggerTokens: 25600,
        slidingWindow: { 
          targetTokens: 12800 
        },
      },
      realtimeInputConfig: {
        automaticActivityDetection: {
          disabled: false,
          startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
          endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',
          prefixPaddingMs: 300,
          silenceDurationMs: 1000,
        },
        activityHandling: 'START_OF_ACTIVITY_INTERRUPTS',
        turnCoverage: 'TURN_INCLUDES_ONLY_ACTIVITY',
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    };

    const session = await this.ai.live.connect({
      config: defaultConfig,
      callbacks: {
        onopen: () => {
          console.log('Gemini Live session opened');
        },
        onmessage: (message: LiveServerMessage) => {
          this.handleServerMessage(message);
        },
        onerror: (error: ErrorEvent) => {
          console.error('Gemini Live error:', error.message);
        },
        onclose: (event: CloseEvent) => {
          console.log('Gemini Live session closed:', event.reason);
        },
      },
    });

    const sessionId = this.generateSessionId();
    this.activeSessions.set(sessionId, session);

    return session;
  }

  private handleServerMessage(message: LiveServerMessage) {
    if (message.serverContent?.modelTurn?.parts) {
      const parts = message.serverContent.modelTurn.parts;
      
      for (const part of parts) {
        if (part.text) {
          console.log('Text response:', part.text);
          // Broadcast to connected clients
          this.broadcastMessage({
            type: 'text_response',
            content: part.text,
            timestamp: new Date().toISOString(),
          });
        }

        if (part.inlineData) {
          console.log('Audio response received');
          this.handleAudioResponse(part.inlineData);
        }

        if (part.fileData) {
          console.log('File response:', part.fileData.fileUri);
          this.broadcastMessage({
            type: 'file_response',
            fileUri: part.fileData.fileUri,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    if (message.serverContent?.inputTranscription) {
      console.log('Input transcription:', message.serverContent.inputTranscription.text);
      this.broadcastMessage({
        type: 'input_transcription',
        text: message.serverContent.inputTranscription.text,
        timestamp: new Date().toISOString(),
      });
    }

    if (message.serverContent?.outputTranscription) {
      console.log('Output transcription:', message.serverContent.outputTranscription.text);
      this.broadcastMessage({
        type: 'output_transcription',
        text: message.serverContent.outputTranscription.text,
        timestamp: new Date().toISOString(),
      });
    }

    if (message.toolCall) {
      console.log('Tool call received:', message.toolCall);
      this.handleToolCall(message.toolCall);
    }
  }

  private async handleAudioResponse(inlineData: any) {
    try {
      const audioBuffer = await this.audioProcessor.processAudioResponse(
        inlineData.data,
        inlineData.mimeType
      );

      this.broadcastMessage({
        type: 'audio_response',
        data: audioBuffer.toString('base64'),
        mimeType: 'audio/wav',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error processing audio response:', error);
    }
  }

  private handleToolCall(toolCall: any) {
    // Handle tool calls (function calling)
    this.broadcastMessage({
      type: 'tool_call',
      toolCall,
      timestamp: new Date().toISOString(),
    });
  }

  async sendText(session: Session, text: string) {
    try {
      await session.send({
        clientContent: {
          turns: [{
            parts: [{ text }],
            role: 'user',
          }],
          turnComplete: true,
        },
      });
    } catch (error) {
      console.error('Error sending text:', error);
      throw error;
    }
  }

  async sendAudio(session: Session, audioData: Buffer) {
    try {
      const processedAudio = await this.audioProcessor.processAudioInput(audioData);
      
      await session.send({
        realtimeInput: {
          audio: {
            data: processedAudio.toString('base64'),
            mimeType: 'audio/pcm',
          },
        },
      });
    } catch (error) {
      console.error('Error sending audio:', error);
      throw error;
    }
  }

  async sendVideo(session: Session, videoData: Buffer) {
    try {
      const processedVideo = await this.mediaProcessor.processVideoForGemini(videoData);
      
      await session.send({
        realtimeInput: {
          video: {
            data: processedVideo.toString('base64'),
            mimeType: 'video/mp4',
          },
        },
      });
    } catch (error) {
      console.error('Error sending video:', error);
      throw error;
    }
  }

  async addUrlContext(session: Session, url: string) {
    try {
      // Add URL context to the conversation
      await session.send({
        clientContent: {
          turns: [{
            parts: [{ 
              text: `Please analyze the content from this URL: ${url}` 
            }],
            role: 'user',
          }],
          turnComplete: true,
        },
      });
    } catch (error) {
      console.error('Error adding URL context:', error);
      throw error;
    }
  }

  closeSession(session: Session) {
    try {
      session.close();
      // Remove from active sessions
      for (const [id, sess] of this.activeSessions.entries()) {
        if (sess === session) {
          this.activeSessions.delete(id);
          break;
        }
      }
    } catch (error) {
      console.error('Error closing session:', error);
    }
  }

  private broadcastMessage(message: any) {
    // This would broadcast to all connected WebSocket clients
    // Implementation depends on your WebSocket setup
    console.log('Broadcasting message:', message);
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}