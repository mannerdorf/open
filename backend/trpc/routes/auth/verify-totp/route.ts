import { publicProcedure } from "../../create-context";
import { z } from "zod";
import { createHmac } from "crypto";

const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(base32: string): Buffer {
  base32 = base32.toUpperCase().replace(/=+$/, "");
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < base32.length; i++) {
    const char = base32[i];
    const index = base32Chars.indexOf(char);
    if (index === -1) throw new Error("Invalid base32 character");

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

function generateHOTP(secret: Buffer, counter: number): string {
  const buffer = Buffer.alloc(8);
  for (let i = 7; i >= 0; i--) {
    buffer[i] = counter & 0xff;
    counter = counter >> 8;
  }

  const hmac = createHmac("sha1", secret);
  hmac.update(buffer);
  const hash = hmac.digest();

  const offset = hash[hash.length - 1] & 0xf;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

function generateTOTP(secret: string, window = 0): string {
  const secretBuffer = base32Decode(secret);
  const counter = Math.floor(Date.now() / 1000 / 30) + window;
  return generateHOTP(secretBuffer, counter);
}

function verifyTOTP(token: string, secret: string, windowSize = 1): boolean {
  for (let i = -windowSize; i <= windowSize; i++) {
    const totp = generateTOTP(secret, i);
    if (totp === token) {
      return true;
    }
  }
  return false;
}

export const verifyTotpProcedure = publicProcedure
  .input(z.object({
    secret: z.string(),
    token: z.string().length(6),
  }))
  .mutation(async ({ input }) => {
    try {
      const isValid = verifyTOTP(input.token, input.secret);
      
      return {
        success: isValid,
        message: isValid ? "Код верный" : "Неверный код",
      };
    } catch (error) {
      console.error("TOTP verification error:", error);
      return {
        success: false,
        message: "Ошибка верификации",
      };
    }
  });
