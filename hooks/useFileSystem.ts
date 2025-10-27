'use client';

import { useState, useCallback } from 'react';
import type { ImageFile, FolderNode } from '@/types';
import { isImageFile } from '@/lib/fileUtils';
import { getImageDimensions, createThumbnail } from '@/lib/imageUtils';

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
   * 扫描文件夹（非递归）
   */
  const scanFolder = useCallback(
    async (
      dirHandle: FileSystemDirectoryHandle,
      parentPath = ''
    ): Promise<{ folders: FolderNode[]; images: ImageFile[] }> => {
      const folders: FolderNode[] = [];
      const images: ImageFile[] = [];

      try {
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
              try {
                const file = await entry.getFile();
                const imageFile = await createImageFile(file, entry, entryPath);
                images.push(imageFile);
              } catch (err) {
                console.error(`读取文件失败: ${entry.name}`, err);
              }
            }
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
   * 递归扫描所有子文件夹
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
    scanFolderRecursive,
  };
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
 * 创建图片文件对象
 */
async function createImageFile(
  file: File,
  handle: FileSystemFileHandle,
  path: string
): Promise<ImageFile> {
  const url = URL.createObjectURL(file);
  const dimensions = await getImageDimensions(url);
  const thumbnail = await createThumbnail(url, 300);

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
