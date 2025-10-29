// 文件夹节点
export interface FolderNode {
  id: string;
  name: string;
  handle: FileSystemDirectoryHandle;
  path: string;
  children: FolderNode[];
  imageCount?: number;
  totalImageCount?: number;
  isExpanded: boolean;
  isLoaded: boolean;
  level: number;
}

// 图片文件
export interface ImageFile {
  id: string;
  name: string;
  handle: FileSystemFileHandle;
  path: string;
  blob: Blob | null;
  url: string;
  thumbnail: string;
  size: number;
  width: number;
  height: number;
  type: string;
  createdAt: Date;
  modifiedAt: Date;
  folderPath: string;
  metadataLoaded?: boolean;
}

// 视图模式
export type ViewMode = 'grid' | 'list';

// 排序方式
export type SortBy = 'name' | 'date' | 'size' | 'type';
export type SortOrder = 'asc' | 'desc';

// 画廊设置
export interface GallerySettings {
  viewMode: ViewMode;
  sortBy: SortBy;
  sortOrder: SortOrder;
  recursive: boolean;
  gridColumns: number;
  imageFit: 'cover' | 'contain';
}

// 图片变换
export type FitMode = 'default' | 'contain' | 'cover' | 'actual' | 'custom';

export interface ImageTransform {
  scale: number;
  rotation: number;
  translateX: number;
  translateY: number;
  fitMode: FitMode;
}

// 预览器状态
export interface ImageViewerState {
  isOpen: boolean;
  currentImage: ImageFile | null;
  currentIndex: number;
  images: ImageFile[];
  transform: ImageTransform;
  isLoading: boolean;
}

// 幻灯片转换类型
export type TransitionType = 'none' | 'fade' | 'slide' | 'zoom' | 'flip' | 'dissolve';

// 幻灯片设置
export interface SlideshowSettings {
  interval: number;
  transition: TransitionType;
  transitionDuration: number;
  loop: boolean;
  random: boolean;
  autoFullscreen: boolean;
  showInfo: boolean;
  showProgress: boolean;
  fitMode: FitMode;
}

// 幻灯片状态
export interface SlideshowState {
  isPlaying: boolean;
  isPaused: boolean;
  currentIndex: number;
  progress: number;
  remainingTime: number;
}
