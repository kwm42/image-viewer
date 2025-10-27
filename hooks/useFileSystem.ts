'use client';

import { useState, useCallback } from 'react';
import type { ImageFile, FolderNode } from '@/types';
import { isImageFile } from '@/lib/fileUtils';
import { cacheManager } from '@/lib/cacheManager';

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
      fastMode = true
    ): Promise<{ folders: FolderNode[]; images: ImageFile[] }> => {
      const folders: FolderNode[] = [];
      const imageFiles: Array<{ file: File; handle: FileSystemFileHandle; path: string }> = [];
      const images: ImageFile[] = [];

      try {
        // 第一步：快速扫描文件和文件夹
        // @ts-ignore - TypeScript 类型定义可能不完整
        for await (const entry of dirHandle.values()) {
          const entryPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;

          if (entry.kind === 'directory') {
            const imageCount = await countImages(entry);
            folders.push({
              id: crypto.randomUUID(),
              name: entry.name,
              handle: entry,
              path: entryPath,
              children: [],
              imageCount,
              totalImageCount: imageCount,
              isExpanded: false,
              isLoaded: false,
              level: parentPath.split('/').filter(Boolean).length,
            });
          } else if (entry.kind === 'file') {
            if (isImageFile(entry.name)) {
              const file = await entry.getFile();
              imageFiles.push({ file, handle: entry, path: entryPath });
            }
          }
        }

        if (fastMode) {
          // 快速模式：先返回基本信息，不加载缩略图
          images.push(
            ...await Promise.all(
              imageFiles.map(({ file, handle, path }) =>
                createImageFileFast(file, handle, path)
              )
            )
          );
        } else {
          // 完整模式：批量并发处理图片（每次处理 20 张）
          const batchSize = 20;
          for (let i = 0; i < imageFiles.length; i += batchSize) {
            const batch = imageFiles.slice(i, i + batchSize);
            const batchResults = await Promise.all(
              batch.map(async ({ file, handle, path }) => {
                try {
                  return await createImageFile(file, handle, path);
                } catch (err) {
                  console.error(`读取文件失败: ${file.name}`, err);
                  return null;
                }
              })
            );
            
            images.push(...batchResults.filter((img): img is ImageFile => img !== null));
          }
        }
      } catch (err) {
        console.error('扫描文件夹失败:', err);
      }

      // 按名称排序
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
      const imageFiles: Array<{ file: File; handle: FileSystemFileHandle; path: string }> = [];
      const images: ImageFile[] = [];

      try {
        // 第一步：快速扫描文件和文件夹
        // @ts-ignore
        for await (const entry of dirHandle.values()) {
          const entryPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;

          if (entry.kind === 'directory') {
            // 递归扫描子文件夹
            const { folders: subFolders, images: subImages } = await scanFolderStructure(
              entry,
              entryPath,
              level + 1
            );
            
            const imageCount = await countImages(entry);
            const totalImageCount = imageCount + subImages.length;
            
            folders.push({
              id: crypto.randomUUID(),
              name: entry.name,
              handle: entry,
              path: entryPath,
              children: subFolders,
              imageCount,
              totalImageCount,
              isExpanded: false,
              isLoaded: true,
              level,
            });
          } else if (entry.kind === 'file') {
            if (isImageFile(entry.name)) {
              const file = await entry.getFile();
              imageFiles.push({ file, handle: entry, path: entryPath });
            }
          }
        }

        // 第二步：快速创建图片对象（不生成缩略图，懒加载）
        images.push(
          ...await Promise.all(
            imageFiles.map(({ file, handle, path }) =>
              createImageFileFast(file, handle, path)
            )
          )
        );
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
  // 如果已有缩略图，直接返回
  if (image.thumbnail) {
    return image.thumbnail;
  }

  // 尝试从缓存获取
  const cached = await cacheManager.get(image.path, image.modifiedAt.getTime());
  if (cached) {
    return cached.thumbnail;
  }

  // 生成新缩略图
  const { thumbnail, dimensions } = await loadImageOnce(image.url);

  // 保存到缓存
  cacheManager.set({
    path: image.path,
    thumbnail,
    width: dimensions.width,
    height: dimensions.height,
    size: image.size,
    modifiedAt: image.modifiedAt.getTime(),
    cachedAt: Date.now(),
  }).catch(err => console.error('缓存保存失败:', err));

  // 更新图片对象
  image.thumbnail = thumbnail;
  image.width = dimensions.width;
  image.height = dimensions.height;

  return thumbnail;
}

/**
 * 统计文件夹内的图片数量
 */
async function countImages(dirHandle: FileSystemDirectoryHandle): Promise<number> {
  let count = 0;
  try {
    // @ts-ignore
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
 * 创建图片文件对象（优化版：使用缓存 + 延迟加载缩略图）
 */
async function createImageFile(
  file: File,
  handle: FileSystemFileHandle,
  path: string,
  useCache = true
): Promise<ImageFile> {
  const url = URL.createObjectURL(file);
  const modifiedAt = file.lastModified;

  // 尝试从缓存获取
  if (useCache) {
    const cached = await cacheManager.get(path, modifiedAt);
    if (cached) {
      return {
        id: crypto.randomUUID(),
        name: file.name,
        handle,
        path,
        blob: file,
        url,
        thumbnail: cached.thumbnail,
        size: file.size,
        width: cached.width,
        height: cached.height,
        type: file.type,
        createdAt: new Date(file.lastModified),
        modifiedAt: new Date(file.lastModified),
        folderPath: path.slice(0, path.lastIndexOf('/')),
      };
    }
  }

  // 缓存未命中，加载图片
  const { dimensions, thumbnail } = await loadImageOnce(url);

  // 保存到缓存
  if (useCache) {
    cacheManager.set({
      path,
      thumbnail,
      width: dimensions.width,
      height: dimensions.height,
      size: file.size,
      modifiedAt,
      cachedAt: Date.now(),
    }).catch(err => console.error('缓存保存失败:', err));
  }

  return {
    id: crypto.randomUUID(),
    name: file.name,
    handle,
    path,
    blob: file,
    url,
    thumbnail,
    size: file.size,
    width: dimensions.width,
    height: dimensions.height,
    type: file.type,
    createdAt: new Date(file.lastModified),
    modifiedAt: new Date(file.lastModified),
    folderPath: path.slice(0, path.lastIndexOf('/')),
  };
}

/**
 * 快速创建图片文件对象（不生成缩略图，用于快速扫描）
 */
async function createImageFileFast(
  file: File,
  handle: FileSystemFileHandle,
  path: string
): Promise<ImageFile> {
  const url = URL.createObjectURL(file);

  return {
    id: crypto.randomUUID(),
    name: file.name,
    handle,
    path,
    blob: file,
    url,
    thumbnail: '', // 空缩略图，稍后按需加载
    size: file.size,
    width: 0, // 未知尺寸
    height: 0,
    type: file.type,
    createdAt: new Date(file.lastModified),
    modifiedAt: new Date(file.lastModified),
    folderPath: path.slice(0, path.lastIndexOf('/')),
  };
}

/**
 * 一次性加载图片，同时获取尺寸和生成缩略图
 */
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

        const maxSize = 300;
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
