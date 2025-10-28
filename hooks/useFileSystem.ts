'use client';

import { useState, useCallback } from 'react';
import type { ImageFile, FolderNode } from '@/types';
import { isImageFile } from '@/lib/fileUtils';
import { cacheManager } from '@/lib/cacheManager';
import { ensureImageMetadata, ensureImageURL } from '@/lib/imageUtils';
import { THUMBNAIL_SIZE } from '@/lib/constants';

const MAX_THUMBNAIL_CONCURRENCY = 4;
let activeThumbnailTasks = 0;
const thumbnailTaskQueue: Array<() => void> = [];
const thumbnailPromises = new Map<string, Promise<string>>();

function runNextThumbnailTask() {
  if (activeThumbnailTasks >= MAX_THUMBNAIL_CONCURRENCY) {
    return;
  }

  const nextTask = thumbnailTaskQueue.shift();
  if (!nextTask) {
    return;
  }

  nextTask();
}

function scheduleThumbnailTask<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const execute = () => {
      activeThumbnailTasks++;

      task()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          activeThumbnailTasks = Math.max(0, activeThumbnailTasks - 1);
          runNextThumbnailTask();
        });
    };

    thumbnailTaskQueue.push(execute);

    queueMicrotask(runNextThumbnailTask);
  });
}

export function useFileSystem() {
  const [isSupported, setIsSupported] = useState(
    typeof window !== 'undefined' && 'showDirectoryPicker' in window
  );

  /**
   * 打开文件夹选择对话框
   */
  const openFolder = useCallback(async (): Promise<FileSystemDirectoryHandle | null> => {
    if (!isSupported) {
      alert('您的浏览器不支持 File System Access API，请使用 Chrome 或 Edge 浏览器');
      return null;
    }

    try {
      const handle = await window.showDirectoryPicker({
        mode: 'read',
        startIn: 'pictures',
      });
      return handle;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('打开文件夹失败:', err);
      }
      return null;
    }
  }, [isSupported]);

  /**
   * 扫描文件夹（非递归）- 快速模式
   */
  const scanFolder = useCallback(
    async (
      dirHandle: FileSystemDirectoryHandle,
      parentPath = '',
      options: { includeImages?: boolean } = {}
    ): Promise<{ folders: FolderNode[]; images: ImageFile[] }> => {
      const includeImages = options.includeImages ?? true;
      const folders: FolderNode[] = [];
      const images: ImageFile[] = [];

      try {
        // @ts-ignore - 某些浏览器类型定义不完整
        for await (const entry of dirHandle.values()) {
          const entryPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;

          if (entry.kind === 'directory') {
            folders.push({
              id: crypto.randomUUID(),
              name: entry.name,
              handle: entry,
              path: entryPath,
              children: [],
              isExpanded: false,
              isLoaded: false,
              level: parentPath.split('/').filter(Boolean).length,
            });
          } else if (entry.kind === 'file' && includeImages) {
            if (isImageFile(entry.name)) {
              images.push(createImagePlaceholder(entry, entryPath));
            }
          }
        }
      } catch (err) {
        console.error('扫描文件夹失败:', err);
      }

      folders.sort((a, b) => a.name.localeCompare(b.name));
      images.sort((a, b) => a.name.localeCompare(b.name));

      return { folders, images };
    },
    []
  );

  /**
   * 递归扫描文件夹结构（包含子文件夹）- 快速模式
   */
  const scanFolderStructure = useCallback(
    async (
      dirHandle: FileSystemDirectoryHandle,
      parentPath = '',
      level = 0
    ): Promise<{ folders: FolderNode[]; images: ImageFile[] }> => {
      const folders: FolderNode[] = [];
      const images: ImageFile[] = [];

      try {
        // 第一步：快速扫描文件和文件夹
        // @ts-ignore
        for await (const entry of dirHandle.values()) {
          const entryPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;

          if (entry.kind === 'directory') {
            // 递归扫描子文件夹
            const { folders: subFolders } = await scanFolderStructure(
              entry,
              entryPath,
              level + 1
            );

            folders.push({
              id: crypto.randomUUID(),
              name: entry.name,
              handle: entry,
              path: entryPath,
              children: subFolders,
              isExpanded: false,
              isLoaded: true,
              level,
            });
          } else if (entry.kind === 'file') {
            if (isImageFile(entry.name)) {
              images.push(createImagePlaceholder(entry, entryPath));
            }
          }
        }

      } catch (err) {
        console.error('扫描文件夹结构失败:', err);
      }

      // 按名称排序
      folders.sort((a, b) => a.name.localeCompare(b.name));
      images.sort((a, b) => a.name.localeCompare(b.name));

      return { folders, images };
    },
    []
  );

  /**
   * 递归扫描所有子文件夹的图片
   */
  const scanFolderRecursive = useCallback(
    async (
      dirHandle: FileSystemDirectoryHandle,
      parentPath = ''
    ): Promise<ImageFile[]> => {
      const allImages: ImageFile[] = [];

      const { folders, images } = await scanFolder(dirHandle, parentPath);
      allImages.push(...images);

      // 递归扫描子文件夹
      for (const folder of folders) {
        const subImages = await scanFolderRecursive(folder.handle, folder.path);
        allImages.push(...subImages);
      }

      return allImages;
    },
    [scanFolder]
  );

  return {
    isSupported,
    openFolder,
    scanFolder,
    scanFolderStructure,
    scanFolderRecursive,
    loadThumbnail,
  };
}

