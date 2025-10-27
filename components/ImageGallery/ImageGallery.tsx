'use client';

import React from 'react';
import type { ImageFile, GallerySettings } from '@/types';
import { ImageGrid } from './ImageGrid';
import { ImageList } from './ImageList';
import * as ScrollArea from '@radix-ui/react-scroll-area';

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
    <ScrollArea.Root className="h-full">
      <ScrollArea.Viewport className="h-full w-full">
        <div className="p-6">
          {settings.viewMode === 'grid' ? (
            <ImageGrid
              images={images}
              columns={settings.gridColumns}
              onImageClick={onImageClick}
            />
          ) : (
            <ImageList images={images} onImageClick={onImageClick} />
          )}
        </div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        className="flex select-none touch-none p-0.5 bg-gray-100 dark:bg-gray-800 transition-colors duration-150 ease-out hover:bg-gray-200 dark:hover:bg-gray-700 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
        orientation="vertical"
      >
        <ScrollArea.Thumb className="flex-1 bg-gray-400 dark:bg-gray-600 rounded-full relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}
