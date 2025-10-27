'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type {
  FolderNode,
  ImageFile,
  GallerySettings,
  ImageViewerState,
  SlideshowState,
  SlideshowSettings,
  SortBy,
  SortOrder,
} from '@/types';
import { useFileSystem } from '@/hooks/useFileSystem';
import { DEFAULT_GALLERY_SETTINGS, DEFAULT_SLIDESHOW_SETTINGS } from '@/lib/constants';

/**
 * 排序图片
 */
function sortImages(images: ImageFile[], sortBy: SortBy, sortOrder: SortOrder): ImageFile[] {
  const sorted = [...images].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'date':
        comparison = a.modifiedAt.getTime() - b.modifiedAt.getTime();
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

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
  loadingProgress: { current: number; total: number } | null;
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
    loadingProgress: null,
    error: null,
  });

  const { openFolder: openFolderDialog, scanFolder, scanFolderStructure, scanFolderRecursive } = useFileSystem();

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
      // 使用 scanFolderStructure 一次性加载完整的文件夹树
      const { folders, images } = await scanFolderStructure(handle);

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
  }, [openFolderDialog, scanFolderStructure]);

  /**
   * 选择文件夹
   */
  const selectFolder = useCallback(
    async (folder: FolderNode) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        let allImages: ImageFile[];
        
        // 如果开启了递归，扫描所有子文件夹
        if (state.gallerySettings.recursive) {
          allImages = await scanFolderRecursive(folder.handle, folder.path);
        } else {
          // 只扫描当前文件夹
          const { images } = await scanFolder(folder.handle, folder.path);
          allImages = images;
        }

        setState((prev) => ({
          ...prev,
          selectedFolder: folder,
          filteredImages: sortImages(allImages, prev.gallerySettings.sortBy, prev.gallerySettings.sortOrder),
          isLoading: false,
        }));
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          error: err.message || '加载文件夹失败',
          isLoading: false,
        }));
      }
    },
    [scanFolder, scanFolderRecursive, state.gallerySettings.recursive]
  );

  /**
   * 展开/收起文件夹
   */
  const toggleFolder = useCallback(
    async (folder: FolderNode) => {
      // 如果要展开且未加载过，先加载子文件夹
      if (!folder.isExpanded && !folder.isLoaded) {
        setState((prev) => ({ ...prev, isLoading: true }));
        
        try {
          const { folders } = await scanFolder(folder.handle, folder.path);
          
          const updateFolderInTree = (node: FolderNode): FolderNode => {
            if (node.id === folder.id) {
              return {
                ...node,
                children: folders,
                isExpanded: true,
                isLoaded: true,
              };
            }
            return {
              ...node,
              children: node.children.map(updateFolderInTree),
            };
          };

          setState((prev) => ({
            ...prev,
            rootFolder: prev.rootFolder ? updateFolderInTree(prev.rootFolder) : null,
            isLoading: false,
          }));
        } catch (err: any) {
          setState((prev) => ({
            ...prev,
            error: err.message || '加载子文件夹失败',
            isLoading: false,
          }));
        }
      } else {
        // 只是切换展开状态
        const updateFolderInTree = (node: FolderNode): FolderNode => {
          if (node.id === folder.id) {
            return { ...node, isExpanded: !node.isExpanded };
          }
          return {
            ...node,
            children: node.children.map(updateFolderInTree),
          };
        };

        setState((prev) => ({
          ...prev,
          rootFolder: prev.rootFolder ? updateFolderInTree(prev.rootFolder) : null,
        }));
      }
    },
    [scanFolder]
  );

  /**
   * 更新画廊设置
   */
  const updateGallerySettings = useCallback(
    async (settings: Partial<GallerySettings>) => {
      setState((prev) => {
        const newSettings = { ...prev.gallerySettings, ...settings };
        
        // 如果排序设置改变，重新排序图片
        let newFilteredImages = prev.filteredImages;
        if (settings.sortBy || settings.sortOrder) {
          newFilteredImages = sortImages(
            prev.filteredImages,
            newSettings.sortBy,
            newSettings.sortOrder
          );
        }

        return {
          ...prev,
          gallerySettings: newSettings,
          filteredImages: newFilteredImages,
        };
      });

      // 如果递归设置改变，重新加载图片
      if (settings.recursive !== undefined && state.selectedFolder) {
        await selectFolder(state.selectedFolder);
      }
    },
    [state.selectedFolder, selectFolder]
  );

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
