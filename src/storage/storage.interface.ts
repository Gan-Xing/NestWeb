export interface IStorageService {
  uploadFile(file: Express.Multer.File): Promise<any>;
  deleteFile(filePath: string): Promise<boolean>;
  moveFile(oldPath: string, newPath: string, bucket?: string): Promise<boolean>;
} 