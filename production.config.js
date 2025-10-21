// Production Configuration for OneDice
module.exports = {
  // Server Configuration
  server: {
    port: process.env.PORT || 4000,
    host: '0.0.0.0',
    cors: {
      origin: ['https://onedice.ru', 'https://www.onedice.ru'],
      credentials: true
    }
  },

  // Database Configuration
  database: {
    path: './server/game.db',
    options: {
      busyTimeout: 30000,
      journalMode: 'DELETE',
      foreignKeys: true
    }
  },

  // Frontend Configuration
  frontend: {
    buildPath: './dist',
    staticPath: './public',
    apiBaseUrl: 'https://onedice.ru/api'
  },

  // Telegram Bot Configuration
  telegram: {
    botToken: process.env.BOT_TOKEN,
    webAppUrl: 'https://onedice.ru',
    channelUrl: 'https://t.me/onedices',
    chatUrl: 'https://t.me/myonedice'
  },

  // SSL Configuration (if using HTTPS)
  ssl: {
    enabled: true,
    certPath: process.env.SSL_CERT_PATH || '/etc/ssl/certs/onedice.ru.crt',
    keyPath: process.env.SSL_KEY_PATH || '/etc/ssl/private/onedice.ru.key'
  }
};
