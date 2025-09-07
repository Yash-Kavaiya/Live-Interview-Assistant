// Enhanced Gemini Live API with Full Audio Support
// Run: node audio-interview-example.js

import { GoogleGenAI, Modality, MediaResolution } from '@google/genai';
import { writeFile } from 'fs';

const API_KEY = 'AIzaSyB8_Wd0uOiVMrIiobdb5EhmuZ9DeNQq-yU';

// Audio handling functions
const audioParts = [];

function handleAudioResponse(part) {
  if (part?.inlineData) {
    const fileName = `interview_response_${Date.now()}.wav`;
    const inlineData = part.inlineData;
    
    audioParts.push(inlineData?.data ?? '');
    
    const buffer = convertToWav(audioParts, inlineData.mimeType ?? '');
    saveBinaryFile(fileName, buffer);
    console.log(`🔊 Audio response saved as: ${fileName}`);
  }
}

function convertToWav(rawData, mimeType) {
  const options = parseMimeType(mimeType);
  const dataLength = rawData.reduce((a, b) => a + b.length, 0);
  const wavHeader = createWavHeader(dataLength, options);
  const buffer = Buffer.concat(rawData.map(data => Buffer.from(data, 'base64')));
  return Buffer.concat([wavHeader, buffer]);
}

function parseMimeType(mimeType) {
  const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
  const [_, format] = fileType.split('/');

  const options = {
    numChannels: 1,
    bitsPerSample: 16,
    sampleRate: 24000, // Default sample rate
  };

  if (format && format.startsWith('L')) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) {
      options.bitsPerSample = bits;
    }
  }

  for (const param of params) {
    const [key, value] = param.split('=').map(s => s.trim());
    if (key === 'rate') {
      options.sampleRate = parseInt(value, 10);
    }
  }

  return options;
}

function createWavHeader(dataLength, options) {
  const { numChannels, sampleRate, bitsPerSample } = options;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const buffer = Buffer.alloc(44);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  return buffer;
}

function saveBinaryFile(fileName, content) {
  writeFile(fileName, content, (err) => {
    if (err) {
      console.error(`Error writing file ${fileName}:`, err);
      return;
    }
    console.log(`🎵 Audio saved to ${fileName}`);
  });
}

async function runAudioInterviewSession() {
  try {
    console.log('🚀 Starting AI Interview Session with FULL Audio Support...');
    
    const ai = new GoogleGenAI({
      apiKey: API_KEY,
    });

    const session = await ai.live.connect({
      model: 'models/gemini-2.0-flash-exp',
      callbacks: {
        onopen: () => {
          console.log('✅ Connected to Gemini Live API with Audio & Text!');
          console.log('🎤 Ready for audio input and will generate audio responses!');
        },
        onmessage: (message) => {
          console.log('📩 Message received:', message.type || 'unknown type');
          
          if (message.serverContent?.modelTurn?.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
              if (part?.text) {
                console.log('🤖 AI Interviewer (Text):', part.text);
                console.log(''); // Add spacing
              }
              if (part?.inlineData) {
                console.log('🔊 AI Interviewer: *Speaking audio response*');
                handleAudioResponse(part);
              }
            }
          }
          
          // Check if turn is complete
          if (message.serverContent?.turnComplete) {
            console.log('✅ Turn completed');
          }
        },
        onerror: (error) => {
          console.error('❌ Error:', error);
        },
        onclose: (event) => {
          console.log('🔚 Session ended:', event.reason || 'Session completed');
        },
      },
      config: {
        responseModalities: [Modality.AUDIO]
      }
    });

    console.log('📤 Starting the audio-enabled interview...\n');

    // Send initial greeting
    await session.sendClientContent({
      turns: [{
        role: 'user',
        parts: [{
          text: "Hello! I'm ready for my software engineer interview practice session. Please introduce yourself and ask me your first question. I'd like you to respond with both text and audio."
        }]
      }]
    });

    // Wait for responses
    console.log('⏳ Waiting for AI response (including audio)...');
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Send a follow-up response
    console.log('👤 You: I have 3 years of experience in full-stack development, primarily working with React and Node.js.\n');
    
    await session.sendClientContent({
      turns: [{
        role: 'user',
        parts: [{
          text: "I have 3 years of experience in full-stack development, primarily working with React and Node.js. Can you ask me a technical question about React?"
        }]
      }]
    });

    // Wait for final response
    console.log('⏳ Waiting for technical question response...');
    await new Promise(resolve => setTimeout(resolve, 8000));

    console.log('🎯 Audio-enabled interview session completed!');
    console.log('🎵 Check the current directory for generated audio files (*.wav)');
    session.close();

  } catch (error) {
    console.error('💥 Failed to run audio interview session:', error.message);
    console.error('Full error:', error);
  }
}

// Run the enhanced audio interview
runAudioInterviewSession();
