const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Путь к базе данных
const dbPath = path.join(__dirname, 'game.db');

// Создание/открытие базы данных
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Ошибка подключения к SQLite:', err.message);
  } else {
    // Глобальный таймаут ожидания освобождения блокировки
    try {
      // node-sqlite3 поддерживает конфигурацию busyTimeout
      db.configure && db.configure('busyTimeout', 30000);
      console.log('✅ SQLite busyTimeout установлен через db.configure (30 секунд)');
    } catch (e) {
      console.warn('⚠️ Не удалось применить db.configure("busyTimeout"):', e?.message);
    }
    console.log('✅ Подключение к SQLite установлено');
    initDatabase();
  }
});

// Инициализация схемы базы данных
function initDatabase() {
  // Используем DELETE режим журнала вместо WAL для избежания блокировок
  db.run('PRAGMA journal_mode = DELETE;', (err) => {
    if (err) {
      console.error('❌ Ошибка установки journal mode: ' + err.message);
    } else {
      console.log('✅ Journal mode установлен (DELETE)');
    }
  });

  // Включаем поддержку внешних ключей
  db.run('PRAGMA foreign_keys = ON;', (err) => {
    if (err) {
      console.error('❌ Ошибка включения foreign keys:', err.message);
    } else {
      console.log('✅ Foreign keys включены');
    }
  });

  // Увеличиваем timeout для занятой БД
  db.run('PRAGMA busy_timeout = 30000;', (err) => {
    if (err) {
      console.error('❌ Ошибка установки busy_timeout:', err.message);
    } else {
      console.log('✅ Busy timeout установлен (30 секунд)');
    }
  });

  // Таблица для пользователей
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      avatar TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('❌ Ошибка создания таблицы users:', err.message);
    } else {
      console.log('✅ Таблица users готова');
      // Добавляем колонку avatar если она не существует (для обновления существующих баз)
      db.run('ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT NULL', () => {});
    }
  });

  // Таблица статистики пользователей (рейтинг и победы)
  db.run(`
    CREATE TABLE IF NOT EXISTS user_stats (
      user_id TEXT PRIMARY KEY,
      rating INTEGER NOT NULL DEFAULT 0,
      games_played INTEGER NOT NULL DEFAULT 0,
      games_won INTEGER NOT NULL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('❌ Ошибка создания таблицы user_stats:', err.message);
    } else {
      console.log('✅ Таблица user_stats готова');
    }
  });

  // Таблица для лобби
  db.run(`
    CREATE TABLE IF NOT EXISTS lobbies (
      id TEXT PRIMARY KEY,
      creator_id TEXT NOT NULL,
      creator_first_name TEXT,
      creator_last_name TEXT,
      type TEXT NOT NULL CHECK (type IN ('duel', 'lobby')),
      bet REAL NOT NULL DEFAULT 0,
      is_public BOOLEAN NOT NULL DEFAULT 0,
      open_profile BOOLEAN NOT NULL DEFAULT 1,
      max_players INTEGER NOT NULL,
      current_players INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'ready', 'playing', 'finished')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      finished_at DATETIME,
      FOREIGN KEY (creator_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('❌ Ошибка создания таблицы lobbies:', err.message);
    } else {
      console.log('✅ Таблица lobbies готова');
      // Добавляем колонки если они не существуют (для обновления существующих баз)
      db.run('ALTER TABLE lobbies ADD COLUMN creator_first_name TEXT', () => {});
      db.run('ALTER TABLE lobbies ADD COLUMN creator_last_name TEXT', () => {});
      db.run('ALTER TABLE lobbies ADD COLUMN current_players INTEGER DEFAULT 0', () => {});
    }
  });

  // Таблица для участников лобби
  db.run(`
    CREATE TABLE IF NOT EXISTS lobby_players (
      lobby_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('creator', 'player')),
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_ready BOOLEAN DEFAULT 0,
      left_at DATETIME,
      PRIMARY KEY (lobby_id, player_id),
      FOREIGN KEY (lobby_id) REFERENCES lobbies (id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('❌ Ошибка создания таблицы lobby_players:', err.message);
    } else {
      console.log('✅ Таблица lobby_players готова');
    }
  });

  // Таблица для результатов игр
  db.run(`
    CREATE TABLE IF NOT EXISTS game_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lobby_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      dice_value INTEGER NOT NULL,
      is_winner BOOLEAN NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lobby_id) REFERENCES lobbies (id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('❌ Ошибка создания таблицы game_results:', err.message);
    } else {
      console.log('✅ Таблица game_results готова');
    }
  });
}

