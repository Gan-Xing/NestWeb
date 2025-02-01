import { Module, forwardRef } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailProducer } from './producers/email.producer';
import { EmailConsumer } from './consumers/email.consumer';
import { EmailModule } from '../email/email.module';
import { PrometheusModule, makeCounterProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';
import { PrometheusService } from '../monitoring/prometheus.service';
import { QUEUE_NAMES, QUEUE_CONFIG } from './constants/queue.constants';

@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('RABBITMQ_URI'),
        connectionInitOptions: { wait: false },
        exchanges: [
          {
            name: 'email.direct',
            type: 'direct',
          },
          {
            name: 'email.dlx',
            type: 'direct',
          },
        ],
        channels: {
          'email-channel': {
            prefetchCount: 20,
            default: true,
          },
        },
      }),
    }),
    PrometheusModule.register(),
    forwardRef(() => EmailModule),
  ],
  providers: [
    EmailProducer,
    EmailConsumer,
    PrometheusService,
    makeCounterProvider({
      name: 'email_received_total',
      help: 'Total number of received email messages',
      labelNames: ['type'],
    }),
    makeCounterProvider({
      name: 'email_success_total',
      help: 'Total number of successfully sent emails',
      labelNames: ['type'],
    }),
    makeCounterProvider({
      name: 'email_failure_total',
      help: 'Total number of failed email sends',
      labelNames: ['type'],
    }),
    makeHistogramProvider({
      name: 'email_processing_duration_seconds',
      help: 'Email processing duration in seconds',
      labelNames: ['type'],
      buckets: [0.1, 0.5, 1, 2, 5],
    }),
  ],
  exports: [EmailProducer],
})
export class QueueModule {} 