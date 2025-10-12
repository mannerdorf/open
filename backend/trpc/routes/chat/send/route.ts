import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

export type ChatMessage = z.infer<typeof MessageSchema>;

export default publicProcedure
  .input(
    z.object({
      messages: z.array(MessageSchema).min(1),
      model: z.string().default("local-mock"),
    })
  )
  .mutation(async ({ input }) => {
    try {
      const lastUser = [...input.messages].reverse().find((m) => m.role === "user");
      const base = lastUser?.content ?? "";
      const prefix = "LOCAL-ASSISTANT";
      const text = base
        ? `${prefix}: ${base}`
        : `${prefix}: Привет! Я локальный офлайн-чат без внешних API. Задайте вопрос.`;
      return { text };
    } catch (e) {
      console.error("[chat] local mock error", e);
      return { text: "Ошибка локального ответа" };
    }
  });