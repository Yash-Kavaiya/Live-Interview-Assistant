// Final Working Gemini Live API Example
// Run: node final-gemini-interview.js

import { GoogleGenAI, Modality } from '@google/genai';

const API_KEY = 'AIzaSyB8_Wd0uOiVMrIiobdb5EhmuZ9DeNQq-yU';

async function runInterviewSession() {
  try {
    console.log('🚀 Starting AI Interview Session...');
    
    const ai = new GoogleGenAI({
      apiKey: API_KEY,
    });

    const session = await ai.live.connect({
      model: 'models/gemini-2.5-flash-preview-native-audio-dialog',
      callbacks: {
        onopen: () => {
          console.log('✅ Connected to Gemini Live API!');
        },
        onmessage: (message) => {
          if (message.serverContent?.modelTurn?.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
              if (part?.text) {
                console.log('🤖 AI Interviewer:', part.text);
                console.log(''); // Add spacing
              }
            }
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
        responseModalities: [Modality.TEXT],
        systemInstruction: {
          parts: [{
            text: `You are a professional AI interview assistant. Conduct a mock interview for a software engineer position. 
            - Ask relevant technical and behavioral questions
            - Be encouraging and provide constructive feedback
            - Keep responses concise but helpful
            - Simulate a real interview experience`
          }]
        }
      }
    });

    console.log('📤 Starting the interview...\n');

    // Send initial greeting
    await session.sendClientContent({
      turns: [{
        role: 'user',
        parts: [{
          text: "Hello! I'm ready for my software engineer interview practice session. Please start with an introduction and your first question."
        }]
      }]
    });

    // Wait for responses
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Send a follow-up response
    console.log('👤 You: I have 3 years of experience in full-stack development, primarily working with React and Node.js.\n');
    
    await session.sendClientContent({
      turns: [{
        role: 'user',
        parts: [{
          text: "I have 3 years of experience in full-stack development, primarily working with React and Node.js."
        }]
      }]
    });

    // Wait for final response
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🎯 Interview session completed! The AI assistant has provided feedback and questions.');
    session.close();

  } catch (error) {
    console.error('💥 Failed to run interview session:', error.message);
  }
}

// Run the interview
runInterviewSession();
