#!/bin/bash

echo "🧪 Тестирование чата GPT через терминал"
echo "========================================"

API_URL="https://rork-haulz-api-test.onrender.com"

echo ""
echo "1️⃣ Проверка статуса API..."
curl -s "$API_URL/" | jq .

echo ""
echo "2️⃣ Проверка API эндпоинта..."
curl -s "$API_URL/api" | jq .

echo ""
echo "3️⃣ Тестирование tRPC чата GPT..."
echo "Отправка запроса к chat.gpt..."

# Попробуем разные форматы tRPC запросов
echo ""
echo "Формат 1: Стандартный tRPC batch"
curl -X POST "$API_URL/api/trpc/chat.gpt" \
  -H "Content-Type: application/json" \
  -H "x-trpc-source: client" \
  -d '{
    "0": {
      "json": {
        "messages": [
          {
            "role": "user",
            "content": "Привет! Как дела? Ответь коротко."
          }
        ]
      }
    }
  }' -s | jq .

echo ""
echo "Формат 2: Простой JSON"
curl -X POST "$API_URL/api/trpc/chat.gpt" \
  -H "Content-Type: application/json" \
  -d '{
    "json": {
      "messages": [
        {
          "role": "user",
          "content": "Привет! Как дела?"
        }
      ]
    }
  }' -s | jq .

echo ""
echo "Формат 3: Прямой вызов"
curl -X POST "$API_URL/api/trpc/chat.gpt" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Привет! Как дела?"
      }
    ]
  }' -s | jq .

echo ""
echo "4️⃣ Тестирование локального чата (мок)..."
curl -X POST "$API_URL/api/trpc/chat.send" \
  -H "Content-Type: application/json" \
  -d '{
    "0": {
      "json": {
        "messages": [
          {
            "role": "user",
            "content": "Привет! Как дела?"
          }
        ],
        "model": "local-mock"
      }
    }
  }' -s | jq .

echo ""
echo "✅ Тестирование завершено!"
