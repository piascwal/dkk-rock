import { G } from '../jeu/vue';
import type { Pinceau } from './pinceau';

type Dessin = (p: Pinceau, e: number, f: number) => void;

/** Agrandit un dessin d'un facteur entier. */
const zoom =
  (p: Pinceau, k: number): Pinceau =>
  (x, y, w, h, c) =>
    p(x * k, y * k, w * k, h * k, c);

export const DESSINS_BOSS: Partial<Record<number, Dessin>> = {
  // le Yéti Alpha : un yéti deux fois plus grand, chaîne en or et lunettes de soleil
  [G.YETI_ALPHA]: (p0, e) => {
    const p = zoom(p0, 2);
    const h = e === 1 ? 1 : 0;
    p(-7, -16 + h, 14, 14, '#f4f9ff');
    p(-7, -4, 14, 2, '#c8d8ea');
    p(-6, -2, 4, 2, '#dfe9f5');
    p(2, -2, 4, 2, '#dfe9f5');
    p(-1, -14 + h, 6, 5, '#5f87c8');
    p(-1, -13 + h, 6, 1, '#111');
    p(1, -10 + h, 3, 1, '#2a3a5a');
    p(-4, -9 + h, 8, 1, '#ffd23f');
    p(-1, -8 + h, 2, 1, '#ffd23f');
    p(-8, -15 + h, 2, 4, '#ff4fd8');
    p(6, -15 + h, 2, 4, '#ff4fd8');
    p(-7, -18 + h, 14, 1, '#ff4fd8');
    p(6, -9, 3, 5, '#f4f9ff');
    p(-9, -9, 3, 5, '#f4f9ff');
    if (e === 2) {
      p(-9, -14, 3, 5, '#f4f9ff');
      p(6, -14, 3, 5, '#f4f9ff');
    }
  },
  // DJ Boucle derrière ses platines
  [G.DJ]: (p, e, f) => {
    const bras = e === 1;
    // le DJ
    p(-5, -28, 10, 9, '#2b0a3d');
    p(-4, -36, 8, 8, '#e0ac69');
    p(-4, -38, 8, 3, '#111');
    p(-4, -33, 8, 2, f % 20 < 10 ? '#ff4fd8' : '#3fe0ff');
    p(-6, -35, 2, 5, '#111');
    p(4, -35, 2, 5, '#111');
    p(-5, -37, 10, 1, '#333');
    p(bras ? 5 : 4, bras ? -40 : -27, 2, bras ? 12 : 6, '#2b0a3d');
    if (bras) p(5, -42, 3, 2, '#e0ac69');
    // les platines
    p(-18, -19, 36, 19, '#151515');
    p(-18, -19, 36, 2, '#444');
    for (const x of [-14, 6]) {
      p(x, -22, 9, 3, '#333');
      p(x + 3, -22, 3, 1, f % 8 < 4 ? '#ddd' : '#999');
    }
    const leds = ['#ff4fd8', '#3fe0ff', '#7cfc7c', '#ffd23f'];
    for (let i = 0; i < 8; i++) p(-15 + i * 4, -12, 2, 2, leds[(i + Math.floor(f / 8)) % 4]!);
    p(-12, -6, 24, 3, '#2a2a2a');
  },
  // une enceinte : la membrane pulse sur le temps
  [G.ENCEINTE]: (p, e) => {
    p(-10, -30, 20, 30, '#111');
    p(-9, -29, 18, 28, '#1f1f1f');
    const r = e === 1 ? 7 : 6;
    p(-r, -12 - r, r * 2, r * 2, '#000');
    p(-2, -14, 4, 4, '#444');
    p(-3, -27, 6, 6, '#000');
    p(-1, -25, 2, 2, '#444');
    p(-9, -29, 18, 1, '#ff4fd8');
  },
};
