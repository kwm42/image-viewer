// 支持的图片格式
export const IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
  '.svg',
  '.avif',
] as const;

// 图片 MIME 类型
export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/svg+xml',
  'image/avif',
] as const;

// 默认缩略图尺寸
export const THUMBNAIL_SIZE = 300;

// 默认网格列数
export const GRID_COLUMNS = {
  sm: 2,
  md: 3,
  lg: 4,
  xl: 6,
} as const;

// 键盘快捷键
export const KEYBOARD_SHORTCUTS = {
  OPEN_FOLDER: 'ctrl+o',
  TOGGLE_VIEW: 'ctrl+g',
  SEARCH: 'ctrl+f',
  NEXT_IMAGE: 'ArrowRight',
  PREV_IMAGE: 'ArrowLeft',
  CLOSE: 'Escape',
  ZOOM_IN: '+',
  ZOOM_OUT: '-',
  RESET_ZOOM: '0',
  ROTATE: 'r',
  FIT_WINDOW: '1',
  ACTUAL_SIZE: '2',
  FULLSCREEN: 'f',
  PLAY_PAUSE: ' ',
} as const;

// 幻灯片默认设置
export const DEFAULT_SLIDESHOW_SETTINGS = {
  interval: 3000,
  transition: 'fade' as const,
  transitionDuration: 500,
  loop: true,
  random: false,
  autoFullscreen: true,
  showInfo: true,
  showProgress: true,
  fitMode: 'default' as const,
};

// 画廊默认设置
export const DEFAULT_GALLERY_SETTINGS = {
  viewMode: 'grid' as const,
  sortBy: 'name' as const,
  sortOrder: 'asc' as const,
  recursive: false,
  gridColumns: 4,
};
