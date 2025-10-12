# Развертывание на Railway

## 🚀 Быстрый старт

1. **Подключите репозиторий к Railway:**
   - Перейдите на [railway.com](https://railway.com)
   - Нажмите "Deploy from GitHub Repo"
   - Выберите этот репозиторий

2. **Настройте переменные окружения в Railway:**
   ```
   NODE_ENV=production
   ONEC_API_URL=https://tdn.postb.ru
   ONEC_API_USERNAME=order@lal-auto.com
   ONEC_API_PASSWORD=ZakaZ656565
   OPENAI_API_KEY=sk-proj-...
   ```

3. **Railway автоматически:**
   - Установит Bun
   - Установит зависимости (`bun install`)
   - Запустит backend (`bun run backend/server.ts`)

## 📁 Структура проекта

```
├── backend/           # Backend API (Bun + Hono)
│   ├── server.ts      # Точка входа
│   ├── hono.ts        # Hono приложение
│   └── trpc/          # tRPC роуты
├── app/               # Frontend (Expo)
├── railway.json       # Конфигурация Railway
├── nixpacks.toml      # Конфигурация сборки
└── .railwayignore     # Игнорируемые файлы
```

## 🔧 API эндпоинты

После развертывания будут доступны:
- `GET /` - Статус сервера
- `GET /api/test-perevozki` - Тест API 1С
- `POST /api/chat-gpt` - ChatGPT API

## 🌐 Frontend

Frontend должен быть развернут отдельно (например, на Vercel) и настроен на Railway API URL.
