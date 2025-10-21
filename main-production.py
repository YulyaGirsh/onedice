import asyncio
import os
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
        [InlineKeyboardButton(text="Канал", url="https://t.me/onedices")],
        [InlineKeyboardButton(text="Наш чат", url="https://t.me/myonedice")]
    ])
    
    # Отправляем сообщение с кнопками
    await message.answer(welcome_text, reply_markup=keyboard)

async def main():
    """Главная функция для запуска бота"""
    print("🤖 OneDice Bot запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
