import React, { type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label?: string;
}

export function IconButton({
  icon,
  label,
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center p-2 rounded-lg',
        'text-gray-600 dark:text-gray-400',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'focus:outline-none focus:ring-2 focus:ring-blue-500',
        'transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      title={label}
      aria-label={label}
      {...props}
    >
      {icon}
    </button>
  );
}
