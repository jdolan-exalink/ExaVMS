import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/proxy/casa': {
            target: 'http://10.1.1.252:5000',
            changeOrigin: true,
            secure: false,
            ws: true,
            rewrite: (path) => path.replace(/^\/proxy\/casa/, ''),
            configure: (proxy, _options) => {
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                console.log(`[PROXY casa] ${req.method} ${req.url} -> ${proxyReq.path}`);
              });
              proxy.on('proxyRes', (proxyRes, req, res) => {
                console.log(`[PROXY casa] Response: ${proxyRes.statusCode} for ${req.url}`);
              });
              proxy.on('error', (err, req, res) => {
                console.error(`[PROXY casa] ERROR:`, err.message);
              });
            }
          },
          '/proxy/server1': {
            target: 'http://10.1.1.252:5000',
            changeOrigin: true,
            secure: false,
            ws: false,
            rewrite: (path) => path.replace(/^\/proxy\/server1/, ''),
            configure: (proxy, _options) => {
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                console.log(`[PROXY server1] ${req.method} ${req.url} -> ${proxyReq.path}`);
              });
              proxy.on('proxyRes', (proxyRes, req, res) => {
                console.log(`[PROXY server1] Response: ${proxyRes.statusCode} for ${req.url}`);
              });
              proxy.on('error', (err, req, res) => {
                console.error(`[PROXY server1] ERROR:`, err.message);
              });
            }
          },
                    '/proxy/casa_stream': {
            target: 'http://10.1.1.252:1984',
            changeOrigin: true,
            secure: false,
            ws: false,
            rewrite: (path) => path.replace(/^\/proxy\/casa_stream/, ''),
            configure: (proxy, _options) => {
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                console.log(`[PROXY casa_stream] ${req.method} ${req.url} -> ${proxyReq.path}`);
              });
              proxy.on('proxyRes', (proxyRes, req, res) => {
                console.log(`[PROXY casa_stream] Response: ${proxyRes.statusCode} for ${req.url}`);
              });
              proxy.on('error', (err, req, res) => {
                console.error(`[PROXY casa_stream] ERROR:`, err.message);
              });
            }
          },
          '/proxy/server1_stream': {
            target: 'http://10.1.1.252:1984',
            changeOrigin: true,
            secure: false,
            ws: false,
            rewrite: (path) => path.replace(/^\/proxy\/server1_stream/, ''),
            configure: (proxy, _options) => {
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                console.log(`[PROXY server1_stream] ${req.method} ${req.url} -> ${proxyReq.path}`);
              });
              proxy.on('proxyRes', (proxyRes, req, res) => {
                console.log(`[PROXY server1_stream] Response: ${proxyRes.statusCode} for ${req.url}`);
              });
              proxy.on('error', (err, req, res) => {
                console.error(`[PROXY server1_stream] ERROR:`, err.message);
              });
            }
          },
          '/proxy/casa_webrtc': {
            target: 'ws://10.1.1.252:1984',
            changeOrigin: true,
            secure: false,
            ws: true,
            rewrite: (path) => path.replace(/^\/proxy\/casa_webrtc/, ''),
            configure: (proxy, _options) => {
              proxy.on('proxyReqWs', (proxyReq, req, socket, options, head) => {
                console.log(`[PROXY casa_webrtc] WS ${req.method} ${req.url} -> ws://10.1.1.252:1984${req.url.replace('/proxy/casa_webrtc', '')}`);
              });
              proxy.on('error', (err, req, res) => {
                console.error(`[PROXY casa_webrtc] ERROR:`, err.message);
              });
            }
          },
          '/proxy/casa_auth': {
            target: 'https://10.1.1.252:8971',
            changeOrigin: true,
            secure: false,
            ws: true,
            rewrite: (path) => path.replace(/^\/proxy\/casa_auth/, ''),
            configure: (proxy, _options) => {
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                console.log(`[PROXY casa_auth] ${req.method} ${req.url} -> ${proxyReq.path}`);
                // Forward cookies from the browser
                if (req.headers.cookie) {
                  proxyReq.setHeader('Cookie', req.headers.cookie);
                  console.log(`[PROXY casa_auth] Forwarding cookies`);
                }
                proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
                proxyReq.setHeader('Accept', 'application/json, text/plain, */*');
              });
              proxy.on('proxyRes', (proxyRes, req, res) => {
                console.log(`[PROXY casa_auth] Response: ${proxyRes.statusCode} for ${req.url}`);
                // Forward Set-Cookie headers back to the browser
                const setCookie = proxyRes.headers['set-cookie'];
                if (setCookie) {
                  res.setHeader('Set-Cookie', setCookie);
                  console.log(`[PROXY casa_auth] Setting cookies:`, setCookie);
                }
              });
              proxy.on('error', (err, req, res) => {
                console.error(`[PROXY casa_auth] ERROR:`, err.message);
              });
            }
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
