'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type {
  FolderNode,
  ImageFile,
  GallerySettings,
  ImageViewerState,
  SlideshowState,
  SlideshowSettings,
} from '@/types';
import { useFileSystem } from '@/hooks/useFileSystem';
import { DEFAULT_GALLERY_SETTINGS, DEFAULT_SLIDESHOW_SETTINGS } from '@/lib/constants';

interface AppState {
  rootFolder: FolderNode | null;
  selectedFolder: FolderNode | null;
  allImages: ImageFile[];
  filteredImages: ImageFile[];
  gallerySettings: GallerySettings;
  viewerState: ImageViewerState;
  slideshowState: SlideshowState;
  slideshowSettings: SlideshowSettings;
  isLoading: boolean;
  error: string | null;
}

interface AppActions {
  openFolder: () => Promise<void>;
  selectFolder: (folder: FolderNode) => void;
  toggleFolder: (folder: FolderNode) => Promise<void>;
  updateGallerySettings: (settings: Partial<GallerySettings>) => void;
  openImageViewer: (image: ImageFile, index: number) => void;
  closeImageViewer: () => void;
  navigateImage: (direction: 'prev' | 'next') => void;
  startSlideshow: () => void;
  stopSlideshow: () => void;
  updateSlideshowSettings: (settings: Partial<SlideshowSettings>) => void;
}

const AppContext = createContext<(AppState & AppActions) | null>(null);

const initialViewerState: ImageViewerState = {
  isOpen: false,
  currentImage: null,
  currentIndex: 0,
  images: [],
  transform: {
    scale: 1,
    rotation: 0,
    translateX: 0,
    translateY: 0,
    fitMode: 'contain',
  },
  isLoading: false,
};

const initialSlideshowState: SlideshowState = {
  isPlaying: false,
  isPaused: false,
  currentIndex: 0,
  progress: 0,
  remainingTime: 0,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    rootFolder: null,
    selectedFolder: null,
    allImages: [],
    filteredImages: [],
    gallerySettings: DEFAULT_GALLERY_SETTINGS,
    viewerState: initialViewerState,
    slideshowState: initialSlideshowState,
    slideshowSettings: DEFAULT_SLIDESHOW_SETTINGS,
    isLoading: false,
    error: null,
  });

  const { openFolder: openFolderDialog, scanFolder, scanFolderRecursive } = useFileSystem();

  /**
   * 打开文件夹
   */
  const openFolder = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const handle = await openFolderDialog();
    if (!handle) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const { folders, images } = await scanFolder(handle);

      const rootNode: FolderNode = {
        id: crypto.randomUUID(),
        name: handle.name,
        handle,
        path: '',
        children: folders,
        imageCount: images.length,
        totalImageCount: images.length,
        isExpanded: true,
        isLoaded: true,
        level: 0,
      };

      setState((prev) => ({
        ...prev,
        rootFolder: rootNode,
        selectedFolder: rootNode,
        allImages: images,
        filteredImages: images,
        isLoading: false,
      }));
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        error: err.message || '打开文件夹失败',
        isLoading: false,
      }));
    }
  }, [openFolderDialog, scanFolder]);

  /**
   * 选择文件夹
   */
  const selectFolder = useCallback((folder: FolderNode) => {
    setState((prev) => ({
      ...prev,
      selectedFolder: folder,
    }));
  }, []);

  /**
   * 展开/收起文件夹
   */
  const toggleFolder = useCallback(
    async (folder: FolderNode) => {
      // TODO: 实现文件夹展开/收起逻辑
      console.log('Toggle folder:', folder.name);
    },
    []
  );

  /**
   * 更新画廊设置
   */
  const updateGallerySettings = useCallback((settings: Partial<GallerySettings>) => {
    setState((prev) => ({
      ...prev,
      gallerySettings: {
        ...prev.gallerySettings,
        ...settings,
      },
    }));
  }, []);

  /**
   * 打开图片预览
   */
  const openImageViewer = useCallback((image: ImageFile, index: number) => {
    setState((prev) => ({
      ...prev,
      viewerState: {
        ...initialViewerState,
        isOpen: true,
        currentImage: image,
        currentIndex: index,
        images: prev.filteredImages,
      },
    }));
  }, []);

  /**
   * 关闭图片预览
   */
  const closeImageViewer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      viewerState: initialViewerState,
    }));
  }, []);

  /**
   * 导航到上一张/下一张
   */
  const navigateImage = useCallback((direction: 'prev' | 'next') => {
    setState((prev) => {
      const { currentIndex, images } = prev.viewerState;
      let newIndex = currentIndex;

      if (direction === 'prev') {
        newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
      } else {
        newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
      }

      return {
        ...prev,
        viewerState: {
          ...prev.viewerState,
          currentIndex: newIndex,
          currentImage: images[newIndex],
        },
      };
    });
  }, []);

  /**
   * 开始幻灯片播放
   */
  const startSlideshow = useCallback(() => {
    setState((prev) => ({
      ...prev,
      slideshowState: {
        ...prev.slideshowState,
        isPlaying: true,
        isPaused: false,
      },
    }));
  }, []);

  /**
   * 停止幻灯片播放
   */
  const stopSlideshow = useCallback(() => {
    setState((prev) => ({
      ...prev,
      slideshowState: initialSlideshowState,
    }));
  }, []);

  /**
   * 更新幻灯片设置
   */
  const updateSlideshowSettings = useCallback((settings: Partial<SlideshowSettings>) => {
    setState((prev) => ({
      ...prev,
      slideshowSettings: {
        ...prev.slideshowSettings,
        ...settings,
      },
    }));
  }, []);

  const value: AppState & AppActions = {
    ...state,
    openFolder,
    selectFolder,
    toggleFolder,
    updateGallerySettings,
    openImageViewer,
    closeImageViewer,
    navigateImage,
    startSlideshow,
    stopSlideshow,
    updateSlideshowSettings,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * 使用应用上下文
 */
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
