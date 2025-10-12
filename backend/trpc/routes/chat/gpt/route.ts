import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
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

export const chatGptProcedure = publicProcedure
  .input(
    z.object({
      messages: z.array(
        z.object({
          role: z.enum(["user", "assistant", "system"]),
          content: z.string(),
        })
      ),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[GPT] === Request received ===");
    console.log("[GPT] Timestamp:", new Date().toISOString());
    console.log("[GPT] Messages count:", input.messages.length);
    console.log("[GPT] Messages:", JSON.stringify(input.messages, null, 2));
    console.log("[GPT] OpenAI API Key exists:", !!process.env.OPENAI_API_KEY);
    console.log("[GPT] OpenAI API Key length:", process.env.OPENAI_API_KEY?.length || 0);
    
    try {
      console.log("[GPT] Calling OpenAI API...");
      const openaiClient = getOpenAI();
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: input.messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      console.log("[GPT] OpenAI API response received");
      console.log("[GPT] Response:", completion.choices[0].message.content);
      console.log("[GPT] Usage:", completion.usage);

      return {
        message: completion.choices[0].message.content,
        usage: completion.usage,
      };
    } catch (error) {
      console.error("[GPT] === OpenAI API Error ===");
      console.error("[GPT] Error type:", error?.constructor?.name);
      console.error("[GPT] Error message:", error instanceof Error ? error.message : String(error));
      console.error("[GPT] Full error:", error);
      throw new Error("Failed to get response from ChatGPT: " + (error instanceof Error ? error.message : String(error)));
    }
  });
