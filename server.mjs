import express from 'express';
import { createRequestHandler } from '@remix-run/express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as remixBuild from './build/server/index.js';

const PORT = process.env.PORT || 3000;

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files
app.use(express.static('./public'));

// Serve static files from the build/client directory
app.use(express.static(path.join(__dirname, './build/client')));

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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
