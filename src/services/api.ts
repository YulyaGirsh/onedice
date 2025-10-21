import { API_BASE_URL } from '../config/api';
import { CreateGameData, Game, GameResults, PlayAgainResponse, PlayAgainStatus } from '../types';
import { avatarCache } from '../utils/avatarCache';

// Интерфейс для ответа API при создании лобби
interface CreateLobbyResponse {
  id: string;
  type: 'duel' | 'lobby';
  bet: number;
  isPublic: boolean;
  openProfile: boolean;
  players: Array<{
    id: string;
    username: string;
    role: 'creator' | 'player';
    joinedAt: number;
    isReady?: boolean;
  }>;
  maxPlayers: number;
  createdAt: number;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  creatorFirstName?: string;
  creatorLastName?: string;
}



class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Создание нового лобби
  async createLobby(gameData: CreateGameData, creatorId: string, creatorName: string): Promise<CreateLobbyResponse> {
    try {
      // Extract first and last names from creatorName if it contains spaces
      const nameParts = creatorName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const response = await fetch(`${this.baseUrl}/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creator: {
            id: creatorId,
            username: creatorName,
            first_name: firstName,
            last_name: lastName,
          },
          type: gameData.type === '1v1' ? 'duel' : 'lobby',
          bet: gameData.price,
          isPublic: !gameData.isPrivate,
          openProfile: !gameData.isAnonymous,
        }),
      });

      if (!response.ok) {
        // Пробуем прочитать ошибку сервера
        let message = `HTTP error! status: ${response.status}`;
        try { const body = await response.json(); if (body?.error) message = body.error; } catch {}
        throw new Error(message);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Ошибка при создании лобби:', error);
      throw error;
    }
  }

  // Регистрация нового пользователя
  async registerUser(userData: { id: string; username: string; first_name: string; last_name: string }): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Ошибка регистрации пользователя:', error);
      throw error;
    }
  }

  // Профиль/статистика игрока
  async getUserStats(userId: string): Promise<{ rating: number; gamesPlayed: number; gamesWon: number; }> {
    const res = await fetch(`${this.baseUrl}/users/${userId}/stats`);
    if (!res.ok) throw new Error('Failed to load stats');
    return res.json();
  }

  // Профиль пользователя (имя, username)
  async getUserProfile(userId: string): Promise<{ id: string; username?: string; first_name?: string; last_name?: string; photo_url?: string; avatar?: string; } | null> {
    const res = await fetch(`${this.baseUrl}/users/${userId}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to load user profile');
    return res.json();
  }

  // Получить аватарку пользователя
  async getUserAvatar(userId: string): Promise<string | null> {
    // Проверяем кэш сначала
    const cachedAvatar = avatarCache.get(userId);
    if (cachedAvatar) {
      return cachedAvatar;
    }

    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/avatar`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to load user avatar');
      const data = await response.json();
      
      // Сохраняем в кэш если аватар найден
      if (data.avatar) {
        avatarCache.set(userId, data.avatar);
      }
      
      return data.avatar;
    } catch (error) {
      console.error('Ошибка получения аватарки пользователя:', error);
      throw error;
    }
  }

  // Обновить аватарку пользователя
  async updateUserAvatar(userId: string, avatar: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatar }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Обновляем кэш после успешного обновления
      avatarCache.set(userId, avatar);
    } catch (error) {
      console.error('Ошибка обновления аватарки пользователя:', error);
      throw error;
    }
  }

  // Получение списка всех лобби
  async getLobbies(isPrivate?: boolean): Promise<CreateLobbyResponse[]> {
    try {
      // В dev API_BASE_URL пустой, используем относительный путь и формируем строку запроса вручную
      let url = `${this.baseUrl}/games`;
      if (isPrivate !== undefined) {
        const query = `public=${(!isPrivate).toString()}`;
        url += (url.includes('?') ? '&' : '?') + query;
      }

      const response = await fetch(url);

      if (!response.ok) {
        let message = `HTTP error! status: ${response.status}`;
        try { const body = await response.json(); if (body?.error) message = body.error; } catch {}
        throw new Error(message);
      }

      const data: CreateLobbyResponse[] = await response.json();
      return data;
    } catch (error) {
      console.error('Ошибка при получении списка лобби:', error);
      throw error;
    }
  }

  // Получение лобби конкретного пользователя
  async getUserLobbies(userId: string): Promise<CreateLobbyResponse[]> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/lobbies`);

      if (!response.ok) {
        let message = `HTTP error! status: ${response.status}`;
        try { const body = await response.json(); if (body?.error) message = body.error; } catch {}
        throw new Error(message);
      }

      const data: CreateLobbyResponse[] = await response.json();
      return data;
    } catch (error) {
      console.error('Ошибка при получении лобби пользователя:', error);
      throw error;
    }
  }

  // Получение конкретного лобби по ID
  async getLobby(lobbyId: string): Promise<CreateLobbyResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/games/${lobbyId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Ошибка при получении лобби:', error);
      throw error;
    }
  }

  // Присоединение к лобби
  async joinLobby(lobbyId: string, playerId: string, playerData: { first_name?: string; last_name?: string; telegramUsername?: string }): Promise<CreateLobbyResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/games/${lobbyId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player: {
            id: playerId,
            first_name: playerData.first_name || '',
            last_name: playerData.last_name || '',
            telegramUsername: playerData.telegramUsername || '',
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Ошибка при присоединении к лобби:', error);
      throw error;
    }
  }

  // Покидание лобби
  async leaveLobby(lobbyId: string, playerId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/games/${lobbyId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Ошибка при покидании лобби:', error);
      throw error;
    }
  }

  // Обновление готовности игрока
  async updatePlayerReady(lobbyId: string, playerId: string, isReady: boolean): Promise<CreateLobbyResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/games/${lobbyId}/ready`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId,
          isReady,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Ошибка при обновлении готовности:', error);
      throw error;
    }
  }

  // Генерация результатов игры (бросок кубиков)
  async rollDice(lobbyId: string, playerId: string): Promise<GameResults> {
    try {
      const response = await fetch(`${this.baseUrl}/games/${lobbyId}/roll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Ошибка при генерации результатов:', error);
      throw error;
    }
  }

  // Запрос на повторную игру
  async requestPlayAgain(lobbyId: string, playerId: string): Promise<PlayAgainResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/games/${lobbyId}/play-again`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Ошибка при запросе повторной игры:', error);
      throw error;
    }
  }

  // Получить статус запросов на повторную игру
  async getPlayAgainStatus(lobbyId: string): Promise<PlayAgainStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/games/${lobbyId}/play-again-status`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Ошибка при получении статуса повторной игры:', error);
      throw error;
    }
  }

  // Отклонение запроса на повторную игру
  async declinePlayAgain(lobbyId: string, playerId: string): Promise<{ status: 'declined' }> {
    try {
      const response = await fetch(`${this.baseUrl}/games/${lobbyId}/decline-play-again`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Ошибка при отклонении повторной игры:', error);
      throw error;
    }
  }

  // Heartbeat присутствия игрока
  async heartbeat(lobbyId: string, playerId: string, screen: 'game' | 'lobby'): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/games/${lobbyId}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, screen })
      });
    } catch (error) {
      // Без шума — heartbeat best-effort
      console.warn('Heartbeat error:', error);
    }
  }

  // Удаление лобби (только создатель)
  async deleteLobby(lobbyId: string, creatorId: string): Promise<void> {
    try {
      console.log('Удаление лобби:', { lobbyId, creatorId, baseUrl: this.baseUrl });
      const url = `${this.baseUrl}/games/${lobbyId}`;
      console.log('URL запроса:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: creatorId })
      });
      
      console.log('Ответ сервера:', response.status, response.statusText);
      
      if (!response.ok) {
        const text = await response.text();
        console.error('Ошибка ответа сервера:', text);
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.text();
      console.log('Результат удаления:', result);
    } catch (error) {
    console.error('Ошибка при удалении лобби:', error);
    if (error instanceof Error) {
      console.error('Детали ошибки:', error.message, error.name, error.stack);
    }
    throw error;
  }
  }

  // Преобразование ответа API в формат Game для фронтенда
  mapApiResponseToGame(apiResponse: CreateLobbyResponse, currentUserId?: string): Game {
    const creator = apiResponse.players.find(p => p.role === 'creator');
    
    return {
      id: apiResponse.id, // Сохраняем id как строку (UUID)
      creatorId: creator?.id || '',
      creatorName: !apiResponse.openProfile ? 'Анонимный игрок' : (creator?.username || 'Player'),
      price: apiResponse.bet,
      maxPlayers: apiResponse.maxPlayers,
      currentPlayers: apiResponse.players.length,
      isPrivate: !apiResponse.isPublic,
      isAnonymous: !apiResponse.openProfile,
      status: apiResponse.status,
      type: apiResponse.type === 'duel' ? '1v1' : 'lobby',
      isMyGame: currentUserId ? (creator?.id === currentUserId) : false,
      creatorFirstName: (apiResponse as any).creatorFirstName,
      creatorLastName: (apiResponse as any).creatorLastName,
    };
  }

  // Получить список игроков для рейтинга
  async getTopPlayers(limit?: number) {
    try {
      let url = `${this.baseUrl}/rating`;
      if (limit && limit > 0) {
        url += `?limit=${limit}`;
      }
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Ошибка при получении топ игроков:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
export default apiService;