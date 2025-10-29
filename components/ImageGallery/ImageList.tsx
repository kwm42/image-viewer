'use client';

import React, { useEffect, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import type { ImageFile } from '@/types';
import { formatFileSize, formatDate, cn } from '@/lib/utils';
import { loadThumbnail } from '@/hooks/useFileSystem';
import { ensureImageURL } from '@/lib/imageUtils';

interface ImageListProps {
  images: ImageFile[];
  imageFit: 'cover' | 'contain';
  onImageClick: (image: ImageFile, index: number) => void;
}

interface ListItemData {
  images: ImageFile[];
  imageFit: 'cover' | 'contain';
  onImageClick: (image: ImageFile, index: number) => void;
}

const ROW_HEIGHT = 96;
const ROW_GAP = 8;

const ListRow = ({ index, style, data }: ListChildComponentProps<ListItemData>) => {
  const { images, onImageClick, imageFit } = data;
  const image = images[index];

  const [thumbnail, setThumbnail] = useState(image?.thumbnail ?? '');

  useEffect(() => {
    setThumbnail(image?.thumbnail ?? '');
  }, [image?.id, image?.thumbnail]);

  useEffect(() => {
    let cancelled = false;

    if (!image) return;

    if (!thumbnail) {
      loadThumbnail(image)
        .then((thumb) => {
          if (!cancelled) {
            setThumbnail(thumb);
          }
        })
        .catch(async () => {
          try {
            const url = await ensureImageURL(image);
            if (!cancelled) {
              setThumbnail(url);
            }
          } catch (err) {
            console.error('加载列表缩略图失败:', err);
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [image, thumbnail]);

  if (!image) {
    return null;
  }

  const containerStyle: React.CSSProperties = {
    ...style,
    top: (style.top as number) + ROW_GAP / 2,
    height: ROW_HEIGHT - ROW_GAP,
    width: style.width,
    padding: ROW_GAP / 2,
    boxSizing: 'border-box',
  };

  const sizeText =
    image.width > 0 && image.height > 0 ? `${image.width} × ${image.height}` : '—';

  return (
    <div style={containerStyle}>
      <div
        className={cn(
          'flex h-full items-center gap-4 p-3 rounded-lg cursor-pointer',
          'hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
          index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/50' : 'bg-white dark:bg-gray-900'
        )}
        onClick={() => onImageClick(image, index)}
      >
        <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-200 dark:bg-gray-700">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={image.name}
              className={cn(
                'w-full h-full transition-all duration-200',
                imageFit === 'contain' ? 'object-contain bg-gray-900/60' : 'object-cover'
              )}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{image.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{image.folderPath || '根目录'}</p>
        </div>

        <div className="text-xs text-gray-600 dark:text-gray-400 text-right w-24">{sizeText}</div>

        <div className="text-xs text-gray-600 dark:text-gray-400 w-20 text-right">
          {image.size > 0 ? formatFileSize(image.size) : '—'}
        </div>

        <div className="text-xs text-gray-600 dark:text-gray-400 w-32 text-right hidden lg:block">
          {image.modifiedAt && image.modifiedAt.getTime() > 0 ? formatDate(image.modifiedAt) : '—'}
        </div>
      </div>
    </div>
  );
};

export function ImageList({ images, imageFit, onImageClick }: ImageListProps) {
  const itemData: ListItemData = { images, imageFit, onImageClick };

  return (
    <div className="h-full w-full">
      <AutoSizer>
        {({ height, width }) => {
          if (!height || !width) {
            return null;
          }

          return (
            <FixedSizeList
              height={height}
              width={width}
              itemCount={images.length}
              itemSize={ROW_HEIGHT}
              itemData={itemData}
              overscanCount={6}
            >
              {ListRow}
            </FixedSizeList>
          );
        }}
      </AutoSizer>
    </div>
  );
}
