import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import multer from 'multer';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { GeminiLiveService } from './services/GeminiLiveService.js';
import { MediaProcessor } from './services/MediaProcessor.js';
import { ScreenShareService } from './services/ScreenShareService.js';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// Services
const geminiService = new GeminiLiveService();
const mediaProcessor = new MediaProcessor();
const screenShareService = new ScreenShareService();

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// File upload endpoint for media files
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const processedFile = await mediaProcessor.processFile(req.file);
    res.json({ 
      success: true, 
      file: processedFile,
      message: 'File uploaded and processed successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');
  
  const sessionId = generateSessionId();
  let geminiSession: any = null;

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'init':
          geminiSession = await geminiService.createSession(message.config);
          ws.send(JSON.stringify({ 
            type: 'session_ready', 
            sessionId,
            message: 'Gemini Live session initialized'
          }));
          break;

        case 'text':
          if (geminiSession) {
            await geminiService.sendText(geminiSession, message.content);
          }
          break;

        case 'audio':
          if (geminiSession) {
            const audioData = Buffer.from(message.data, 'base64');
            await geminiService.sendAudio(geminiSession, audioData);
          }
          break;

        case 'video':
          if (geminiSession) {
            const videoData = Buffer.from(message.data, 'base64');
            await geminiService.sendVideo(geminiSession, videoData);
          }
          break;

        case 'screen_share_start':
          await screenShareService.startScreenShare(ws, message.config);
          break;

        case 'screen_share_stop':
          await screenShareService.stopScreenShare(ws);
          break;

        case 'url_context':
          if (geminiSession) {
            await geminiService.addUrlContext(geminiSession, message.url);
          }
          break;

        default:
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: `Unknown message type: ${message.type}` 
          }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Failed to process message' 
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    if (geminiSession) {
      geminiService.closeSession(geminiSession);
    }
    screenShareService.stopScreenShare(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Gemini Live Backend Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;