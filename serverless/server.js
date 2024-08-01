import { jsx, jsxs } from 'react/jsx-runtime';
import {
  RemixServer,
  Outlet,
  Meta,
  Links,
  ScrollRestoration,
  Scripts,
} from '@remix-run/react';
import express from 'express';
import { createRequestHandler } from '@remix-run/express';
import serverless from 'serverless-http';
import { fileURLToPath } from 'url';
import path from 'path';
import { PassThrough } from 'stream';
import { createReadableStreamFromReadable } from '@remix-run/node';
import { renderToPipeableStream } from 'react-dom/server';
import { isbot } from 'isbot';
import { Response, Headers } from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUILD_DIR = path.join(__dirname, 'build');

const app = express();

// Serve static files from the /public directory
app.use(express.static(path.join(__dirname, '../public')));

// Utility function to convert Express headers to Fetch headers
const toFetchHeaders = (headers) => {
  const fetchHeaders = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    fetchHeaders.append(key, value);
  }
  return fetchHeaders;
};

// Handle Remix SSR
app.all('*', async (req, res) => {
  const loadContext = {}; // Add your load context if needed
  const remixContext = BUILD_DIR;

  const responseHeaders = new Headers();
  responseHeaders.set('Content-Type', 'text/html');

  const handleRequest = async (
    request,
    responseStatusCode,
    responseHeaders,
    remixContext,
    loadContext
  ) => {
    return isbot(request.headers.get('user-agent') || '')
      ? handleBotRequest(
          request,
          responseStatusCode,
          responseHeaders,
          remixContext
        )
      : handleBrowserRequest(
          request,
          responseStatusCode,
          responseHeaders,
          remixContext
        );
  };

  const handleBotRequest = (
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  ) => {
    return new Promise((resolve, reject) => {
      let shellRendered = false;
      const { pipe, abort } = renderToPipeableStream(
        jsx(RemixServer, {
          context: remixContext,
          url: request.url,
          abortDelay: 5000,
        }),
        {
          onAllReady() {
            shellRendered = true;
            const body = new PassThrough();
            const stream = createReadableStreamFromReadable(body);
            responseHeaders.set('Content-Type', 'text/html');
            resolve(
              new Response(stream, {
                headers: responseHeaders,
                status: responseStatusCode,
              })
            );
            pipe(body);
          },
          onShellError(error) {
            reject(error);
          },
          onError(error) {
            responseStatusCode = 500;
            if (shellRendered) {
              console.error(error);
            }
          },
        }
      );
      setTimeout(abort, 5000);
    });
  };

  const handleBrowserRequest = (
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  ) => {
    return new Promise((resolve, reject) => {
      let shellRendered = false;
      const { pipe, abort } = renderToPipeableStream(
        jsx(RemixServer, {
          context: remixContext,
          url: request.url,
          abortDelay: 5000,
        }),
        {
          onShellReady() {
            shellRendered = true;
            const body = new PassThrough();
            const stream = createReadableStreamFromReadable(body);
            responseHeaders.set('Content-Type', 'text/html');
            resolve(
              new Response(stream, {
                headers: responseHeaders,
                status: responseStatusCode,
              })
            );
            pipe(body);
          },
          onShellError(error) {
            reject(error);
          },
          onError(error) {
            responseStatusCode = 500;
            if (shellRendered) {
              console.error(error);
            }
          },
        }
      );
      setTimeout(abort, 5000);
    });
  };

  const request = {
    url: req.url,
    headers: toFetchHeaders(req.headers), // Convert headers to Fetch headers
    method: req.method,
  };

  const response = await handleRequest(
    request,
    200,
    responseHeaders,
    remixContext,
    loadContext
  );

  res.status(response.status).send(await response.text());
});

export const handler = serverless(app);

if (process.env.NODE_ENV !== 'production') {
  app.listen(5173, () => {
    console.log('Server is running on http://localhost:5173');
  });
}
