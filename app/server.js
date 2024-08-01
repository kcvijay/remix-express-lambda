// import express from 'express';
// import { createRequestHandler } from '@remix-run/express';
// import * as remixBuild from './build';

// let app = express();

// app.use(express.static('public'));

// app.all(
//   '*',
//   createRequestHandler({
//     build: remixBuild,
//     getLoadContext() {
//       // Whatever you return here will be passed as `context` to your loaders
//       // and actions.
//     },
//   })
// );

// let port = process.env.PORT || 3000;

// app.listen(port, () => {
//   console.log(`Express server started on http://localhost:${port}`);
// });
// server.js
import express from 'express';
import { createRequestHandler } from '@remix-run/express';
import serverless from 'serverless-http';
import path from 'path';
import { fileURLToPath } from 'url';
import * as remixBuild from '../build/server/index.js';

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files
app.use(express.static('../public'));

// Serve static files from the build/client directory
app.use(express.static(path.join(__dirname, '../build/client')));

// Remix SSR handler
app.all(
  '*',
  createRequestHandler({
    build: remixBuild,
    getLoadContext() {
      return {};
    },
  })
);

export const handler = serverless(app);

if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
  });
}
