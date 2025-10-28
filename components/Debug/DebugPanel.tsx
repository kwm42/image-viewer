'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useApp } from '@/contexts/AppContext';

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '—';
  }
  const megabytes = bytes / (1024 * 1024);
  if (megabytes >= 1024) {
    return `${(megabytes / 1024).toFixed(2)} GB`;
  }
  return `${megabytes.toFixed(1)} MB`;
}

export function DebugPanel() {
  const { clearMemory } = useApp();
  const [visible, setVisible] = useState(false);
  const [memory, setMemory] = useState<MemoryInfo | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memorySupported = useMemo(() => {
    return typeof performance !== 'undefined' && 'memory' in performance;
  }, []);

  const updateMemory = useCallback(() => {
    if (!memorySupported) {
      return;
    }

    const memoryInfo = (performance as any).memory as MemoryInfo | undefined;
    if (!memoryInfo) {
      return;
    }

    setMemory({
      usedJSHeapSize: memoryInfo.usedJSHeapSize,
      totalJSHeapSize: memoryInfo.totalJSHeapSize,
      jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
      timestamp: Date.now(),
    });
  }, [memorySupported]);

  const togglePanel = useCallback(() => {
    setVisible((prev) => !prev);
  }, []);

  useKeyboardShortcuts(
    {
      'ctrl+shift+/': togglePanel,
      'ctrl+shift+?': togglePanel,
    },
    [togglePanel]
  );

  useEffect(() => {
    if (!visible || !memorySupported) {
      return;
    }

    updateMemory();
    const interval = window.setInterval(updateMemory, 1000);
    return () => window.clearInterval(interval);
  }, [visible, memorySupported, updateMemory]);

  const handleClear = useCallback(async () => {
    setIsClearing(true);
    setError(null);

    try {
      await clearMemory();
      updateMemory();
    } catch (err) {
      const message = err instanceof Error ? err.message : '清理失败';
      setError(message);
    } finally {
      setIsClearing(false);
    }
  }, [clearMemory, updateMemory]);

  return (
    <div
      className={
        visible
          ? 'fixed bottom-4 right-4 z-50 max-w-sm w-full sm:w-80 transition duration-200'
          : 'fixed bottom-4 right-4 z-50 pointer-events-none opacity-0 translate-y-4 transition duration-200'
      }
    >
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 shadow-lg backdrop-blur p-4 text-sm text-gray-800 dark:text-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-base font-semibold">调试面板</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ctrl + Shift + / 打开/隐藏</p>
          </div>
          <button
            type="button"
            className="h-8 w-8 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white"
            onClick={() => setVisible(false)}
            aria-label="关闭调试面板"
          >
            ×
          </button>
        </div>

        {memorySupported ? (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">当前使用</span>
              <span className="font-medium">{formatBytes(memory?.usedJSHeapSize ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">已分配</span>
              <span>{formatBytes(memory?.totalJSHeapSize ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">限制</span>
              <span>{formatBytes(memory?.jsHeapSizeLimit ?? 0)}</span>
            </div>
            <button
              type="button"
              onClick={handleClear}
              disabled={isClearing}
              className="mt-3 w-full rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 text-sm font-medium transition"
            >
              {isClearing ? '清理中...' : '一键清理缓存'}
            </button>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <p className="text-[11px] text-gray-400 mt-2">
              内存数据来源于 performance.memory，仅在 Chromium 浏览器可用。
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            当前浏览器不支持 performance.memory，无法获取实时内存信息。
          </p>
        )}
      </div>
    </div>
  );
}