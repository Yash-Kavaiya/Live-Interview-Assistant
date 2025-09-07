import { WebSocket } from 'ws';

export interface ScreenShareConfig {
  quality?: 'low' | 'medium' | 'high';
  frameRate?: number;
  captureAudio?: boolean;
  captureSystemAudio?: boolean;
}

export class ScreenShareService {
  private activeScreenShares: Map<WebSocket, ScreenShareSession> = new Map();

  async startScreenShare(ws: WebSocket, config: ScreenShareConfig = {}) {
    try {
      const session = new ScreenShareSession(ws, config);
      this.activeScreenShares.set(ws, session);
      
      await session.start();
      
      ws.send(JSON.stringify({
        type: 'screen_share_started',
        config,
        message: 'Screen sharing started successfully'
      }));
      
      console.log('Screen share started for client');
    } catch (error) {
      console.error('Error starting screen share:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to start screen sharing'
      }));
    }
  }

  async stopScreenShare(ws: WebSocket) {
    const session = this.activeScreenShares.get(ws);
    if (session) {
      await session.stop();
      this.activeScreenShares.delete(ws);
      
      ws.send(JSON.stringify({
        type: 'screen_share_stopped',
        message: 'Screen sharing stopped'
      }));
      
      console.log('Screen share stopped for client');
    }
  }

  getActiveScreenShares(): number {
    return this.activeScreenShares.size;
  }
}

class ScreenShareSession {
  private ws: WebSocket;
  private config: ScreenShareConfig;
  private isActive: boolean = false;
  private frameInterval: NodeJS.Timeout | null = null;

  constructor(ws: WebSocket, config: ScreenShareConfig) {
    this.ws = ws;
    this.config = {
      quality: config.quality || 'medium',
      frameRate: config.frameRate || 30,
      captureAudio: config.captureAudio || false,
      captureSystemAudio: config.captureSystemAudio || false,
    };
  }

  async start() {
    if (this.isActive) {
      throw new Error('Screen share session already active');
    }

    this.isActive = true;
    
    // Start capturing frames
    const frameInterval = 1000 / this.config.frameRate!;
    this.frameInterval = setInterval(() => {
      this.captureFrame();
    }, frameInterval);

    // Setup message handlers for screen share data
    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'screen_frame') {
          this.handleScreenFrame(message);
        }
      } catch (error) {
        console.error('Error handling screen share message:', error);
      }
    });
  }

  async stop() {
    this.isActive = false;
    
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }
  }

  private async captureFrame() {
    if (!this.isActive) return;

    try {
      // Request frame from client
      this.ws.send(JSON.stringify({
        type: 'request_screen_frame',
        config: this.config
      }));
    } catch (error) {
      console.error('Error requesting screen frame:', error);
    }
  }

  private handleScreenFrame(message: any) {
    try {
      // Process the received screen frame
      const frameData = {
        type: 'screen_frame_processed',
        timestamp: new Date().toISOString(),
        frameId: message.frameId,
        data: message.data,
        metadata: {
          width: message.width,
          height: message.height,
          format: message.format,
          quality: this.config.quality,
        }
      };

      // Forward processed frame data
      this.broadcastFrameData(frameData);
      
    } catch (error) {
      console.error('Error processing screen frame:', error);
    }
  }

  private broadcastFrameData(frameData: any) {
    // This would typically send the frame data to Gemini Live API
    // or other connected services for processing
    console.log('Broadcasting screen frame data:', {
      frameId: frameData.frameId,
      timestamp: frameData.timestamp,
      size: frameData.data?.length || 0
    });
  }
}