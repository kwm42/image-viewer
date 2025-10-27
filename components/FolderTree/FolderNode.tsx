'use client';

import React from 'react';
import { ChevronRightIcon } from '@radix-ui/react-icons';
import * as Collapsible from '@radix-ui/react-collapsible';
import type { FolderNode as FolderNodeType } from '@/types';
import { cn } from '@/lib/utils';

interface FolderNodeProps {
  folder: FolderNodeType;
  selectedFolder: FolderNodeType | null;
  onSelect: (folder: FolderNodeType) => void;
  onToggle: (folder: FolderNodeType) => void;
  level: number;
}

export function FolderNode({ folder, selectedFolder, onSelect, onToggle, level }: FolderNodeProps) {
  const isSelected = selectedFolder?.id === folder.id;
  
  const handleToggle = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    onToggle(folder);
  };
  
  return (
    <Collapsible.Root open={folder.isExpanded}>
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer select-none',
          'hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
          isSelected && 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
        )}
        style={{ paddingLeft: `${level * 1 + 0.5}rem` }}
        onClick={() => onSelect(folder)}
      >
        {folder.children.length > 0 ? (
          <button
            type="button"
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            onClick={handleToggle}
          >
            <ChevronRightIcon
              className={cn(
                'w-4 h-4 transition-transform',
                folder.isExpanded && 'rotate-90'
              )}
            />
          </button>
        ) : (
          <div className="w-6 h-6" />
        )}

        <svg
          className="w-4 h-4 text-yellow-600 dark:text-yellow-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>

        <span className="flex-1 text-sm truncate">{folder.name}</span>
        
        <span className="text-xs text-gray-500 dark:text-gray-400 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
          {folder.imageCount}
        </span>
      </div>

      <Collapsible.Content>
        {folder.children.map((child) => (
          <FolderNode
            key={child.id}
            folder={child}
            selectedFolder={selectedFolder}
            onSelect={onSelect}
            onToggle={onToggle}
            level={level + 1}
          />
        ))}
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
