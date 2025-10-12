import { publicProcedure } from '../../../create-context';
import { onecClient } from '../../../../lib/onec-client';
import { z } from 'zod';

export const getDocumentsProcedure = publicProcedure
  .input(
    z.object({
      type: z.enum(['contract', 'invoice', 'act']).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  )
  .query(async ({ input }) => {
    try {
      const params = new URLSearchParams();
      if (input.type) params.append('type', input.type);
      if (input.startDate) params.append('startDate', input.startDate);
      if (input.endDate) params.append('endDate', input.endDate);

      const endpoint = `/documents?${params.toString()}`;
      const documents = await onecClient.get(endpoint);

      return {
        success: true,
        documents,
      };
    } catch (error) {
      console.error('Error fetching documents from 1C:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        documents: [],
      };
    }
  });
