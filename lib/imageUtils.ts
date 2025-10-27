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
