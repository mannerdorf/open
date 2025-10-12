// Тест чата GPT через терминал
const testChatGPT = async () => {
  const apiUrl = 'https://rork-haulz-api-test.onrender.com';
  
  console.log('🧪 Тестирование чата GPT...');
  console.log('API URL:', apiUrl);
  
  try {
    // Тест 1: Проверка статуса API
    console.log('\n1️⃣ Проверка статуса API...');
    const statusResponse = await fetch(`${apiUrl}/`);
    const statusData = await statusResponse.json();
    console.log('✅ Статус API:', statusData);
    
    // Тест 2: Проверка tRPC эндпоинта
    console.log('\n2️⃣ Проверка tRPC эндпоинта...');
    const trpcResponse = await fetch(`${apiUrl}/api/trpc/chat.gpt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      })
    });
    
    console.log('📡 Статус ответа:', trpcResponse.status);
    console.log('📡 Заголовки:', Object.fromEntries(trpcResponse.headers.entries()));
    
    const trpcData = await trpcResponse.text();
    console.log('📡 Ответ tRPC:', trpcData);
    
    if (trpcResponse.ok) {
      try {
        const parsedData = JSON.parse(trpcData);
        console.log('✅ Парсинг JSON успешен:', parsedData);
      } catch (e) {
        console.log('❌ Ошибка парсинга JSON:', e.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
};

// Запуск теста
testChatGPT();
