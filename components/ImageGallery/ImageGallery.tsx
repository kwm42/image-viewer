'use client';

import React from 'react';
import type { ImageFile, GallerySettings } from '@/types';
import { ImageGrid } from './ImageGrid';
import { ImageList } from './ImageList';

interface ImageGalleryProps {
  images: ImageFile[];
  settings: GallerySettings;
  onImageClick: (image: ImageFile, index: number) => void;
}

export function ImageGallery({ images, settings, onImageClick }: ImageGalleryProps) {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <svg className="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-lg font-medium mb-2">没有找到图片</p>
        <p className="text-sm">此文件夹中没有图片文件</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="h-full w-full p-6 box-border">
        {settings.viewMode === 'grid' ? (
          <ImageGrid
            images={images}
            columns={settings.gridColumns}
            imageFit={settings.imageFit}
            onImageClick={onImageClick}
          />
        ) : (
          <ImageList
            images={images}
            imageFit={settings.imageFit}
            onImageClick={onImageClick}
          />
        )}
      </div>
    </div>
  );
}
