export interface ImageThumbnail {
  size: string;
  path: string;
  url: string;
}

export interface ImageLocation {
  latitude: number;
  longitude: number;
}

export interface Image {
  id: number;
  description: string;
  area: string;
  photos: string[];
  thumbnails: ImageThumbnail[];
  location?: ImageLocation;
  stakeNumber?: string;
  offset?: number;
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdById: number;
  createdBy?: {
    id: number;
    username: string;
    avatar: string;
  };
} 