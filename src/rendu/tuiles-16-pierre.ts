import { bruit } from '../moteur/maths';
import { COTE } from './bords-tuiles';
import { bloc, q } from './tuiles-16-outils';
import { D, N, type Pinceau, teinte } from './tuiles-hd-outils';

/**
 * La pierre calcaire dans le style 16-bit (voir tuiles-16.ts) : des moellons usés (coins écornés, arêtes émoussées, taches,
 * mousse dans les joints), et sur le vide un bord irrégulier où les pierres dépassent un peu les unes des autres.
 */

const JOINT = '#7c6e55';
const TONS = ['#bdb59d', '#c2b28e', '#cfc09c', '#d4bf94', '#d9cba8'];

interface Moellon {
  x: number;
  y: number;
  w: number;
  h: number;
  base: string;
  id: number;
}

/** Les moellons qui tombent dans la case : un appareil de 2 × 2 tuiles (deux assises par tuile), qui se raccorde d'une case à l'autre. */
function moellons(quart: number): Moellon[] {
  const [ox, oy] = [(quart & 1) * 16, (quart >> 1) * 16];
  const rangs = [0, 7, 16, 23, 32];
  const tous: Moellon[] = [];
  for (let r = 0; r < 4; r++) {
    const y = rangs[r]! - oy;
    const h = rangs[r + 1]! - rangs[r]! - 1;
    if (y + h <= 0 || y >= 16) continue;
    const debut = Math.floor(bruit(r, 0, 111) * 6);
    for (let x = debut, k = 0; x < debut + 32; k++) {
      let w = 8 + Math.floor(bruit(r, k, 112) * 4);
      if (debut + 32 - x < w + 6) w = debut + 32 - x;
      const base = TONS[Math.floor(bruit(r, k, 113) * TONS.length)]!;
      for (const d of [-32, 0, 32]) {
        const sx = x + d - ox;
        if (sx + w > 0 && sx < 16) tous.push({ x: sx, y, w: w - 1, h, base, id: r * 16 + k });
      }
      x += w;
    }
  }
  return tous;
}

/** Un moellon usé, dans le rectangle donné (en pixels du jeu) : le bloc, puis le temps qui a passé dessus. */
function moellon(pi: Pinceau, m: Moellon, x: number, y: number, w: number, h: number, mousse = true): void {
  bloc(pi, x, y, w, h, m.base);
  const r = (sel: number) => bruit(m.id, sel, 120);
  const dans = (k: number, n: number) => Math.floor(r(k) * Math.max(1, n));
  // des taches plus sombres et plus claires, une piqûre
  q(pi, x + 1 + dans(1, w - 3), y + 1 + dans(2, h - 3), 2, 1, teinte(m.base, -0.1));
  q(pi, x + 1 + dans(3, w - 2), y + 2 + dans(4, h - 4), 1, 1, teinte(m.base, 0.12));
  q(pi, x + 2 + dans(5, w - 4), y + 2 + dans(6, h - 4), 1, 1, teinte(m.base, -0.28));
  // l'arête du haut émoussée par endroits
  q(pi, x + 1 + dans(7, w - 2), y, 1 + dans(8, 2), 1, m.base);
  // un coin écorné
  const coin = r(9);
  if (coin < 0.3) q(pi, x + w - 1, y, 1, 1, JOINT);
  else if (coin < 0.55) q(pi, x, y + h - 1, 1, 1, JOINT);
  else if (coin < 0.7) q(pi, x, y, 1, 1, JOINT);
  // de la mousse dans le joint du dessous, de temps en temps
  if (mousse && r(10) < 0.18) q(pi, x + 1 + dans(11, w - 3), y + h, 2, 1, '#6f7a3e');
}

export function pierre16(pi: Pinceau, quart: number): void {
  q(pi, 0, 0, 16, 16, JOINT);
  for (const m of moellons(quart)) moellon(pi, m, m.x, m.y, m.w, m.h);
}

/**
 * Le bord d'un mur de pierre qui donne sur le vide : pas une coupe lisse, des moellons qui dépassent un peu les uns des autres
 * (chacun, au hasard, reste au ras du bord ou recule d'un ou deux pixels du jeu sur chaque côté libre). Derrière, on voit
 * ce qu'il y a : le ciel, ou la paroi de fond (voir dessin-tuiles.ts).
 */
export function bordPierre16(pi: Pinceau, cotes: number, quart: number): void {
  const [g, d, h, b] = [COTE.GAUCHE, COTE.DROITE, COTE.HAUT, COTE.BAS].map((c) => (cotes & c) !== 0);
  if (g) pi.efface(0, 0, 2 * D, N);
  if (d) pi.efface(N - 2 * D, 0, 2 * D, N);
  if (h) pi.efface(0, 0, N, 2 * D);
  if (b) pi.efface(0, N - 2 * D, N, 2 * D);
  for (const m of moellons(quart)) {
    const recul = (sel: number) => {
      const v = bruit(m.id, quart >> 1, sel);
      return v < 0.4 ? 0 : v < 0.75 ? 1 : 2;
    };
    const tg = g && m.x <= 1;
    const td = d && m.x + m.w >= 15;
    const th = h && m.y <= 1;
    const tb = b && m.y + m.h >= 14;
    if (!(tg || td || th || tb)) continue;
    const x1 = tg ? recul(114) : m.x;
    const x2 = td ? 16 - recul(115) : m.x + m.w;
    const y1 = th ? recul(116) : m.y;
    const y2 = tb ? 15 - recul(117) : m.y + m.h;
    const [ex, ey] = [Math.max(0, m.x), Math.max(0, m.y)];
    pi.efface(ex * D, ey * D, (Math.min(16, m.x + m.w) - ex) * D, (Math.min(16, m.y + m.h) - ey) * D);
    moellon(pi, m, x1, y1, x2 - x1, y2 - y1, false);
  }
}
