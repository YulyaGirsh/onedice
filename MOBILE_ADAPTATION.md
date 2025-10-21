# 📱 Адаптация для мобильных устройств

## 🎯 Проблема

На мобильных устройствах Telegram Mini Apps могут перекрываться системными элементами:
- **Верхняя панель** (статус бар, время, батарея)
- **Нижняя панель** (навигация, жесты)
- **Кнопки Telegram** (MainButton, SecondaryButton)

## ✅ Решение

### 1. Viewport настройки

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" />
```

- `viewport-fit=cover` - использует весь экран
- `user-scalable=no` - отключает масштабирование

### 2. Безопасные зоны (Safe Areas)

```css
:root {
  --safe-area-inset-top: env(safe-area-inset-top);
  --safe-area-inset-bottom: env(safe-area-inset-bottom);
  --safe-area-inset-left: env(safe-area-inset-left);
  --safe-area-inset-right: env(safe-area-inset-right);
}
```

### 3. Применение безопасных зон

```css
body {
  padding-top: var(--safe-area-inset-top, 0px);
  padding-bottom: var(--safe-area-inset-bottom, 0px);
  padding-left: var(--safe-area-inset-left, 0px);
  padding-right: var(--safe-area-inset-right, 0px);
}
```

### 4. Настройка Telegram Web App

```typescript
// Инициализация
WebApp.ready()
WebApp.expand()

// Настройка цветов
WebApp.setHeaderColor('#2481cc')
WebApp.setBackgroundColor('#ffffff')
```

## 📐 Рекомендации по дизайну

### Размеры элементов
- **Минимальная высота кнопок**: 44px
- **Отступы между элементами**: 16px
- **Размер шрифта**: минимум 16px

### Позиционирование
- **MainButton**: автоматически позиционируется внизу
- **SecondaryButton**: автоматически позиционируется внизу
- **Контент**: должен иметь отступы от краев экрана

### Цвета и контраст
- Используйте цвета, соответствующие теме Telegram
- Обеспечьте достаточный контраст для читаемости
- Адаптируйтесь под светлую/темную тему

## 🔧 Технические детали

### CSS переменные для безопасных зон
```css
.container {
  padding-bottom: calc(1rem + var(--safe-area-inset-bottom, 0px));
}
```

### Медиа-запросы для мобильных
```css
@media (max-width: 768px) {
  .container {
    padding: 0.5rem;
    padding-bottom: calc(0.5rem + var(--safe-area-inset-bottom, 0px));
  }
}
```

### Предотвращение скролла на iOS
```css
body {
  position: fixed;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#root {
  overflow-y: auto;
  overflow-x: hidden;
}
```

## 📱 Тестирование

### На реальных устройствах
1. **iPhone** - проверьте notch и home indicator
2. **Android** - проверьте navigation bar и status bar
3. **Планшеты** - проверьте landscape и portrait режимы

### В браузере
1. Откройте DevTools (F12)
2. Включите мобильную эмуляцию
3. Выберите устройство (iPhone, Android)
4. Проверьте безопасные зоны

## 🎨 Примеры кода

### Адаптивный контейнер
```tsx
<div 
  className="container"
  style={{
    paddingBottom: `calc(1rem + ${WebApp.viewportStableHeight ? 'env(safe-area-inset-bottom)' : '0px'})`
  }}
>
  {/* Контент */}
</div>
```

### Адаптивные кнопки
```tsx
<MainButton
  text="Отправить"
  onClick={handleSend}
  style={{
    marginBottom: 'env(safe-area-inset-bottom)'
  }}
/>
```

## ⚠️ Важные замечания

1. **Всегда тестируйте** на реальных устройствах
2. **Используйте безопасные зоны** для отступов
3. **Не полагайтесь** только на эмуляцию браузера
4. **Учитывайте** разные размеры экранов
5. **Проверяйте** работу в landscape режиме

---

**Теперь ваше приложение будет корректно отображаться на всех мобильных устройствах! 📱** 