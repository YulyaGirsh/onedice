const Database = require('better-sqlite3');
const db = new Database('game.db');

// Вставка тестового пользователя 2
const insertUser2 = db.prepare('INSERT OR IGNORE INTO users (id, first_name, last_name, username, last_seen) VALUES (?, ?, ?, ?, ?)');
insertUser2.run('testuser2', 'Test', 'User2', 'testuser2', Date.now());
const insertStats2 = db.prepare('INSERT OR IGNORE INTO user_stats (user_id, rating, games_played, games_won) VALUES (?, ?, ?, ?)');
insertStats2.run('testuser2', 1800, 30, 15);

// Вставка тестового пользователя 3
const insertUser3 = db.prepare('INSERT OR IGNORE INTO users (id, first_name, last_name, username, last_seen) VALUES (?, ?, ?, ?, ?)');
insertUser3.run('testuser3', 'Test', 'User3', 'testuser3', Date.now());
const insertStats3 = db.prepare('INSERT OR IGNORE INTO user_stats (user_id, rating, games_played, games_won) VALUES (?, ?, ?, ?)');
insertStats3.run('testuser3', 1600, 25, 12);

console.log('Тестовые пользователи добавлены');