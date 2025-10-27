'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GearIcon } from '@radix-ui/react-icons';
import type { ImageFile, SlideshowSettings } from '@/types';
import { SlideshowControls } from './SlideshowControls';
import { SlideshowSettingsPanel } from './SlideshowSettings';
import { transitions, getTransition } from './transitions';
import { IconButton } from '@/components/ui/IconButton';

interface SlideshowProps {
  images: ImageFile[];
  initialIndex?: number;
  settings: SlideshowSettings;
  onSettingsChange: (settings: Partial<SlideshowSettings>) => void;
  onClose: () => void;
}

export function Slideshow({
  images,
  initialIndex = 0,
  settings,
  onSettingsChange,
  onClose,
}: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [remainingTime, setRemainingTime] = useState(settings.interval / 1000);
  const [direction, setDirection] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const currentImage = images[currentIndex];
  const totalImages = images.length;

  // 获取下一张图片索引
  const getNextIndex = useCallback(() => {
    if (settings.random) {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * totalImages);
      } while (nextIndex === currentIndex && totalImages > 1);
      return nextIndex;
    } else {
      if (currentIndex >= totalImages - 1) {
        return settings.loop ? 0 : currentIndex;
      }
      return currentIndex + 1;
    }
  }, [currentIndex, totalImages, settings.random, settings.loop]);

  // 播放下一张
  const playNext = useCallback(() => {
    const nextIndex = getNextIndex();
    if (nextIndex !== currentIndex) {
      setDirection(1);
      setCurrentIndex(nextIndex);
      setProgress(0);
      setRemainingTime(settings.interval / 1000);
    } else {
      // 到达末尾且不循环，停止播放
      setIsPlaying(false);
    }
  }, [currentIndex, getNextIndex, settings.interval]);

  // 上一张
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
      setRemainingTime(settings.interval / 1000);
    }
  }, [currentIndex, settings.interval]);

  // 下一张
  const handleNext = useCallback(() => {
    if (currentIndex < totalImages - 1) {
      setDirection(1);
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
      setRemainingTime(settings.interval / 1000);
    }
  }, [currentIndex, totalImages, settings.interval]);

  // 播放/暂停
  const handlePlayPause = useCallback(() => {
    if (!isPlaying) {
      setIsPlaying(true);
      setIsPaused(false);
    } else {
      setIsPaused(!isPaused);
    }
  }, [isPlaying, isPaused]);

  // 停止
  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    setRemainingTime(settings.interval / 1000);
  }, [settings.interval]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          if (isPlaying) {
            handleStop();
          } else {
            onClose();
          }
          break;
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 's':
        case 'S':
          setShowSettings(!showSettings);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isPaused, showSettings, handlePlayPause, handlePrevious, handleNext, handleStop, onClose]);

  // 自动播放计时器
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / settings.interval, 1);
      const newRemainingTime = Math.ceil((settings.interval - elapsed) / 1000);

      setProgress(newProgress);
      setRemainingTime(Math.max(newRemainingTime, 0));

      if (elapsed >= settings.interval) {
        playNext();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, isPaused, settings.interval, playNext]);

  const variant = transitions[settings.transition] || transitions.fade;
  const transition = getTransition(settings.transition, settings.transitionDuration);

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* 设置按钮 */}
      <div className="absolute top-4 right-4 z-30">
        <IconButton
          icon={<GearIcon className="w-5 h-5" />}
          onClick={() => setShowSettings(!showSettings)}
          className="text-white hover:bg-white/20 bg-black/30"
          title="设置 (S)"
        />
      </div>

      {/* 关闭按钮 */}
      <div className="absolute top-4 left-4 z-30">
        <IconButton
          icon={<span className="text-xl">✕</span>}
          onClick={onClose}
          className="text-white hover:bg-white/20 bg-black/30"
          title="关闭 (Esc)"
        />
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <SlideshowSettingsPanel
          settings={settings}
          onSettingsChange={onSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* 图片显示区域 */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variant}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            className="absolute inset-0 flex items-center justify-center"
          >
            <img
              src={currentImage.url}
              alt={currentImage.name}
              className="max-w-full max-h-full object-contain"
            />

            {/* 图片信息 */}
            {settings.showInfo && (
              <div className="absolute top-20 left-0 right-0 flex justify-center pointer-events-none">
                <div className="bg-black/60 backdrop-blur-sm rounded-lg px-6 py-3 text-white">
                  <p className="text-lg font-medium mb-1">{currentImage.name}</p>
                  <div className="flex items-center gap-4 text-sm text-white/70">
                    {currentImage.width > 0 && (
                      <span>
                        {currentImage.width} × {currentImage.height} px
                      </span>
                    )}
                    <span>{(currentImage.size / 1024 / 1024).toFixed(2)} MB</span>
                    <span>
                      {new Date(currentImage.modifiedAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 控制条 */}
      {settings.showProgress && (
        <SlideshowControls
          isPlaying={isPlaying}
          isPaused={isPaused}
          currentIndex={currentIndex}
          totalImages={totalImages}
          progress={progress}
          remainingTime={remainingTime}
          onPlay={() => handlePlayPause()}
          onPause={() => handlePlayPause()}
          onStop={handleStop}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      )}
    </div>
  );
}
