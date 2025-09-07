import { promises as fs } from 'fs';
import { join } from 'path';
import mime from 'mime';

export class FileUtils {
  static async saveFile(data: Buffer, filename: string, directory: string = 'uploads'): Promise<string> {
    const dir = join(process.cwd(), directory);
    
    // Ensure directory exists
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }

    const filepath = join(dir, filename);
    await fs.writeFile(filepath, data);
    
    return filepath;
  }

  static async readFile(filepath: string): Promise<Buffer> {
    return await fs.readFile(filepath);
  }

  static async deleteFile(filepath: string): Promise<void> {
    try {
      await fs.unlink(filepath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  static getMimeType(filename: string): string {
    return mime.getType(filename) || 'application/octet-stream';
  }

  static generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    
    return `${baseName}_${timestamp}_${random}.${extension}`;
  }

  static async getFileSize(filepath: string): Promise<number> {
    const stats = await fs.stat(filepath);
    return stats.size;
  }

  static isValidFileType(mimeType: string, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return mimeType.startsWith(type.slice(0, -1));
      }
      return mimeType === type;
    });
  }

  static async cleanupOldFiles(directory: string, maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const dir = join(process.cwd(), directory);
      const files = await fs.readdir(dir);
      const now = Date.now();

      for (const file of files) {
        const filepath = join(dir, file);
        const stats = await fs.stat(filepath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filepath);
          console.log(`Cleaned up old file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old files:', error);
    }
  }
}