export interface IStorageService {
  uploadFile(file: Express.Multer.File): Promise<{
    url: string;
    path: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  }>;
  deleteFile(filePath: string): Promise<boolean>;
  moveFile(oldPath: string, newPath: string, bucket?: string): Promise<boolean>;
  getPresignedUrl(filePath: string): Promise<string>;
} 