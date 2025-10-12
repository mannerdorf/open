import { publicProcedure } from '../../../create-context';
import https from 'https';
import type { IncomingMessage } from 'http';
import { z } from 'zod';

export const fetchPerevozki = publicProcedure
  .input(z.object({
    email: z.string(),
    password: z.string(),
  }))
  .mutation(async ({ input }) => {
    console.log('=== fetchPerevozki backend called ===');
    console.log('Input email:', input.email);

    const apiUrl = process.env.ONEC_API_URL || 'https://tdn.postb.ru';
    const apiUsername = input.email;
    const apiPassword = input.password;

    if (!apiUsername || !apiPassword) {
      console.error('1C API credentials not configured');
      return {
        success: false,
        error: 'API не настроен. Обратитесь к администратору.',
        data: null,
      };
    }

    return new Promise((resolve) => {
      try {
        // Динамический период: последние 12 месяцев
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        
        const formatDate = (date: Date): string => {
          return date.toISOString().split('T')[0]; // Формат: YYYY-MM-DD
        };
        
        const dateB = formatDate(startDate);
        const dateE = formatDate(endDate);
        
        const path = `/workbase/hs/DeliveryWebService/GetPerevozki?DateB=${dateB}&DateE=${dateE}`;
        
        console.log('Making request to:', apiUrl + path);
        console.log('Period:', dateB, 'to', dateE);

        const url = new URL(apiUrl);
        const authString = Buffer.from(`${apiUsername}:${apiPassword}`).toString('base64');

        const options = {
          method: 'GET',
          hostname: url.hostname,
          path: path,
          headers: {
            'Authorization': `Basic ${authString}`,
          },
        };

        console.log('Request options:', JSON.stringify({ ...options, headers: { Authorization: 'Basic ***' } }, null, 2));

        const req = https.request(options, function (res: IncomingMessage) {
          const chunks: Buffer[] = [];

          console.log('Response status:', res.statusCode);
          console.log('Response headers:', res.headers);

          res.on('data', function (chunk: Buffer) {
            chunks.push(chunk);
          });

          res.on('end', function () {
            try {
              const body = Buffer.concat(chunks);
              const responseText = body.toString();
              
              console.log('Raw response:', responseText.substring(0, 500));

              if (res.statusCode !== 200) {
                console.log('API request failed:', res.statusCode, responseText);
                resolve({
                  success: false,
                  error: `Ошибка ${res.statusCode}: ${responseText || 'Неверный логин или пароль'}`,
                  data: null,
                });
                return;
              }

              const data = JSON.parse(responseText);
              console.log('API Response received, items count:', Array.isArray(data) ? data.length : 'not an array');
              console.log('First item:', Array.isArray(data) && data.length > 0 ? JSON.stringify(data[0], null, 2) : 'no items');

              resolve({
                success: true,
                data,
                error: null,
              });
            } catch (error) {
              console.error('Error parsing response:', error);
              resolve({
                success: false,
                error: 'Ошибка обработки ответа сервера',
                data: null,
              });
            }
          });

          res.on('error', function (error: Error) {
            console.error('Response error:', error);
            resolve({
              success: false,
              error: 'Ошибка получения ответа от сервера',
              data: null,
            });
          });
        });

        req.on('error', function (error: Error) {
          console.error('Request error:', error);
          resolve({
            success: false,
            error: 'Ошибка подключения к серверу',
            data: null,
          });
        });

        req.end();
      } catch (error) {
        console.error('API Error:', error);
        resolve({
          success: false,
          error: 'Ошибка подключения к серверу',
          data: null,
        });
      }
    });
  });
