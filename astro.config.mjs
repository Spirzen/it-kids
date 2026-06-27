import {defineConfig} from 'astro/config';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import patchAstroRedirects from '../it-portals/packages/shared/src/integrations/patch-astro-redirects.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const site = process.env.IT_KIDS_SITE ?? 'http://localhost:4333';
const base = process.env.IT_KIDS_BASE ?? '/';

export default defineConfig({
  site,
  base,
  output: 'static',
  integrations: [patchAstroRedirects()],
  vite: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  },
});
