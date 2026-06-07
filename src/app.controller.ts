import { Controller, Get } from '@nestjs/common';
import { Public } from 'src/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('api/health')
  getHealth() {
    return this.appService.getHealth();
  }
}
