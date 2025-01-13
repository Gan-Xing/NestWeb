import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { IStorageService } from './storage.interface';
import { extname } from 'path';
import { exiftool } from 'exiftool-vendored';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';

const execPromise = promisify(exec);

@Injectable()
export class MinioStorageService implements IStorageService, OnModuleInit {
  private minioClient: Client;
  private defaultBucket: string;

  constructor(private configService: ConfigService) {
    try {
      this.defaultBucket = this.configService.get<string>('MINIO_DEFAULT_BUCKET');
      const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY');
      const secretKey = this.configService.get<string>('MINIO_SECRET_KEY');
      const publicUrl = this.configService.get<string>('MINIO_PUBLIC_URL');
      
      // 如果配置了公共访问 URL，使用它的 hostname 作为 endPoint
      let endpoint = this.configService.get<string>('MINIO_ENDPOINT');
      let port = parseInt(this.configService.get<string>('MINIO_PORT'));
      let useSSL = false;

      if (publicUrl) {
        try {
          const url = new URL(publicUrl);
          endpoint = url.hostname;
          port = url.port ? parseInt(url.port) : (url.protocol === 'https:' ? 443 : 80);
          useSSL = url.protocol === 'https:';
        } catch (e) {
          console.warn('Invalid MINIO_PUBLIC_URL, falling back to default endpoint');
        }
      }

      const config: any = {
        endPoint: endpoint,
        port,
        useSSL,
        accessKey,
        secretKey,
      };

      this.minioClient = new Client(config);
    } catch (error) {
      console.error('Failed to initialize Minio client:', error);
      throw error;
    }
  }

  async onModuleInit() {
    try {
      const bucketExists = await this.minioClient.bucketExists(this.defaultBucket);
      if (!bucketExists) {
        await this.minioClient.makeBucket(this.defaultBucket, 'us-east-1');
      }
    } catch (error) {
      console.error('Failed to initialize Minio bucket:', error);
    }
  }

  private async extractGPSInfo(buffer: Buffer): Promise<{ latitude: number; longitude: number } | null> {
    const startTime = Date.now();
    const tempFilePath = `/tmp/gps-${Date.now()}.jpg`;
    
    try {
      await fs.writeFile(tempFilePath, buffer);
      console.log(`[${new Date().toISOString()}] GPS提取：临时文件写入完成，耗时: ${Date.now() - startTime}ms`);

      const metadata = await exiftool.read(tempFilePath);
      const { GPSLatitude: latitude, GPSLongitude: longitude } = metadata;

      if (typeof latitude === 'number' && typeof longitude === 'number') {
        return { latitude, longitude };
      }
      return null;
    } catch (error) {
      console.error('Failed to extract GPS info:', error);
      return null;
    } finally {
      await fs.unlink(tempFilePath).catch(() => {});
    }
  }

  private async convertToJpeg(buffer: Buffer): Promise<Buffer> {
    const startTime = Date.now();
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const tempHeicPath = `/tmp/heic-${uniqueId}.heic`;
    const tempJpegPath = `/tmp/jpeg-${uniqueId}.jpg`;

    try {
      await fs.writeFile(tempHeicPath, buffer);
      console.log(`[${new Date().toISOString()}] 转换：临时文件写入完成，耗时: ${Date.now() - startTime}ms`);

      try {
        const convertStartTime = Date.now();
        await execPromise(`magick "${tempHeicPath}" -quality 85 "${tempJpegPath}"`);
        
        const stats = await fs.stat(tempJpegPath);
        if (stats.size > 0) {
          console.log(`[${new Date().toISOString()}] 转换：ImageMagick转换完成，耗时: ${Date.now() - convertStartTime}ms`);
          return await fs.readFile(tempJpegPath);
        }
        throw new Error('转换后文件大小为0');
      } catch (magickError) {
        if (process.platform === 'darwin') {
          const sipsStartTime = Date.now();
          await execPromise(`sips -s format jpeg -s formatOptions 85 "${tempHeicPath}" --out "${tempJpegPath}"`);
          
          const stats = await fs.stat(tempJpegPath);
          if (stats.size > 0) {
            console.log(`[${new Date().toISOString()}] 转换：sips转换完成，耗时: ${Date.now() - sipsStartTime}ms`);
            return await fs.readFile(tempJpegPath);
          }
        }
        throw magickError;
      }
    } finally {
      // 并行清理临时文件
      await Promise.all([
        fs.unlink(tempHeicPath).catch(() => {}),
        fs.unlink(tempJpegPath).catch(() => {})
      ]);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
  ): Promise<{ url: string; path: string; location?: { latitude: number; longitude: number } }> {
    const startTime = Date.now();
    console.log(`[${new Date().toISOString()}] 开始处理文件上传，大小: ${file.size} bytes`);

    const bucket = this.configService.get('MINIO_DEFAULT_BUCKET');
    const fileBuffer = file.buffer;
    const fileType = file.mimetype;
    const isHeic = fileType === 'image/heic' || fileType === 'image/heif';
    const timestamp = Date.now();
    const randomId = Math.round(Math.random() * 1e9);

    try {
      // 并行处理 GPS 提取
      const gpsPromise = this.extractGPSInfo(fileBuffer);

      if (isHeic) {
        // HEIC 文件处理：直接转换为 JPEG
        const jpegPath = `photos/${timestamp}-${randomId}.jpg`;

        // 并行处理文件转换和 GPS 提取
        const [jpegBuffer, gpsInfo] = await Promise.all([
          this.convertToJpeg(fileBuffer),
          gpsPromise
        ]);

        // 上传转换后的文件
        await this.minioClient.putObject(bucket, jpegPath, jpegBuffer, jpegBuffer.length, {
          'Content-Type': 'image/jpeg',
        });

        return {
          url: await this.getPresignedUrl(jpegPath),
          path: jpegPath,
          ...(gpsInfo && { location: gpsInfo }),
        };
      } else {
        // 非 HEIC 文件处理
        const ext = extname(file.originalname).toLowerCase() || '.jpg';
        const filePath = `photos/${timestamp}-${randomId}${ext}`;

        // 并行处理文件上传和 GPS 提取
        const [gpsInfo] = await Promise.all([
          gpsPromise,
          this.minioClient.putObject(bucket, filePath, fileBuffer, fileBuffer.length, {
            'Content-Type': file.mimetype,
          })
        ]);

        return {
          url: await this.getPresignedUrl(filePath),
          path: filePath,
          ...(gpsInfo && { location: gpsInfo }),
        };
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] 文件处理失败:`, error);
      throw error;
    }
  }

  async deleteFile(path: string, bucket: string = this.defaultBucket): Promise<boolean> {
    try {
      await this.minioClient.removeObject(bucket, path);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
  async getPresignedUrl(path: string, bucket: string = this.defaultBucket): Promise<string> {
    return await this.minioClient.presignedGetObject(bucket, path, 24 * 60 * 60);
  }

  async moveFile(
    oldPath: string,
    newPath: string,
    bucket: string = this.defaultBucket,
  ): Promise<boolean> {
    try {
      await this.minioClient.copyObject(bucket, newPath, `${bucket}/${oldPath}`, null);
      await this.minioClient.removeObject(bucket, oldPath);
      return true;
    } catch (error) {
      console.error('Error moving file:', error);
      return false;
    }
  }
} 