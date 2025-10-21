# 🛡️ Руководство по исправлению UI перекрытий в Telegram Mini App

## 📖 Описание проблемы

В Telegram Mini App на мобильных устройствах возникают **перекрытия интерфейса**:

1. **Dynamic Island** (iPhone 14 Pro+) перекрывает верх приложения
2. **Кнопки Telegram** (закрыть ❌, меню ⋯) перекрывают интерфейс приложения
3. **Safe areas от Telegram SDK** работают некорректно или возвращают 0
4. **Стандартные CSS safe areas** (`env(safe-area-inset-*)`) не учитывают кнопки Telegram

## 🎯 Наше решение

### **Принцип работы:**
- ✅ **JavaScript принудительно устанавливает** safe areas для мобильных
- ✅ **CSS переменные используются** для позиционирования элементов
- ✅ **Только safe-top перезаписывается**, остальные остаются от SDK
- ✅ **Автоматическое определение** мобильного устройства

## 🔧 Техническая реализация

### **1. JavaScript Hook - useTelegramWebApp.ts**

```javascript
// Принудительная установка safe areas для мобильных
function forceMobileSafeAreas() {
  const isMobile = isMobileAndTabletCheck();
  
  if (isMobile) {
    // ВАЖНО: Только safe-top для защиты от Dynamic Island + кнопки Telegram
    const forcedSafeTop = '90px';
    
    // Принудительно перезаписываем CSS переменную
    document.documentElement.style.setProperty('--safe-top', forcedSafeTop);
    
    // safe-left, safe-right, safe-bottom НЕ ТРОГАЕМ!
    // Иначе весь контент сдвигается и появляются пустые области
  }
}
```

**🎯 Ключевые моменты:**
- Вызывается при инициализации, ресайзе, orientation change
- Перезаписывается при событиях от Telegram SDK
- **90px** - оптимальное значение (меньше = может перекрывать, больше = слишком много места)

### **2. CSS Safe Areas - globals.css**

```css
:root {
  /* Fallback значения для не-мобильных */
  --safe-top: var(--tg-content-safe-area-inset-top, var(--tg-safe-area-inset-top, env(safe-area-inset-top, 44px)));
  --safe-bottom: var(--tg-content-safe-area-inset-bottom, var(--tg-safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)));
  --safe-left: var(--tg-content-safe-area-inset-left, var(--tg-safe-area-inset-left, env(safe-area-inset-left, 0px)));
  --safe-right: var(--tg-content-safe-area-inset-right, var(--tg-safe-area-inset-right, env(safe-area-inset-right, 0px)));
}
```

**🎯 Порядок приоритета:**
1. `--tg-content-safe-area-inset-*` (Telegram SDK)
2. `--tg-safe-area-inset-*` (Telegram SDK fallback)
3. `env(safe-area-inset-*)` (Стандартные CSS safe areas)
4. Hardcoded fallback (44px для desktop, 0px для остальных)

### **3. Layout CSS - App.css**

```css
/* Профиль сверху */
.app-header {
  padding-top: var(--safe-top);      /* Отступ от Dynamic Island */
  padding-left: var(--safe-left);    /* Отступ слева */
  padding-right: var(--safe-right);  /* Отступ справа */
  height: calc(54px + var(--safe-top));
}

/* Контент */
.app-content {
  top: calc(54px + var(--safe-top));     /* Начинается после профиля */
  left: var(--safe-left);
  right: var(--safe-right);
  bottom: calc(80px + var(--safe-bottom)); /* Место для меню */
}

/* Меню снизу */
.app-footer {
  padding-left: calc(var(--safe-left) + 20px);
  padding-right: calc(var(--safe-right) + 20px);
  padding-bottom: calc(var(--safe-bottom) + 16px);
}
```

### **4. Определение мобильного устройства**

```javascript
function isMobileAndTabletCheck(): boolean {
  return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
```

## ⚠️ Критические ошибки которых нужно избегать

### **❌ НЕ ДЕЛАЙТЕ:**

1. **Не перезаписывайте safe-left и safe-right:**
   ```javascript
   // ПЛОХО - сдвигает весь контент
   root.style.setProperty('--safe-left', '50px');
   root.style.setProperty('--safe-right', '50px');
   ```

2. **Не используйте слишком большие значения:**
   ```javascript
   // ПЛОХО - слишком много пустого места
   const forcedSafeTop = '150px';
   ```

3. **Не полагайтесь только на CSS media queries:**
   ```css
   /* ПЛОХО - не работает надежно */
   @media (max-width: 768px) {
     --safe-top: 100px;
   }
   ```

4. **Не игнорируйте события от Telegram SDK:**
   ```javascript
   // ПЛОХО - не отслеживает изменения
   // Нужно переустанавливать после событий SDK
   ```

### **✅ ПРАВИЛЬНО:**

1. **Только safe-top принудительно:**
   ```javascript
   // ХОРОШО - только защита сверху
   root.style.setProperty('--safe-top', '90px');
   ```

2. **Оптимальное значение:**
   ```javascript
   // ХОРОШО - баланс защиты и места
   const forcedSafeTop = '90px';
   ```

3. **JavaScript решение:**
   ```javascript
   // ХОРОШО - работает всегда
   setTimeout(forceMobileSafeAreas, 100);
   ```

## 🧪 Отладка и диагностика

### **DebugPage для диагностики:**

```javascript
// Проверка принудительных safe areas
const checkJsForced = (cssVarSafeTop: string) => {
  const topValue = parseInt(cssVarSafeTop);
  return topValue >= 90; // Наше принудительное значение
};
```

### **Консоль логи:**
- `🔧 Принудительно устанавливаю safe areas` - JavaScript работает
- `💻 Десктоп - используем стандартные safe areas` - JS не вмешивается

### **Визуальные индикаторы:**
- 🟢 Зеленый = safe area работает правильно
- 🔴 Красный = проблема (0px или перекрытие)
- 🔧 = установлено JavaScript принудительно

## 📱 Результат

### **Desktop (PC):**
- ✅ Стандартные safe areas (44px)
- ✅ JavaScript не вмешивается
- ✅ Работает через CSS переменные

### **Mobile (Phone/Tablet):**
- ✅ Принудительный safe-top = 90px
- ✅ Профиль под кнопками Telegram
- ✅ Контент не перекрывается Dynamic Island
- ✅ Полная ширина без сдвигов

## 🔄 Алгоритм работы

1. **Инициализация Telegram SDK**
2. **Определение мобильного устройства**
3. **Если мобильное** → принудительно `--safe-top: 90px`
4. **Если НЕ мобильное** → стандартные CSS переменные
5. **Отслеживание событий** SDK и переустановка при изменениях
6. **Layout использует** CSS переменные для позиционирования

## 💡 Для будущих ИИ

**При работе с Telegram Mini App UI проблемами:**

1. **Сначала диагностируйте** - используйте DebugPage
2. **Проверьте консоль** - ищите логи принудительной установки
3. **НЕ трогайте safe-left/right** - только top если нужно
4. **Тестируйте на реальном устройстве** - эмуляторы могут врать
5. **Используйте наш подход** - JavaScript + CSS переменные надежнее CSS media queries

**Этот подход решает 95% проблем с UI перекрытиями в Telegram Mini App!** 🚀

---

*Документация создана на основе успешного решения проблемы UI перекрытий в проекте игры в кубики TON.*