// Утилита для повторных попыток при SQLITE_BUSY
function retryOnBusy(operation, maxRetries = 3, delay = 100) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    function attempt() {
      attempts++;
      operation()
        .then(resolve)
        .catch(err => {
          if (err && err.code === 'SQLITE_BUSY' && attempts < maxRetries) {
            console.log(`⚠️ База данных занята, повторная попытка ${attempts}/${maxRetries} через ${delay}мс`);
            setTimeout(attempt, delay * attempts);
          } else {
            reject(err);
          }
        });
    }

    attempt();
  });
}

// Вспомогательные функции для работы с пользователями
const userQueries = {
  // Создать или обновить пользователя
  upsertUser(userId, firstName = null, lastName = null, telegramUsername = null) {
    const operation = () => new Promise((resolve, reject) => {
      // Формируем username из доступных данных, приоритизируя полное имя
      let username = '';
      
      // Приоритет 1: Полное имя (firstName + lastName)
      if (firstName || lastName) {
        username = `${firstName || ''} ${lastName || ''}`.trim();
      }
      // Приоритет 2: telegramUsername
      else if (telegramUsername) {
        username = telegramUsername;
      }
      // Приоритет 3: fallback
      else {
        username = 'anonymous';
      }
      
      console.log(`📝 Формирование username для пользователя ${userId}:`, {
        firstName,
        lastName,
        telegramUsername,
        resultUsername: username
      });
      
      const stmt = db.prepare(`
        INSERT INTO users (id, first_name, last_name, username, last_seen)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          first_name = excluded.first_name,
          last_name = excluded.last_name,
          username = excluded.username,
          last_seen = CURRENT_TIMESTAMP
      `);

      stmt.run([userId, firstName, lastName, username], function(err) {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          // Создаем запись в user_stats, если её нет
          db.run('INSERT OR IGNORE INTO user_stats (user_id) VALUES (?)', [userId], (e) => {
            if (e) console.warn('⚠️ Не удалось создать user_stats:', e.message);
            resolve(this.lastID);
          });
        }
      });
    });

    return retryOnBusy(operation);
  },

  // Получить пользователя по ID
  getUser(userId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  // Обновить время последней активности
  updateLastSeen(userId) {
    const operation = () => new Promise((resolve, reject) => {
      const stmt = db.prepare('UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?');
      stmt.run([userId], function(err) {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
    return retryOnBusy(operation);
  },

  // Обновить аватарку пользователя
  updateUserAvatar(userId, avatar) {
    const operation = () => new Promise((resolve, reject) => {
      const stmt = db.prepare('UPDATE users SET avatar = ? WHERE id = ?');
      stmt.run([avatar, userId], function(err) {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
    return retryOnBusy(operation);
  },

  // Обновить профиль пользователя (имя и аватар)
  updateUserProfile(userId, username, avatar) {
    const operation = () => new Promise((resolve, reject) => {
      const stmt = db.prepare('UPDATE users SET username = ?, avatar = ? WHERE id = ?');
      stmt.run([username, avatar, userId], function(err) {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
    return retryOnBusy(operation);
  },

  // Получить аватарку пользователя
  getUserAvatar(userId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT avatar FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? row.avatar : null);
        }
      });
    });
  }
};

// Вспомогательные функции для работы с лобби
const lobbyQueries = {
  // Создать лобби
  async createLobby(lobbyData) {
    const operation = () => new Promise((resolve, reject) => {
      const { id, creator_id, type, bet, is_public, open_profile, max_players, creator_first_name = null, creator_last_name = null } = lobbyData;

      const stmt = db.prepare(`
        INSERT INTO lobbies (id, creator_id, type, bet, is_public, open_profile, max_players, creator_first_name, creator_last_name, current_players)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `);

      stmt.run([id, creator_id, type, bet, is_public ? 1 : 0, open_profile ? 1 : 0, max_players, creator_first_name, creator_last_name], function(err) {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });

    await retryOnBusy(operation);
    // Добавляем создателя как игрока в лобби
    await this.addPlayerToLobby(lobbyData.id, lobbyData.creator_id, 'creator');
  },

  // Добавить игрока в лобби
  async addPlayerToLobby(lobbyId, playerId, role = 'player') {
    const operation = () => new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO lobby_players (lobby_id, player_id, role, joined_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `);

      stmt.run([lobbyId, playerId, role], function(err) {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });

    await retryOnBusy(operation);
    // Обновляем количество игроков после добавления
    await this.updatePlayerCount(lobbyId);
  },

  // Удалить игрока из лобби (пометить как покинувший)
  async removePlayerFromLobby(lobbyId, playerId) {
    const operation = () => new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        UPDATE lobby_players 
        SET left_at = CURRENT_TIMESTAMP 
        WHERE lobby_id = ? AND player_id = ? AND left_at IS NULL
      `);

      stmt.run([lobbyId, playerId], function(err) {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });

    await retryOnBusy(operation);
    // Обновляем количество игроков после удаления
    await this.updatePlayerCount(lobbyId);
    // Удаляем лобби, если оно стало пустым, и возвращаем результат
    const deleteResult = await this.deleteEmptyLobbies();
    return deleteResult;
  },

  // Получить лобби пользователя (которые он создал)
  getUserLobbies(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM lobbies WHERE creator_id = ? ORDER BY created_at DESC',
        [userId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  },

  // Удалить лобби (с каскадным удалением связанных записей)
  deleteLobby(lobbyId) {
    const operation = () => new Promise((resolve, reject) => {
      // Благодаря ON DELETE CASCADE, удаление лобби автоматически удалит связанные записи
      const stmt = db.prepare('DELETE FROM lobbies WHERE id = ?');
      stmt.run([lobbyId], function(err) {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });

    return retryOnBusy(operation);
  },

  // Обновить количество игроков в лобби
  updatePlayerCount(lobbyId) {
    const operation = () => new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        UPDATE lobbies 
        SET current_players = (
          SELECT COUNT(*) 
          FROM lobby_players 
          WHERE lobby_id = ? AND left_at IS NULL
        )
        WHERE id = ?
      `);

      stmt.run([lobbyId, lobbyId], function(err) {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });

    return retryOnBusy(operation);
  },

  // Удалить пустые лобби (с 0 игроков)
  async deleteEmptyLobbies() {
    // Сначала получим ID лобби, которые будут удалены
    const checkOperation = () => new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        SELECT id, current_players, status, created_at 
        FROM lobbies 
        WHERE current_players = 0 
        AND status IN ('waiting', 'ready')
      `);

      stmt.all([], function(err, rows) {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    const candidatesForDeletion = await retryOnBusy(checkOperation);
    console.log(`🔍 Найдено ${candidatesForDeletion.length} пустых лобби для удаления:`, candidatesForDeletion);

    if (candidatesForDeletion.length === 0) {
      return { deletedCount: 0, deletedIds: [] };
    }

    const deletedIds = candidatesForDeletion.map(lobby => lobby.id);

    const operation = () => new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        DELETE FROM lobbies 
        WHERE current_players = 0 
        AND status IN ('waiting', 'ready')
      `);

      stmt.run([], function(err) {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          console.log(`🗑️ Удалено ${this.changes} пустых лобби`);
          resolve(this.changes);
        }
      });
    });

    const deletedCount = await retryOnBusy(operation);
    return { deletedCount, deletedIds };
  },

  // Получить все лобби для отладки
  async getAllLobbiesDebug() {
    const operation = () => new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        SELECT l.id, l.current_players, l.status, l.created_at,
               COUNT(lp.player_id) as actual_players
        FROM lobbies l
        LEFT JOIN lobby_players lp ON l.id = lp.lobby_id AND lp.left_at IS NULL
        GROUP BY l.id
        ORDER BY l.created_at DESC
      `);

      stmt.all([], function(err, rows) {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    return retryOnBusy(operation);
  },

  // Обновить статус лобби
  updateLobbyStatus(lobbyId, status) {
    const operation = () => new Promise((resolve, reject) => {
      const stmt = db.prepare('UPDATE lobbies SET status = ? WHERE id = ?');
      stmt.run([status, lobbyId], function(err) {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
    return retryOnBusy(operation);
  },

  // Установить время завершения игры
  finishLobby(lobbyId) {
    const operation = () => new Promise((resolve, reject) => {
      const stmt = db.prepare('UPDATE lobbies SET status = ?, finished_at = CURRENT_TIMESTAMP WHERE id = ?');
      stmt.run(['finished', lobbyId], function(err) {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
    return retryOnBusy(operation);
  },

  updatePlayerReady(lobbyId, playerId, isReady) {
    const operation = () => new Promise((resolve, reject) => {
      const stmt = db.prepare('UPDATE lobby_players SET is_ready = ? WHERE lobby_id = ? AND player_id = ? AND left_at IS NULL');
      stmt.run([isReady ? 1 : 0, lobbyId, playerId], function(err) {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
    return retryOnBusy(operation);
  },

  // Получить все лобби с игроками из базы данных
  getAllLobbiesWithPlayers() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          l.*,
          lp.player_id,
          lp.role,
          lp.joined_at as player_joined_at,
          lp.is_ready,
          u.first_name,
          u.last_name,
          u.username
        FROM lobbies l
        LEFT JOIN lobby_players lp ON l.id = lp.lobby_id AND lp.left_at IS NULL
        LEFT JOIN users u ON lp.player_id = u.id
        WHERE l.status IN ('waiting', 'ready', 'playing')
        ORDER BY l.created_at DESC, lp.joined_at ASC
      `;
      
      db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Группируем результаты по лобби
          const lobbiesMap = new Map();
          
          rows.forEach(row => {
            if (!lobbiesMap.has(row.id)) {
              lobbiesMap.set(row.id, {
                id: row.id,
                type: row.type,
                bet: row.bet,
                isPublic: Boolean(row.is_public),
                openProfile: Boolean(row.open_profile),
                creatorId: row.creator_id,
                creatorFirstName: row.creator_first_name || null,
                creatorLastName: row.creator_last_name || null,
                maxPlayers: row.max_players,
                status: row.status,
                createdAt: new Date(row.created_at).getTime(),
                players: []
              });
            }
            
            const lobby = lobbiesMap.get(row.id);
            if (row.player_id) {
              // Формируем полное имя из first_name и last_name
              let displayName = 'anonymous';
              if (row.first_name && row.last_name) {
                displayName = `${row.first_name} ${row.last_name}`;
              } else if (row.first_name) {
                displayName = row.first_name;
              } else if (row.last_name) {
                displayName = row.last_name;
              }
              
              lobby.players.push({
                id: row.player_id,
                username: displayName,
                role: row.role,
                joinedAt: new Date(row.player_joined_at).getTime(),
                isReady: row.role === 'creator' ? true : Boolean(row.is_ready), // Создатель всегда готов
                online: true // По умолчанию считаем онлайн
              });
            }
          });
          
          resolve(Array.from(lobbiesMap.values()));
        }
      });
    });
  }
};

// Вспомогательные функции для работы с результатами игр
const gameQueries = {
  // Сохранить результаты игры
  saveGameResults(lobbyId, results) {
    console.log(`💾 Сохраняем результаты игры для лобби ${lobbyId}:`, results);
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO game_results (lobby_id, player_id, dice_value, is_winner)
        VALUES (?, ?, ?, ?)
      `);

      db.serialize(() => {
        db.run('BEGIN TRANSACTION', (err) => {
          if (err) {
            console.error(`❌ Ошибка начала транзакции для лобби ${lobbyId}:`, err);
            stmt.finalize();
            return reject(err);
          }

          let pendingInserts = results.length;
          let hasError = false;

          results.forEach(result => {
            stmt.run([
              lobbyId,
              result.playerId,
              result.diceValue,
              result.isWinner ? 1 : 0
            ], (err) => {
              if (err && !hasError) {
                hasError = true;
                console.error(`❌ Ошибка вставки результата для игрока ${result.playerId}:`, err);
                db.run('ROLLBACK');
                stmt.finalize();
                return reject(err);
              }

              pendingInserts--;
              if (pendingInserts === 0 && !hasError) {
                db.run('COMMIT', (commitErr) => {
                  stmt.finalize();
                  if (commitErr) {
                    console.error(`❌ Ошибка коммита для лобби ${lobbyId}:`, commitErr);
                    reject(commitErr);
                  } else {
                    console.log(`✅ Результаты игры успешно сохранены для лобби ${lobbyId}`);
                    resolve(true);
                  }
                });
              }
            });
          });
        });
      });
    });
  },

  // Обновить рейтинг после игры: +15 победителю, -15 проигравшему (не ниже 0)
  applyRatingResults(results) {
    console.log('📈 Применяем изменения рейтинга:', results);
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        UPDATE user_stats
        SET 
          rating = MAX(0, rating + ?),
          games_played = games_played + 1,
          games_won = games_won + CASE WHEN ? > 0 THEN 1 ELSE 0 END,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `);

      db.serialize(() => {
        db.run('BEGIN TRANSACTION', (err) => {
          if (err) {
            console.error('❌ Ошибка начала транзакции рейтинга:', err);
            stmt.finalize();
            return reject(err);
          }

          let pendingUpdates = results.length;
          let hasError = false;

          results.forEach(r => {
            const delta = r.isWinner ? 15 : -15;
            console.log(`📊 Обновляем рейтинг для ${r.playerId}: ${delta > 0 ? '+' : ''}${delta}`);
            
            stmt.run([delta, delta, r.playerId], function(err) {
              if (err && !hasError) {
                hasError = true;
                console.error(`❌ Ошибка обновления рейтинга для пользователя ${r.playerId}:`, err);
                db.run('ROLLBACK');
                stmt.finalize();
                return reject(err);
              }

              if (this.changes === 0) {
                console.warn(`⚠️ Не найден пользователь в user_stats: ${r.playerId}`);
              } else {
                console.log(`✅ Рейтинг обновлен для ${r.playerId}, изменено строк: ${this.changes}`);
              }

              pendingUpdates--;
              if (pendingUpdates === 0 && !hasError) {
                db.run('COMMIT', (commitErr) => {
                  stmt.finalize();
                  if (commitErr) {
                    console.error('❌ Ошибка коммита рейтинга:', commitErr);
                    reject(commitErr);
                  } else {
                    console.log('✅ Рейтинг успешно обновлен для всех игроков');
                    resolve(true);
                  }
                });
              }
            });
          });
        });
      });
    });
  },

  // Получить статистику пользователя
  getUserStats(userId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT rating, games_played as gamesPlayed, games_won as gamesWon FROM user_stats WHERE user_id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row || { rating: 0, gamesPlayed: 0, gamesWon: 0 });
      });
    });
  },
  
  // Получить топ игроков по рейтингу
  getTopPlayers(limit) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          u.id,
          u.first_name, 
          u.last_name, 
          u.username,
          s.rating, 
          s.games_played as gamesPlayed, 
          s.games_won as gamesWon
        FROM user_stats s
        JOIN users u ON s.user_id = u.id
        WHERE s.games_played > 0
        ORDER BY s.rating DESC
      `;
      const params = [];
      if (limit > 0) {
        query += ' LIMIT ?';
        params.push(limit);
      }
      db.all(query, params, (err, rows) => {
        if (err) {
          console.error('❌ Ошибка получения топ игроков:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  },

  // Получить историю игр пользователя
  getUserGameHistory(userId, limit = 10) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          gr.lobby_id,
          gr.dice_value,
          gr.is_winner,
          gr.created_at,
          l.bet,
          l.type
        FROM game_results gr
        JOIN lobbies l ON gr.lobby_id = l.id
        WHERE gr.player_id = ?
        ORDER BY gr.created_at DESC
        LIMIT ?
      `, [userId, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
};

module.exports = {
  db,
  userQueries,
  lobbyQueries,
  gameQueries
};