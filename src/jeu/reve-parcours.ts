import { Aleatoire } from '../moteur/maths';

/**
 * Le parcours du rêve de JBT : le ciel de nuit qu'il traverse à toute vitesse, avec ses obstacles et ses piles, tiré d'après le
 * numéro du vol (le même pour l'hôte et pour l'écran des invités). Tout y est en pixels du jeu : x le long du ciel (la distance
 * parcourue, JBT y est), y vers le bas, de PLAFOND à SOL (les toits de la ville autotunée, tout en bas). Les obstacles ne
 * dépendent que de la distance parcourue : leur position se recalcule partout, sans rien envoyer.
 *
 * - un arc électrique : deux astéroïdes reliés par un éclair, droit, couché ou en biais, et qui parfois tourne ;
 * - une porte : deux arcs, l'un au plafond, l'autre au sol, et le passage entre eux ;
 * - une pluie de météorites : des rochers en feu qui foncent un peu plus vite que le ciel, en ondulant ;
 * - des étoiles filantes : annoncées au bord de l'écran, elles traversent à toute allure à la hauteur de l'alerte.
 */

export const LONGUEUR = 10000;
export const PLAFOND = 16;
export const SOL = 148;
/** Jusqu'où JBT voit devant lui (au-delà du bord de tout écran) : les étoiles filantes partent de là. */
export const AVANCE = 420;
/** L'alerte d'une étoile filante précède son départ de cette distance (pixels parcourus). */
export const ALERTE = 260;
/** Une étoile filante file vers la gauche à tant de fois la vitesse du ciel. */
export const VITESSE_ETOILE = 2.4;
/** La pleine lune, au bout du parcours : son centre et son rayon. */
export const LUNE_X = LONGUEUR + 420;
export const LUNE_Y = 82;
export const LUNE_R = 80;
/** Le rayon des astéroïdes au bout d'un arc électrique. */
export const ROCHER_ARC = 6;

export interface Arc {
  x: number;
  y: number;
  longueur: number;
  angle: number;
  /** radians par pixel parcouru (0 : l'arc ne tourne pas) */
  rotation: number;
}
export interface Meteore {
  x: number;
  y: number;
  rayon: number;
  /** de combien il fonce plus vite que le ciel (pixels par pixel parcouru) */
  derive: number;
  ampl: number;
  phase: number;
}
export interface Etoile {
  /** la distance où elle part (son alerte la précède de ALERTE), sa hauteur */
  x: number;
  y: number;
}
export interface Pile {
  x: number;
  y: number;
  /** une pile en or : dix piles d'un coup */
  or: boolean;
}
export interface Parcours {
  arcs: Arc[];
  meteores: Meteore[];
  etoiles: Etoile[];
  piles: Pile[];
}

/** La vitesse du ciel (pixels par seconde) à la distance `d` : de plus en plus vite. */
export const vitesse = (d: number): number => 125 + 85 * Math.min(1, Math.max(0, d / LONGUEUR));

/** Les deux bouts d'un arc électrique (là où sont ses astéroïdes) à la distance parcourue `d`. */
export function boutsArc(a: Arc, d: number): [number, number, number, number] {
  const t = a.angle + a.rotation * d;
  const dx = (Math.cos(t) * a.longueur) / 2;
  const dy = (Math.sin(t) * a.longueur) / 2;
  return [a.x - dx, a.y - dy, a.x + dx, a.y + dy];
}

/** Où est la météorite à la distance parcourue `d` : elle fonce dès qu'elle est en vue, en ondulant. */
export const posMeteore = (m: Meteore, d: number): { x: number; y: number } => ({
  x: m.x - m.derive * Math.max(0, d - (m.x - AVANCE)),
  y: m.y + m.ampl * Math.sin(d * 0.012 + m.phase),
});

/** Où est l'étoile filante à la distance parcourue `d`, ou null si elle n'est pas encore partie. */
export const posEtoile = (e: Etoile, d: number): { x: number; y: number } | null =>
  d < e.x ? null : { x: e.x + AVANCE - VITESSE_ETOILE * (d - e.x), y: e.y };

const HAUT = PLAFOND + 10;
const BAS = SOL - 10;

/** Des arcs électriques : un ou deux, droits, couchés ou en biais ; plus loin, certains tournent. */
function arcs(p: Parcours, r: Aleatoire, x: number, k: number): number {
  const n = k > 0.4 && r.suivant() < 0.5 ? 2 : 1;
  for (let i = 0; i < n; i++) {
    const longueur = r.entre(44, 64 + 24 * k);
    const tourne = k > 0.22 && r.suivant() < 0.25 + 0.3 * k;
    const angle = r.choix([Math.PI / 2, 0, Math.PI / 4, -Math.PI / 4]);
    const demi = tourne || angle !== 0 ? longueur / 2 : 4;
    const y = r.entre(HAUT - 6 + demi, BAS + 6 - demi);
    const rotation = tourne ? r.choix([-1, 1]) * r.entre(0.004, 0.006 + 0.004 * k) : 0;
    p.arcs.push({ x: x + i * r.entre(80, 110), y, longueur, angle, rotation });
  }
  return n * 95;
}

