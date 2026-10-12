import { defineConfig } from 'vite';

// GitHub Pages sert le jeu sous /dkk-rock/ ; en développement, à la racine.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/dkk-rock/' : '/',
  build: { target: 'es2022' },
}));
