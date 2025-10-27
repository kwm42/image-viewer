/**
 * IndexedDB 缓存管理器
 * 用于缓存图片缩略图和元数据，提升加载速度
 */

const DB_NAME = 'image-viewer-cache';
const DB_VERSION = 1;
const STORE_NAME = 'thumbnails';

interface CachedImage {
  path: string;
  thumbnail: string;
  width: number;
  height: number;
  size: number;
  modifiedAt: number;
  cachedAt: number;
}

class CacheManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * 初始化数据库
   */
  private async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建对象存储
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'path' });
          store.createIndex('cachedAt', 'cachedAt', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * 获取缓存的图片数据
   */
  async get(path: string, modifiedAt: number): Promise<CachedImage | null> {
    try {
      await this.init();
      if (!this.db) return null;

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(path);

        request.onsuccess = () => {
          const cached = request.result as CachedImage | undefined;
          
          // 检查缓存是否过期（文件修改时间变了）
          if (cached && cached.modifiedAt === modifiedAt) {
            resolve(cached);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error('获取缓存失败:', err);
      return null;
    }
  }

  /**
   * 保存图片数据到缓存
   */
  async set(data: CachedImage): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(data);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error('保存缓存失败:', err);
    }
  }

  /**
   * 批量获取缓存
   */
  async getMany(
    items: Array<{ path: string; modifiedAt: number }>
  ): Promise<Map<string, CachedImage>> {
    try {
      await this.init();
      if (!this.db) return new Map();

      const results = new Map<string, CachedImage>();

      await Promise.all(
        items.map(async ({ path, modifiedAt }) => {
          const cached = await this.get(path, modifiedAt);
          if (cached) {
            results.set(path, cached);
          }
        })
      );

      return results;
    } catch (err) {
      console.error('批量获取缓存失败:', err);
      return new Map();
    }
  }

  /**
   * 清理过期缓存（保留最近 30 天）
   */
  async cleanup(maxAge = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;

      const cutoffTime = Date.now() - maxAge;

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('cachedAt');
        const request = index.openCursor();

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const cached = cursor.value as CachedImage;
            if (cached.cachedAt < cutoffTime) {
              cursor.delete();
            }
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error('清理缓存失败:', err);
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<{ count: number; size: number }> {
    try {
      await this.init();
      if (!this.db) return { count: 0, size: 0 };

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const items = request.result as CachedImage[];
          const size = items.reduce((sum, item) => sum + item.thumbnail.length, 0);
          resolve({ count: items.length, size });
        };

        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error('获取缓存统计失败:', err);
      return { count: 0, size: 0 };
    }
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error('清空缓存失败:', err);
    }
  }
}

// 单例
export const cacheManager = new CacheManager();
