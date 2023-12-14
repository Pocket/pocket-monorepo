export interface Image {
  url: string;
  width: number;
  height: number;
}

export interface CachedImage extends Image {
  id: string;
}

export enum ImageFileType {
  WEBP = 'WEBP',
  JPEG = 'JPEG',
  PNG = 'PNG',
}

export type CachedImageInput = {
  id: string;
  qualityPercentage?: number;
  width?: number;
  height?: number;
  fileType?: ImageFileType;
};
