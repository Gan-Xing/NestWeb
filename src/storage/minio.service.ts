import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { IStorageService } from './storage.interface';
import { extname } from 'path';
import { exiftool } from 'exiftool-vendored';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as sharp from 'sharp';

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
      let port: number | undefined;
      let useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';

      if (publicUrl) {
        try {
          const url = new URL(publicUrl);
          endpoint = url.hostname;
          port = url.port ? parseInt(url.port) : undefined;
          useSSL = url.protocol === 'https:';
          
          console.log('MinIO Configuration from URL:', {
            endpoint,
            port,
            useSSL,
            publicUrl
          });
        } catch (e) {
          console.warn('Invalid MINIO_PUBLIC_URL, falling back to default endpoint');
        }
      }

      const config: any = {
        endPoint: endpoint,
        useSSL,
        accessKey,
        secretKey,
      };

      // 只有在明确指定端口时才添加端口配置
      if (port) {
        config.port = port;
      }

      console.log('Final MinIO Configuration:', {
        ...config,
        bucket: this.defaultBucket
      });

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
  ): Promise<{
    url: string;
    path: string;
    thumbnails: Array<{ size: string; url: string; path: string }>;
    location?: { latitude: number; longitude: number };
  }> {
    const startTime = Date.now();
    console.log(`[${new Date().toISOString()}] 开始处理文件上传，大小: ${file.size} bytes`);

    const bucket = this.configService.get('MINIO_DEFAULT_BUCKET');
    
    // 确保 bucket 存在
    const bucketExists = await this.minioClient.bucketExists(bucket);
    if (!bucketExists) {
      console.log(`Bucket ${bucket} 不存在，正在创建...`);
      await this.minioClient.makeBucket(bucket, 'us-east-1');
    }

    const fileBuffer = file.buffer;
    const fileType = file.mimetype;
    const isHeic = fileType === 'image/heic' || fileType === 'image/heif';
    const timestamp = Date.now();
    const randomId = Math.round(Math.random() * 1e9);

    try {
      // 并行处理 GPS 提取
      const gpsPromise = this.extractGPSInfo(fileBuffer);

      let processedBuffer = fileBuffer;
      let processedFileType = fileType;
      if (isHeic) {
        processedBuffer = await this.convertToJpeg(fileBuffer);
        processedFileType = 'image/jpeg';
      }

      // 生成文件路径
      const ext = isHeic ? '.jpg' : path.extname(file.originalname);
      const fileName = `${timestamp}-${randomId}${ext}`;
      const filePath = `uploads/${fileName}`;

      // 上传原始文件
      await this.minioClient.putObject(
        bucket,
        filePath,
        processedBuffer,
        processedBuffer.length,
        { 'Content-Type': processedFileType }
      );

      // 生成公共访问 URL
      const publicUrl = this.configService.get('MINIO_PUBLIC_URL');
      const fileUrl = publicUrl 
        ? `${publicUrl}/${bucket}/${filePath}`  // 包含 bucket 名称
        : await this.getPresignedUrl(filePath);

      // 如果是图片，生成缩略图
      const thumbnails: Array<{ size: string; url: string; path: string }> = [];
      if (fileType.startsWith('image/')) {
        const sizes = ['64x64', '500x500'];
        for (const size of sizes) {
          const [width, height] = size.split('x').map(Number);
          const thumbnailBuffer = await sharp(processedBuffer)
            .resize(width, height, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .toBuffer();

          const thumbnailPath = `uploads/thumbnails/${timestamp}-${randomId}-${size}${ext}`;
          await this.minioClient.putObject(
            bucket,
            thumbnailPath,
            thumbnailBuffer,
            thumbnailBuffer.length,
            { 'Content-Type': processedFileType }
          );

          // 生成缩略图的公共访问 URL
          const thumbnailUrl = publicUrl
            ? `${publicUrl}/${bucket}/${thumbnailPath}`  // 包含 bucket 名称
            : await this.getPresignedUrl(thumbnailPath);

          thumbnails.push({
            size,
            url: thumbnailUrl,
            path: thumbnailPath
          });
        }
      }

      const location = await gpsPromise;

      console.log(`[${new Date().toISOString()}] 文件上传完成，耗时: ${Date.now() - startTime}ms`);

      return {
        url: fileUrl,
        path: filePath,
        thumbnails,
        ...(location && { location })
      };
    } catch (error) {
      console.error('文件上传失败:', error);
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
    const publicUrl = this.configService.get<string>('MINIO_PUBLIC_URL');
    
    if (publicUrl) {
      // 直接返回公共访问 URL，需要包含 bucket 名称
      return `${publicUrl}/${bucket}/${path}`;
    }

    // 如果没有配置公共访问 URL，则返回预签名 URL
    const url = await this.minioClient.presignedGetObject(bucket, path, 24 * 60 * 60);
    return url;
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