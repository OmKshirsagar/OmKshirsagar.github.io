import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import yaml from '@rollup/plugin-yaml';

// https://astro.build/config
export default defineConfig({
  site: 'https://omkshirsagar.github.io',
  base: '/',
  output: 'static',
  integrations: [react()],
  vite: {
    plugins: [yaml()],
    assetsInclude: ['**/*.vox'],
  },
  build: {
    assets: '_astro',
  },
});
