# Исправление ошибок прокси Vite

## Проблема
Приложение выдавало ошибки вида:
```
AggregateError 
     at internalConnectMultiple (node:net:1114:18) 
     at afterConnectMultiple (node:net:1667:5) 
 [vite] http proxy error: /games/df253381-5daf-42cd-8a89-d40732b66ae1
```

## Причина
Vite был настроен на проксирование запросов к `/games/*` на backend сервер по адресу `http://localhost:4000`, но сервер не был запущен.

## Решение
1. **Запущен backend сервер на порту 4000**:
   ```bash
   cd server
   npm install
   npm run dev
   ```

2. **Vite прокси настроен в vite.config.ts**:
   ```typescript
   proxy: {
     '/games': {
       target: 'http://localhost:4000',
       changeOrigin: true,
       secure: false,
     },
     '/ping': {
       target: 'http://localhost:4000',
       changeOrigin: true,
       secure: false,
     }
   }
   ```

3. **API конфигурация использует правильный base URL**:
   - В режиме localhost: `http://localhost:4000`
   - В режиме production: пустая строка (относительные пути через прокси)

## Результат
✅ Ошибки прокси устранены
✅ Backend сервер доступен на http://localhost:4000
✅ Frontend корректно проксирует запросы к API