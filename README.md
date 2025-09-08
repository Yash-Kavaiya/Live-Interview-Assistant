# Live Interview Assistant

A real-time, AI-powered interview practice platform built with Google's Gemini Live API. This application provides an interactive interview simulation experience with multi-modal support including text, audio, video, and screen sharing capabilities.

## 🎯 Overview

Live Interview Assistant is a comprehensive solution for interview preparation, featuring:
- Real-time AI interviewer powered by Google's Gemini 2.0 models
- Multi-modal communication (text, audio, video)
- Live screen sharing for technical demonstrations
- Audio recording and playback
- Professional interview feedback and guidance

## ✨ Features

### Core Capabilities
- **AI Interview Simulation**: Practice with an intelligent AI interviewer that asks relevant technical and behavioral questions
- **Real-time Communication**: WebSocket-based bidirectional communication for instant responses
- **Multi-modal Support**: 
  - Text-based chat
  - Audio conversations with voice synthesis
  - Video streaming support
  - Screen sharing for code demonstrations
- **Session Management**: Persistent interview sessions with history tracking
- **File Upload**: Support for various media formats (images, audio, video, documents)
- **Audio Processing**: WAV conversion and audio streaming
- **Professional Feedback**: Get constructive feedback on your responses

### Supported File Types
- **Images**: JPEG, PNG, GIF, WebP
- **Audio**: MP3, WAV, OGG, MP4 Audio
- **Video**: MP4, WebM, QuickTime
- **Documents**: PDF, Plain Text

## 🛠️ Tech Stack

### Frontend
- **React 18.2.0** with TypeScript 5.7.2
- **Vite 6.3.1** for fast development and building
- **Tailwind CSS 3.4.1** with shadcn/ui components
- **React Router 7.5.1** for navigation
- **WebSocket** for real-time communication

### Backend
- **Node.js** with Express
- **Google Gemini Live API** (`@google/genai`)
- **WebSocket (ws)** for real-time messaging
- **Multer** for file uploads
- **TypeScript** for type safety

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm, yarn, or bun (bun recommended for faster installation)
- Google Gemini API Key

### Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd live-interview-assistant
```

2. **Install dependencies**

Using bun (recommended):
```bash
# Install frontend dependencies
bun install

# Install backend dependencies
cd backend
bun install
```

Using npm:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

3. **Configure environment variables**
```bash
# Create .env file in root directory
cp .env.example .env

# Add your Gemini API key
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

4. **Start development servers**

Using the provided batch script (Windows):
```bash
./start-dev.bat
```

Or manually:
```bash
# Terminal 1 - Start backend server
npm run dev:backend

# Terminal 2 - Start frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- WebSocket: ws://localhost:3001

## 🚀 Usage

### Basic Interview Session

```javascript
// Initialize connection
const ws = new WebSocket('ws://localhost:3001');

// Start interview session
ws.send(JSON.stringify({
  type: 'init',
  config: {
    model: 'models/gemini-2.5-flash-preview-native-audio-dialog',
    responseModalities: ['TEXT', 'AUDIO'],
    voiceName: 'Zephyr',
    temperature: 0.7
  }
}));

// Send text message
ws.send(JSON.stringify({
  type: 'text',
  content: 'I am preparing for a software engineer role'
}));
```

### Audio Interview

```javascript
// Record and send audio
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    const mediaRecorder = new MediaRecorder(stream);
    // ... recording logic
    
    // Send audio data
    ws.send(JSON.stringify({
      type: 'audio',
      data: base64AudioData,
      mimeType: 'audio/wav'
    }));
  });
```

## 📡 API Documentation

### WebSocket Messages

#### Initialize Session
```json
{
  "type": "init",
  "config": {
    "model": "models/gemini-2.5-flash-preview-native-audio-dialog",
    "responseModalities": ["TEXT", "AUDIO"],
    "voiceName": "Zephyr",
    "temperature": 0.7,
    "systemInstruction": "Interview assistant instructions..."
  }
}
```

#### Send Text
```json
{
  "type": "text",
  "content": "Your message here"
}
```

#### Send Audio
```json
{
  "type": "audio",
  "data": "base64-encoded-audio",
  "mimeType": "audio/wav"
}
```

#### Start Screen Share
```json
{
  "type": "screen_share_start",
  "config": {
    "quality": "high",
    "frameRate": 30,
    "captureAudio": true
  }
}
```

### REST Endpoints

- `GET /health` - Health check
- `POST /upload` - Upload single file
- `GET /supported-types` - Get supported file types
- `GET /config` - Get API configuration

## 🏗️ Project Structure

```
live-interview-assistant/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   └── services/          # API services
├── backend/               # Backend server (if separated)
│   ├── services/          # Backend services
│   │   ├── GeminiLiveService.ts
│   │   ├── MediaProcessor.ts
│   │   └── ScreenShareService.ts
│   ├── middleware/        # Express middleware
│   └── utils/            # Utility functions
├── server.ts             # Main backend server file
├── package.json          # Frontend dependencies
├── backend-package.json  # Backend dependencies
└── vite.config.ts       # Vite configuration
```

## 🔧 Configuration

### Gemini Model Options
- `gemini-2.0-flash-exp` - Latest experimental model
- `gemini-2.5-flash-preview-native-audio-dialog` - Audio-enabled model

### Voice Options
- Zephyr (default)
- Charon
- Kore
- Fenrir

### Response Modalities
- TEXT - Text-only responses
- AUDIO - Audio synthesis
- Combined TEXT + AUDIO

## 🐛 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Verify backend server is running on port 3001
   - Check CORS configuration
   - Ensure firewall allows WebSocket connections

2. **Audio Not Working**
   - Check microphone permissions in browser
   - Verify audio format compatibility (WAV recommended)
   - Ensure sample rate is 24000 Hz

3. **Gemini API Errors**
   - Verify API key is valid
   - Check API quotas and rate limits
   - Ensure selected model is available

4. **File Upload Issues**
   - Check file size (max 100MB by default)
   - Verify file type is supported
   - Check available disk space

## 🚢 Deployment

### Docker Deployment

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

```dockerfile
# Backend Dockerfile
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
```env
NODE_ENV=production
GEMINI_API_KEY=your_production_key
CORS_ORIGIN=https://your-domain.com
PORT=3001
MAX_FILE_SIZE=104857600
```

## 📚 Examples

### Running Standalone Examples

```bash
# Simple text-based interview
node simple-gemini-example.js

# Audio-enabled interview
node audio-interview-example.js

# Full-featured interview with greeting
node final-gemini-interview.js
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Google Gemini Team for the Live API
- shadcn/ui for the component library
- The open-source community for various dependencies

## 📞 Support

For issues and questions:
- Create an issue in the GitHub repository
- Check the [troubleshooting section](#-troubleshooting)
- Review the [API documentation](#-api-documentation)

---

Built with ❤️ for helping people ace their interviews!
