import { PartialType } from '@nestjs/swagger';
import { CreatePhotoLogDto } from './create-photo-log.dto';

export class UpdatePhotoLogDto extends PartialType(CreatePhotoLogDto) {} 