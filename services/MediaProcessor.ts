import { promises as fs } from 'fs';
import { join } from 'path';
import mime from 'mime';

export interface ProcessedFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  data: Buffer;
  processedAt: Date;
}

export class MediaProcessor {
  private tempDir: string;

  constructor() {
    this.tempDir = join(process.cwd(), 'temp');
    this.ensureTempDir();
  }

  private async ensureTempDir() {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }

  async processFile(file: Express.Multer.File): Promise<ProcessedFile> {
    const fileId = this.generateFileId();
    const mimeType = file.mimetype || mime.getType(file.originalname) || 'application/octet-stream';

    const processedFile: ProcessedFile = {
      id: fileId,
      originalName: file.originalname,
      mimeType,
      size: file.size,
      data: file.buffer,
      processedAt: new Date(),
    };

    // Process based on file type
    if (mimeType.startsWith('image/')) {
      processedFile.data = await this.processImage(file.buffer, mimeType);
    } else if (mimeType.startsWith('audio/')) {
      processedFile.data = await this.processAudio(file.buffer, mimeType);
    } else if (mimeType.startsWith('video/')) {
      processedFile.data = await this.processVideo(file.buffer, mimeType);
    }

    // Save to temp directory for potential reuse
    const tempPath = join(this.tempDir, `${fileId}_${file.originalname}`);
    await fs.writeFile(tempPath, processedFile.data);

    return processedFile;
  }

  private async processImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
    // For now, return as-is. In production, you might want to:
    // - Resize images
    // - Convert formats
    // - Compress
    return buffer;
  }

  private async processAudio(buffer: Buffer, mimeType: string): Promise<Buffer> {
    // For now, return as-is. In production, you might want to:
    // - Convert to supported formats
    // - Normalize audio levels
    // - Apply noise reduction
    return buffer;
  }

  private async processVideo(buffer: Buffer, mimeType: string): Promise<Buffer> {
    // For now, return as-is. In production, you might want to:
    // - Extract frames
    // - Convert formats
    // - Compress
    return buffer;
  }

  async processVideoForGemini(videoData: Buffer): Promise<Buffer> {
    // Process video data specifically for Gemini Live API
    // This might involve:
    // - Converting to supported format
    // - Extracting key frames
    // - Compressing for real-time transmission
    return videoData;
  }

  async processImageForGemini(imageData: Buffer): Promise<Buffer> {
    // Process image data specifically for Gemini Live API
    return imageData;
  }

  async extractVideoFrames(videoData: Buffer, frameRate: number = 1): Promise<Buffer[]> {
    // Extract frames from video for analysis
    // This is a placeholder - in production you'd use ffmpeg or similar
    return [videoData];
  }

  async convertVideoFormat(videoData: Buffer, targetFormat: string): Promise<Buffer> {
    // Convert video to target format
    // This is a placeholder - in production you'd use ffmpeg
    return videoData;
  }

  async compressMedia(mediaData: Buffer, quality: number = 0.8): Promise<Buffer> {
    // Compress media for transmission
    // This is a placeholder - in production you'd use appropriate compression libraries
    return mediaData;
  }

  private generateFileId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  async cleanup(fileId: string) {
    try {
      const files = await fs.readdir(this.tempDir);
      const filesToDelete = files.filter(file => file.startsWith(fileId));
      
      for (const file of filesToDelete) {
        await fs.unlink(join(this.tempDir, file));
      }
    } catch (error) {
      console.error('Error cleaning up files:', error);
    }
  }
}