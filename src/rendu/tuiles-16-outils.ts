import { bruit } from '../moteur/maths';
import { D, type Pinceau, teinte } from './tuiles-hd-outils';

/** Les outils des motifs 16-bit (voir tuiles-16.ts) : le gros pixel, le bloc, le grain et les masses de tons. */

/** Ce qu'un motif sait de sa case : les variantes et le décor. */
export interface Contexte {
  graine: number;
  terre: string;
  bouts: number;
  vieux: boolean;
  casse: number;
  console: boolean;
  allumee: boolean;
  urbain: boolean;
  /** la parité de la case (la roche et les matières naturelles se raccordent sur 2 × 2 tuiles) */
  quart: number;
}

/** Un gros pixel (un pixel du jeu) : `q(x, y, w, h)` en pixels du jeu. */
export const q = (pi: Pinceau, x: number, y: number, w: number, h: number, c: string) =>
  pi.p(x * D, y * D, w * D, h * D, c);

/** Un bloc à la façon 16-bit : sa face, une arête claire en haut et à gauche, sombre en bas et à droite. */
export function bloc(pi: Pinceau, x: number, y: number, w: number, h: number, base: string): void {
  q(pi, x, y, w, h, base);
  q(pi, x, y, w, 1, teinte(base, 0.25));
  q(pi, x, y + 1, 1, h - 1, teinte(base, 0.1));
  q(pi, x, y + h - 1, w, 1, teinte(base, -0.3));
  q(pi, x + w - 1, y + 1, 1, h - 1, teinte(base, -0.18));
}

/** Des gros pixels épars d'une couleur, tirés d'un bruit fixe. */
export function points(pi: Pinceau, c: string, n: number, graine: number, sel: number): void {
  for (let i = 0; i < n; i++)
    q(pi, Math.floor(bruit(i, graine, sel) * 16), Math.floor(bruit(graine, i, sel + 1) * 16), 1, 1, c);
}

/** Les tons d'une matière naturelle, gros pixel par gros pixel, d'un bruit doux qui se raccorde sur 2 × 2 tuiles. */
export function masses(pi: Pinceau, tons: readonly string[], quart: number, sel: number): void {
  const ox = (quart & 1) * 16;
  const oy = (quart >> 1) * 16;
  const v = (i: number, j: number) => bruit(i % 4, j % 4, sel);
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const gx = (x + ox) / 8;
      const gy = (y + oy) / 8;
      const [i, j] = [Math.floor(gx), Math.floor(gy)];
      const [fx, fy] = [gx - i, gy - j];
      const a = v(i, j) + (v(i + 1, j) - v(i, j)) * fx;
      const b = v(i, j + 1) + (v(i + 1, j + 1) - v(i, j + 1)) * fx;
      const r = a + (b - a) * fy + (bruit(x + ox, y + oy, sel + 5) - 0.5) * 0.08;
      q(pi, x, y, 1, 1, tons[Math.max(0, Math.min(tons.length - 1, Math.floor(r * tons.length)))]!);
    }
}
