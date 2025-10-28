'use client';

import React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeGrid, GridChildComponentProps } from 'react-window';
import type { ImageFile } from '@/types';
import { ImageCard } from './ImageCard';

const GRID_GAP = 16;
const MIN_CARD_SIZE = 150;

interface ImageGridProps {
  images: ImageFile[];
  columns: number;
  onImageClick: (image: ImageFile, index: number) => void;
}

interface GridItemData {
  images: ImageFile[];
  onImageClick: (image: ImageFile, index: number) => void;
  columnCount: number;
  cardSize: number;
  gap: number;
}

const GridCell = ({ columnIndex, rowIndex, style, data }: GridChildComponentProps<GridItemData>) => {
  const { images, onImageClick, columnCount, cardSize, gap } = data;
  const index = rowIndex * columnCount + columnIndex;

  if (index >= images.length) {
    return null;
  }

  const image = images[index];

  const cellStyle: React.CSSProperties = {
    ...style,
    left: (style.left as number) + gap / 2,
    top: (style.top as number) + gap / 2,
    width: cardSize,
    height: cardSize,
    padding: gap / 2,
    boxSizing: 'border-box',
  };

  return (
    <div style={cellStyle}>
      <ImageCard image={image} onClick={() => onImageClick(image, index)} />
    </div>
  );
};

export function ImageGrid({ images, columns, onImageClick }: ImageGridProps) {
  return (
    <div className="h-full w-full">
      <AutoSizer>
        {({ height, width }) => {
          if (!height || !width) {
            return null;
          }

          const maxColumns = Math.max(1, columns);
          const estimatedColumns = Math.max(1, Math.floor(width / (MIN_CARD_SIZE + GRID_GAP)));
          const columnCount = Math.min(maxColumns, Math.max(1, estimatedColumns));
          const availableWidth = Math.max(width, MIN_CARD_SIZE + GRID_GAP);
          const totalGap = (columnCount + 1) * GRID_GAP;
          let tentativeCardSize = Math.floor((availableWidth - totalGap) / columnCount);

          if (!Number.isFinite(tentativeCardSize) || tentativeCardSize <= 0) {
            tentativeCardSize = Math.floor(availableWidth / columnCount) - GRID_GAP;
          }

          const maxCardSize = Math.max(MIN_CARD_SIZE, availableWidth - GRID_GAP);
          const cardSize = Math.max(MIN_CARD_SIZE, Math.min(tentativeCardSize, maxCardSize));
          const columnWidth = cardSize + GRID_GAP;
          const rowHeight = cardSize + GRID_GAP;
          const rowCount = Math.ceil(images.length / columnCount);

          const itemData: GridItemData = {
            images,
            onImageClick,
            columnCount,
            cardSize,
            gap: GRID_GAP,
          };

          return (
            <FixedSizeGrid
              height={height}
              width={width}
              columnCount={columnCount}
              columnWidth={columnWidth}
              rowCount={rowCount}
              rowHeight={rowHeight}
              itemData={itemData}
              overscanRowCount={2}
            >
              {GridCell}
            </FixedSizeGrid>
          );
        }}
      </AutoSizer>
    </div>
  );
}
