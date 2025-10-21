// Конфигурация API
// В dev используем относительные пути (прокси Vite). В проде (Telegram/хостинг) нужен абсолютный адрес бэкенда.
export const API_BASE_URL = (() => {
  const envBase = (import.meta as any)?.env?.VITE_API_BASE_URL as string | undefined;
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocalhost = /^(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)$/.test(hostname);

  if (isLocalhost) {
    // Локальная разработка — используем прокси Vite
    return '';
  }

  // Прод/Telegram — сначала берём из env, иначе из глобальной переменной или localStorage
  if (envBase) return envBase;
  try { const globalBase = (window as any).__API_BASE_URL__; if (typeof globalBase === 'string' && globalBase) return globalBase; } catch {}
  try { const saved = localStorage.getItem('api_base_url'); if (saved) return saved; } catch {}
  return '';
})();

// Определяем окружение
const isDevelopment = typeof window !== 'undefined' && (/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname));

interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

// 🔧 Создаем конфигурацию API
const createApiConfig = (): ApiConfig => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Добавляем заголовки Telegram Web App если доступны
  if (window.Telegram?.WebApp) {
    const webApp = window.Telegram.WebApp;
    
    // Добавляем initDataUnsafe если доступен
    if (webApp.initDataUnsafe) {
      headers['X-Telegram-Init-Data'] = JSON.stringify(webApp.initDataUnsafe);
    }
    
    // Добавляем информацию о платформе
    headers['X-Telegram-Platform'] = webApp.platform || 'unknown';
    headers['X-Telegram-Version'] = webApp.version || 'unknown';
  }

  return {
    baseURL: API_BASE_URL,
    timeout: 10000, // 10 секунд
    headers,
  };
};

// 📡 API endpoints
export const API_ENDPOINTS = {
  // 🎮 Игровые эндпоинты
  games: {
    list: '/games',
    create: '/games',
    join: (gameId: string) => `/games/${gameId}/join`,
    leave: (gameId: string) => `/games/${gameId}/leave`,
    details: (gameId: string) => `/games/${gameId}`,
  },
  
  // 👤 Пользовательские эндпоинты
  user: {
    profile: '/user/profile',
    stats: '/user/stats',
    history: '/user/history',
    leaderboard: '/user/leaderboard',
    avatar: (userId: string) => `/users/${userId}/avatar`,
    updateAvatar: (userId: string) => `/users/${userId}/avatar`,
  },
  
  // 🏪 Эндпоинты магазина
  shop: {
    items: '/shop/items',
    purchase: '/shop/purchase',
    inventory: '/user/inventory',
  },
  
  // 🎯 Системные эндпоинты
  system: {
    health: '/health',
    version: '/version',
    config: '/config',
  }
} as const;

// 🔑 Заголовки по умолчанию
export const getDefaultHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // 🎫 Добавляем Telegram Web App данные если доступны
  if (window.Telegram?.WebApp?.initDataUnsafe) {
    headers['X-Telegram-Init-Data'] = JSON.stringify(window.Telegram.WebApp.initDataUnsafe);
  }

  // 📱 Добавляем информацию о платформе
  if (window.Telegram?.WebApp?.platform) {
    headers['X-Platform'] = window.Telegram.WebApp.platform;
  }

  return headers;
};

// 🔄 Функция для повторных попыток
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await requestFn();
  } catch (error) {
    if (retries > 0) {
      console.log(`🔄 Повторная попытка через ${delay}ms. Осталось попыток: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(requestFn, retries - 1, delay * 1.5); // Exponential backoff
    }
    throw error;
  }
};

// 📡 Основная функция для API запросов
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: getDefaultHeaders(),
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, finalOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// 🎯 Удобные методы для HTTP запросов
export const api = {
  get: <T>(endpoint: string) => 
    apiRequest<T>(endpoint, { method: 'GET' }),
    
  post: <T>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  put: <T>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  patch: <T>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};

// 🔧 Экспортируем конфигурацию
export default createApiConfig();

// 📝 Логирование конфигурации при инициализации
console.log('🚀 API Configuration:', {
  environment: isDevelopment ? 'development' : 'production',
  baseUrl: API_BASE_URL,
  timeout: 10000, // 10 секунд
  retries: 3,
});