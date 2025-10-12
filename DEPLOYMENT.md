# Развертывание API 1С на Render.com

## Обзор

Этот проект содержит API для интеграции с 1С, построенный на Hono + tRPC + Bun. API уже настроен для работы с 1С системой и готов к развертыванию на render.com.

## Структура API

### Основные эндпоинты:
- `GET /` - Статус сервера
- `GET /api` - Статус API
- `POST /api/trpc/*` - tRPC эндпоинты

### tRPC роуты:
- `onec.getDocuments` - Получение документов из 1С
- `company.fetchPerevozki` - Получение данных о перевозках
- `auth.sendOtp` / `auth.verifyOtp` - Аутентификация
- `chat.send` / `chat.gpt` - Чат функции

## Настройка переменных окружения

### Обязательные переменные:
```bash
NODE_ENV=production
ONEC_API_URL=https://tdn.postb.ru
ONEC_API_USERNAME=order@lal-auto.com
ONEC_API_PASSWORD=ZakaZ656565
OPENAI_API_KEY=sk-proj-...
```

## Развертывание на Render.com

### 1. Подготовка репозитория

1. Убедитесь, что все изменения закоммичены:
```bash
git add .
git commit -m "Configure for render.com deployment"
git push origin main
```

### 2. Создание сервиса на Render.com

1. Войдите в [render.com](https://render.com)
2. Нажмите "New +" → "Web Service"
3. Подключите ваш GitHub репозиторий
4. Выберите репозиторий `rork-haulz-api-test`

### 3. Настройка сервиса

**Основные настройки:**
- **Name**: `haulz-api` (или любое другое имя)
- **Runtime**: `Bun`
- **Build Command**: `bun install`
- **Start Command**: `bun run backend/server.ts`

**Переменные окружения:**
Добавьте следующие переменные в разделе "Environment Variables":

```
NODE_ENV = production
ONEC_API_URL = https://tdn.postb.ru
ONEC_API_USERNAME = order@lal-auto.com
ONEC_API_PASSWORD = ZakaZ656565
OPENAI_API_KEY = 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
```

### 4. Дополнительные настройки

**Планы:**
- Для production рекомендуется использовать платный план
- Free план имеет ограничения по времени работы

**Автоматическое развертывание:**
- Включите "Auto-Deploy" для автоматического развертывания при push в main ветку

### 5. Развертывание

1. Нажмите "Create Web Service"
2. Render.com автоматически начнет процесс развертывания
3. Дождитесь завершения сборки (обычно 2-5 минут)
4. После успешного развертывания вы получите URL вида: `https://haulz-api.onrender.com`

## Проверка развертывания

### 1. Проверка статуса
```bash
curl https://your-app-name.onrender.com/
```

Ожидаемый ответ:
```json
{
  "status": "ok",
  "message": "Server is running",
  "endpoints": {
    "api": "/api",
    "trpc": "/api/trpc"
  }
}
```

### 2. Проверка API
```bash
curl https://your-app-name.onrender.com/api
```

### 3. Проверка tRPC (пример)
```bash
curl -X POST https://your-app-name.onrender.com/api/trpc/onec.getDocuments \
  -H "Content-Type: application/json" \
  -d '{"type":"contract"}'
```

## Мониторинг и логи

### Логи приложения
- В панели Render.com перейдите в раздел "Logs"
- Здесь вы можете видеть все логи приложения в реальном времени

### Мониторинг производительности
- Render.com предоставляет базовую статистику использования ресурсов
- Для детального мониторинга рекомендуется использовать внешние сервисы

## Обновление приложения

### Автоматическое обновление
Если включен Auto-Deploy:
1. Внесите изменения в код
2. Закоммитьте и запушьте в main ветку
3. Render.com автоматически развернет обновления

### Ручное обновление
1. В панели Render.com нажмите "Manual Deploy"
2. Выберите ветку и коммит для развертывания

## Устранение неполадок

### Частые проблемы:

1. **Ошибка сборки**
   - Проверьте логи сборки в панели Render.com
   - Убедитесь, что все зависимости указаны в package.json

2. **Ошибка запуска**
   - Проверьте правильность Start Command
   - Убедитесь, что все переменные окружения настроены

3. **Ошибки 1С API**
   - Проверьте правильность URL и учетных данных 1С
   - Убедитесь, что 1С сервер доступен из интернета

4. **CORS ошибки**
   - Проверьте настройки CORS в backend/hono.ts
   - Добавьте ваш домен в список разрешенных origins

### Полезные команды для отладки:

```bash
# Локальный запуск для тестирования
cd backend
bun install
bun run dev

# Проверка переменных окружения
echo $ONEC_API_URL
echo $ONEC_API_USERNAME
```

## Безопасность

### Рекомендации:
1. **Никогда не коммитьте секретные ключи** в репозиторий
2. Используйте переменные окружения для всех чувствительных данных
3. Регулярно обновляйте API ключи
4. Настройте мониторинг для отслеживания подозрительной активности

### Переменные окружения в .env файле:
Файл `.env` содержит тестовые данные и НЕ должен использоваться в production. Все production значения должны быть настроены через панель Render.com.

## Поддержка

При возникновении проблем:
1. Проверьте логи в панели Render.com
2. Убедитесь, что все переменные окружения настроены правильно
3. Проверьте доступность 1С API
4. Обратитесь к документации Render.com или создайте issue в репозитории
