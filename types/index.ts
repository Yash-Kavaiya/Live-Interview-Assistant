export interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: string;
  sessionId?: string;
}

export interface TextMessage extends WebSocketMessage {
  type: 'text';
  content: string;
}

export interface AudioMessage extends WebSocketMessage {
  type: 'audio';
  data: string; // base64 encoded
  mimeType?: string;
  duration?: number;
}

export interface VideoMessage extends WebSocketMessage {
  type: 'video';
  data: string; // base64 encoded
  mimeType?: string;
  width?: number;
  height?: number;
  frameRate?: number;
}

export interface ScreenShareMessage extends WebSocketMessage {
  type: 'screen_share_start' | 'screen_share_stop' | 'screen_frame';
  config?: {
    quality?: 'low' | 'medium' | 'high';
    frameRate?: number;
    captureAudio?: boolean;
  };
  frameId?: string;
  width?: number;
  height?: number;
  format?: string;
}

export interface UrlContextMessage extends WebSocketMessage {
  type: 'url_context';
  url: string;
  metadata?: {
    title?: string;
    description?: string;
    content?: string;
  };
}

export interface InitMessage extends WebSocketMessage {
  type: 'init';
  config: {
    model?: string;
    responseModalities?: string[];
    voiceName?: string;
    systemInstruction?: string;
    temperature?: number;
    maxOutputTokens?: number;
  };
}

export interface ErrorMessage extends WebSocketMessage {
  type: 'error';
  message: string;
  code?: string;
}

export interface SessionReadyMessage extends WebSocketMessage {
  type: 'session_ready';
  sessionId: string;
  message: string;
}

export interface TranscriptionMessage extends WebSocketMessage {
  type: 'input_transcription' | 'output_transcription';
  text: string;
}

export interface ResponseMessage extends WebSocketMessage {
  type: 'text_response' | 'audio_response' | 'file_response';
  content?: string;
  data?: string;
  mimeType?: string;
  fileUri?: string;
}

export type ClientMessage = 
  | InitMessage
  | TextMessage
  | AudioMessage
  | VideoMessage
  | ScreenShareMessage
  | UrlContextMessage;

export type ServerMessage = 
  | SessionReadyMessage
  | ResponseMessage
  | TranscriptionMessage
  | ErrorMessage
  | WebSocketMessage;