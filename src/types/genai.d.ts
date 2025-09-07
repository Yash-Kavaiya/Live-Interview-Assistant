declare module '@google/genai' {
  export enum Modality {
    TEXT = 'TEXT',
    AUDIO = 'AUDIO',
    VIDEO = 'VIDEO',
    IMAGE = 'IMAGE'
  }

  export interface GenerativeAIConfig {
    apiKey: string;
  }

  export interface LiveConfig {
    model: string;
    callbacks?: {
      onopen?: () => void;
      onmessage?: (message: any) => void;
      onerror?: (error: any) => void;
      onclose?: () => void;
    };
    config?: {
      responseModalities?: Modality[];
      speechConfig?: {
        voiceConfig?: {
          prebuiltVoiceConfig?: {
            voiceName: string;
          };
        };
      };
    };
  }

  export interface LiveSession {
    sendClientContent(content: any): Promise<void>;
    close(): void;
  }

  export class GoogleGenAI {
    constructor(config: GenerativeAIConfig);
    
    live: {
      connect(config: LiveConfig): Promise<LiveSession>;
    };
  }
}
