'use client';

import React from 'react';
import { ViewModeToggle } from '../ImageGallery/ViewModeToggle';
import { SortSelect } from '../ImageGallery/SortSelect';
import type { GallerySettings } from '@/types';
import * as Switch from '@radix-ui/react-switch';

interface ToolbarProps {
  settings: GallerySettings;
  imageCount: number;
  loadingProgress?: { current: number; total: number } | null;
  onOpenFolder: () => void;
  onSettingsChange: (settings: Partial<GallerySettings>) => void;
  onStartSlideshow?: () => void;
}

export function Toolbar({
  settings,
  imageCount,
  loadingProgress,
  onOpenFolder,
  onSettingsChange,
  onStartSlideshow,
}: ToolbarProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex-shrink-0">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* 左侧：打开文件夹按钮和图片统计 */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <button
            onClick={onOpenFolder}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg transition-colors font-medium shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <span className="text-sm">打开文件夹</span>
          </button>

          {onStartSlideshow && imageCount > 0 && (
            <button
              onClick={onStartSlideshow}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg transition-colors font-medium shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              <span className="text-sm">幻灯片</span>
            </button>
          )}

          <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
            {loadingProgress ? (
              <span>
                加载中 <span className="font-semibold text-blue-600">{loadingProgress.current}</span> / {loadingProgress.total}
              </span>
            ) : (
              <>
                共 <span className="font-semibold text-gray-900 dark:text-white">{imageCount}</span> 张图片
              </>
            )}
          </div>
        </div>

        {/* 右侧：视图控制 */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* 递归开关 */}
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <span className="text-gray-700 dark:text-gray-300 whitespace-nowrap">包含子文件夹</span>
            <Switch.Root
              checked={settings.recursive}
              onCheckedChange={(checked) => onSettingsChange({ recursive: checked })}
              className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full relative data-[state=checked]:bg-blue-600 transition-colors cursor-pointer shadow-inner"
            >
              <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px] shadow-md" />
            </Switch.Root>
          </label>

          {/* 排序选择 */}
          <SortSelect
            sortBy={settings.sortBy}
            sortOrder={settings.sortOrder}
            onSortByChange={(sortBy) => onSettingsChange({ sortBy })}
            onSortOrderChange={(sortOrder) => onSettingsChange({ sortOrder })}
          />

          {/* 视图模式切换 */}
          <ViewModeToggle
            viewMode={settings.viewMode}
            onChange={(viewMode) => onSettingsChange({ viewMode })}
          />
        </div>
      </div>
    </div>
  );
}
