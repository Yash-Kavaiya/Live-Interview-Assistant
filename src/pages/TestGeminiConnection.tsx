import { useState } from 'react'
import { GoogleGenAI, Modality } from '@google/genai'

function TestGeminiConnection() {
  const [status, setStatus] = useState('Ready to test')
  const [response, setResponse] = useState('')
  const [session, setSession] = useState<any>(null)
  
  const API_KEY = 'AIzaSyB8_Wd0uOiVMrIiobdb5EhmuZ9DeNQq-yU'

  const testConnection = async () => {
    setStatus('Testing connection...')
    setResponse('')
    
    try {
      console.log('Testing Gemini Live API connection...')
      
      const ai = new GoogleGenAI({ apiKey: API_KEY })
      
      const testSession = await ai.live.connect({
        model: 'models/gemini-2.0-flash-exp',
        callbacks: {
          onopen: () => {
            console.log('✅ Connection opened successfully')
            setStatus('Connected! Sending test message...')
            
            // Send test message
            setTimeout(() => {
              testSession.sendClientContent({
                turns: [{
                  role: 'user',
                  parts: [{ text: 'Hello! Please respond with "Connection test successful" to confirm you can hear me.' }]
                }]
              })
            }, 500)
          },
          onmessage: (message) => {
            console.log('📨 Received response:', message)
            
            if (message.serverContent?.modelTurn?.parts) {
              let textContent = ''
              for (const part of message.serverContent.modelTurn.parts) {
                if (part?.text) {
                  textContent += part.text
                }
              }
              
              if (textContent) {
                setResponse(textContent)
                setStatus('✅ Test successful! Connection working.')
              }
            }
          },
          onerror: (error) => {
            console.error('❌ Connection error:', error)
            setStatus(`❌ Error: ${error.message || 'Unknown error'}`)
            setResponse('Connection failed')
          },
          onclose: (event) => {
            console.log('🔌 Connection closed:', event)
            if (!response) {
              setStatus('❌ Connection closed unexpectedly')
            }
          },
        },
        config: {
          responseModalities: [Modality.TEXT]
        }
      })

      setSession(testSession)
      
    } catch (error) {
      console.error('❌ Failed to test connection:', error)
      setStatus(`❌ Failed: ${error.message || 'Unknown error'}`)
    }
  }

  const closeConnection = () => {
    if (session) {
      session.close()
      setSession(null)
      setStatus('Connection closed')
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">🧪 Gemini Live API Connection Test</h2>
        
        <div className="space-y-4">
          <div className="text-sm">
            <strong>Status:</strong> {status}
          </div>
          
          {response && (
            <div>
              <strong>AI Response:</strong>
              <textarea 
                value={response} 
                readOnly 
                className="w-full mt-2 p-2 border rounded"
                rows={3}
              />
            </div>
          )}
          
          <div className="flex gap-2">
            <button 
              onClick={testConnection} 
              disabled={!!session}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
            >
              Test Connection
            </button>
            <button 
              onClick={closeConnection} 
              disabled={!session}
              className="px-4 py-2 bg-gray-500 text-white rounded disabled:bg-gray-300"
            >
              Close Connection
            </button>
          </div>
          
          <div className="text-xs text-gray-500">
            <p>This test will:</p>
            <ol className="list-decimal list-inside ml-4">
              <li>Connect to Gemini Live API</li>
              <li>Send a test message</li>
              <li>Display the response</li>
              <li>Show any errors</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestGeminiConnection
