'use client';

import React from 'react';
import { PlayIcon, PauseIcon, StopIcon } from '@radix-ui/react-icons';
import { IconButton } from '@/components/ui/IconButton';

interface SlideshowControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  currentIndex: number;
  totalImages: number;
  progress: number;
  remainingTime: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function SlideshowControls({
  isPlaying,
  isPaused,
  currentIndex,
  totalImages,
  progress,
  remainingTime,
  onPlay,
  onPause,
  onStop,
  onPrevious,
  onNext,
}: SlideshowControlsProps) {
  const formatTime = (seconds: number) => {
    return `${seconds}s`;
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-6 z-20">
      {/* 进度条 */}
      <div className="mb-4">
        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center justify-between">
        {/* 左侧：位置信息 */}
        <div className="flex items-center gap-4 text-white">
          <span className="text-sm">
            {currentIndex + 1} / {totalImages}
          </span>
          {isPlaying && (
            <span className="text-sm text-white/70">
              {formatTime(remainingTime)} 后切换
            </span>
          )}
        </div>

        {/* 中间：播放控制 */}
        <div className="flex items-center gap-2">
          <IconButton
            icon={<span className="text-lg">←</span>}
            onClick={onPrevious}
            disabled={currentIndex === 0}
            className="text-white hover:bg-white/20 disabled:opacity-30 w-10 h-10"
            title="上一张 (←)"
          />

          {!isPlaying || isPaused ? (
            <IconButton
              icon={<PlayIcon className="w-6 h-6" />}
              onClick={onPlay}
              className="text-white hover:bg-white/20 bg-white/10 w-12 h-12"
              title="播放 (Space)"
            />
          ) : (
            <IconButton
              icon={<PauseIcon className="w-6 h-6" />}
              onClick={onPause}
              className="text-white hover:bg-white/20 bg-white/10 w-12 h-12"
              title="暂停 (Space)"
            />
          )}

          <IconButton
            icon={<StopIcon className="w-5 h-5" />}
            onClick={onStop}
            disabled={!isPlaying}
            className="text-white hover:bg-white/20 disabled:opacity-30 w-10 h-10"
            title="停止 (Esc)"
          />

          <IconButton
            icon={<span className="text-lg">→</span>}
            onClick={onNext}
            disabled={currentIndex === totalImages - 1}
            className="text-white hover:bg-white/20 disabled:opacity-30 w-10 h-10"
            title="下一张 (→)"
          />
        </div>

        {/* 右侧：占位 */}
        <div className="w-32" />
      </div>
    </div>
  );
}
