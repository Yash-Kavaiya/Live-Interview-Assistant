# Gemini Live API Backend

A comprehensive backend implementation for Google's Gemini Live API supporting all modalities: text, audio, video, and screen sharing.

## Features

- **Multi-modal Support**: Text, audio, video, and screen sharing
- **Real-time Communication**: WebSocket-based real-time messaging
- **File Upload**: Support for various media file formats
- **Audio Processing**: WAV conversion and audio processing utilities
- **Video Processing**: Video frame extraction and processing
- **Screen Sharing**: Real-time screen capture and streaming
- **URL Context**: Add web page context to conversations
- **Session Management**: Persistent session handling
- **Error Handling**: Comprehensive error handling and validation

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the development server:
```bash
npm run dev
```

## Configuration

### Environment Variables

- `GEMINI_API_KEY`: Your Google Gemini API key (required)
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `API_KEY`: API key for authentication
- `MAX_FILE_SIZE`: Maximum file upload size in bytes
- `CORS_ORIGIN`: Allowed CORS origin

### Gemini Configuration

```typescript
const config = {
  model: 'models/gemini-2.5-flash-preview-native-audio-dialog',
  responseModalities: ['TEXT', 'AUDIO'],
  voiceName: 'Zephyr', // Zephyr, Charon, Kore, Fenrir
  temperature: 0.7,
  maxOutputTokens: 8192,
  systemInstruction: 'You are a helpful assistant.',
};
```

## API Endpoints

### REST API

- `GET /health` - Health check
- `POST /upload` - Upload single file
- `POST /upload-multiple` - Upload multiple files
- `GET /supported-types` - Get supported file types
- `GET /config` - Get API configuration
- `GET /test-ws` - WebSocket test information

### WebSocket API

Connect to `ws://localhost:3001` and send JSON messages:

#### Initialize Session
```json
{
  "type": "init",
  "config": {
    "model": "models/gemini-2.5-flash-preview-native-audio-dialog",
    "responseModalities": ["TEXT", "AUDIO"],
    "voiceName": "Zephyr",
    "temperature": 0.7
  }
}
```

#### Send Text
```json
{
  "type": "text",
  "content": "Hello, how are you?"
}
```

#### Send Audio
```json
{
  "type": "audio",
  "data": "base64-encoded-audio-data",
  "mimeType": "audio/wav"
}
```

#### Send Video
```json
{
  "type": "video",
  "data": "base64-encoded-video-data",
  "mimeType": "video/mp4"
}
```

#### Start Screen Share
```json
{
  "type": "screen_share_start",
  "config": {
    "quality": "medium",
    "frameRate": 30,
    "captureAudio": true
  }
}
```

#### Add URL Context
```json
{
  "type": "url_context",
  "url": "https://example.com"
}
```

## Supported File Types

### Images
- JPEG (`image/jpeg`)
- PNG (`image/png`)
- GIF (`image/gif`)
- WebP (`image/webp`)

### Audio
- MP3 (`audio/mpeg`)
- WAV (`audio/wav`)
- OGG (`audio/ogg`)
- MP4 Audio (`audio/mp4`)

### Video
- MP4 (`video/mp4`)
- WebM (`video/webm`)
- QuickTime (`video/quicktime`)

### Documents
- PDF (`application/pdf`)
- Plain Text (`text/plain`)

## Architecture

### Services

- **GeminiLiveService**: Main service for Gemini Live API integration
- **MediaProcessor**: Handles file processing and conversion
- **AudioProcessor**: Audio-specific processing and WAV conversion
- **ScreenShareService**: Screen sharing functionality

### Middleware

- **Authentication**: Token-based authentication
- **Validation**: Request and file validation
- **Error Handling**: Centralized error handling

### Utilities

- **FileUtils**: File system operations
- **WebSocketUtils**: WebSocket helper functions

## Usage Examples

### Basic Text Conversation

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  // Initialize session
  ws.send(JSON.stringify({
    type: 'init',
    config: {
      responseModalities: ['TEXT'],
      temperature: 0.7
    }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

// Send text message
ws.send(JSON.stringify({
  type: 'text',
  content: 'Hello, Gemini!'
}));
```

### Audio Conversation

```javascript
// Record audio and send
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    const mediaRecorder = new MediaRecorder(stream);
    const chunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      chunks.push(event.data);
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/wav' });
      const reader = new FileReader();
      
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        ws.send(JSON.stringify({
          type: 'audio',
          data: base64,
          mimeType: 'audio/wav'
        }));
      };
      
      reader.readAsDataURL(blob);
    };
    
    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), 3000); // Record for 3 seconds
  });
```

### Screen Sharing

```javascript
// Start screen sharing
ws.send(JSON.stringify({
  type: 'screen_share_start',
  config: {
    quality: 'high',
    frameRate: 30,
    captureAudio: true
  }
}));

// Handle screen frame requests
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'request_screen_frame') {
    // Capture screen and send frame
    navigator.mediaDevices.getDisplayMedia({ video: true })
      .then(stream => {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        
        video.onloadedmetadata = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0);
          
          canvas.toBlob(blob => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result.split(',')[1];
              ws.send(JSON.stringify({
                type: 'screen_frame',
                frameId: message.frameId,
                data: base64,
                width: canvas.width,
                height: canvas.height,
                format: 'image/png'
              }));
            };
            reader.readAsDataURL(blob);
          });
        };
      });
  }
};
```

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## Deployment

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use secure `JWT_SECRET`
- Configure proper `CORS_ORIGIN`
- Set up proper logging

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check if server is running on correct port
   - Verify CORS configuration
   - Check firewall settings

2. **Audio Not Working**
   - Ensure microphone permissions
   - Check audio format compatibility
   - Verify sample rate settings

3. **File Upload Failed**
   - Check file size limits
   - Verify file type is supported
   - Check disk space

4. **Gemini API Errors**
   - Verify API key is correct
   - Check API quotas and limits
   - Ensure model is available

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.