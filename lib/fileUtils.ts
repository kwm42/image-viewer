import { IMAGE_EXTENSIONS } from './constants';

/**
 * 判断是否为图片文件
 */
export function isImageFile(filename: string): boolean {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return IMAGE_EXTENSIONS.includes(ext as any);
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  return filename.toLowerCase().slice(filename.lastIndexOf('.'));
}

/**
 * 获取不带扩展名的文件名
 */
export function getFileNameWithoutExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex > 0 ? filename.slice(0, lastDotIndex) : filename;
}

/**
 * 统计文件夹内的图片数量（不递归）
 */
export async function countImages(
  dirHandle: FileSystemDirectoryHandle
): Promise<number> {
  let count = 0;
  try {
    // @ts-ignore - TypeScript 类型定义可能不完整
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file' && isImageFile(entry.name)) {
        count++;
      }
    }
  } catch (err) {
    console.error('统计图片数量失败:', err);
  }
  return count;
}

/**
 * 递归统计文件夹内的图片数量
 */
export async function countImagesRecursive(
  dirHandle: FileSystemDirectoryHandle
): Promise<number> {
  let count = 0;
  try {
    // @ts-ignore - TypeScript 类型定义可能不完整
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file' && isImageFile(entry.name)) {
        count++;
      } else if (entry.kind === 'directory') {
        count += await countImagesRecursive(entry);
      }
    }
  } catch (err) {
    console.error('递归统计图片数量失败:', err);
  }
  return count;
}
