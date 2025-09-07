import { Router } from 'express';
import multer from 'multer';
import { MediaProcessor } from '../services/MediaProcessor.js';
import { validateFileUpload } from '../middleware/validation.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();
const mediaProcessor = new MediaProcessor();

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      gemini: process.env.GEMINI_API_KEY ? 'configured' : 'not configured',
      websocket: 'active',
      fileUpload: 'active',
    },
  });
});

// File upload endpoint
router.post('/upload', 
  optionalAuth,
  upload.single('file'), 
  validateFileUpload, 
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const processedFile = await mediaProcessor.processFile(req.file);
      
      res.json({
        success: true,
        file: {
          id: processedFile.id,
          originalName: processedFile.originalName,
          mimeType: processedFile.mimeType,
          size: processedFile.size,
          processedAt: processedFile.processedAt,
        },
        message: 'File uploaded and processed successfully',
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        error: 'Failed to process file',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Multiple file upload endpoint
router.post('/upload-multiple',
  optionalAuth,
  upload.array('files', 10),
  async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const processedFiles = await Promise.all(
        files.map(file => mediaProcessor.processFile(file))
      );

      res.json({
        success: true,
        files: processedFiles.map(file => ({
          id: file.id,
          originalName: file.originalName,
          mimeType: file.mimeType,
          size: file.size,
          processedAt: file.processedAt,
        })),
        message: `${processedFiles.length} files uploaded and processed successfully`,
      });
    } catch (error) {
      console.error('Multiple upload error:', error);
      res.status(500).json({ 
        error: 'Failed to process files',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Get supported file types
router.get('/supported-types', (req, res) => {
  res.json({
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
    document: ['application/pdf', 'text/plain'],
    maxSize: '100MB',
  });
});

// Get API configuration
router.get('/config', (req, res) => {
  res.json({
    gemini: {
      models: [
        'models/gemini-2.5-flash-preview-native-audio-dialog',
        'models/gemini-2.0-flash-exp',
        'models/gemini-exp-1206',
      ],
      voices: ['Zephyr', 'Charon', 'Kore', 'Fenrir'],
      modalities: ['TEXT', 'AUDIO', 'VIDEO', 'IMAGE'],
      maxTokens: 8192,
      temperatureRange: [0, 2],
    },
    websocket: {
      endpoint: '/ws',
      protocols: ['gemini-live'],
    },
    upload: {
      maxFileSize: '100MB',
      maxFiles: 10,
    },
  });
});

// Test endpoint for WebSocket connection
router.get('/test-ws', (req, res) => {
  res.json({
    message: 'WebSocket test endpoint',
    instructions: [
      '1. Connect to WebSocket at ws://localhost:3001',
      '2. Send init message with config',
      '3. Send text, audio, video, or screen share messages',
      '4. Receive responses from Gemini Live API',
    ],
    sampleMessages: {
      init: {
        type: 'init',
        config: {
          model: 'models/gemini-2.5-flash-preview-native-audio-dialog',
          responseModalities: ['TEXT', 'AUDIO'],
          voiceName: 'Zephyr',
          temperature: 0.7,
        },
      },
      text: {
        type: 'text',
        content: 'Hello, how are you?',
      },
      audio: {
        type: 'audio',
        data: 'base64-encoded-audio-data',
        mimeType: 'audio/wav',
      },
    },
  });
});

export default router;