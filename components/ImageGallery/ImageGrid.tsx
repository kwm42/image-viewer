'use client';

import React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeGrid, GridChildComponentProps } from 'react-window';
import type { ImageFile } from '@/types';
import { ImageCard } from './ImageCard';

const GRID_GAP = 16;
const MIN_CARD_SIZE = 250;
const MAX_CARD_SIZE = 300;

interface ImageGridProps {
  images: ImageFile[];
  columns: number;
  imageFit: 'cover' | 'contain';
  onImageClick: (image: ImageFile, index: number) => void;
}

interface GridItemData {
  images: ImageFile[];
  onImageClick: (image: ImageFile, index: number) => void;
  columnCount: number;
  cardSize: number;
  gap: number;
  imageFit: 'cover' | 'contain';
}

const GridCell = ({ columnIndex, rowIndex, style, data }: GridChildComponentProps<GridItemData>) => {
  const { images, onImageClick, columnCount, cardSize, gap, imageFit } = data;
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
      <ImageCard
        image={image}
        fitMode={imageFit}
        onClick={() => onImageClick(image, index)}
      />
    </div>
  );
};

export function ImageGrid({ images, columns: _ignoredColumns, imageFit, onImageClick }: ImageGridProps) {
  return (
    <div className="h-full w-full">
      <AutoSizer>
        {({ height, width }) => {
          if (!height || !width) {
            return null;
          }

          const availableWidth = Math.max(width, MIN_CARD_SIZE + GRID_GAP);

          const computeCardSize = (cols: number) => {
            const safeCols = Math.max(1, cols);
            const totalGap = (safeCols + 1) * GRID_GAP;
            let size = Math.floor((availableWidth - totalGap) / safeCols);

            if (!Number.isFinite(size) || size <= 0) {
              size = Math.floor(availableWidth / safeCols) - GRID_GAP;
            }

            const absoluteMax = Math.max(MIN_CARD_SIZE, availableWidth - GRID_GAP);
            return Math.max(MIN_CARD_SIZE, Math.min(size, absoluteMax));
          };

          let columnCount = Math.max(1, Math.floor(availableWidth / (MIN_CARD_SIZE + GRID_GAP)));
          let cardSize = computeCardSize(columnCount);

          if (cardSize > MAX_CARD_SIZE) {
            const desiredColumns = Math.max(1, Math.floor(availableWidth / (MAX_CARD_SIZE + GRID_GAP)));
            columnCount = Math.max(columnCount, desiredColumns);
            cardSize = computeCardSize(columnCount);
          }

          cardSize = Math.max(MIN_CARD_SIZE, Math.min(cardSize, MAX_CARD_SIZE));
          const columnWidth = cardSize + GRID_GAP;
          const rowHeight = cardSize + GRID_GAP;
          const rowCount = Math.ceil(images.length / columnCount);

          const itemData: GridItemData = {
            images,
            onImageClick,
            columnCount,
            cardSize,
            gap: GRID_GAP,
            imageFit,
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
