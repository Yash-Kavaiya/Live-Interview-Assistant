// Gemini Live API Example with Interview Greeting
// To run this code: node gemini-live-example.js

import {
  GoogleGenAI,
  LiveServerMessage,
  MediaResolution,
  Modality,
  Session,
} from '@google/genai';
import { writeFile } from 'fs';

const responseQueue = [];
let session = undefined;

// Your API key
const API_KEY = 'AIzaSyB8_Wd0uOiVMrIiobdb5EhmuZ9DeNQq-yU';

async function handleTurn() {
  const turn = [];
  let done = false;
  while (!done) {
    const message = await waitMessage();
    turn.push(message);
    if (message.serverContent && message.serverContent.turnComplete) {
      done = true;
    }
  }
  return turn;
}

async function waitMessage() {
  let done = false;
  let message = undefined;
  while (!done) {
    message = responseQueue.shift();
    if (message) {
      handleModelTurn(message);
      done = true;
    } else {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  return message;
}

const audioParts = [];
function handleModelTurn(message) {
  if (message.serverContent?.modelTurn?.parts) {
    const part = message.serverContent?.modelTurn?.parts?.[0];

    if (part?.fileData) {
      console.log(`File: ${part?.fileData.fileUri}`);
    }

    if (part?.inlineData) {
      const fileName = 'audio.wav';
      const inlineData = part?.inlineData;

      audioParts.push(inlineData?.data ?? '');

      const buffer = convertToWav(audioParts, inlineData.mimeType ?? '');
      saveBinaryFile(fileName, buffer);
    }

    if (part?.text) {
      console.log('AI Assistant:', part?.text);
    }
  }
}

function saveBinaryFile(fileName, content) {
  writeFile(fileName, content, 'utf8', (err) => {
    if (err) {
      console.error(`Error writing file ${fileName}:`, err);
      return;
    }
    console.log(`Appending stream content to file ${fileName}.`);
  });
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
  const {
    numChannels,
    sampleRate,
    bitsPerSample,
  } = options;

  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const buffer = Buffer.alloc(44);

  buffer.write('RIFF', 0);                      // ChunkID
  buffer.writeUInt32LE(36 + dataLength, 4);     // ChunkSize
  buffer.write('WAVE', 8);                      // Format
  buffer.write('fmt ', 12);                     // Subchunk1ID
  buffer.writeUInt32LE(16, 16);                 // Subchunk1Size (PCM)
  buffer.writeUInt16LE(1, 20);                  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);        // NumChannels
  buffer.writeUInt32LE(sampleRate, 24);         // SampleRate
  buffer.writeUInt32LE(byteRate, 28);           // ByteRate
  buffer.writeUInt16LE(blockAlign, 32);         // BlockAlign
  buffer.writeUInt16LE(bitsPerSample, 34);      // BitsPerSample
  buffer.write('data', 36);                     // Subchunk2ID
  buffer.writeUInt32LE(dataLength, 40);         // Subchunk2Size

  return buffer;
}

async function main() {
  const ai = new GoogleGenAI({
    apiKey: API_KEY,
  });

  const model = 'models/gemini-2.0-flash-exp';

  const config = {
    responseModalities: [Modality.AUDIO, Modality.TEXT],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: 'Zephyr',
        }
      }
    },
    systemInstruction: {
      parts: [{
        text: `You are an AI interview assistant conducting a mock interview. 
        Be professional, encouraging, and provide constructive feedback. 
        Ask relevant questions based on the role and provide helpful guidance.
        Keep responses concise but informative.`
      }]
    },
  };

  try {
    session = await ai.live.connect({
      model,
      callbacks: {
        onopen: function () {
          console.log('Connected to Gemini Live API');
        },
        onmessage: function (message) {
          responseQueue.push(message);
        },
        onerror: function (e) {
          console.error('Error:', e.message);
        },
        onclose: function (e) {
          console.log('Connection closed:', e.reason);
        },
      },
      config
    });

    // Send initial greeting for interview
    const greetingMessage = `Hello! I'm your AI interview assistant. I'm here to help you practice your interview skills.

Let's start with a friendly introduction. Could you please tell me:
1. What role are you preparing for?
2. What's your background or experience level?
3. Are there any specific areas you'd like to focus on?

Take your time, and remember - this is a safe space to practice and improve!`;

    console.log('Sending greeting message...');
    
    session.sendClientContent({
      turns: [
        {
          role: 'user',
          parts: [{ text: greetingMessage }]
        }
      ]
    });

    await handleTurn();

    console.log('Interview session completed. Check audio.wav for any audio responses.');
    
  } catch (error) {
    console.error('Failed to connect:', error);
  } finally {
    if (session) {
      session.close();
    }
  }
}

// Run the example
main().catch(console.error);
