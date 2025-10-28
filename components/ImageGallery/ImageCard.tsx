'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { ImageFile } from '@/types';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/utils';
import { loadThumbnail } from '@/hooks/useFileSystem';
import { ensureImageURL } from '@/lib/imageUtils';

interface ImageCardProps {
  image: ImageFile;
  onClick: () => void;
  isSelected?: boolean;
}

export function ImageCard({ image, onClick, isSelected }: ImageCardProps) {
  const [thumbnail, setThumbnail] = useState(image.thumbnail);
  const [isLoading, setIsLoading] = useState(!image.thumbnail);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 使用 Intersection Observer 检测卡片是否可见
  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      {
        rootMargin: '200px', // 提前 200px 开始加载
      }
    );

    observer.observe(cardRef.current);

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  // 当卡片可见且没有缩略图时，加载缩略图
  useEffect(() => {
    if (!isVisible || thumbnail) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    loadThumbnail(image)
      .then((thumb) => {
        if (cancelled) return;
        setThumbnail(thumb);
        setIsLoading(false);
      })
      .catch(async (err) => {
        console.error('加载缩略图失败:', err);
        try {
          const url = await ensureImageURL(image);
          if (!cancelled) {
            setThumbnail(url);
            setIsLoading(false);
          }
        } catch (error) {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isVisible, thumbnail, image]);

  return (
    <div
      ref={cardRef}
      className={cn(
        'group relative aspect-square overflow-hidden rounded-lg cursor-pointer',
        'transition-all duration-200 hover:scale-105',
        'hover:shadow-xl hover:z-10',
        'bg-gray-100 dark:bg-gray-800',
        isSelected && 'ring-2 ring-blue-500 scale-105'
      )}
      onClick={onClick}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={image.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : isLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <svg
            className="animate-spin h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}

      {/* 悬停信息覆层 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
        <p className="text-white text-sm font-medium truncate mb-1">
          {image.name}
        </p>
        <div className="flex items-center justify-between text-white/80 text-xs">
          <span>
            {image.width > 0 && image.height > 0
              ? `${image.width} × ${image.height}`
              : '—'}
          </span>
          <span>{image.size > 0 ? formatFileSize(image.size) : '—'}</span>
        </div>
      </div>

      {/* 选中标记 */}
      {isSelected && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
