require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { userQueries, lobbyQueries, gameQueries } = require('./database');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// In-memory lobby store
const lobbies = new Map();

// --- SSE: клиенты для реального времени ---
const sseClients = new Set();
function sseBroadcast(event, payload) {
  const data = `event: ${event}\n` + `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of sseClients) {
    try { res.write(data); } catch (_) {}
  }
}

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  res.write(': connected\n\n');
  sseClients.add(res);
  const keepAlive = setInterval(() => { try { res.write(': ping\n\n'); } catch {} }, 25000);
  req.on('close', () => { clearInterval(keepAlive); sseClients.delete(res); });
});

// Загрузка лобби из базы данных в память при старте сервера
async function loadLobbiesFromDatabase() {
  try {
    console.log('🔄 Загружаем лобби из базы данных...');
    const dbLobbies = await lobbyQueries.getAllLobbiesWithPlayers();
    
    dbLobbies.forEach(lobby => {
      // Обрабатываем игроков из БД, формируя правильные displayName
      lobby.players = lobby.players.map(player => {
        const displayName = player.first_name && player.last_name 
          ? `${player.first_name} ${player.last_name}`.trim()
          : player.telegramUsername || 'anonymous';
        
        return {
          ...player,
          username: displayName
        };
      });
      lobbies.set(lobby.id, lobby);
    });
    
    console.log(`✅ Загружено ${dbLobbies.length} лобби из базы данных`);
  } catch (error) {
    console.error('❌ Ошибка загрузки лобби из базы данных:', error);
  }
}

// Регистрация пользователя при первом входе в приложение
app.post('/users/register', async (req, res) => {
  console.log('👤 Запрос на регистрацию пользователя:', req.body);
  try {
    const { id, username, first_name, last_name } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Проверяем, существует ли пользователь
    const existingUser = await userQueries.getUser(id);
    if (existingUser) {
      console.log(`✅ Пользователь ${id} уже существует`);
      return res.json({ message: 'User already exists', user: existingUser });
    }

    // Создаем нового пользователя
    await userQueries.upsertUser(id, first_name || null, last_name || null, username || null);
    const newUser = await userQueries.getUser(id);
    
    console.log(`✅ Новый пользователь зарегистрирован: ${id}`);
    res.json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    console.error('❌ Ошибка регистрации пользователя:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Утилита: только пометить оффлайн/онлайн по lastSeen — никого не удаляем автоматически
function purgeOfflinePlayers(lobby) {
  if (!lobby) return false;
  const now = Date.now();
  lobby.players.forEach(p => {
    const lastActive = p.lastSeen || p.joinedAt || 0;
    const isOffline = now - lastActive > 15000;
    p.online = !isOffline;
  });
  // Ничего не удаляем — авто-удаление выключено
  return false;
}

/**
 * Создать лобби
 * body: { creator: { id, username }, type: 'duel' | 'lobby', bet: number, isPublic: boolean }
 */
app.post('/games', async (req, res) => {
  console.log(`🎯 Запрос на создание лобби:`, req.body);
  try {
    const { creator, type = 'duel', bet = 0, isPublic = false, openProfile = false } = req.body || {};
    if (!creator || !creator.id) {
      console.log(`❌ Некорректные данные создателя:`, req.body);
      return res.status(400).json({ error: 'creator required' });
    }

    // 1) Проверяем, что пользователь существует в БД (должен быть зарегистрирован при входе в приложение)
    const existingUser = await userQueries.getUser(creator.id);
    if (!existingUser) {
      console.log(`❌ Пользователь ${creator.id} не найден в БД. Необходима регистрация.`);
      return res.status(400).json({ error: 'User not registered. Please restart the app.' });
    }

    // 2) Create lobby in memory (for runtime operations)
    const id = uuidv4();
    const lobby = {
      id,
      type,
      bet,
      isPublic,
      openProfile,
      creatorId: creator.id,
      creatorFirstName: creator.first_name || null,
      creatorLastName: creator.last_name || null,
      players: [{ ...creator, role: 'creator', joinedAt: Date.now() }],
      maxPlayers: type === 'duel' ? 2 : 5,
      createdAt: Date.now(),
      status: 'waiting'
    };
    lobbies.set(id, lobby);

    // 3) Persist lobby + creator membership in SQLite
    await lobbyQueries.createLobby({
      id,
      creator_id: creator.id,
      type,
      bet,
      is_public: isPublic,
      open_profile: openProfile,
      max_players: lobby.maxPlayers,
      creator_first_name: creator.first_name || null,
      creator_last_name: creator.last_name || null,
    });

    console.log(`✅ Лобби создано и сохранено в БД:`, lobby);
    
    // Уведомляем всех клиентов о создании нового лобби через SSE
    sseBroadcast('lobby_update', { 
      id: lobby.id, 
      currentPlayers: lobby.players.length, 
      status: lobby.status,
      action: 'created'
    });
    
    return res.status(201).json(lobby);
  } catch (err) {
    console.error('❌ Ошибка при создании лобби:', err);
    return res.status(500).json({ error: 'internal error' });
  }
});

// Получить список лобби (опционально только публичные)
app.get('/games', async (req, res) => {
  console.log(`GET /games called with query: ${JSON.stringify(req.query)}`);
  try {
    const publicOnly = req.query.public === 'true';

    // 1) Синхронизируем состояние из БД, чтобы все клиенты видели одинаковый список
    const dbLobbies = await lobbyQueries.getAllLobbiesWithPlayers();
    dbLobbies.forEach(dbLobby => {
      const existing = lobbies.get(dbLobby.id);
      if (existing) {
        // Обновляем основные поля и аккуратно сливаем игроков, сохраняя рантайм-поля (lastSeen, screen)
        existing.type = dbLobby.type;
        existing.bet = dbLobby.bet;
        existing.isPublic = dbLobby.isPublic;
        existing.openProfile = dbLobby.openProfile;
        existing.creatorId = dbLobby.creatorId;
        existing.creatorFirstName = dbLobby.creatorFirstName || null;
        existing.creatorLastName = dbLobby.creatorLastName || null;
        existing.maxPlayers = dbLobby.maxPlayers;
        existing.status = dbLobby.status;
        existing.createdAt = dbLobby.createdAt;

        const runtimeById = new Map((existing.players || []).map(p => [p.id, p]));
        existing.players = (dbLobby.players || []).map(p => {
          const rt = runtimeById.get(p.id) || {};
          return {
            ...p,
            lastSeen: rt.lastSeen || p.joinedAt,
            online: typeof rt.online === 'boolean' ? rt.online : true,
            screen: rt.screen
          };
        });
      } else {
        lobbies.set(dbLobby.id, dbLobby);
      }
    });

    // 2) Возвращаем актуальный список из памяти (после синка), с учетом фильтра публичности
    const list = Array.from(lobbies.values()).filter(l => !publicOnly || l.isPublic);

    // Обновляем онлайн-флаги (без удаления)
    list.forEach(lobby => purgeOfflinePlayers(lobby));

    res.json(list);
  } catch (e) {
    console.error('❌ Ошибка получения списка лобби:', e);
    res.status(500).json({ error: 'internal error' });
  }
});

// Присоединиться к лобби
app.post('/games/:id/join', async (req, res) => {
  console.log(`🎮 Запрос на присоединение к лобби ${req.params.id}:`, req.body);
  
  const lobby = lobbies.get(req.params.id);
  if (!lobby) {
    console.log(`❌ Лобби ${req.params.id} не найдено`);
    return res.status(404).json({ error: 'not found' });
  }

  const { player } = req.body || {};
  if (!player || !player.id) {
    console.log(`❌ Некорректные данные игрока:`, req.body);
    return res.status(400).json({ error: 'player required' });
  }
  
  // избежать дубликатов
  if (lobby.players.find(p => p.id === player.id)) {
    console.log(`⚠️ Игрок ${player.id} уже в лобби ${req.params.id}`);
    return res.json(lobby);
  }

  // Проверяем заполненность ТОЛЬКО для новых игроков
  if (lobby.players.length >= lobby.maxPlayers) {
    console.log(`❌ Лобби ${req.params.id} заполнено (${lobby.players.length}/${lobby.maxPlayers})`);
    return res.status(400).json({ error: 'lobby full' });
  }

  // Определяем роль (если возвращается создатель — роль creator)
  const role = player.id === lobby.creatorId ? 'creator' : 'player';

  // Используем переданные поля first_name, last_name и telegramUsername
  const firstName = player.first_name || null;
  const lastName = player.last_name || null;
  const telegramUsername = player.telegramUsername || null;
  
  console.log(`🔍 Данные игрока ${player.id}:`, {
    firstName,
    lastName,
    telegramUsername,
    originalPlayer: player
  });

  // Обновляем информацию о пользователе в БД
  let userFromDb = null;
  try {
    // Обновляем пользователя с отдельными полями
    await userQueries.upsertUser(player.id, firstName, lastName, telegramUsername);
    
    // Получаем обновленные данные пользователя из БД
    userFromDb = await userQueries.getUser(player.id);
    
    // persist membership
    await lobbyQueries.addPlayerToLobby(req.params.id, player.id, role);
  } catch (err) {
    console.error('❌ Ошибка сохранения игрока в БД:', err);
  }

  // Используем username из базы данных
  const displayName = userFromDb?.username || 'anonymous';
  
  const playerWithDisplayName = { ...player, username: displayName, role, joinedAt: Date.now() };
  
  console.log(`📝 Игрок ${player.id} получил username из БД: "${displayName}"`);

  lobby.players.push(playerWithDisplayName);
  if (lobby.players.length === lobby.maxPlayers) lobby.status = 'ready';
  // Сбрасываем информацию о последнем вышедшем
  lobby.lastPlayerLeft = null;
  
  const playerDisplayName = `${player.first_name || ''} ${player.last_name || ''}`.trim() || player.username || 'Игрок';
  console.log(`✅ Игрок ${player.id} (${playerDisplayName}) присоединился к лобби ${req.params.id}`);
  console.log(`📊 Текущее состояние лобби:`, lobby);
  // Реал-тайм: сообщаем всем клиентам об обновлении лобби
  sseBroadcast('lobby_update', { id: lobby.id, currentPlayers: lobby.players.length, status: lobby.status });
  
  res.json(lobby);
});

// Обновить статус готовности
app.post('/games/:id/ready', async (req, res) => {
  const lobby = lobbies.get(req.params.id);
  if (!lobby) return res.status(404).json({ error: 'not found' });
  
  // Обновляем онлайн-флаги (без удаления)
  purgeOfflinePlayers(lobby);
  
  const { playerId, isReady } = req.body;
  if (!playerId) return res.status(400).json({ error: 'playerId required' });
  
  const player = lobby.players.find(p => p.id === playerId);
  if (!player) return res.status(400).json({ error: 'player not found' });

  // Создатель всегда готов, не позволяем изменить его статус
  if (player.role === 'creator') {
    player.isReady = true;
  } else {
    player.isReady = isReady;
  }

  // Сохраняем статус готовности в базе данных
  try {
    const finalReadyStatus = player.role === 'creator' ? true : isReady;
    await lobbyQueries.updatePlayerReady(req.params.id, playerId, finalReadyStatus);
    console.log(`✅ Статус готовности обновлен в БД для игрока ${playerId}: ${finalReadyStatus}`);
  } catch (error) {
    console.error(`❌ Ошибка обновления статуса готовности в БД:`, error);
  }
  
  // Проверяем, все ли готовы (создатель всегда готов)
  const allReady = lobby.players.every(p => p.isReady || p.role === 'creator');

  // Автозапуск игры если все готовы и лобби заполнено
  if (lobby.status !== 'playing' && lobby.players.length === lobby.maxPlayers && allReady) {
    lobby.status = 'playing';
    // Очищаем флаги "играть снова" при старте новой игры
    delete lobby.playAgainDeclinedBy;
    delete lobby.playAgainInitiator;
    delete lobby.shouldClearDeclineState;
    
    console.log(`🚀 Игра в лобби ${req.params.id} автоматически запущена!`);
    
    // Уведомляем всех клиентов о начале игры
    sseBroadcast('lobby-updated', lobby);
  } else if (lobby.status !== 'playing') {
    lobby.status = lobby.players.length === lobby.maxPlayers && allReady ? 'ready' : 'waiting';
  }
  
  // Обновляем статус в базе данных
  const newStatus = lobby.status;
  lobbyQueries.updateLobbyStatus(req.params.id, newStatus).catch(e => console.error('DB status update error:', e));
  
  res.json(lobby);
});

// Heartbeat для онлайна
app.post('/games/:id/heartbeat', (req, res) => {
  const lobby = lobbies.get(req.params.id);
  if (!lobby) return res.status(404).json({ error: 'not found' });
  const { playerId, screen } = req.body || {};
  if (!playerId) return res.status(400).json({ error: 'playerId required' });
  const player = lobby.players.find(p => p.id === playerId);
  if (!player) return res.status(400).json({ error: 'player not found' });
  player.lastSeen = Date.now();
  player.online = true;
  if (screen === 'game' || screen === 'lobby') player.screen = screen;
  // Обновляем время последнего посещения пользователя в БД
  try {
    userQueries.updateLastSeen(player.id).catch(() => {});
  } catch {}
  res.json({ ok: true });
});

// Покинуть лобби
app.post('/games/:id/leave', async (req, res) => {
  const lobby = lobbies.get(req.params.id);
  if (!lobby) return res.status(404).json({ error: 'not found' });
  const { playerId } = req.body || {};
  if (!playerId) return res.status(400).json({ error: 'playerId required' });
  
  // Удаляем в памяти
  const removedPlayer = lobby.players.find(p => p.id === playerId);
  lobby.players = lobby.players.filter(p => p.id !== playerId);
  
  // Помечаем игрока как покинувшего в БД
  let dbDeleteResult = null;
  try {
    dbDeleteResult = await lobbyQueries.removePlayerFromLobby(req.params.id, playerId);
  } catch (e) {
    console.error('DB remove player error:', e);
  }
  
  // Удаляем из playAgain, если был
  if (lobby.playAgain && lobby.playAgain instanceof Set) {
    lobby.playAgain.delete(playerId);
  }
  if (removedPlayer) {
    const playerDisplayName = `${removedPlayer.first_name || ''} ${removedPlayer.last_name || ''}`.trim() || removedPlayer.username || 'Игрок';
    lobby.lastPlayerLeft = { id: removedPlayer.id, username: playerDisplayName };
  }
  
  // Обрабатываем результат удаления из БД
  if (dbDeleteResult && dbDeleteResult.deletedIds && dbDeleteResult.deletedIds.length > 0) {
    dbDeleteResult.deletedIds.forEach(deletedLobbyId => {
      if (lobbies.has(deletedLobbyId)) {
        lobbies.delete(deletedLobbyId);
        console.log(`🗑️ Лобби ${deletedLobbyId} удалено из БД и памяти`);
        sseBroadcast('lobby_deleted', { id: deletedLobbyId });
      }
    });
    
    // Если текущее лобби было удалено, возвращаем соответствующий ответ
    if (dbDeleteResult.deletedIds.includes(req.params.id)) {
      return res.json({ deleted: true, message: 'Empty lobby deleted' });
    }
  }
  
  // Если в лобби никого не осталось — удаляем его немедленно
  if (lobby.players.length === 0) {
    try {
      const deleteResult = await lobbyQueries.deleteEmptyLobbies();
      if (deleteResult.deletedIds.includes(req.params.id)) {
        // Лобби было удалено из БД, удаляем из памяти
        lobbies.delete(req.params.id);
        console.log(`🗑️ Пустое лобби ${req.params.id} автоматически удалено`);
        // Уведомляем клиентов об удалении лобби
        sseBroadcast('lobby_deleted', { id: req.params.id });
        return res.json({ deleted: true, message: 'Empty lobby deleted' });
      }
    } catch (e) {
      console.error('Error deleting empty lobby:', e);
    }
    
    // Если не удалось удалить, оставляем как есть
    lobby.status = 'waiting';
    lobbyQueries.updateLobbyStatus(req.params.id, 'waiting').catch(e => console.error('DB status update error:', e));
    sseBroadcast('lobby_update', { id: lobby.id, currentPlayers: lobby.players.length, status: lobby.status });
    return res.json(lobby);
  }
  
  // При выходе кого-либо — лобби возвращается в ожидание
  lobby.status = 'waiting';
  lobbyQueries.updateLobbyStatus(req.params.id, 'waiting').catch(e => console.error('DB status update error:', e));
  sseBroadcast('lobby_update', { id: lobby.id, currentPlayers: lobby.players.length, status: lobby.status });
  res.json(lobby);
});

// Получить детали лобби
app.get('/games/:id', async (req, res) => {
  let lobby = lobbies.get(req.params.id);

  // Если в памяти нет — пробуем достать из БД (например, после рестарта сервера)
  if (!lobby) {
    try {
      const dbLobbies = await lobbyQueries.getAllLobbiesWithPlayers();
      lobby = dbLobbies.find(l => l.id === req.params.id);
      if (lobby) {
        // Обрабатываем игроков из БД, используя username из базы данных
        lobby.players = lobby.players.map(player => {
          return {
            ...player,
            username: player.username || 'anonymous' // Используем username из БД
          };
        });
        lobbies.set(lobby.id, lobby);
      }
    } catch (e) {
      console.error('❌ Ошибка чтения лобби из БД:', e);
    }
  }

  if (!lobby) return res.status(404).json({ error: 'not found' });

  // Обновляем онлайн по lastSeen (таймаут 12 секунд)
  const now = Date.now();
  lobby.players.forEach(p => {
    if (p.lastSeen) {
      p.online = now - p.lastSeen <= 12000;
    }
    // Находимся ли в экране игры сейчас
    p.inGame = p.online && p.screen === 'game';
  });

  // Перед отдачей — обновляем онлайн-флаги (без удаления)
  purgeOfflinePlayers(lobby);

  res.json(lobby);
});

// Удаление лобби (только создатель)
app.delete('/games/:id', async (req, res) => {
  console.log('🗑️ Запрос на удаление лобби:', req.params.id, 'Body:', req.body);
  
  const lobby = lobbies.get(req.params.id);
  if (!lobby) {
    console.log('❌ Лобби не найдено:', req.params.id);
    return res.status(404).json({ error: 'not found' });
  }
  
  const { playerId } = req.body || {};
  console.log('👤 Запрос от игрока:', playerId);
  console.log('👑 Создатель лобби (creatorId):', lobby.creatorId);
  
  if (!lobby.creatorId || lobby.creatorId !== playerId) {
    console.log('🚫 Доступ запрещен: только создатель может удалить лобби');
    return res.status(403).json({ error: 'only creator can delete' });
  }
  
  try {
    console.log('🗄️ Удаляем лобби из базы данных...');
    // Удаляем из базы данных (каскадно удалятся связанные записи)
    await lobbyQueries.deleteLobby(req.params.id);
    console.log('💾 Лобби удалено из базы данных');
    
    // Удаляем из памяти
    lobbies.delete(req.params.id);
    console.log('🧠 Лобби удалено из памяти');
    
    console.log('✅ Лобби успешно удалено:', req.params.id);
    res.json({ deleted: true });
  } catch (error) {
    console.error('❌ Ошибка удаления лобби:', error);
    res.status(500).json({ error: 'internal error' });
  }
});

// Health check
app.get('/ping', (_, res) => {
  res.json({ message: 'pong' });
});

// Отладочный эндпоинт для проверки лобби
app.get('/debug/lobbies', async (req, res) => {
  try {
    const dbLobbies = await lobbyQueries.getAllLobbiesDebug();
    const memoryLobbies = Array.from(lobbies.entries()).map(([id, lobby]) => ({
      id,
      players_count: lobby.players.length,
      status: lobby.status,
      created_at: new Date(lobby.createdAt).toISOString()
    }));
    
    res.json({
      database_lobbies: dbLobbies,
      memory_lobbies: memoryLobbies
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Принудительная очистка пустых лобби
app.post('/debug/cleanup', async (req, res) => {
  try {
    const deleted = await lobbyQueries.deleteEmptyLobbies();
    res.json({ deleted_count: deleted });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Топ рейтинга
app.get('/rating', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit);
    const list = await gameQueries.getTopPlayers(isNaN(limit) || limit <= 0 ? 0 : limit);
    res.json(list);
  } catch (e) {
    console.error('❌ Ошибка получения топ рейтинга:', e);
    res.status(500).json({ error: 'internal error' });
  }
});

// Профиль/рейтинг пользователя
app.get('/users/:id/stats', async (req, res) => {
  try {
    const stats = await gameQueries.getUserStats(req.params.id);
    res.json(stats);
  } catch (e) {
    console.error('❌ Ошибка чтения рейтинга:', e);
    res.status(500).json({ error: 'internal error' });
  }
});

// Получение профиля пользователя
app.get('/users/:id', async (req, res) => {
  try {
    const user = await userQueries.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name
    });
  } catch (e) {
    console.error('❌ Ошибка получения профиля пользователя:', e);
    res.status(500).json({ error: 'internal error' });
  }
});

// Получение лобби пользователя (которые он создал)
app.get('/users/:id/lobbies', async (req, res) => {
  try {
    const userLobbies = await lobbyQueries.getUserLobbies(req.params.id);
    console.log(`📋 Получены лобби пользователя ${req.params.id}:`, userLobbies);
    res.json(userLobbies);
  } catch (e) {
    console.error('❌ Ошибка получения лобби пользователя:', e);
    res.status(500).json({ error: 'internal error' });
  }
});

// Получить аватарку пользователя
app.get('/users/:id/avatar', async (req, res) => {
  try {
    const { id } = req.params;
    const avatar = await userQueries.getUserAvatar(id);
    res.json({ avatar });
  } catch (error) {
    console.error('❌ Ошибка получения аватарки пользователя:', error);
    res.status(500).json({ error: 'Failed to get user avatar' });
  }
});

// Обновить аватарку пользователя
app.post('/users/:id/avatar', async (req, res) => {
  try {
    const { id } = req.params;
    const { avatar } = req.body;
    
    if (!avatar) {
      return res.status(400).json({ error: 'Avatar is required' });
    }
    
    // Проверяем, что аватарка из допустимого списка
    const allowedAvatars = ['A1', 'A2', 'A3', 'A4', 'A5'];
    if (!allowedAvatars.includes(avatar)) {
      return res.status(400).json({ error: 'Invalid avatar' });
    }
    
    await userQueries.updateUserAvatar(id, avatar);
    console.log(`✅ Аватарка пользователя ${id} обновлена на ${avatar}`);
    res.json({ message: 'Avatar updated successfully', avatar });
  } catch (error) {
    console.error('❌ Ошибка обновления аватарки пользователя:', error);
    res.status(500).json({ error: 'Failed to update user avatar' });
  }
});

// Генерация результатов (бросок кубиков)
app.post('/games/:id/roll', async (req, res) => {
  const lobby = lobbies.get(req.params.id);
  if (!lobby) return res.status(404).json({ error: 'not found' });
  const { playerId } = req.body;
  
  // Проверяем, есть ли уже результаты для текущей игры
  if (!lobby.currentResults) {
    console.log(`🎲 Генерация результатов для лобби ${req.params.id}`);
    let results;
    let winners;
    let rerollCount = 0;
    do {
    // Генерируем уникальные результаты для каждого игрока при первом вызове
      results = lobby.players.map(p => ({
      playerId: p.id,
      playerName: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.username || 'Игрок',
        diceValue: Math.floor(Math.random() * 6) + 1
    }));
      const max = Math.max(...results.map(r => r.diceValue));
      winners = results.filter(r => r.diceValue === max);
      if (winners.length !== 1) rerollCount += 1;
    } while (winners.length !== 1 && rerollCount < 50);
    
    lobby.currentResults = results;
    lobby.winner = winners[0];
    lobby.status = 'finished';
    // Persist results and finish status
    try {
      // Users should already be registered when they first entered the app

      await gameQueries.saveGameResults(req.params.id, results.map(r => ({
        playerId: r.playerId,
        diceValue: r.diceValue,
        isWinner: r.playerId === lobby.winner.playerId
      })));
      // Применяем рейтинги (+15/-15, не ниже 0)
      await gameQueries.applyRatingResults(results.map(r => ({
        playerId: r.playerId,
        isWinner: r.playerId === lobby.winner.playerId
      })));
      await lobbyQueries.finishLobby(req.params.id);
      // Сигнал фронту обновить профиль текущего пользователя
      if (lobby.winner?.playerId) {
        try { localStorage; } catch {}
        sseBroadcast('lobby_update', { id: lobby.id, currentPlayers: lobby.players.length, status: lobby.status, statsChanged: true });
      }
    } catch (e) {
      console.error('DB error saving game results:', e);
    }
    console.log(`🏆 Результаты игры в лобби ${req.params.id}:`, lobby.currentResults);
    return res.json({ results: lobby.currentResults, winner: lobby.winner, tieResolved: rerollCount > 0, rerollCount });
  } else {
    console.log(`🎲 Возвращаем существующие результаты для лобби ${req.params.id}`);
  }
  
  res.json({ results: lobby.currentResults, winner: lobby.winner, tieResolved: false, rerollCount: 0 });
});

// Запрос на повторную игру
app.post('/games/:id/play-again', (req, res) => {
  const lobby = lobbies.get(req.params.id);
  if (!lobby) return res.status(404).json({ error: 'not found' });
  const { playerId } = req.body;

  // Обновить онлайн-флаги (без удаления)
  purgeOfflinePlayers(lobby);

  // Если кто-то уже вернулся в лобби (не в экране игры) — нельзя начинать без него
  const leftPlayer = lobby.players.find(p => p.screen && p.screen !== 'game');
  if (leftPlayer) {
    // Сбрасываем возможную предыдущую готовность
    lobby.playAgain = new Set();
    delete lobby.playAgainDeclinedBy;
    delete lobby.playAgainInitiator;
    return res.json({
      status: 'player_left',
      allReady: false,
      message: `Игрок ${`${leftPlayer.first_name || ''} ${leftPlayer.last_name || ''}`.trim() || leftPlayer.username || 'Игрок'} вышел в лобби`,
      waitingFor: lobby.players,
      readyPlayers: []
    });
  }

  // Если кто-то вышел и игроков меньше максимума — не даем начать повторную игру
  if (lobby.players.length < lobby.maxPlayers) {
    const leftName = lobby.lastPlayerLeft?.username || 'один из игроков';
    return res.json({
      status: 'player_left',
      allReady: false,
      message: `Игрок ${leftName} вышел из лобби`,
      waitingFor: lobby.players
    });
  }

  // Проверяем, что игрок, который делает запрос, существует в лобби
  const requestingPlayer = lobby.players.find(p => p.id === playerId);
  if (!requestingPlayer) {
    return res.status(400).json({ error: 'player not found in lobby' });
  }

  if (!lobby.playAgain) lobby.playAgain = new Set();
  // Начинается новый цикл "играть снова" — очищаем предыдущее отклонение
  delete lobby.playAgainDeclinedBy;
  if (lobby.playAgain.size === 0) {
    lobby.playAgainInitiator = playerId;
  }
  lobby.playAgain.add(playerId);
  const allReady = lobby.playAgain.size === lobby.players.length;
  if (allReady) {
    lobby.status = 'playing';
    lobby.currentResults = null; // Сбрасываем результаты для новой игры
    lobby.winner = null;
    lobby.playAgain = new Set(); // reset
    delete lobby.playAgainInitiator;
    // Сбрасываем готовность игроков для следующей игры
    lobby.players.forEach(p => p.isReady = false);
  }
  
  // Формируем список ожидающих игроков
  const waitingPlayers = lobby.players.filter(p => !lobby.playAgain.has(p.id));
  const readyPlayers = lobby.players.filter(p => lobby.playAgain.has(p.id));
  
  res.json({
    status: allReady ? 'ready_to_play' : 'waiting',
    allReady,
    message: allReady ? 'Все игроки готовы!' : `Ожидаем готовность: ${waitingPlayers.map(p => `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.username || 'Игрок').join(', ')}`,
    waitingFor: waitingPlayers,
    readyPlayers
  });
});

