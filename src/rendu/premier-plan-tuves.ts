import type { Aleatoire } from '../moteur/maths';
import { T } from '../monde/tuiles';
import { disque } from './formes-pixels';
import { pied, toile, type DefPremierPlan, type Pose, type Sorte } from './premier-plan';

/**
 * Le premier plan des gorges de la Siagne, posé sur le terrain (voir premier-plan.ts) : de grands arbres feuillus dont on voit
 * le tronc, le feuillage en haut de l'image et une branche chargée de lianes ; de larges roches moussues, translucides, d'où
 * l'eau goutte, avec des fougères sur leur crête. Plus sombres que le jeu, pour la profondeur sans gêner.
 */

type Ctx = CanvasRenderingContext2D;

const FEUILLES = ['rgba(28,58,26,0.82)', 'rgba(36,72,30,0.8)', 'rgba(22,46,22,0.85)', 'rgba(46,86,36,0.75)'];
const ECORCE = 'rgba(34,24,16,0.92)';
const GOUTTE = 'rgba(225,248,255,0.75)';
/** les terrains où l'on pose un élément : la terre du sentier, la boue et l'eau de la rivière (pas le pont ni les parois) */
const SOLS: ReadonlySet<number> = new Set([T.TERRE, T.BOUE, T.EAU, T.SABLE]);

