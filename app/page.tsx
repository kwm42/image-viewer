'use client';

import { useApp } from '@/contexts/AppContext';
import { FolderTree } from '@/components/FolderTree/FolderTree';
import { ImageGallery } from '@/components/ImageGallery/ImageGallery';
import { Toolbar } from '@/components/Toolbar/Toolbar';
import { ImagePreview } from '@/components/ImagePreview';
import { Slideshow } from '@/components/Slideshow';
import { DebugPanel } from '@/components/Debug/DebugPanel';

export default function Home() {
  const {
    rootFolder,
    selectedFolder,
    isLoading,
    loadingProgress,
    error,
    openFolder,
    selectFolder,
    toggleFolder,
    filteredImages,
    gallerySettings,
    updateGallerySettings,
    openImageViewer,
    viewerState,
    closeImageViewer,
    navigateImage,
    slideshowState,
    slideshowSettings,
    startSlideshow,
    stopSlideshow,
    updateSlideshowSettings,
  } = useApp();

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {!rootFolder ? (
        // 欢迎页面
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
              <div className="mb-6">
                <svg
                  className="w-24 h-24 mx-auto text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                图片查看器
              </h1>

              <p className="text-gray-600 dark:text-gray-300 mb-6">
                选择包含图片的文件夹开始浏览
              </p>

              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  💡 建议打开: <span className="font-mono">I:\图片\ハナビ様</span>
                </p>
              </div>

              <button
                onClick={openFolder}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>加载中...</span>
                  </>
                ) : (
                  '📂 打开文件夹'
                )}
              </button>

              {error && (
                <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="mt-6 text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <p>⚠️ 需要 Chrome 或 Edge 86+ 浏览器</p>
                <p className="text-xs">使用 File System Access API</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // 主界面
        <>
          {/* 工具栏 */}
          <Toolbar
            settings={gallerySettings}
            imageCount={filteredImages.length}
            loadingProgress={loadingProgress}
            onOpenFolder={openFolder}
            onSettingsChange={updateGallerySettings}
            onStartSlideshow={filteredImages.length > 0 ? startSlideshow : undefined}
          />

          {/* 主内容区域 */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* 左侧：文件夹树 */}
            <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                  文件夹
                </h2>
              </div>
              <div className="flex-1 overflow-hidden">
                <FolderTree
                  rootFolder={rootFolder}
                  selectedFolder={selectedFolder}
                  onFolderSelect={selectFolder}
                  onFolderToggle={toggleFolder}
                />
              </div>
            </div>

            {/* 右侧：图片画廊 */}
            <div className="flex-1 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">加载图片中...</p>
                  </div>
                </div>
              ) : (
                <ImageGallery
                  images={filteredImages}
                  settings={gallerySettings}
                  onImageClick={openImageViewer}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* 图片预览 */}
      <ImagePreview
        image={viewerState.currentImage}
        images={viewerState.images}
        isLoading={viewerState.isLoading}
        onClose={closeImageViewer}
        onNavigate={navigateImage}
      />

      {/* 幻灯片播放 */}
      {slideshowState.isPlaying && filteredImages.length > 0 && (
        <Slideshow
          images={filteredImages}
          initialIndex={0}
          settings={slideshowSettings}
          onSettingsChange={updateSlideshowSettings}
          onClose={stopSlideshow}
        />
      )}

      <DebugPanel />
    </div>
  );
}
