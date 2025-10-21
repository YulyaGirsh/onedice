// Утилита для кэширования аватарок пользователей

interface AvatarCacheEntry {
  avatar: string;
  timestamp: number;
}

class AvatarCache {
  private memoryCache: Map<string, string> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 минут
  private readonly STORAGE_KEY = 'avatar_cache';

  constructor() {
    this.loadFromStorage();
  }

  // Получить аватар из кэша
  get(userId: string): string | null {
    return this.memoryCache.get(userId) || null;
  }

  // Сохранить аватар в кэш
  set(userId: string, avatar: string): void {
    this.memoryCache.set(userId, avatar);
    this.saveToStorage();
  }

  // Проверить, есть ли аватар в кэше
  has(userId: string): boolean {
    return this.memoryCache.has(userId);
  }

  // Загрузить кэш из localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const cache: Record<string, AvatarCacheEntry> = JSON.parse(stored);
        const now = Date.now();
        
        // Загружаем только не истекшие записи
        Object.entries(cache).forEach(([userId, entry]) => {
          if (now - entry.timestamp < this.CACHE_DURATION) {
            this.memoryCache.set(userId, entry.avatar);
          }
        });
      }
    } catch (error) {
      console.warn('Ошибка при загрузке кэша аватарок:', error);
    }
  }

  // Сохранить кэш в localStorage
  private saveToStorage(): void {
    try {
      const cache: Record<string, AvatarCacheEntry> = {};
      const now = Date.now();
      
      this.memoryCache.forEach((avatar, userId) => {
        cache[userId] = {
          avatar,
          timestamp: now
        };
      });
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('Ошибка при сохранении кэша аватарок:', error);
    }
  }

  // Очистить кэш
  clear(): void {
    this.memoryCache.clear();
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Получить размер кэша
  size(): number {
    return this.memoryCache.size;
  }
}

// Экспортируем единственный экземпляр кэша
export const avatarCache = new AvatarCache();