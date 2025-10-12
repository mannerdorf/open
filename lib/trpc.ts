import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const normalizeBaseUrl = (raw: string): string => {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!/^https?:\/\//i.test(trimmed)) {
    const withProto = `https://${trimmed}`;
    console.log(
      "[trpc] No protocol in EXPO_PUBLIC_RORK_API_BASE_URL, assuming https:",
      withProto
    );
    return withProto;
  }
  return trimmed;
};

const getBaseUrl = () => {
  const raw = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  console.log("\n" + "=".repeat(60));
  console.log("🔧 [trpc] Configuration");
  console.log("Raw BASE URL:", raw);
  console.log("Platform:", typeof window !== 'undefined' ? 'web' : 'native');
  console.log("All env vars:", Object.keys(process.env).filter(k => k.startsWith('EXPO_PUBLIC')));
  
  if (raw && raw.length > 0) {
    const url = normalizeBaseUrl(raw);
    if (url.includes(".internal")) {
      console.warn("⚠️  Detected .internal base URL - not reachable from clients!");
    }
    console.log("✅ Final URL:", url);
    console.log("Full tRPC endpoint:", url + "/api/trpc");
    console.log("=".repeat(60) + "\n");
    return url;
  }
  
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    console.log("✅ Using window.location.origin:", origin);
    console.log("Full tRPC endpoint:", origin + "/api/trpc");
    console.log("=".repeat(60) + "\n");
    return origin;
  }
  
  console.log("⚠️  No base URL configured!");
  console.log("=".repeat(60) + "\n");
  return "";
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      fetch: async (url, options) => {
        console.log("\n" + "=".repeat(60));
        console.log('🌐 [trpc] Making request');
        console.log('URL:', url);
        console.log('Method:', options?.method || 'GET');
        console.log("=".repeat(60) + "\n");
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.error('⏱️  [trpc] Request timeout after 30s');
          controller.abort();
        }, 30000);
        
        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
              ...options?.headers,
              'Content-Type': 'application/json',
            },
          });
          
          clearTimeout(timeoutId);
          console.log("\n" + "=".repeat(60));
          console.log('✅ [trpc] Response received');
          console.log('Status:', response.status);
          console.log('OK:', response.ok);
          console.log("=".repeat(60) + "\n");
          
          if (!response.ok) {
            const text = await response.text();
            console.error('❌ [trpc] Error response:', text.substring(0, 500));
            // Создаем новый response с тем же телом для повторного чтения
            return new Response(text, {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
            });
          }
          
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          console.error("\n" + "=".repeat(60));
          console.error('❌ [trpc] Fetch failed');
          console.error('Error:', error instanceof Error ? error.message : String(error));
          console.error('URL:', String(url));
          console.error("=".repeat(60) + "\n");
          throw error;
        }
      },
    }),
  ],
});
