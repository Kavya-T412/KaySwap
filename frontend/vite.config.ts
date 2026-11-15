import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function apiDevPlugin() {
  return {
    name: 'kayswap-api-dev-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url || '';
        if (!url.startsWith('/api/')) return next();

        try {
          const { getAllReviews, saveReview, clearAllReviews, getHealthStatus } = await import('./dbService.js');

          if (url === '/api/health' && req.method === 'GET') {
            const health = await getHealthStatus();
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify(health));
            return;
          }

          if (url.startsWith('/api/feedbacks')) {
            if (req.method === 'GET') {
              const items = await getAllReviews();
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify(items));
              return;
            }

            if (req.method === 'POST') {
              let bodyStr = '';
              req.on('data', (chunk: any) => {
                bodyStr += chunk;
              });
              req.on('end', async () => {
                try {
                  const body = JSON.parse(bodyStr || '{}');
                  const result = await saveReview(body);
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 200;
                  res.end(JSON.stringify(result));
                } catch (e: any) {
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: e.message }));
                }
              });
              return;
            }

            if (req.method === 'DELETE') {
              const result = await clearAllReviews();
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify(result));
              return;
            }
          }
        } catch (err: any) {
          console.error('[Vite API Middleware Error]:', err.message);
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiDevPlugin()],
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer/',
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
