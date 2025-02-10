import { Process, Processor, OnQueueFailed } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { IP_GEO_QUEUE, IP_GEO_FETCH_JOB } from '../constants/queue.constants';
import { IpGeoErrorMiddleware } from '../middlewares/ip-geo-error.middleware';

interface IpGeoJob {
  ip: string;
  redisKey: string;
  ttl: number;
}

@Injectable()
@Processor(IP_GEO_QUEUE)
export class IpGeoProcessor {
  private readonly logger = new Logger(IpGeoProcessor.name);
  private readonly errorMiddleware: IpGeoErrorMiddleware;

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {
    this.errorMiddleware = new IpGeoErrorMiddleware();
  }

  @OnQueueFailed()
  async onFailed(job: Job, error: Error) {
    await this.errorMiddleware.handler(job, error);
  }

  @Process(IP_GEO_FETCH_JOB)
  async handleFetchGeo(job: Job<IpGeoJob>) {
    try {
      const { ip, redisKey, ttl } = job.data;
      
      // 获取地理位置信息
      const response = await axios.get(`http://ip-api.com/json/${ip}?lang=zh-CN`);
      const geoData = response.data;

      if (geoData.status === 'success') {
        // 格式化要存储的地理位置信息
        const locationData = {
          country: geoData.country,
          countryCode: geoData.countryCode,
          region: geoData.region,
          regionName: geoData.regionName,
          city: geoData.city,
          lat: geoData.lat,
          lon: geoData.lon,
          timezone: geoData.timezone,
          isp: geoData.isp,
          org: geoData.org,
          as: geoData.as,
          query: geoData.query
        };

        // 保存到 Redis
        await this.redisService.set(redisKey, locationData, ttl);

        // 使用 Prisma.sql 来执行原始 SQL 更新
        await this.prisma.$executeRaw`
          UPDATE system_logs 
          SET location = ${JSON.stringify(locationData)}::jsonb 
          WHERE ip = ${ip}
        `;

        this.logger.log(`Successfully processed IP geolocation for ${ip}`);
      } else {
        throw new Error(`Failed to get location data for IP: ${ip}`);
      }
      
    } catch (error) {
      this.logger.error(`Failed to process IP geolocation: ${error.message}`, error.stack);
      throw error;
    }
  }
}