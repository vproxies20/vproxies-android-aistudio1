import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'proxy-api-relay',
        configureServer(server) {
          server.middlewares.use('/api/fetch-proxy-api', async (req, res) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', (chunk) => {
                body += chunk;
              });
              req.on('end', async () => {
                try {
                  const { url, apiKey } = JSON.parse(body || '{}');
                  if (!url) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'URL is required' }));
                    return;
                  }
                  const headers: Record<string, string> = {
                    'User-Agent': 'VProxies-Client/2.4.0',
                    Accept: 'application/json, text/plain, */*',
                  };
                  if (apiKey) {
                    headers['Authorization'] = `Bearer ${apiKey}`;
                    headers['X-API-Key'] = apiKey;
                  }
                  const response = await fetch(url, { headers });
                  const contentType = response.headers.get('content-type') || '';
                  let data: any;
                  if (contentType.includes('application/json')) {
                    data = await response.json();
                  } else {
                    data = await response.text();
                  }
                  res.statusCode = response.status;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ ok: response.ok, status: response.status, data }));
                } catch (err: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message || 'Failed to fetch proxy API' }));
                }
              });
            } else {
              res.statusCode = 405;
              res.end();
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
