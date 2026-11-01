import { bruit } from '../moteur/maths';
import { N, type Pinceau, teinte } from './tuiles-hd-outils';

/**
 * Les matières naturelles en haute définition : la roche, le sable, la glace et le socle (voir tuiles-hd-sols.ts). Pas de blocs
 * taillés : des pierres arrondies, des masses de tons irrégulières, tirées d'un bruit qui se répète exactement d'une tuile à l'autre (les tuiles voisines
 * se raccordent, on ne voit pas la grille), puis des détails propres à chaque case (fissures, éclats, grains).
 */

/** Un bruit doux de période N (la tuile), à `cellules` mailles par côté, de 0 à 1. */
function doux(x: number, y: number, cellules: number, graine: number): number {
  const pas = N / cellules;
  const gx = x / pas;
  const gy = y / pas;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const fx = gx - x0;
  const fy = gy - y0;
  const v = (i: number, j: number) =>
    bruit(
      (((x0 + i) % cellules) + cellules) % cellules,
      (((y0 + j) % cellules) + cellules) % cellules,
      graine,
    );
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = v(0, 0) + (v(1, 0) - v(0, 0)) * sx;
  const b = v(0, 1) + (v(1, 1) - v(0, 1)) * sx;
  return a + (b - a) * sy;
}

/** Deux octaves de bruit doux, de 0 à 1. */
const relief = (x: number, y: number, graine: number) =>
  doux(x, y, 4, graine) * 0.65 + doux(x, y, 8, graine + 1) * 0.35;

/** Remplit la tuile en tons, par paquets de 2 × 2 pixels d'art, selon le relief (posterisé : du pixel art, pas un dégradé). */
function masses(pi: Pinceau, tons: readonly string[], graine: number): void {
  for (let y = 0; y < N; y += 2)
    for (let x = 0; x < N; x += 2) {
      const r = relief(x, y, graine);
      const i = Math.min(tons.length - 1, Math.floor(r * tons.length * 1.15 - 0.08 * tons.length));
      pi.p(x, y, 2, 2, tons[Math.max(0, i)]!);
    }
}

/** Une fissure qui serpente, de `long` pas, à partir d'un point tiré de la graine ; un liseré clair dessous. */
function fissure(pi: Pinceau, graine: number, long: number, sombre: string, clair: string): void {
  let x = 6 + Math.floor(bruit(graine, 1, 81) * (N - 12));
  let y = 4 + Math.floor(bruit(graine, 2, 82) * (N / 2));
  for (let i = 0; i < long; i++) {
    pi.p(x, y, 1, 2, sombre);
    pi.p(x + 1, y + 1, 1, 1, clair);
    const r = bruit(graine, i, 83);
    x += r < 0.33 ? -1 : r < 0.66 ? 1 : 0;
    y += 1 + (bruit(i, graine, 84) < 0.3 ? 1 : 0);
    if (y >= N - 2 || x <= 1 || x >= N - 2) break;
  }
}

/**
 * La roche : des pierres arrondies de tailles variées, serrées dans une gangue sombre, chacune éclairée en haut à gauche et ombrée
 * en bas à droite. Le motif s'étend sur 2 × 2 tuiles et se répète sans couture : `quart` dit quel quart de ce motif peindre
 * (la parité de la case en x et en y), les tuiles voisines se raccordent exactement.
 */
