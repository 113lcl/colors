import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://113lcl.github.io',
  base: '/',
  build: {
    format: 'directory',
  },
  devToolbar: {
    enabled: false,
  },
});
