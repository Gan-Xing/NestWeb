import { SetMetadata } from '@nestjs/common';

export const SKIP_SYSTEM_LOG_KEY = 'skipSystemLog';
export const SkipSystemLog = () => SetMetadata(SKIP_SYSTEM_LOG_KEY, true); 