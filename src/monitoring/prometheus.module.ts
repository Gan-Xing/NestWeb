import { Module } from '@nestjs/common';
import { PrometheusModule as NestPrometheusModule } from '@willsoto/nestjs-prometheus';
import { PrometheusService } from './prometheus.service';
import { makeCounterProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    NestPrometheusModule.register({
      defaultMetrics: {
        enabled: true,
        config: {
          prefix: 'nest_',
        },
      },
      path: '/metrics',
    }),
  ],
  providers: [
    PrometheusService,
    makeCounterProvider({
      name: 'email_received_total',
      help: '接收到的邮件总数',
      labelNames: ['type'],
    }),
    makeCounterProvider({
      name: 'email_success_total',
      help: '成功发送的邮件总数',
      labelNames: ['type'],
    }),
    makeCounterProvider({
      name: 'email_failure_total',
      help: '发送失败的邮件总数',
      labelNames: ['type'],
    }),
    makeHistogramProvider({
      name: 'email_processing_duration_seconds',
      help: '邮件处理时间（秒）',
      labelNames: ['type'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    }),
  ],
  exports: [PrometheusService],
})
export class PrometheusModule {} 