/** Un amas de feuilles : quelques disques serrés, chacun d'un vert, quelques trous (on voit au travers), des feuilles découpées. */
function feuillage(c: Ctx, r: Aleatoire, x: number, y: number, etendue: number, nb: number): void {
  for (let i = 0; i < nb; i++) {
    if (r.suivant() < 0.2) continue;
    c.fillStyle = r.choix(FEUILLES);
    disque(c, x + r.entier(-etendue, etendue), y + r.entier(-etendue / 2, etendue / 2), r.entier(3, 8));
  }
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

/** Une liane qui pend de (x, y) sur `long` pixels, avec des feuilles le long. */
function liane(c: Ctx, x: number, y: number, long: number, phase: number): void {
  for (let k = 0; k < long; k++) {
    const lx = x + Math.round(Math.sin(k / 9 + phase) * 1.5);
    c.fillStyle = 'rgba(30,60,28,0.75)';
    c.fillRect(lx, y + k, 1, 1);
    if (k % 7 === 3) c.fillRect(lx - 1, y + k, 3, 2);
  }
}

/** Un grand arbre : un tronc noueux qui s'évase au pied, son feuillage en haut, une branche (côté `sens`) et ses lianes. */
function arbre(w: number, h: number, sens: 1 | -1, graine: Aleatoire): Sorte {
  const [t, c] = toile(w, h);
  const cx = Math.round(w / 2);
  const dx = (y: number) => Math.round(Math.sin(y / 23) * 4);
  c.fillStyle = ECORCE;
  for (let y = h - 1; y > 34; y--) {
    const large = 8 + Math.round((h - y) / 22) + (y > h - 8 ? 6 - (h - 1 - y) : 0);
    c.fillRect(cx - Math.round(large / 2) + dx(y), y, large, 1);
  }
  c.fillStyle = 'rgba(60,44,30,0.6)'; // l'écorce, éclairée d'un côté
  for (let y = h - 3; y > 38; y -= 3) c.fillRect(cx - 3 + dx(y), y, 1, 2);
  // la branche, à mi-hauteur, qui part du tronc ; ses feuilles au bout, ses lianes dessous
  const by = Math.round(h * 0.5);
  const longueur = Math.round(w * 0.3);
  c.fillStyle = ECORCE;
  for (let k = 0; k < longueur; k++) c.fillRect(cx + sens * k + dx(by), by - Math.round(k * 0.25), 3, 3);
  for (let k = 0; k < 4; k++) feuillage(c, graine, cx + sens * (longueur - 8 - k * 9), by - 12 - k * 2, 9, 6);
  for (let k = 0; k < 6; k++)
    liane(c, cx + sens * (8 + k * 8), by - Math.round(k * 2), graine.entier(26, 56), k);
  // le feuillage, en haut : un gros amas qui déborde largement du tronc, avec des trous
  for (let k = 0; k < 11; k++)
    feuillage(c, graine, cx - Math.round(w * 0.3) + k * Math.round(w * 0.06), graine.entier(14, 40), 14, 10);
  return { toile: t, pied: { x: cx, y: h - 1 } };
}

/** Des fougères en gerbe sur la crête d'une roche : des frondes en arc, des folioles de part et d'autre. */
function fougere(c: Ctx, r: Aleatoire, x: number, y: number): void {
  for (let f = 0; f < 6; f++) {
    const angle = ((f - 2.5) / 2.5) * 1.1;
    const long = r.entier(14, 24);
    for (let k = 0; k < long; k++) {
      const fx = x + Math.round(Math.sin(angle) * k * 0.9);
      const fy = y - Math.round(Math.cos(angle) * k * 0.8 - (k * k) / (long * 3.2));
      c.fillStyle = FEUILLES[f % FEUILLES.length]!;
      c.fillRect(fx, fy, 1, 1);
      const foliole = Math.max(1, Math.round((long - k) / 6));
      if (k % 3 === 0) c.fillRect(fx - foliole, fy - 1, foliole * 2 + 1, 1);
    }
  }
}

/**
 * Une large roche moussue, enracinée au sol : plus translucide en haut qu'en bas (on voit le héros qui passe derrière sa
 * crête), des strates, de la mousse, des fougères sur la crête, et une saillie d'où l'eau goutte jusqu'au pied.
 */
function roche(w: number, h: number, graine: Aleatoire): Sorte {
  const [t, c] = toile(w, h);
  const bosses = [graine.entre(0, 6), graine.entre(0, 6), graine.entre(0, 6)];
  const sommet = (x: number) => {
    const u = (x + 0.5) / w;
    const cloche = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u))), 0.55);
    const relief = 0.78 + 0.22 * Math.sin(u * 9 + bosses[0]!) * Math.cos(u * 5 + bosses[1]!);
    return Math.round(h - (h - 18) * cloche * relief);
  };
  for (let x = 0; x < w; x++) {
    const haut = sommet(x);
    for (let y = haut; y < h; y++) {
      const k = (y - haut) / Math.max(1, h - haut);
      const alpha = 0.34 + 0.46 * k; // translucide en haut, plus dense en bas
      const clair = x < w * 0.45 ? 14 : 0; // le côté éclairé
      const strate = (y + Math.floor(x / 23) * 3) % 9 === 0 ? -14 : 0;
      c.fillStyle = `rgba(${70 + clair + strate},${64 + clair + strate},${54 + clair + strate},${alpha.toFixed(2)})`;
      c.fillRect(x, y, 1, 1);
    }
    c.fillStyle = 'rgba(46,86,36,0.85)'; // la mousse sur la crête
    c.fillRect(x, haut, 1, 2 + ((x * 7) % 3));
  }
  // les fougères, sur la crête
  for (let x = 14; x < w - 10; x += graine.entier(26, 40)) fougere(c, graine, x, sommet(x) + 2);
  // la saillie d'où l'eau goutte
  const gx = Math.round(w * 0.64);
  const gy = sommet(gx) + 10;
  c.fillStyle = 'rgba(52,48,40,0.9)';
  c.fillRect(gx - 4, gy, 20, 4);
  c.fillStyle = 'rgba(46,86,36,0.85)';
  c.fillRect(gx - 4, gy, 20, 1);
  c.fillStyle = 'rgba(220,245,255,0.12)';
  c.fillRect(gx, gy + 4, 11, h - gy - 4);
  return {
    toile: t,
    pied: { x: Math.round(w / 2), y: h - 1 },
    // les gouttes : des traits clairs qui tombent de la saillie, un éclat au pied
    anime: (ctx, x, y, tick) => {
      ctx.fillStyle = GOUTTE;
      const chute = h - gy - 6;
      for (let k = 0; k < 7; k++)
        ctx.fillRect(x + gx + ((k * 5) % 11), y + gy + 4 + ((tick * 3 + k * 23) % chute), 1, 4);
      if (tick % 6 < 3) ctx.fillRect(x + gx - 2 + (tick % 11), y + h - 2, 3, 1);
    },
  };
}

export const PREMIER_PLAN_TUVES: DefPremierPlan = {
  parallaxe: 1.4,
  sortes: (r) => [
    arbre(190, 125, 1, r),
    arbre(210, 130, -1, r),
    arbre(170, 120, 1, r),
    roche(190, 58, r),
    roche(120, 46, r),
    roche(150, 52, r),
  ],
  pose: (terrain, r) => {
    const poses: Pose[] = [];
    let tx = 12;
    while (tx < terrain.largeur - 6) {
      const s = terrain.surface(tx);
      if (!s || !SOLS.has(s.tuile)) {
        tx++;
        continue;
      }
      // un arbre un peu plus souvent qu'une roche
      const sorte = r.suivant() < 0.55 ? r.entier(0, 2) : r.entier(3, 5);
      poses.push({ sorte, ...pied(tx, s.ty) });
      tx += r.entier(8, 14);
    }
    return poses;
  },
};
