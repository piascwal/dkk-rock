import { HAUTEUR_VUE } from '../config';
import type { Aleatoire } from '../moteur/maths';
import { disque } from './formes-pixels';
import type { DefPremierPlan } from './premier-plan';

/**
 * Le premier plan des gorges de la Siagne : tout près de l'objectif, un figuier dont le feuillage passe en haut de l'image
 * (on voit le jeu entre les feuilles), une branche d'où pendent des lianes, un rocher moussu d'où l'eau goutte sans arrêt,
 * de grandes fougères qui montent du bas. Plus sombre que le jeu, et translucide : de la profondeur, sans gêner.
 */

type Ctx = CanvasRenderingContext2D;

const H = HAUTEUR_VUE;
const LARGEUR = 1100;
/** où tombent les gouttes, dans la bande */
const GOUTTES = { x: 640, haut: 16, large: 12 };
const FEUILLES = ['rgba(28,58,26,0.82)', 'rgba(36,72,30,0.8)', 'rgba(22,46,22,0.85)', 'rgba(46,86,36,0.75)'];

/** Un amas de feuilles : quelques disques serrés, chacun d'un vert ; un sur cinq est laissé en trou (on voit au travers). */
function feuillage(c: Ctx, r: Aleatoire, x: number, y: number, etendue: number, nb: number): void {
  for (let i = 0; i < nb; i++) {
    if (r.suivant() < 0.2) continue;
    c.fillStyle = r.choix(FEUILLES);
    disque(c, x + r.entier(-etendue, etendue), y + r.entier(-etendue / 2, etendue / 2), r.entier(3, 8));
  }
  // quelques feuilles de figuier détachées, découpées en trois lobes
  for (let i = 0; i < nb / 3; i++) {
    const fx = x + r.entier(-etendue - 6, etendue + 6);
    const fy = y + r.entier(-etendue / 2 - 4, etendue / 2 + 6);
    c.fillStyle = r.choix(FEUILLES);
    c.fillRect(fx, fy, 5, 3);
    c.fillRect(fx + 1, fy - 2, 1, 2);
    c.fillRect(fx + 3, fy - 2, 1, 2);
    c.fillRect(fx + 2, fy + 3, 1, 2);
  }
}

/** Le figuier : un tronc noueux qui monte du bas de l'image, ses branches, son feuillage en haut. */
function figuier(c: Ctx, r: Aleatoire, x: number): void {
  c.fillStyle = 'rgba(34,24,16,0.9)';
  for (let y = H; y > 30; y--) {
    const dx = Math.round(Math.sin(y / 23) * 4);
    c.fillRect(x + dx, y, 9 + Math.round((H - y) / 40), 1);
  }
  c.fillStyle = 'rgba(60,44,30,0.6)'; // l'écorce, éclairée d'un côté
  for (let y = H; y > 34; y -= 3) c.fillRect(x + 2 + Math.round(Math.sin(y / 23) * 4), y, 1, 2);
  c.fillStyle = 'rgba(34,24,16,0.9)'; // deux branches
  for (let k = 0; k < 40; k++) {
    c.fillRect(x + 6 + k, 44 - Math.round(k * 0.6), 3, 2);
    c.fillRect(x - k, 52 - Math.round(k * 0.45), 3, 2);
  }
  for (let k = 0; k < 9; k++) feuillage(c, r, x - 50 + k * 14, r.entier(4, 30), 14, 10);
}

/** Une branche qui entre par le haut, et ses lianes qui pendent, avec des feuilles le long. */
function branche(c: Ctx, r: Aleatoire, x: number): void {
  c.fillStyle = 'rgba(34,24,16,0.85)';
  for (let k = 0; k < 90; k++) c.fillRect(x + k, Math.round(Math.sin(k / 30) * 8 + k * 0.2), 2, 2);
  for (let k = 0; k < 6; k++) feuillage(c, r, x + k * 16, 10 + k * 3, 10, 6);
  for (let k = 0; k < 7; k++) {
    const lx = x + 8 + k * 12;
    const long = r.entier(30, 80);
    for (let y = 16; y < 16 + long; y++) {
      c.fillStyle = 'rgba(30,60,28,0.75)';
      c.fillRect(lx + Math.round(Math.sin(y / 9 + k) * 1.5), y, 1, 1);
      if (y % 7 === 0) c.fillRect(lx - 1 + Math.round(Math.sin(y / 9 + k) * 1.5), y, 3, 2);
    }
  }
}

/** Le rocher moussu d'où l'eau goutte : la roche en haut, et un voile d'eau très léger ; les gouttes sont animées. */
function rocherQuiGoutte(c: Ctx, r: Aleatoire): void {
  const { x, haut, large } = GOUTTES;
  c.fillStyle = 'rgba(70,64,54,0.9)';
  c.fillRect(x - 14, 0, large + 28, haut);
  c.fillRect(x - 8, haut, large + 16, 3);
  for (let k = 0; k < 14; k++) {
    c.fillStyle = r.choix(FEUILLES); // la mousse, au bord
    c.fillRect(x - 14 + k * 3, haut - 2 + r.entier(0, 3), 3, 2);
  }
  c.fillStyle = 'rgba(220,245,255,0.1)';
  c.fillRect(x, haut + 3, large, H - haut - 3);
}

/** De grandes fougères qui montent du bas de l'image : des frondes en arc, des folioles de part et d'autre. */
function fougeres(c: Ctx, r: Aleatoire, x: number): void {
  for (let f = 0; f < 6; f++) {
    const sens = f % 2 ? 1 : -1;
    const long = r.entier(30, 52);
    const pente = r.entre(0.5, 1.2);
    for (let k = 0; k < long; k++) {
      const fx = x + f * 6 + sens * Math.round(k * pente * 0.6);
      const fy = H - Math.round(k * 1.1 - (k * k) / (long * 2.2));
      c.fillStyle = FEUILLES[f % FEUILLES.length]!;
      c.fillRect(fx, fy, 1, 1);
      const foliole = Math.max(1, Math.round((long - k) / 6));
      if (k % 3 === 0) c.fillRect(fx - foliole, fy - 1, foliole * 2 + 1, 1);
    }
  }
}

export const PREMIER_PLAN_TUVES: DefPremierPlan = {
  largeur: LARGEUR,
  parallaxe: 1.6,
  peint: (c, r) => {
    figuier(c, r, 70);
    branche(c, r, 360);
    rocherQuiGoutte(c, r);
    fougeres(c, r, 880);
  },
  // les gouttes : des traits clairs qui tombent du rocher, et un éclat en bas de l'image
  anime: (ctx, x0, tick) => {
    const { x, haut, large } = GOUTTES;
    ctx.fillStyle = 'rgba(225,248,255,0.75)';
    for (let k = 0; k < 16; k++) {
      const y = haut + 3 + ((tick * 3 + k * 37) % (H - haut));
      ctx.fillRect(x0 + x + ((k * 5) % large), y, 1, 4);
    }
    if (tick % 6 < 3) ctx.fillRect(x0 + x - 2 + (tick % large), H - 2, 3, 1);
  },
};
