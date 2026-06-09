import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { FileAsset } from "@prisma/client";

type FileAssetUploader = {
  id: number;
  username: string | null;
  email: string | null;
  avatar: string | null;
};

export class FileAssetEntity implements FileAsset {
  constructor(partial: Partial<FileAssetEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  id: number;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  storagePath: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  size: number;

  @ApiPropertyOptional()
  extension: string | null;

  @ApiPropertyOptional()
  category: string | null;

  @ApiPropertyOptional()
  description: string | null;

  @ApiPropertyOptional()
  uploaderId: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt: Date | null;

  @ApiPropertyOptional()
  uploader?: FileAssetUploader | null;
}

export class FileDownloadEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  url: string;
}
