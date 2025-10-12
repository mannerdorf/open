import { z } from 'zod';
import { publicProcedure } from '../../../create-context';

import { setOtp } from '../otp-store';

function generateOtp(): string {
  return '111111';
}

export const sendOtpProcedure = publicProcedure
  .input(
    z.object({
      phone: z.string().min(10),
    })
  )
  .mutation(async ({ input }) => {
    try {
      console.log('Sending OTP to:', input.phone);
      
      const code = generateOtp();
      setOtp(input.phone, code);
      console.log('📱 Используйте код для входа:', code);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        status: 'pending',
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to send OTP');
    }
  });
