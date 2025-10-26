import { publicProcedure } from "../../create-context";
import { z } from "zod";
import { createHmac, randomBytes } from "crypto";

const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += base32Chars[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += base32Chars[(value << (5 - bits)) & 31];
  }

  while (output.length % 8 !== 0) {
    output += "=";
  }

  return output;
}

export const generateTotpProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
    appName: z.string().optional().default("Haulz"),
  }))
  .mutation(async ({ input }) => {
    const secret = randomBytes(20);
    const base32Secret = base32Encode(secret);
    
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(input.appName)}:${encodeURIComponent(input.userId)}?secret=${base32Secret}&issuer=${encodeURIComponent(input.appName)}`;
    
    return {
      secret: base32Secret,
      qrCodeUrl: otpauthUrl,
    };
  });
