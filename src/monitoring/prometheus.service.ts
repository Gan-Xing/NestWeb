import { Injectable } from '@nestjs/common';
import { Counter, Histogram } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class PrometheusService {
  constructor(
    @InjectMetric('email_received_total')
    private emailReceivedCounter: Counter<string>,
    @InjectMetric('email_success_total')
    private emailSuccessCounter: Counter<string>,
    @InjectMetric('email_failure_total')
    private emailFailureCounter: Counter<string>,
    @InjectMetric('email_processing_duration_seconds')
    private emailProcessingDuration: Histogram<string>,
  ) {}

  // 邮件接收计数
  incrementEmailReceived(type: string): void {
    this.emailReceivedCounter.labels(type).inc();
  }

  // 邮件发送成功计数
  incrementEmailSuccess(type: string): void {
    this.emailSuccessCounter.labels(type).inc();
  }

  // 邮件发送失败计数
  incrementEmailFailure(type: string): void {
    this.emailFailureCounter.labels(type).inc();
  }

  // 邮件处理时间
  observeEmailProcessingTime(type: string, duration: number): void {
    this.emailProcessingDuration.labels(type).observe(duration / 1000); // 转换为秒
  }
} 