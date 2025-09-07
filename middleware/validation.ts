import { Request, Response, NextFunction } from 'express';

export function validateFileUpload(req: Request, res: Response, next: NextFunction) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'application/pdf',
    'text/plain',
  ];

  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ 
      error: 'Unsupported file type',
      allowedTypes: allowedMimeTypes 
    });
  }

  const maxSize = 100 * 1024 * 1024; // 100MB
  if (req.file.size > maxSize) {
    return res.status(400).json({ 
      error: 'File too large',
      maxSize: '100MB' 
    });
  }

  next();
}

export function validateWebSocketMessage(message: any): { valid: boolean; error?: string } {
  if (!message.type) {
    return { valid: false, error: 'Message type is required' };
  }

  switch (message.type) {
    case 'init':
      if (!message.config) {
        return { valid: false, error: 'Config is required for init message' };
      }
      break;

    case 'text':
      if (!message.content || typeof message.content !== 'string') {
        return { valid: false, error: 'Content is required for text message' };
      }
      break;

    case 'audio':
      if (!message.data) {
        return { valid: false, error: 'Data is required for audio message' };
      }
      break;

    case 'video':
      if (!message.data) {
        return { valid: false, error: 'Data is required for video message' };
      }
      break;

    case 'url_context':
      if (!message.url || !isValidUrl(message.url)) {
        return { valid: false, error: 'Valid URL is required for url_context message' };
      }
      break;

    case 'screen_share_start':
      // Config is optional for screen share
      break;

    case 'screen_share_stop':
      // No additional validation needed
      break;

    default:
      return { valid: false, error: `Unknown message type: ${message.type}` };
  }

  return { valid: true };
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

export function validateGeminiConfig(config: any): { valid: boolean; error?: string } {
  const validModalities = ['TEXT', 'AUDIO', 'VIDEO', 'IMAGE'];
  const validVoices = ['Zephyr', 'Charon', 'Kore', 'Fenrir'];
  const validModels = [
    'models/gemini-2.5-flash-preview-native-audio-dialog',
    'models/gemini-2.0-flash-exp',
    'models/gemini-exp-1206',
  ];

  if (config.model && !validModels.includes(config.model)) {
    return { valid: false, error: `Invalid model. Allowed: ${validModels.join(', ')}` };
  }

  if (config.responseModalities) {
    const invalidModalities = config.responseModalities.filter(
      (m: string) => !validModalities.includes(m)
    );
    if (invalidModalities.length > 0) {
      return { 
        valid: false, 
        error: `Invalid modalities: ${invalidModalities.join(', ')}. Allowed: ${validModalities.join(', ')}` 
      };
    }
  }

  if (config.voiceName && !validVoices.includes(config.voiceName)) {
    return { valid: false, error: `Invalid voice. Allowed: ${validVoices.join(', ')}` };
  }

  if (config.temperature !== undefined) {
    if (typeof config.temperature !== 'number' || config.temperature < 0 || config.temperature > 2) {
      return { valid: false, error: 'Temperature must be a number between 0 and 2' };
    }
  }

  if (config.maxOutputTokens !== undefined) {
    if (typeof config.maxOutputTokens !== 'number' || config.maxOutputTokens < 1 || config.maxOutputTokens > 8192) {
      return { valid: false, error: 'maxOutputTokens must be a number between 1 and 8192' };
    }
  }

  return { valid: true };
}