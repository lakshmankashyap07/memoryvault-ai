import fs from 'node:fs/promises';
import path from 'node:path';
import { del } from '@vercel/blob';

export interface StorageProvider {
  uploadFile(buffer: Buffer, originalFilename: string, mimeType: string): Promise<string>;
  deleteFile(fileUrl: string): Promise<boolean>;
}

class HybridStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads');
  }

  private async ensureDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(buffer: Buffer, originalFilename: string, _mimeType: string): Promise<string> {
    await this.ensureDir();
    const ext = path.extname(originalFilename) || '.bin';
    const safeBase = path.basename(originalFilename, ext).replaceAll(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueFilename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeBase}${ext}`;
    const filePath = path.join(this.uploadDir, uniqueFilename);

    await fs.writeFile(filePath, buffer);
    return `/uploads/${uniqueFilename}`;
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    if (!fileUrl) return false;

    // Vercel Blob file deletion
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      try {
        await del(fileUrl);
        return true;
      } catch (error) {
        console.error('Failed to delete file from Vercel Blob:', error);
        return false;
      }
    }

    // Local file deletion
    try {
      if (!fileUrl.startsWith('/uploads/')) return false;
      const filename = fileUrl.replace('/uploads/', '');
      const filePath = path.join(this.uploadDir, filename);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// Global storage singleton instance
export const storageProvider: StorageProvider = new HybridStorageProvider();