/**
 * 按需加载图片缩略图
 */
export async function loadThumbnail(image: ImageFile): Promise<string> {
  if (image.thumbnail) {
    return image.thumbnail;
  }

  const cacheKey = image.path;
  const existingTask = thumbnailPromises.get(cacheKey);
  if (existingTask) {
    return existingTask;
  }

  const task = scheduleThumbnailTask(async () => {
    if (image.thumbnail) {
      return image.thumbnail;
    }

    await ensureImageMetadata(image);

    const modifiedAt = image.modifiedAt?.getTime?.() ?? 0;

    if (modifiedAt) {
      const cached = await cacheManager.get(image.path, modifiedAt);
      if (cached) {
        image.thumbnail = cached.thumbnail;
        image.width = cached.width;
        image.height = cached.height;
        image.size = cached.size;
        return cached.thumbnail;
      }
    }

    const url = await ensureImageURL(image);
    const { dimensions, thumbnail } = await loadImageOnce(url);

    image.thumbnail = thumbnail;
    image.width = dimensions.width;
    image.height = dimensions.height;

    if (modifiedAt) {
      cacheManager
        .set({
          path: image.path,
          thumbnail,
          width: dimensions.width,
          height: dimensions.height,
          size: image.size,
          modifiedAt,
          cachedAt: Date.now(),
        })
        .catch((err) => console.error('缓存保存失败:', err));
    }

    return thumbnail;
  });

  thumbnailPromises.set(cacheKey, task);

  try {
    return await task;
  } finally {
    thumbnailPromises.delete(cacheKey);
  }
}

function createImagePlaceholder(handle: FileSystemFileHandle, path: string): ImageFile {
  const lastSlash = path.lastIndexOf('/');

  return {
    id: crypto.randomUUID(),
    name: handle.name,
    handle,
    path,
    blob: null,
    url: '',
    thumbnail: '',
    size: 0,
    width: 0,
    height: 0,
    type: '',
    createdAt: new Date(0),
    modifiedAt: new Date(0),
    folderPath: lastSlash > -1 ? path.slice(0, lastSlash) : '',
    metadataLoaded: false,
  };
}

async function loadImageOnce(
  url: string
): Promise<{ dimensions: { width: number; height: number }; thumbnail: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const dimensions = {
          width: img.naturalWidth,
          height: img.naturalHeight,
        };

        // 生成缩略图
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve({ dimensions, thumbnail: url });
          return;
        }

        const maxSize = THUMBNAIL_SIZE;
        const scale = Math.min(
          maxSize / img.naturalWidth,
          maxSize / img.naturalHeight,
          1
        );
        
        canvas.width = img.naturalWidth * scale;
        canvas.height = img.naturalHeight * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        
        resolve({ dimensions, thumbnail });
      } catch (err) {
        console.error('处理图片失败:', err);
        resolve({
          dimensions: { width: 0, height: 0 },
          thumbnail: url,
        });
      }
    };
    img.onerror = () => {
      resolve({
        dimensions: { width: 0, height: 0 },
        thumbnail: url,
      });
    };
    img.src = url;
  });
}
