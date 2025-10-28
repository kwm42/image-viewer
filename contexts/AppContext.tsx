'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
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
import { useFileSystem, resetThumbnailQueue } from '@/hooks/useFileSystem';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { DEFAULT_GALLERY_SETTINGS, DEFAULT_SLIDESHOW_SETTINGS } from '@/lib/constants';
import { releaseImageResources, ensureImageURL, ensureImagesMetadata } from '@/lib/imageUtils';
import { cacheManager } from '@/lib/cacheManager';

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
  selectFolder: (folder: FolderNode) => Promise<void>;
  toggleFolder: (folder: FolderNode) => Promise<void>;
  updateGallerySettings: (settings: Partial<GallerySettings>) => Promise<void>;
  openImageViewer: (image: ImageFile, index: number) => void;
  closeImageViewer: () => void;
  navigateImage: (direction: 'prev' | 'next') => void;
  startSlideshow: () => void;
  stopSlideshow: () => void;
  updateSlideshowSettings: (settings: Partial<SlideshowSettings>) => void;
  clearMemory: () => Promise<void>;
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
  const [slideshowSettingsStorage, setSlideshowSettingsStorage] = useLocalStorage<SlideshowSettings>(
    'app.slideshowSettings',
    DEFAULT_SLIDESHOW_SETTINGS
  );

  const [state, setState] = useState<AppState>({
    rootFolder: null,
    selectedFolder: null,
    allImages: [],
    filteredImages: [],
    gallerySettings: DEFAULT_GALLERY_SETTINGS,
    viewerState: initialViewerState,
    slideshowState: initialSlideshowState,
    slideshowSettings: slideshowSettingsStorage,
    isLoading: false,
    loadingProgress: null,
    error: null,
  });

  const { openFolder: openFolderDialog, scanFolder, scanFolderStructure, scanFolderRecursive } = useFileSystem();

  // 启动时做一次缓存清理，避免 IndexedDB 无限制增长
  useEffect(() => {
    cacheManager.cleanup().catch((err) => {
      console.error('清理缓存失败:', err);
    });
  }, []);

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

      const sortBy = state.gallerySettings.sortBy;
      const sortOrder = state.gallerySettings.sortOrder;
      if (sortBy !== 'name') {
        await ensureImagesMetadata(images);
      }
      const sortedImages = sortImages(images, sortBy, sortOrder);

      const rootNode: FolderNode = {
        id: crypto.randomUUID(),
        name: handle.name,
        handle,
        path: '',
        children: folders,
        imageCount: sortedImages.length,
        totalImageCount: sortedImages.length,
        isExpanded: true,
        isLoaded: true,
        level: 0,
      };

      setState((prev) => {
        releaseImageResources(prev.allImages);
        releaseImageResources(prev.filteredImages);
        releaseImageResources(prev.viewerState.images);

        return {
          ...prev,
          rootFolder: rootNode,
          selectedFolder: rootNode,
          allImages: images,
          filteredImages: sortedImages,
          viewerState: initialViewerState,
          slideshowState: initialSlideshowState,
          isLoading: false,
          loadingProgress: null,
          error: null,
        };
      });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        error: err.message || '打开文件夹失败',
        isLoading: false,
      }));
    }
  }, [openFolderDialog, scanFolderStructure, state.gallerySettings.sortBy, state.gallerySettings.sortOrder]);

  /**
   * 选择文件夹
   */
  const selectFolder = useCallback(
    async (folder: FolderNode) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        let allImages: ImageFile[];

        if (state.gallerySettings.recursive) {
          allImages = await scanFolderRecursive(folder.handle, folder.path);
        } else {
          const { images } = await scanFolder(folder.handle, folder.path);
          allImages = images;
        }

        const sortBy = state.gallerySettings.sortBy;
        const sortOrder = state.gallerySettings.sortOrder;
        if (sortBy !== 'name') {
          await ensureImagesMetadata(allImages);
        }

        const sortedImages = sortImages(allImages, sortBy, sortOrder);

        setState((prev) => {
          releaseImageResources(prev.filteredImages);
          releaseImageResources(prev.allImages);
          releaseImageResources(prev.viewerState.images);

          return {
            ...prev,
            selectedFolder: folder,
            allImages,
            filteredImages: sortedImages,
            viewerState: initialViewerState,
            slideshowState: initialSlideshowState,
            isLoading: false,
            loadingProgress: null,
            error: null,
          };
        });
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          error: err.message || '加载文件夹失败',
          isLoading: false,
        }));
      }
    },
    [
      scanFolder,
      scanFolderRecursive,
      state.gallerySettings.recursive,
      state.gallerySettings.sortBy,
      state.gallerySettings.sortOrder,
    ]
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
          const { folders } = await scanFolder(folder.handle, folder.path, { includeImages: false });
          
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
      const targetSortBy = settings.sortBy ?? state.gallerySettings.sortBy;
      const targetSortOrder = settings.sortOrder ?? state.gallerySettings.sortOrder;
      const requiresMetadata = targetSortBy !== 'name';

      setState((prev) => {
        const newSettings = { ...prev.gallerySettings, ...settings };
        const sorted = sortImages(prev.filteredImages, newSettings.sortBy, newSettings.sortOrder);

        return {
          ...prev,
          gallerySettings: newSettings,
          filteredImages: sorted,
        };
      });

      if (settings.recursive !== undefined && state.selectedFolder) {
        await selectFolder(state.selectedFolder);
        return;
      }

      if (requiresMetadata) {
        await ensureImagesMetadata(state.filteredImages);
        setState((prev) => ({
          ...prev,
          filteredImages: sortImages(
            prev.filteredImages,
            targetSortBy,
            targetSortOrder
          ),
        }));
      }
    },
    [state.filteredImages, state.gallerySettings.sortBy, state.gallerySettings.sortOrder, state.selectedFolder, selectFolder]
  );

  /**
   * 加载并打开指定索引的图片
   */
  const loadViewerImageAt = useCallback(
    (index: number) => {
      const images = state.filteredImages;
      if (!images.length) return;

      const total = images.length;
      const normalizedIndex = ((index % total) + total) % total;
      const targetImage = images[normalizedIndex];

      setState((prev) => ({
        ...prev,
        viewerState: {
          ...prev.viewerState,
          isOpen: true,
          isLoading: true,
          images,
          currentIndex: normalizedIndex,
          currentImage: targetImage,
        },
      }));

      ensureImageURL(targetImage)
        .then(() => {
          setState((prev) => {
            if (
              !prev.viewerState.isOpen ||
              prev.viewerState.currentIndex !== normalizedIndex
            ) {
              return prev;
            }

            return {
              ...prev,
              viewerState: {
                ...prev.viewerState,
                isOpen: true,
                isLoading: false,
                images,
                currentIndex: normalizedIndex,
                currentImage: { ...targetImage },
              },
            };
          });
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : '加载图片失败';
          setState((prev) => {
            if (
              !prev.viewerState.isOpen ||
              prev.viewerState.currentIndex !== normalizedIndex
            ) {
              return prev;
            }

            return {
              ...prev,
              error: message,
              viewerState: {
                ...prev.viewerState,
                isLoading: false,
              },
            };
          });
        });
    },
    [state.filteredImages]
  );

  /**
   * 打开图片预览
   */
  const openImageViewer = useCallback(
    (_image: ImageFile, index: number) => {
      loadViewerImageAt(index);
    },
    [loadViewerImageAt]
  );

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
  const navigateImage = useCallback(
    (direction: 'prev' | 'next') => {
      const total = state.filteredImages.length;
      if (!total) return;

      const delta = direction === 'prev' ? -1 : 1;
      const nextIndex = (state.viewerState.currentIndex ?? 0) + delta;
      loadViewerImageAt(nextIndex);
    },
    [loadViewerImageAt, state.filteredImages.length, state.viewerState.currentIndex]
  );

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
  const updateSlideshowSettings = useCallback(
    (settings: Partial<SlideshowSettings>) => {
      setSlideshowSettingsStorage((prev) => ({
        ...prev,
        ...settings,
      }));

      setState((prev) => ({
        ...prev,
        slideshowSettings: {
          ...prev.slideshowSettings,
          ...settings,
        },
      }));
    },
    [setSlideshowSettingsStorage]
  );

  const clearMemory = useCallback(async () => {
    const resetImages = (images: ImageFile[]): ImageFile[] => {
      if (!images.length) return [];
      releaseImageResources(images);
      return images.map((img) => ({
        ...img,
        thumbnail: '',
        metadataLoaded: false,
      }));
    };

    resetThumbnailQueue();

    setState((prev) => ({
      ...prev,
      allImages: resetImages(prev.allImages),
      filteredImages: resetImages(prev.filteredImages),
      viewerState: initialViewerState,
      slideshowState: initialSlideshowState,
    }));

    await cacheManager.clear().catch((err) => {
      console.error('清空缓存失败:', err);
    });
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
    clearMemory,
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