export function roche(pi: Pinceau, quart: number): void {
  const P = 2 * N; // la période du motif
  const qx = (quart & 1) * N;
  const qy = (quart >> 1) * N;
  // la gangue : un gris brun sombre, piqué
  pi.p(0, 0, N, N, '#4a4650');
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(bruit(i, quart, 91) * N);
    const y = Math.floor(bruit(quart, i, 92) * N);
    pi.p(x, y, 1, 1, i % 2 ? '#3c3842' : '#57535e');
  }
  // les pierres : une par maille de 16 pixels d'art, décalée au hasard, de rayon variable
  const pas = 16;
  for (let gy = 0; gy < P / pas; gy++)
    for (let gx = 0; gx < P / pas; gx++) {
      const cx = gx * pas + 3 + bruit(gx, gy, 93) * (pas - 6);
      const cy = gy * pas + 3 + bruit(gy, gx, 94) * (pas - 6);
      const rx = 5 + bruit(gx, gy, 95) * 6;
      const ry = rx * (0.7 + bruit(gy, gx, 96) * 0.3);
      const v = bruit(gx + 7, gy + 3, 97);
      const base = v < 0.33 ? '#6c6874' : v < 0.66 ? '#77737f' : '#827e8a';
      // la pierre et ses copies (le motif se répète) : on ne peint que ce qui tombe dans ce quart
      for (const ox of [-P, 0, P])
        for (const oy of [-P, 0, P]) {
          const sx = cx + ox - qx;
          const sy = cy + oy - qy;
          if (sx + rx < 0 || sx - rx > N || sy + ry < 0 || sy - ry > N) continue;
          for (let y = Math.floor(sy - ry); y <= Math.ceil(sy + ry); y++)
            for (let x = Math.floor(sx - rx); x <= Math.ceil(sx + rx); x++) {
              if (x < 0 || y < 0 || x >= N || y >= N) continue;
              const dx = (x + 0.5 - sx) / rx;
              const dy = (y + 0.5 - sy) / ry;
              const d = dx * dx + dy * dy;
              if (d > 1) continue;
              let c = base;
              if (d > 0.78)
                c = '#34303a'; // le contour, là où la pierre s'enfonce dans la gangue
              else if (dx + dy < -0.75)
                c = teinte(base, 0.28); // l'éclat de lumière, en haut à gauche
              else if (dx + dy > 0.55) c = teinte(base, -0.25); // l'ombre, en bas à droite
              pi.p(x, y, 1, 1, c);
            }
        }
    }
}

/** Le sable : un ocre doux, des rides de vent qui ondulent, des grains clairs et sombres, un coquillage parfois. */
export function sable(pi: Pinceau, graine: number): void {
  masses(pi, ['#d4b26c', '#dcbc78', '#e3c47e', '#ebd08e'], 17);
  for (let k = 0; k < 4; k++) {
    const y0 = 8 + k * 14;
    for (let x = 0; x < N; x++) {
      const y = y0 + Math.round(Math.sin((x / N) * Math.PI * 2 + k) * 3);
      pi.p(x, y, 1, 1, '#c4a35e');
      pi.p(x, y - 1, 1, 1, '#f2dca4');
    }
  }
  pi.grain('#b8975a', 18, graine, 1);
  pi.grain('#fbeec4', 12, graine + 2, 1);
  if (graine === 1) {
    pi.p(40, 44, 4, 3, '#f4e2d4');
    pi.p(41, 44, 2, 1, '#ffffff');
  }
}

/** La glace : un bleu clair translucide, des veines claires en biais, des bulles, une fissure blanche. */
export function glace(pi: Pinceau, graine: number): void {
  masses(pi, ['#6fbde0', '#7fc8e8', '#8fd0ee', '#a6dcf3'], 27);
  // des veines claires en biais
  for (let k = 0; k < 3; k++) {
    const x0 = ((graine * 13 + k * 23) % N) - 10;
    for (let i = 0; i < 22; i++) pi.p(x0 + i, 6 + k * 18 + Math.floor(i / 2), 2, 1, 'rgba(240,252,255,0.75)');
  }
  pi.grain('#e8fbff', 8, graine + 4, 2);
  fissure(pi, graine + 31, 10, '#ffffff', '#5fa8c8');
}

/** Le socle (incassable) : une pierre sombre presque noire, des masses à peine marquées, des veines violettes qui luisent. */
export function socle(pi: Pinceau, graine: number): void {
  masses(pi, ['#1c1a21', '#232028', '#2b2731', '#34303b'], 37);
  fissure(pi, graine + 41, 16, '#4a3a63', '#6a5490');
  pi.grain('#3f3a48', 12, graine + 6, 1);
}
