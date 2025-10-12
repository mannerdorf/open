import { z } from 'zod';
import { publicProcedure } from '../../../create-context';

import { verifyOtpCode } from '../otp-store';

export const verifyOtpProcedure = publicProcedure
  .input(
    z.object({
      phone: z.string().min(10),
      code: z.string().length(6),
    })
  )
  .mutation(async ({ input }) => {
    try {
      console.log('Verifying OTP for:', input.phone);
      const ok = verifyOtpCode(input.phone, input.code);
      if (ok) {
        return { success: true, verified: true };
      }

      return { success: false, verified: false, error: 'Неверный код' };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to verify OTP');
    }
  });
