import { GeminiLiveClient } from '@/components/GeminiLiveClient';

export function GeminiLivePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            Gemini Live API Demo
          </h1>
          <p className="text-muted-foreground mt-2">
            Experience multi-modal AI conversations with text, audio, video, and screen sharing
          </p>
        </div>
        <GeminiLiveClient />
      </div>
    </div>
  );
}