'use client';

import React from 'react';
import type { SortBy, SortOrder } from '@/types';
import * as Select from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';

interface SortSelectProps {
  sortBy: SortBy;
  sortOrder: SortOrder;
  onSortByChange: (sortBy: SortBy) => void;
  onSortOrderChange: (order: SortOrder) => void;
}

export function SortSelect({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}: SortSelectProps) {
  const sortOptions: { value: SortBy; label: string }[] = [
    { value: 'name', label: '名称' },
    { value: 'date', label: '日期' },
    { value: 'size', label: '大小' },
    { value: 'type', label: '类型' },
  ];

  return (
    <div className="flex items-center gap-2">
      {/* 排序字段选择 */}
      <Select.Root value={sortBy} onValueChange={onSortByChange}>
        <Select.Trigger className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <span className="text-gray-700 dark:text-gray-300">
            排序: {sortOptions.find((opt) => opt.value === sortBy)?.label}
          </span>
          <ChevronDownIcon className="w-4 h-4 text-gray-500" />
        </Select.Trigger>

        <Select.Portal>
          <Select.Content className="overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <Select.Viewport className="p-1">
              {sortOptions.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    'relative flex items-center px-8 py-2 rounded text-sm cursor-pointer',
                    'text-gray-900 dark:text-gray-100',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    'focus:bg-gray-100 dark:focus:bg-gray-700 outline-none',
                    'select-none'
                  )}
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator className="absolute left-2">
                    <CheckIcon className="w-4 h-4" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      {/* 排序顺序切换 */}
      <button
        onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
        className="p-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        title={sortOrder === 'asc' ? '升序' : '降序'}
      >
        {sortOrder === 'asc' ? (
          <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z" />
          </svg>
        )}
      </button>
    </div>
  );
}
