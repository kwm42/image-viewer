'use client';

import { useEffect, useCallback } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

interface KeyMap {
  [key: string]: KeyHandler;
}

/**
 * 键盘快捷键 Hook
 */
export function useKeyboardShortcuts(keyMap: KeyMap, deps: any[] = []) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // 检查是否在输入框中
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // 构建快捷键字符串
      const parts: string[] = [];
      if (event.ctrlKey || event.metaKey) parts.push('ctrl');
      if (event.shiftKey) parts.push('shift');
      if (event.altKey) parts.push('alt');
      parts.push(event.key.toLowerCase());

      const shortcut = parts.join('+');
      const handler = keyMap[shortcut] || keyMap[event.key];

      if (handler) {
        event.preventDefault();
        handler(event);
      }
    },
    [keyMap, ...deps]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * 单个按键 Hook
 */
export function useKey(key: string, handler: KeyHandler, deps: any[] = []) {
  useKeyboardShortcuts({ [key]: handler }, deps);
}
