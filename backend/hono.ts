import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import OpenAI from "openai";

// Ленивая инициализация OpenAI
let openai: OpenAI | null = null;

const getOpenAI = () => {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
};

const app = new Hono();

app.use("*", async (c, next) => {
  const timestamp = new Date().toISOString();
  console.log("\n" + "=".repeat(60));
  console.log("🔵 [" + timestamp + "] INCOMING REQUEST");
  console.log("Method:", c.req.method);
  console.log("Full URL:", c.req.url);
  console.log("Path:", c.req.path);
  console.log("Origin:", c.req.header('origin') || 'N/A');
  console.log("User-Agent:", c.req.header('user-agent') || 'N/A');
  console.log("Content-Type:", c.req.header('content-type') || 'N/A');
  console.log("=".repeat(60) + "\n");
  
  try {
    await next();
    console.log("\n" + "=".repeat(60));
    console.log("🟢 [" + timestamp + "] RESPONSE");
    console.log("Status:", c.res.status);
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("🔴 [" + timestamp + "] ERROR");
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("=".repeat(60) + "\n");
    throw error;
  }
});

app.use("*", cors({
  origin: (origin) => {
    console.log('[CORS] Request from origin:', origin);
    const allowedOrigins = [
      'https://api.gapaf.ru',
      'https://rork-haulz-api-test.onrender.com',
      'http://localhost:8081',
      'http://localhost:19006',
      'http://localhost:3000',
    ];
    
    if (!origin || allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      console.log('[CORS] ✅ Origin allowed:', origin);
      return origin || '*';
    }
    
    console.log('[CORS] ⚠️ Origin not in whitelist, but allowing:', origin);
    return origin;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-trpc-source'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
  credentials: true,
}));

console.log('=== Registering tRPC routes ===');
console.log('Company router registered:', !!appRouter.company);
console.log('FetchPerevozki procedure registered:', !!(appRouter.company as any)?.fetchPerevozki);

app.use(
  "/api/trpc",
  trpcServer({
    router: appRouter,
    createContext,
    onError: ({ path, error }) => {
      console.error(`tRPC Error on ${path}:`, error);
    },
  })
);

app.get("/api", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

app.get("/", (c) => {
  return c.json({ 
    status: "ok", 
    message: "Server is running",
    endpoints: {
      api: "/api",
      trpc: "/api/trpc",
      addCompany: "/api/add-company",
      test: "/api/test-perevozki"
    }
  });
});

// Функции-помощники для получения данных из 1C
async function getPerevozki(startDate?: string, endDate?: string) {
  const onecUrl = process.env.ONEC_API_URL;
  const username = process.env.ONEC_API_USERNAME;
  const password = process.env.ONEC_API_PASSWORD;
  
  if (!onecUrl || !username || !password) {
    return { error: "1C API не настроен" };
  }
  
  // Если даты не переданы, используем последние 12 месяцев
  let finalStartDate = startDate;
  let finalEndDate = endDate;
  
  if (!finalStartDate || !finalEndDate) {
    const end = new Date();
    const start = new Date();
    start.setFullYear(start.getFullYear() - 1);
    
    finalStartDate = start.toISOString().split('T')[0];
    finalEndDate = end.toISOString().split('T')[0];
  }
  
  try {
    const response = await fetch(`${onecUrl}/GetPerevozki`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
      },
      body: JSON.stringify({
        startDate: finalStartDate,
        endDate: finalEndDate
      })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    return { error: `Ошибка получения перевозок: ${error}` };
  }
}

async function getDocuments(type?: string) {
  // Заглушка для получения документов
  return {
    invoices: [
      { id: "INV-001", date: "2024-10-01", amount: 50000, status: "paid" },
      { id: "INV-002", date: "2024-10-05", amount: 75000, status: "pending" }
    ],
    acts: [
      { id: "ACT-001", date: "2024-10-02", description: "Оказание услуг перевозки" }
    ]
  };
}

// Роут для ChatGPT с function calling
app.post("/api/chat-gpt", async (c) => {
  try {
    console.log("[GPT] ChatGPT API request with function calling...");
    
    const body = await c.req.json();
    const { messages } = body;
    
    if (!messages || !Array.isArray(messages)) {
      return c.json({
        success: false,
        error: "Invalid messages format"
      }, 400);
    }
    
    const openaiClient = getOpenAI();
    
    // Определяем доступные функции для ChatGPT
    const tools = [
      {
        type: "function" as const,
        function: {
          name: "getPerevozki",
          description: "Получить список перевозок за указанный период. Используй эту функцию когда пользователь спрашивает о перевозках, заказах, грузах.",
          parameters: {
            type: "object",
            properties: {
              startDate: {
                type: "string",
                description: "Дата начала периода в формате YYYY-MM-DD"
              },
              endDate: {
                type: "string",
                description: "Дата окончания периода в формате YYYY-MM-DD"
              }
            }
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "getDocuments",
          description: "Получить список документов (счета, акты, накладные). Используй когда пользователь спрашивает о документах, счетах, актах.",
          parameters: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["invoice", "act", "upd", "all"],
                description: "Тип документов для получения"
              }
            }
          }
        }
      }
    ];
    
    let completion = await openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      tools: tools,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    // Если ChatGPT хочет вызвать функцию
    if (completion.choices[0].message.tool_calls) {
      const toolCalls = completion.choices[0].message.tool_calls;
      const functionResults: any[] = [];
      
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        console.log(`[GPT] Calling function: ${functionName} with args:`, functionArgs);
        
        let result;
        if (functionName === "getPerevozki") {
          result = await getPerevozki(functionArgs.startDate, functionArgs.endDate);
        } else if (functionName === "getDocuments") {
          result = await getDocuments(functionArgs.type);
        }
        
        functionResults.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: JSON.stringify(result)
        });
      }
      
      // Добавляем результаты функций и запрашиваем финальный ответ
      const updatedMessages = [
        ...messages,
        completion.choices[0].message,
        ...functionResults
      ];
      
      completion = await openaiClient.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: updatedMessages,
        temperature: 0.7,
        max_tokens: 1000,
      });
    }

    return c.json({
      success: true,
      message: completion.choices[0].message.content,
      usage: completion.usage,
    });
    
  } catch (error) {
    console.error("[GPT] ChatGPT API Error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "Failed to get response from ChatGPT"
    }, 500);
  }
});