// Отклонение запроса на повторную игру
app.post('/games/:id/decline-play-again', (req, res) => {
  const lobby = lobbies.get(req.params.id);
  if (!lobby) return res.status(404).json({ error: 'not found' });
  const { playerId } = req.body;
  const player = lobby.players.find(p => p.id === playerId);
  if (!player) return res.status(400).json({ error: 'player not found' });
  if (!lobby.playAgain || lobby.playAgain.size === 0) return res.status(400).json({ error: 'no active request' });
  lobby.playAgainDeclinedBy = playerId;
  lobby.playAgain.clear();
  delete lobby.playAgainInitiator;
  lobby.status = 'finished';
  
  res.json({ status: 'declined' });
});

// Получить статус повторной игры
app.get('/games/:id/play-again-status', (req, res) => {
  const lobby = lobbies.get(req.params.id);
  if (!lobby) return res.status(404).json({ error: 'not found' });
  
  // Обновить онлайн-флаги (без удаления)
  purgeOfflinePlayers(lobby);
  
  // Если кто-то вышел — сообщаем об этом
  if (lobby.players.length < lobby.maxPlayers) {
    const leftName = lobby.lastPlayerLeft?.username || 'один из игроков';
    return res.json({
      readyPlayers: [],
      waitingFor: lobby.players,
      allReady: false,
      totalPlayers: lobby.players.length,
      status: 'player_left',
      message: `Игрок ${leftName} вышел из лобби`
    });
  }

  // Если хотя бы один игрок не в экране игры — блокируем повторный старт и уведомляем
  const leftPlayer = lobby.players.find(p => p.screen && p.screen !== 'game');
  if (leftPlayer) {
    // Сбрасываем возможные прошлые отметки готовности, чтобы не слать приглашения
    if (lobby.playAgain && lobby.playAgain instanceof Set) lobby.playAgain.clear();
    delete lobby.playAgainDeclinedBy;
    delete lobby.playAgainInitiator;
    return res.json({
      readyPlayers: [],
      waitingFor: lobby.players,
      allReady: false,
      totalPlayers: lobby.players.length,
      status: 'player_left',
      message: `Игрок ${`${leftPlayer.first_name || ''} ${leftPlayer.last_name || ''}`.trim() || leftPlayer.username || 'Игрок'} вышел в лобби`
    });
  }

  if (lobby.playAgainDeclinedBy) {
    const decliner = lobby.players.find(p => p.id === lobby.playAgainDeclinedBy);
    const initiator = lobby.playAgainInitiator ? lobby.players.find(p => p.id === lobby.playAgainInitiator) : null;
    return res.json({
      status: 'declined',
      decliner,
      initiator,
      message: `Игрок отклонил ваше предложение сыграть снова`,
      allReady: false,
      readyPlayers: [],
      waitingFor: []
    });
  }
  // Формируем списки игроков
  const readyPlayers = lobby.players.filter(p => lobby.playAgain?.has(p.id));
  const waitingFor = lobby.players.filter(p => !lobby.playAgain?.has(p.id));
  const allReady = readyPlayers.length === lobby.players.length;
  
  const initiator = lobby.playAgainInitiator ? lobby.players.find(p => p.id === lobby.playAgainInitiator) : null;
  // Если все готовы, устанавливаем статус playing
  if (allReady && lobby.status !== 'playing') {
    lobby.status = 'playing';
    sseBroadcast('lobby_update', { id: lobby.id, currentPlayers: lobby.players.length, status: lobby.status });
  }
  
  res.json({
    readyPlayers,
    waitingFor,
    allReady,
    initiator,
    totalPlayers: lobby.players.length,
    status: lobby.status === 'playing' ? 'ready_to_play' : 'waiting'
  });
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // После старта сервера загружаем лобби из БД
  loadLobbiesFromDatabase();
  console.log('ℹ️ Ensure DB file exists at:', require('path').join(__dirname, 'game.db'));
});
