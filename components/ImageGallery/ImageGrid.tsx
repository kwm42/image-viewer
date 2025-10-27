'use client';

import React from 'react';
import type { ImageFile } from '@/types';
import { ImageCard } from './ImageCard';

interface ImageGridProps {
  images: ImageFile[];
  columns: number;
  onImageClick: (image: ImageFile, index: number) => void;
}

export function ImageGrid({ images, columns, onImageClick }: ImageGridProps) {
  const gridColsClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
  }[columns] || 'grid-cols-4';

  return (
    <div className={`grid ${gridColsClass} gap-4`}>
      {images.map((image, index) => (
        <ImageCard
          key={image.id}
          image={image}
          onClick={() => onImageClick(image, index)}
        />
      ))}
    </div>
  );
}
