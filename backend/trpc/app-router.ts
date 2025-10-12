import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import chatSend from "./routes/chat/send/route";
import { chatGptProcedure } from "./routes/chat/gpt/route";
import { sendOtpProcedure } from "./routes/auth/send-otp/route";
import { verifyOtpProcedure } from "./routes/auth/verify-otp/route";
import { fetchPerevozki } from "./routes/company/fetch-perevozki/route";
import { getDocumentsProcedure } from "./routes/onec/get-documents/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  chat: createTRPCRouter({
    send: chatSend,
    gpt: chatGptProcedure,
  }),
  auth: createTRPCRouter({
    sendOtp: sendOtpProcedure,
    verifyOtp: verifyOtpProcedure,
  }),
  company: createTRPCRouter({
    fetchPerevozki: fetchPerevozki,
  }),
  onec: createTRPCRouter({
    getDocuments: getDocumentsProcedure,
  }),
});

export type AppRouter = typeof appRouter;
