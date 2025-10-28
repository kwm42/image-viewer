import type { ImageFile } from '@/types';
import { THUMBNAIL_SIZE } from './constants';

/**
 * 获取图片尺寸
 */
export function getImageDimensions(
  url: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * 生成缩略图
 */
export async function createThumbnail(
  url: string,
  maxSize: number = THUMBNAIL_SIZE
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(url);
          return;
        }

        const scale = Math.min(
          maxSize / img.naturalWidth,
          maxSize / img.naturalHeight,
          1
        );
        
        canvas.width = img.naturalWidth * scale;
        canvas.height = img.naturalHeight * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } catch (err) {
        console.error('生成缩略图失败:', err);
        resolve(url);
      }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}

/**
 * 加载图片
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * 释放 Object URL
 */
export function revokeObjectURL(url: string): void {
  try {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    console.error('释放 URL 失败:', err);
  }
}

/**
 * 批量释放图片占用的资源，避免 Object URL 泄漏
 */
export function releaseImageResources(images?: ImageFile[] | null): void {
  if (!images?.length) return;

  images.forEach((image) => {
    if (image.url) {
      revokeObjectURL(image.url);
      image.url = '';
    }

    if (image.thumbnail && image.thumbnail.startsWith('blob:')) {
      revokeObjectURL(image.thumbnail);
    }

    image.blob = null;
    image.metadataLoaded = false;
  });
}

/**
 * 确保图片基础元数据已加载
 */
export async function ensureImageMetadata(image: ImageFile): Promise<ImageFile> {
  if (image.metadataLoaded && image.blob) {
    return image;
  }

  const file = await image.handle.getFile();
  image.blob = file;
  image.size = file.size;
  image.type = file.type;

  const lastModified = file.lastModified ?? Date.now();
  const modifiedDate = new Date(lastModified);

  image.modifiedAt = modifiedDate;
  image.createdAt = modifiedDate;
  image.metadataLoaded = true;

  return image;
}

/**
 * 确保图片拥有可用的 Object URL
 */
export async function ensureImageURL(image: ImageFile): Promise<string> {
  await ensureImageMetadata(image);

  if (!image.url && image.blob) {
    image.url = URL.createObjectURL(image.blob);
  }

  return image.url;
}

/**
 * 批量加载图片元数据，控制并发量
 */
export async function ensureImagesMetadata(
  images: ImageFile[],
  concurrency = 16
): Promise<void> {
  if (!images.length) return;

  const queue = images.slice();
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length) {
      const image = queue.shift();
      if (!image) break;
      if (image.metadataLoaded && image.blob) continue;

      try {
        await ensureImageMetadata(image);
      } catch (err) {
        console.error('加载图片元数据失败:', err);
      }
    }
  });

  await Promise.all(workers);
}

/**
 * 计算适应容器的缩放比例
 */
export function calculateFitScale(
  imageWidth: number,
  imageHeight: number,
  containerWidth: number,
  containerHeight: number,
  mode: 'contain' | 'cover' = 'contain'
): number {
  const widthRatio = containerWidth / imageWidth;
  const heightRatio = containerHeight / imageHeight;

  if (mode === 'contain') {
    return Math.min(widthRatio, heightRatio, 1);
  } else {
    return Math.max(widthRatio, heightRatio);
  }
}
