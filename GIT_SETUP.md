# 🚀 OneDice GitHub Setup

## ✅ Настройка завершена

Репозиторий OneDice успешно настроен и подключен к GitHub:
- **Репозиторий**: https://github.com/YulyaGirsh/onedice.git
- **Пользователь**: YulyaGirsh
- **Токен**: Настроен и сохранен

## 🔄 Автоматический пуш

Настроена система автоматического пуша изменений на GitHub:

### 1. Встроенная функция в main.py
- При каждом запуске бота автоматически пушит изменения
- Время коммита добавляется в сообщение

### 2. PowerShell скрипт
```powershell
.\push-to-github.ps1
```

### 3. Batch скрипт (Windows)
```cmd
push-to-github.bat
```

## 📁 Структура репозитория

```
onedice/
├── src/                    # React frontend
├── server/                 # Node.js backend
├── public/                 # Статические файлы
├── main.py                 # Telegram бот
├── .env                    # Переменные окружения
├── .gitignore             # Исключения Git
└── docs/                  # Документация
```

## 🔧 Команды Git

### Основные команды
```bash
# Проверить статус
git status

# Добавить все изменения
git add .

# Сделать коммит
git commit -m "Описание изменений"

# Отправить на GitHub
git push origin main

# Получить изменения с GitHub
git pull origin main
```

### Автоматический пуш
```bash
# PowerShell
.\push-to-github.ps1

# Batch
push-to-github.bat

# Python (встроено в main.py)
python main.py
```

## 📋 .gitignore

Исключены из репозитория:
- `node_modules/` - зависимости Node.js
- `dist/` - собранные файлы
- `.env` - переменные окружения
- `*.db` - файлы баз данных
- `venv/` - виртуальное окружение Python
- Временные файлы и логи

## 🎯 Рекомендации

1. **Регулярно делайте коммиты** - не накапливайте изменения
2. **Используйте описательные сообщения** коммитов
3. **Проверяйте статус** перед коммитом: `git status`
4. **Синхронизируйтесь** с удаленным репозиторием: `git pull`

## 🔗 Полезные ссылки

- [Репозиторий на GitHub](https://github.com/YulyaGirsh/onedice.git)
- [Документация Git](https://git-scm.com/doc)
- [GitHub Desktop](https://desktop.github.com/) - GUI для Git

---

**Статус**: ✅ Настроено и готово к работе
**Последнее обновление**: $(Get-Date)
