export interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

export class AudioProcessor {
  private audioParts: string[] = [];

  async processAudioInput(audioData: Buffer): Promise<Buffer> {
    // Process incoming audio for Gemini Live API
    // Convert to PCM format if needed
    return this.convertToPCM(audioData);
  }

  async processAudioResponse(base64Data: string, mimeType: string): Promise<Buffer> {
    // Process audio response from Gemini
    this.audioParts.push(base64Data);
    
    const options = this.parseMimeType(mimeType);
    return this.convertToWav(this.audioParts, options);
  }

  private convertToPCM(audioData: Buffer): Buffer {
    // Convert audio to PCM format for Gemini Live API
    // This is a simplified implementation
    return audioData;
  }

  private convertToWav(rawData: string[], options: WavConversionOptions): Buffer {
    const dataLength = rawData.reduce((a, b) => a + b.length, 0);
    const wavHeader = this.createWavHeader(dataLength, options);
    const buffer = Buffer.concat(rawData.map(data => Buffer.from(data, 'base64')));
    return Buffer.concat([wavHeader, buffer]);
  }

  private parseMimeType(mimeType: string): WavConversionOptions {
    const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
    const [_, format] = fileType.split('/');
    
    const options: Partial<WavConversionOptions> = {
      numChannels: 1,
      sampleRate: 24000, // Default sample rate for Gemini
      bitsPerSample: 16,
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

    return options as WavConversionOptions;
  }

  private createWavHeader(dataLength: number, options: WavConversionOptions): Buffer {
    const { numChannels, sampleRate, bitsPerSample } = options;
    
    // Calculate derived values
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    
    // Create WAV header buffer
    const buffer = Buffer.alloc(44);
    
    // RIFF header
    buffer.write('RIFF', 0);                      // ChunkID
    buffer.writeUInt32LE(36 + dataLength, 4);     // ChunkSize
    buffer.write('WAVE', 8);                      // Format
    
    // fmt subchunk
    buffer.write('fmt ', 12);                     // Subchunk1ID
    buffer.writeUInt32LE(16, 16);                 // Subchunk1Size (PCM)
    buffer.writeUInt16LE(1, 20);                  // AudioFormat (1 = PCM)
    buffer.writeUInt16LE(numChannels, 22);        // NumChannels
    buffer.writeUInt32LE(sampleRate, 24);         // SampleRate
    buffer.writeUInt32LE(byteRate, 28);           // ByteRate
    buffer.writeUInt16LE(blockAlign, 32);         // BlockAlign
    buffer.writeUInt16LE(bitsPerSample, 34);      // BitsPerSample
    
    // data subchunk
    buffer.write('data', 36);                     // Subchunk2ID
    buffer.writeUInt32LE(dataLength, 40);         // Subchunk2Size
    
    return buffer;
  }

  async processRealTimeAudio(audioChunk: Buffer): Promise<Buffer> {
    // Process real-time audio chunks
    // Apply noise reduction, normalization, etc.
    return this.normalizeAudio(audioChunk);
  }

  private normalizeAudio(audioData: Buffer): Buffer {
    // Simple audio normalization
    // In production, you'd use proper audio processing libraries
    return audioData;
  }

  async detectSpeech(audioData: Buffer): Promise<boolean> {
    // Detect if audio contains speech
    // This is a placeholder - in production you'd use VAD (Voice Activity Detection)
    return audioData.length > 0;
  }

  async extractAudioFeatures(audioData: Buffer): Promise<any> {
    // Extract audio features for analysis
    return {
      duration: this.estimateAudioDuration(audioData),
      hasVoice: await this.detectSpeech(audioData),
      volume: this.calculateVolume(audioData),
    };
  }

  private estimateAudioDuration(audioData: Buffer): number {
    // Estimate audio duration in seconds
    // This is a rough estimate - actual implementation would depend on format
    return audioData.length / (44100 * 2); // Assuming 44.1kHz, 16-bit
  }

  private calculateVolume(audioData: Buffer): number {
    // Calculate RMS volume
    let sum = 0;
    for (let i = 0; i < audioData.length; i += 2) {
      const sample = audioData.readInt16LE(i);
      sum += sample * sample;
    }
    return Math.sqrt(sum / (audioData.length / 2));
  }

  clearAudioParts() {
    this.audioParts = [];
  }

  getAudioParts(): string[] {
    return [...this.audioParts];
  }
}