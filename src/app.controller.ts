import { Controller, Get } from '@nestjs/common';
import { I18n, I18nContext } from 'nestjs-i18n';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('greet')
  greet(@I18n() i18n: I18nContext): string {
    console.log('Current language:', i18n.lang);
    console.log('Translation for "message.hello":', i18n.t('message.hello')); // 注意这里使用完整路径
    return i18n.t('message.hello'); // 返回完整路径的翻译
  }
  
}
