import { TUILE } from '../config';
import { bruit } from '../moteur/maths';
import { T } from '../monde/tuiles';
import type { Theme } from './themes';

/** Les outils des textures de tuiles (voir atlas-tuiles.ts), et les pierres : la pierre calcaire de Provence, la pierre de taille. */
export type Peintre = (c: CanvasRenderingContext2D, v: number, th: Theme) => void;

export const px = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, coul: string) => {
  c.fillStyle = coul;
  c.fillRect(x, y, w, h);
};

/** Mouchetis : quelques pixels plus clairs ou plus sombres, toujours les mêmes pour une variante. */
export function moucheture(
  c: CanvasRenderingContext2D,
  v: number,
  coul: string,
  n: number,
  graine: number,
): void {
  for (let i = 0; i < n; i++) {
    const x = Math.floor(bruit(i, v, graine) * TUILE);
    const y = Math.floor(bruit(v, i, graine + 1) * TUILE);
    px(c, x, y, 1 + (i % 2), 1, coul);
  }
}

export const PEINTRES_PIERRES: Partial<Record<number, Peintre>> = {
  // la pierre calcaire de Provence : des moellons clairs, inégaux, aux joints de mortier
  [T.PIERRE]: (c, v) => {
    px(c, 0, 0, 16, 16, '#a8987a');
    const rangs = v % 2 ? [0, 5, 11] : [0, 6, 10];
    rangs.forEach((y0, i) => {
      const h = (rangs[i + 1] ?? 16) - y0 - 1;
      for (let x = (i + v) % 2 ? -4 : 0; x < 16; x += 7 + ((i + v) % 3)) {
        px(c, x + 1, y0 + 1, 6 + ((x + v) % 2), h, i % 2 ? '#d2c4a2' : '#c8b896');
        px(c, x + 1, y0 + 1, 6, 1, '#e2d6b8');
      }
    });
    moucheture(c, v, '#9a8a6a', 5, 7);
  },
  // la pierre de taille : deux rangs de gros blocs de granit gris, joints sombres, arêtes taillées ; elle a l'air de ce qu'elle est,
  // presque incassable
  [T.GRANIT]: (c, v) => {
    px(c, 0, 0, 16, 16, '#34343e');
    for (const [y0, dx] of [
      [0, v % 2 ? 8 : 0],
      [8, v % 2 ? 0 : 8],
    ] as const)
      for (const x0 of [dx - 16, dx - 8, dx, dx + 8]) {
        if (x0 >= 16 || x0 + 8 <= 0) continue;
        px(c, x0 + 1, y0 + 1, 7, 6, '#6e6e7a');
        px(c, x0 + 1, y0 + 1, 7, 1, '#9a9aa8');
        px(c, x0 + 1, y0 + 1, 1, 6, '#86869a');
        px(c, x0 + 1, y0 + 6, 7, 1, '#4c4c58');
        px(c, x0 + 7, y0 + 1, 1, 6, '#55556a');
      }
    moucheture(c, v, '#5e5e6c', 6, 14);
  },
};