// Роут для добавления компании (альтернатива tRPC)
app.post("/api/add-company", async (c) => {
  try {
    console.log("[ADD-COMPANY] Request received");
    
    const body = await c.req.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return c.json({
        success: false,
        error: "Email и password обязательны"
      }, 400);
    }
    
    const onecUrl = process.env.ONEC_API_URL || 'https://tdn.postb.ru';
    
    // Динамический период: последние 12 месяцев
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };
    
    const dateB = formatDate(startDate);
    const dateE = formatDate(endDate);
    
    const fullUrl = `${onecUrl}/workbase/hs/DeliveryWebService/GetPerevozki?DateB=${dateB}&DateE=${dateE}`;
    
    console.log("[ADD-COMPANY] Calling 1C API:", fullUrl);
    console.log("[ADD-COMPANY] Auth user:", email);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${email}:${password}`).toString('base64')}`
      }
    });
    
    console.log("[ADD-COMPANY] 1C API Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ADD-COMPANY] 1C API Error:", errorText);
      return c.json({
        success: false,
        error: `Ошибка ${response.status}: ${errorText || 'Неверный логин или пароль'}`,
        data: null
      }, response.status);
    }
    
    const data = await response.json();
    console.log("[ADD-COMPANY] Success, items count:", Array.isArray(data) ? data.length : 'not an array');
    
    return c.json({
      success: true,
      data: data,
      message: "Компания успешно добавлена"
    });
    
  } catch (error) {
    console.error("[ADD-COMPANY] Error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "Ошибка подключения к 1C API"
    }, 500);
  }
});

// Простой тестовый роут для API 1С
app.get("/api/test-perevozki", async (c) => {
  try {
    console.log("[TEST] Testing 1C API connection...");
    
    const onecUrl = process.env.ONEC_API_URL;
    const username = process.env.ONEC_API_USERNAME;
    const password = process.env.ONEC_API_PASSWORD;
    
    if (!onecUrl || !username || !password) {
      return c.json({
        success: false,
        error: "1C API credentials not configured",
        details: {
          onecUrl: !!onecUrl,
          username: !!username,
          password: !!password
        }
      }, 500);
    }
    
    // Динамический период: последние 12 месяцев
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };
    
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);
    
    console.log("[TEST] Period:", startDateStr, "to", endDateStr);
    
    // Тестовый запрос к API 1С
    const response = await fetch(`${onecUrl}/GetPerevozki`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
      },
      body: JSON.stringify({
        startDate: startDateStr,
        endDate: endDateStr
      })
    });
    
    const data = await response.text();
    
    return c.json({
      success: true,
      status: response.status,
      data: data.substring(0, 1000) + (data.length > 1000 ? '...' : ''),
      message: "1C API connection successful"
    });
    
  } catch (error) {
    console.error("[TEST] 1C API Error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "Failed to connect to 1C API"
    }, 500);
  }
});

export default app;
