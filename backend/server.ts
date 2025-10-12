import app from "./hono";

const port = Number(process.env.PORT ?? 3000);

console.log("\n" + "=".repeat(50));
console.log("[server] Starting Hono server");
console.log("[server] Port:", port);
console.log("[server] Environment:", process.env.NODE_ENV || 'development');
console.log("[server] OpenAI API Key configured:", !!process.env.OPENAI_API_KEY);
console.log("[server] OpenAI API Key length:", process.env.OPENAI_API_KEY?.length || 0);
console.log("=".repeat(50) + "\n");

// Railway Bun runtime
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const bunGlobal = (globalThis as any).Bun;

if (bunGlobal && typeof bunGlobal.serve === "function") {
  bunGlobal.serve({
    port,
    hostname: "0.0.0.0",
    fetch: app.fetch,
    // biome-ignore lint/suspicious/noExplicitAny: Bun types may not be present
  } as any);
  console.log("\n" + "=".repeat(50));
  console.log("[server] ✓ Server is running on port", port);
  console.log("[server] ✓ Ready to accept connections");
  console.log("[server] ✓ Listening on http://0.0.0.0:" + port);
  console.log("=".repeat(50) + "\n");
} else {
  console.error("[server] Bun runtime not detected. Please run with Bun.");
}
