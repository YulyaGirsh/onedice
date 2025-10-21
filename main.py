import asyncio
import os
import subprocess
from datetime import datetime
from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, types
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import Command

# Загружаем переменные окружения из .env файла
load_dotenv()

# Токен бота из переменной окружения
BOT_TOKEN = os.getenv("BOT_TOKEN")

# Создаем экземпляры бота и диспетчера
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

def auto_push_to_github():
    """Автоматический пуш изменений на GitHub"""
    try:
        # Добавляем все изменения
        subprocess.run(['git', 'add', '.'], check=True, capture_output=True)
        
        # Получаем текущее время
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Делаем коммит
        subprocess.run(['git', 'commit', '-m', f'Auto-commit: {timestamp}'], 
                      check=True, capture_output=True)
        
        # Пушим на GitHub
        subprocess.run(['git', 'push', 'origin', 'main'], 
                      check=True, capture_output=True)
        
        print(f"✅ Auto-push successful: {timestamp}")
    except subprocess.CalledProcessError as e:
        print(f"❌ Auto-push failed: {e}")
    except Exception as e:
        print(f"❌ Unexpected error during auto-push: {e}")

@dp.message(Command("start"))
async def start_command(message: types.Message):
    """Обработчик команды /start"""
    # Получаем имя пользователя
    username = message.from_user.first_name or "Игрок"
    
    # Создаем приветственное сообщение
    welcome_text = f"""🎲 Добро пожаловать в OneDice, {username}!

🎮 Это игра в кубики на TON с рейтинговой системой и офферами.

🚀 Нажмите кнопку ниже, чтобы открыть мини-апп:

💰 Играйте на TON и выигрывайте реальные деньги!
🏆 Соревнуйтесь с другими игроками в рейтинге!
🤝 Создавайте и принимайте офферы на дуэли!
🛍️ Открывайте кейсы с призами!

📢 Подписывайтесь на наш канал для новостей!
💬 Присоединяйтесь к нашему чату для общения!"""
    
    # Создаем клавиатуру с кнопками
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="Приложение", url="https://onedice.ru/")],
        [InlineKeyboardButton(text="Канал", url="http://t.me/onedices")],
        [InlineKeyboardButton(text="Наш чат", url="http://t.me/myonedice")]
    ])
    
    # Отправляем сообщение с кнопками
    await message.answer(welcome_text, reply_markup=keyboard)

async def main():
    """Главная функция для запуска бота"""
    print("Бот OneDice запущен!")
    
    # Автоматический пуш на GitHub при запуске
    auto_push_to_github()
    
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())