/** Une porte : un arc qui descend du plafond, un autre qui monte du sol, le passage entre eux (et des piles dedans). */
function porte(p: Parcours, r: Aleatoire, x: number, k: number): number {
  const passage = r.entre(58 - 14 * k, 70 - 14 * k);
  const centre = r.entre(HAUT + passage / 2 + 8, BAS - passage / 2 - 8);
  const haut = centre - passage / 2 - PLAFOND;
  const bas = SOL - (centre + passage / 2);
  p.arcs.push({ x, y: PLAFOND + haut / 2, longueur: haut, angle: Math.PI / 2, rotation: 0 });
  p.arcs.push({ x, y: SOL - bas / 2, longueur: bas, angle: Math.PI / 2, rotation: 0 });
  for (let i = -2; i <= 2; i++) p.piles.push({ x: x + i * 11, y: centre, or: false });
  return 40;
}

/** Une pluie de météorites : de deux à cinq rochers en feu, à toutes les hauteurs. */
function pluie(p: Parcours, r: Aleatoire, x: number, k: number): number {
  const n = 2 + Math.floor(r.entre(0, 2 + 2 * k));
  const largeur = 140 + 30 * n;
  for (let i = 0; i < n; i++)
    p.meteores.push({
      x: x + (i / n) * largeur + r.entre(0, 30),
      y: r.entre(HAUT, BAS),
      rayon: r.entre(8, 14),
      derive: r.entre(0.2, 0.45 + 0.35 * k),
      ampl: r.suivant() < 0.5 ? r.entre(6, 20) : 0,
      phase: r.entre(0, Math.PI * 2),
    });
  return largeur;
}

/** Des étoiles filantes, une à trois, l'une après l'autre ; entre elles, quelques piles. */
function etoiles(p: Parcours, r: Aleatoire, x: number, k: number): number {
  const n = 1 + (k > 0.3 ? 1 : 0) + (k > 0.65 && r.suivant() < 0.6 ? 1 : 0);
  for (let i = 0; i < n; i++) p.etoiles.push({ x: x + i * 90, y: r.entre(HAUT, BAS) });
  motifPiles(p, r, x + 20, 90 * n);
  return 90 * n;
}

/** Des piles en ligne, en vague, en biais, en bloc ; parfois une pile en or au milieu. */
function motifPiles(p: Parcours, r: Aleatoire, x: number, largeur: number): void {
  const n = Math.max(3, Math.floor(largeur / 11));
  const forme = r.choix(['ligne', 'vague', 'biais', 'bloc'] as const);
  const y0 = r.entre(HAUT + 12, BAS - 12);
  const sens = r.choix([-1, 1]);
  const or = r.suivant() < 0.12 ? Math.floor(n / 2) : -1;
  for (let i = 0; i < n; i++) {
    const px = x + i * 11;
    const lignes = forme === 'bloc' ? [-10, 0, 10] : [0];
    for (const dy of lignes) {
      let y = y0 + dy;
      if (forme === 'vague') y += Math.sin(i * 0.6) * 20;
      if (forme === 'biais') y += sens * (i - n / 2) * 5;
      y = Math.max(HAUT, Math.min(BAS, y));
      p.piles.push({ x: px, y, or: i === or && dy === 0 });
    }
  }
}

/** Le parcours d'un vol : les obstacles se suivent, de plus en plus serrés, et des piles entre eux. */
export function parcours(manche: number): Parcours {
  const r = new Aleatoire(manche * 104729 + 31);
  const p: Parcours = { arcs: [], meteores: [], etoiles: [], piles: [] };
  motifPiles(p, r, 160, 200);
  let x = 520;
  while (x < LONGUEUR - 500) {
    const k = x / LONGUEUR;
    const t = r.suivant();
    if (t < 0.34) x += arcs(p, r, x, k);
    else if (t < 0.52) x += porte(p, r, x, k);
    else if (t < 0.74) x += pluie(p, r, x, k);
    else x += etoiles(p, r, x, k);
    const ecart = 150 - 60 * k + r.entre(0, 70);
    if (r.suivant() < 0.8) motifPiles(p, r, x + 25, ecart - 50);
    x += ecart;
  }
  // la dernière ligne droite : une traînée de piles jusqu'à la lune
  for (let i = 0; i < 24; i++)
    p.piles.push({ x: LONGUEUR - 380 + i * 14, y: LUNE_Y + Math.sin(i * 0.5) * 18, or: i === 23 });
  p.piles.sort((a, b) => a.x - b.x);
  return p;
}
