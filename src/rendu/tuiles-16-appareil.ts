import { T } from '../monde/tuiles';
import { bruit } from '../moteur/maths';
import { COTE } from './bords-tuiles';
import { bloc, q } from './tuiles-16-outils';
import { D, N, type Pinceau, teinte } from './tuiles-hd-outils';

/**
 * Les murs appareillés dans le style 16-bit (voir tuiles-16.ts) : la pierre calcaire et le granit. Des blocs usés
 * (taches, piqûres, arêtes émoussées, coins écornés ; la pierre, la plus vieille, a des moellons déformés, de la mousse et
 * parfois un trou), et sur le vide un bord irrégulier où les blocs dépassent un peu les uns des autres.
 */

interface Bloc {
  x: number;
  y: number;
  w: number;
  h: number;
  base: string;
  id: number;
}

interface Appareil {
  joint: string;
  /** de combien de pixels du jeu un bloc peut reculer sur le vide */
  recul: number;
  /** la pierre : moellons déformés, mousse, trous */
  vieux: boolean;
  /** les rangées : leur haut (le dernier est le bas du motif), la largeur des blocs, et la période en x */
  blocs: (quart: number, graine: number) => Bloc[];
}

/** Des rangées de blocs (le haut de chaque rangée dans `rangs`, la largeur de chaque bloc tirée par `largeur`), sur un motif de `P` × `P` pixels du jeu. */
function rangees(
  rangs: readonly number[],
  P: number,
  largeur: (r: number, k: number) => number,
  debut: (r: number) => number,
  tons: readonly string[],
  sel: number,
) {
  return (quart: number, graine: number): Bloc[] => {
    const [ox, oy] = P > 16 ? [(quart & 1) * 16, (quart >> 1) * 16] : [0, 0];
    const tous: Bloc[] = [];
    for (let r = 0; r + 1 < rangs.length; r++) {
      const y = rangs[r]! - oy;
      const h = rangs[r + 1]! - rangs[r]! - 1;
      if (y + h <= 0 || y >= 16) continue;
      const x0 = debut(r);
      for (let x = x0, k = 0; x < x0 + P; k++) {
        let w = largeur(r, k);
        if (x0 + P - x < w + 6) w = x0 + P - x;
        const id = r * 16 + k + (P > 16 ? 0 : graine * 64);
        const base = tons[Math.floor(bruit(id, r, sel) * tons.length)]!;
        for (const d of [-P, 0, P]) {
          const sx = x + d - ox;
          if (sx + w > 0 && sx < 16) tous.push({ x: sx, y, w: w - 1, h, base, id });
        }
        x += w;
      }
    }
    return tous;
  };
}

const PIERRE_TONS = ['#b8ae94', '#c2b28e', '#cfc09c', '#d4bf94', '#d9cba8', '#c9bd9f'];
const PIERRE: Appareil = {
  joint: '#7c6e55',
  recul: 2,
  vieux: true,
  blocs: rangees(
    [0, 7, 16, 23, 32],
    32,
    (r, k) => 8 + Math.floor(bruit(r, k, 112) * 4),
    (r) => Math.floor(bruit(r, 0, 111) * 6),
    PIERRE_TONS,
    113,
  ),
};

const GRANIT_TONS = ['#6a6a76', '#6e6e7a', '#767684', '#72727e'];
const GRANIT: Appareil = {
  joint: '#30303a',
  recul: 2,
  vieux: false,
  blocs: rangees(
    [0, 8, 16],
    16,
    () => 8,
    (r) => (r % 2 ? -4 : 0),
    GRANIT_TONS,
    67,
  ),
};

const APPAREILS: Partial<Record<number, Appareil>> = {
  [T.PIERRE]: PIERRE,
  [T.GRANIT]: GRANIT,
};

