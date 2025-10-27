'use client';

import React from 'react';
import type { FolderNode as FolderNodeType } from '@/types';
import { FolderNode } from './FolderNode';
import * as ScrollArea from '@radix-ui/react-scroll-area';

interface FolderTreeProps {
  rootFolder: FolderNodeType | null;
  selectedFolder: FolderNodeType | null;
  onFolderSelect: (folder: FolderNodeType) => void;
  onFolderToggle: (folder: FolderNodeType) => void;
}

export function FolderTree({
  rootFolder,
  selectedFolder,
  onFolderSelect,
  onFolderToggle,
}: FolderTreeProps) {
  if (!rootFolder) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <p className="text-sm">未打开文件夹</p>
      </div>
    );
  }

  return (
    <ScrollArea.Root className="h-full">
      <ScrollArea.Viewport className="h-full w-full">
        <div className="p-2">
          <FolderNode
            folder={rootFolder}
            selectedFolder={selectedFolder}
            onSelect={onFolderSelect}
            onToggle={onFolderToggle}
            level={0}
          />
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
