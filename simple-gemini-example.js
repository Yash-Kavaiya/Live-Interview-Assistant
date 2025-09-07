// Simple Gemini Live API Example - Fixed Version
// To run: node simple-gemini-example.js

import { GoogleGenAI, Modality } from '@google/genai';

const API_KEY = 'AIzaSyB8_Wd0uOiVMrIiobdb5EhmuZ9DeNQq-yU';

async function main() {
  try {
    const ai = new GoogleGenAI({
      apiKey: API_KEY,
    });

    console.log('Connecting to Gemini Live API...');

    const session = await ai.live.connect({
      model: 'models/gemini-2.0-flash-exp',
      callbacks: {
        onopen: () => {
          console.log('✅ Connected to Gemini Live!');
        },
        onmessage: (message) => {
          console.log('📨 Received message type:', message.type || 'unknown');
          
          // Handle text responses
          if (message.serverContent?.modelTurn?.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
              if (part?.text) {
                console.log('🤖 AI Response:', part.text);
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
          console.log('🔌 Connection closed:', event.reason);
        }
      },
      config: {
        responseModalities: [Modality.TEXT], // Use proper enum
      }
    });

    // Send a simple greeting
    console.log('📤 Sending greeting message...');
    
    await session.sendClientContent({
      turns: [{
        role: 'user',
        parts: [{
          text: "Hello! I'm your AI interview assistant. Let's start with a simple question: What role are you preparing for today?"
        }]
      }]
    });

    // Wait for response
    console.log('⏳ Waiting for response...');
    await new Promise(resolve => setTimeout(resolve, 8000));

    console.log('🔚 Closing session...');
    session.close();

  } catch (error) {
    console.error('💥 Failed to connect or send message:', error);
    console.error('Error details:', error.message);
  }
}

main();
