import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { IStorageService } from './storage.interface';

@Injectable()
export class MinioStorageService implements IStorageService, OnModuleInit {
  private minioClient: Client;
  private defaultBucket: string;

  constructor(private configService: ConfigService) {
    try {
      this.defaultBucket = this.configService.get<string>('MINIO_DEFAULT_BUCKET');
      const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY');
      const secretKey = this.configService.get<string>('MINIO_SECRET_KEY');
      const endpoint = this.configService.get<string>('MINIO_ENDPOINT');
      const port = parseInt(this.configService.get<string>('MINIO_PORT'));
      const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';

      console.log('Minio Configuration:', {
        endpoint,
        port,
        useSSL,
        defaultBucket: this.defaultBucket,
        hasAccessKey: !!accessKey,
        hasSecretKey: !!secretKey
      });

      const config: any = {
        endPoint: endpoint,
        port,
        useSSL,
        accessKey,
        secretKey,
      };

      this.minioClient = new Client(config);
      console.log('Minio client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Minio client:', error);
      throw error;
    }
  }

  async onModuleInit() {
    try {
      console.log('Checking if bucket exists:', this.defaultBucket);
      const bucketExists = await this.minioClient.bucketExists(this.defaultBucket);
      console.log('Bucket exists:', bucketExists);
      
      if (!bucketExists) {
        console.log('Creating bucket:', this.defaultBucket);
        await this.minioClient.makeBucket(this.defaultBucket, 'us-east-1');
        console.log('Bucket created successfully');
      }
    } catch (error) {
      console.error('Failed to initialize Minio bucket:', error);
      // 不抛出错误，让服务继续启动
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    bucket: string = this.defaultBucket,
  ): Promise<{ url: string; path: string }> {
    const timestamp = new Date().getTime();
    const path = `${timestamp}-${file.originalname}`;

    await this.minioClient.putObject(
      bucket,
      path,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype }
    );

    return {
      url: await this.getFileUrl(path, bucket),
      path,
    };
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

  async getFileUrl(path: string, bucket: string = this.defaultBucket): Promise<string> {
    return await this.minioClient.presignedGetObject(bucket, path, 24 * 60 * 60); // 24小时有效期
  }

  async moveFile(
    oldPath: string,
    newPath: string,
    bucket: string = this.defaultBucket,
  ): Promise<boolean> {
    try {
      // Minio 不直接支持移动操作，我们需要复制后删除
      await this.minioClient.copyObject(
        bucket,
        newPath,
        `${bucket}/${oldPath}`,
        null
      );
      await this.minioClient.removeObject(bucket, oldPath);
      return true;
    } catch (error) {
      console.error('Error moving file:', error);
      return false;
    }
  }
} 