/** Un bloc usé, dans le rectangle donné (en pixels du jeu) : le bloc, puis le temps qui a passé dessus. */
function abime(
  pi: Pinceau,
  a: Appareil,
  m: Bloc,
  x: number,
  y: number,
  w: number,
  h: number,
  bord = false,
): void {
  const r = (sel: number) => bruit(m.id, sel, 120);
  const dans = (k: number, n: number) => Math.floor(r(k) * Math.max(1, n));
  // un trou : la pierre est tombée, il reste le creux sombre et quelques gravats
  if (a.vieux && !bord && r(20) < 0.06) {
    q(pi, x, y, w, h, '#5a4e3c');
    q(pi, x, y, w, 1, '#3e3528');
    q(pi, x, y + h - 1, w, 1, '#8a7a5e');
    q(pi, x + 1 + dans(21, w - 3), y + h - 2, 2, 1, '#a8987a');
    return;
  }
  bloc(pi, x, y, w, h, m.base);
  q(pi, x + 1 + dans(1, w - 3), y + 1 + dans(2, h - 3), 2, 1, teinte(m.base, -0.1));
  q(pi, x + 1 + dans(3, w - 2), y + 1 + dans(4, h - 2), 1, 1, teinte(m.base, 0.12));
  q(pi, x + 1 + dans(5, w - 2), y + 1 + dans(6, h - 2), 1, 1, teinte(m.base, -0.28));
  q(pi, x + 1 + dans(7, w - 2), y, 1 + dans(8, 2), 1, m.base);
  // les coins écornés : un au plus pour le granit, plusieurs pour les vieux moellons, parfois en double marche
  const coins: [number, number, number, number][] = [
    [x, y, 1, 1],
    [x + w - 1, y, -1, 1],
    [x, y + h - 1, 1, -1],
    [x + w - 1, y + h - 1, -1, -1],
  ];
  coins.forEach(([cx, cy, sx, sy], i) => {
    const v = r(9 + i);
    if (v > (a.vieux ? 0.5 : i === 0 ? 0.3 : 0)) return;
    q(pi, cx, cy, 1, 1, a.joint);
    if (a.vieux && v < 0.15 && w > 4 && h > 4) {
      q(pi, cx + sx, cy, 1, 1, a.joint);
      q(pi, cx, cy + sy, 1, 1, a.joint);
    }
  });
  if (a.vieux) {
    // un creux dans l'arête du haut, une deuxième piqûre, de la mousse dans le joint du dessous
    if (r(14) < 0.3) q(pi, x + 2 + dans(15, w - 5), y, 2, 1, a.joint);
    q(pi, x + 1 + dans(16, w - 2), y + 1 + dans(17, h - 2), 1, 1, teinte(m.base, -0.22));
    if (!bord && r(18) < 0.2) q(pi, x + 1 + dans(19, w - 3), y + h, 2, 1, '#6f7a3e');
  }
}

/** Peint le mur appareillé `t` (pierre, granit) ; faux si ce n'en est pas un. */
export function appareil16(pi: Pinceau, t: number, quart: number, graine: number): boolean {
  const a = APPAREILS[t];
  if (!a) return false;
  q(pi, 0, 0, 16, 16, a.joint);
  for (const m of a.blocs(quart, graine)) abime(pi, a, m, m.x, m.y, m.w, m.h);
  return true;
}

/**
 * Le bord d'un mur appareillé qui donne sur le vide : pas une coupe lisse, des blocs qui dépassent un peu les uns des autres
 * (chacun, au hasard, reste au ras du bord ou recule jusqu'à `recul` pixels du jeu). Derrière, le ciel ou la paroi de fond
 * (voir dessin-tuiles.ts).
 */
export function bordAppareil16(pi: Pinceau, t: number, cotes: number, quart: number, graine: number): void {
  const a = APPAREILS[t];
  if (!a) return;
  const [g, d, h, b] = [COTE.GAUCHE, COTE.DROITE, COTE.HAUT, COTE.BAS].map((c) => (cotes & c) !== 0);
  const e = a.recul * D;
  if (g) pi.efface(0, 0, e, N);
  if (d) pi.efface(N - e, 0, e, N);
  if (h) pi.efface(0, 0, N, e);
  if (b) pi.efface(0, N - e, N, e);
  for (const m of a.blocs(quart, graine)) {
    const recul = (sel: number) => {
      const v = bruit(m.id, quart >> 1, sel);
      return v < 0.4 ? 0 : v < 0.75 || a.recul < 2 ? Math.min(1, a.recul) : 2;
    };
    const tg = g && m.x <= a.recul - 1;
    const td = d && m.x + m.w >= 16 - a.recul;
    const th = h && m.y <= a.recul - 1;
    const tb = b && m.y + m.h >= 15 - a.recul;
    if (!(tg || td || th || tb)) continue;
    // un bloc à peine entamé par le bord (un bout de 2 ou 3 pixels) reste au ras : en reculant, il disparaîtrait et laisserait un trou
    const [ex2, ey2] = [Math.min(16, m.x + m.w), Math.min(16, m.y + m.h)];
    let x1 = tg ? recul(114) : m.x;
    let x2 = td ? 16 - recul(115) : m.x + m.w;
    let y1 = th ? recul(116) : m.y;
    let y2 = tb ? 15 - recul(117) : m.y + m.h;
    if (x2 - x1 < 3) [x1, x2] = [Math.max(0, m.x), ex2];
    if (y2 - y1 < 3) [y1, y2] = [Math.max(0, m.y), ey2];
    const [ex, ey] = [Math.max(0, m.x), Math.max(0, m.y)];
    pi.efface(ex * D, ey * D, (Math.min(16, m.x + m.w) - ex) * D, (Math.min(16, m.y + m.h) - ey) * D);
    abime(pi, a, m, x1, y1, x2 - x1, y2 - y1, true);
  }
}
