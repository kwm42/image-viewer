'use client';

import { useApp } from '@/contexts/AppContext';

export default function Home() {
  const { rootFolder, isLoading, error, openFolder, allImages } = useApp();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            📁 图片查看器
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            使用 File System Access API 浏览本地图片
          </p>
        </header>

        {/* 主要内容区域 */}
        <main>
          {!rootFolder ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
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
                
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
                  开始使用
                </h2>
                
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  点击下方按钮选择包含图片的文件夹
                </p>
                
                <button
                  onClick={openFolder}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '加载中...' : '📂 打开文件夹'}
                </button>
                
                {error && (
                  <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
                    {error}
                  </div>
                )}
                
                <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                  <p>⚠️ 需要 Chrome 或 Edge 浏览器</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                    {rootFolder.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    共找到 {allImages.length} 张图片
                  </p>
                </div>
                
                <button
                  onClick={openFolder}
                  className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg transition-colors"
                >
                  切换文件夹
                </button>
              </div>
              
              {/* 图片网格 - 临时简单展示 */}
              {allImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mt-6">
                  {allImages.slice(0, 12).map((image) => (
                    <div
                      key={image.id}
                      className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                    >
                      <img
                        src={image.thumbnail}
                        alt={image.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  此文件夹中没有图片
                </div>
              )}
              
              {allImages.length > 12 && (
                <div className="mt-4 text-center text-gray-600 dark:text-gray-300">
                  还有 {allImages.length - 12} 张图片...
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
