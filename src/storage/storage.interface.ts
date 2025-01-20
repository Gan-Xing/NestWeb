export interface IStorageService {
  uploadFile(
    file: Express.Multer.File
  ): Promise<{
    url: string;
    path: string;
    thumbnails: Array<{ size: string; url: string; path: string }>;
    location?: { latitude: number; longitude: number };
  }>;
  
  deleteFile(path: string, bucket?: string): Promise<boolean>;
  getPresignedUrl(path: string, bucket?: string): Promise<string>;
  moveFile(oldPath: string, newPath: string, bucket?: string): Promise<boolean>;
} 