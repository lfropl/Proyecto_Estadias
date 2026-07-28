import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');
const BACKEND_URL = process.env['BACKEND_URL'] || 'http://localhost:3000';

const app = express();
const angularApp = new AngularNodeAppEngine();

// ─── BFF Proxy: reenvía auth y api al backend con JWT ───
app.use(express.json());

// Proxy middleware que intercepta peticiones a /auth y /api
app.use((req, res, next) => {
  const url = req.originalUrl || req.url;
  
  if (url.startsWith('/auth/') || url.startsWith('/api/')) {
    handleProxy(req, res).catch(() => {
      res.status(502).json({ message: 'Error de conexión con el backend.' });
    });
    return;
  }
  
  next();
});

async function handleProxy(req: express.Request, res: express.Response) {
  const target = `${BACKEND_URL}${req.originalUrl}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (req.headers['authorization']) {
    headers['Authorization'] = req.headers['authorization'] as string;
  }

  const body = req.method !== 'GET' && req.method !== 'HEAD' 
    ? JSON.stringify(req.body) 
    : undefined;

  const backendRes = await fetch(target, {
    method: req.method,
    headers,
    body,
  });

  const data = await backendRes.json();
  res.status(backendRes.status).json(data);
}

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);