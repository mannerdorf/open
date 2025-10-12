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
      test: "/api/test-perevozki"
    }
  });
});

// Простой роут для ChatGPT
app.post("/api/chat-gpt", async (c) => {
  try {
    console.log("[GPT] Testing ChatGPT API connection...");
    
    const body = await c.req.json();
    const { messages } = body;
    
    if (!messages || !Array.isArray(messages)) {
      return c.json({
        success: false,
        error: "Invalid messages format"
      }, 400);
    }
    
    const openaiClient = getOpenAI();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

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
    
    // Тестовый запрос к API 1С
    const response = await fetch(`${onecUrl}/GetPerevozki`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
      },
      body: JSON.stringify({
        startDate: '2024-01-01',
        endDate: '2026-01-01'
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
