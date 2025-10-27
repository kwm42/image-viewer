'use client';

import React from 'react';
import type { ImageFile } from '@/types';
import { formatFileSize, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ImageListProps {
  images: ImageFile[];
  onImageClick: (image: ImageFile, index: number) => void;
}

export function ImageList({ images, onImageClick }: ImageListProps) {
  return (
    <div className="space-y-1">
      {images.map((image, index) => (
        <div
          key={image.id}
          className={cn(
            'flex items-center gap-4 p-3 rounded-lg cursor-pointer',
            'hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
            index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/50' : 'bg-white dark:bg-gray-900'
          )}
          onClick={() => onImageClick(image, index)}
        >
          {/* 缩略图 */}
          <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-200 dark:bg-gray-700">
            <img
              src={image.thumbnail}
              alt={image.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* 文件名 */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {image.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {image.folderPath || '根目录'}
            </p>
          </div>

          {/* 尺寸 */}
          <div className="text-xs text-gray-600 dark:text-gray-400 text-right w-24">
            {image.width} × {image.height}
          </div>

          {/* 文件大小 */}
          <div className="text-xs text-gray-600 dark:text-gray-400 w-20 text-right">
            {formatFileSize(image.size)}
          </div>

          {/* 修改日期 */}
          <div className="text-xs text-gray-600 dark:text-gray-400 w-32 text-right hidden lg:block">
            {formatDate(image.modifiedAt)}
          </div>
        </div>
      ))}
    </div>
  );
}
