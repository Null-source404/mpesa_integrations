import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import billRouter from './server/routes/bill.js';
import { securityHeadersMiddleware } from './server/services/security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.disable('x-powered-by');
  app.use(securityHeadersMiddleware);
  app.use(cors());
  app.use(express.json({ limit: '32kb' }));

  // API routes
  app.use('/api', billRouter);

  // Graceful JSON syntax / API error handler that never leaks stack traces
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      res.status(400).json({
        message:
          'We could not process that request. Please check your details and try again.',
      });
      return;
    }
    next(err);
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });

    // Prevent Vite 8 client from throwing WebSocket or SendBeforeConnectError when HMR is disabled
    app.get('/@vite/client', async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const transformed = await vite.transformRequest('/@vite/client');
        if (transformed?.code) {
          const patchedCode = transformed.code
            .replace(/await wsTransport\.connect\(handlers\);/g, 'await Promise.resolve();')
            .replace(/await wsTransport\.disconnect\(\);/g, 'await Promise.resolve();')
            .replace(/wsTransport\.send\(data\);/g, 'void 0;');
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache');
          res.status(200).send(patchedCode);
          return;
        }
      } catch {
        // Fall through to default Vite middleware
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SplitPesa server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
