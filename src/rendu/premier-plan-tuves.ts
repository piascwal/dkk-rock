import type { Aleatoire } from '../moteur/maths';
import { T } from '../monde/tuiles';
import { disque } from './formes-pixels';
import { pied, toile, type DefPremierPlan, type Pose, type Sorte } from './premier-plan';

/**
 * Le premier plan des gorges de la Siagne, posé sur le terrain (voir premier-plan.ts) : de grands arbres feuillus dont le
 * tronc plonge jusqu'au fond du niveau, le feuillage en haut de l'image, une branche chargée de lianes ; des mottes d'herbe et
 * de fougères sur un sol sombre qui descend aussi jusqu'au fond ; et des cascades qui tombent d'un rocher du ciel sur une
 * motte. Plus sombres que le jeu, translucides, pour la profondeur sans gêner.
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

/** Un grand arbre : un tronc noueux qui plonge hors de l'image (étiré jusqu'au fond), son feuillage en haut, une branche et ses lianes. */
function arbre(w: number, h: number, sens: 1 | -1, graine: Aleatoire): Sorte {
  const [t, c] = toile(w, h);
  const cx = Math.round(w / 2);
  const dx = (y: number) => Math.round(Math.sin(y / 23) * 4);
  c.fillStyle = ECORCE;
  for (let y = h - 1; y > 34; y--) {
    const large = 8 + Math.round((h - y) / 22);
    c.fillRect(cx - Math.round(large / 2) + dx(Math.min(y, h - 24)), y, large, 1);
  }
  c.fillStyle = 'rgba(60,44,30,0.6)'; // l'écorce, éclairée d'un côté
  for (let y = h - 3; y > 38; y -= 3) c.fillRect(cx - 3 + dx(Math.min(y, h - 24)), y, 1, 2);
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
  return { toile: t, pied: { x: cx, y: h - 1 }, prolonge: true };
}

/** Des fougères en gerbe sur la crête d'une motte : des frondes en arc, des folioles de part et d'autre. */
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

/** La hauteur d'un rocher du ciel au-dessus du sol de la motte, quand il porte une cascade : sa lèvre est dans le haut de l'écran. */
const CIEL = 80;

/**
 * Une motte d'herbe et de fougères, large, translucide en haut : de la mousse, des strates, puis de la roche qui vire à une terre
 * sombre en descendant, jusqu'à la dernière rangée, étirée vers le bas jusqu'au fond du niveau : un sol plus foncé que le
 * terrain, qui ne montre jamais son pied. Avec `cascade`, un rocher du ciel la surplombe, et l'eau tombe de sa lèvre sur une
 * saillie de la motte.
 */
function motte(w: number, hMotte: number, cascade: boolean, graine: Aleatoire): Sorte {
  const h = hMotte + (cascade ? CIEL : 0);
  const [t, c] = toile(w, h);
  const haut0 = h - hMotte; // la rangée du pied du rocher du ciel, ou du haut de la motte
  const bosses = [graine.entre(0, 6), graine.entre(0, 6)];
  const sommet = (x: number) => {
    const u = (x + 0.5) / w;
    const cloche = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u))), 0.55);
    const relief = 0.78 + 0.22 * Math.sin(u * 9 + bosses[0]!) * Math.cos(u * 5 + bosses[1]!);
    return Math.round(h - (hMotte - 18) * cloche * relief);
  };
  for (let x = 0; x < w; x++) {
    const haut = sommet(x);
    for (let y = haut; y < h; y++) {
      const k = (y - haut) / Math.max(1, h - haut);
      const terre = Math.pow(k, 1.6); // de la roche en haut, une terre sombre en bas
      const clair = x < w * 0.45 ? 12 * (1 - terre) : 0; // le côté éclairé
      const strate = (y + Math.floor(x / 23) * 3) % 9 === 0 ? -12 : 0;
      const rouge = Math.round(70 + clair + strate - 34 * terre);
      const vert = Math.round(64 + clair + strate - 36 * terre);
      const bleu = Math.round(54 + clair + strate - 32 * terre);
      c.fillStyle = `rgba(${rouge},${vert},${bleu},${(0.34 + 0.3 * k).toFixed(2)})`; // translucide en haut, plus dense en bas
      c.fillRect(x, y, 1, 1);
    }
    // la mousse et l'herbe sur la crête, pas sur la dernière rangée (elle est étirée vers le bas : un trait vert sur les bords)
    c.fillStyle = 'rgba(46,86,36,0.85)';
    c.fillRect(x, haut, 1, Math.min(2 + ((x * 7) % 3), h - 2 - haut));
  }
  for (let x = 14; x < w - 10; x += graine.entier(26, 40)) fougere(c, graine, x, sommet(x) + 2);
  if (!cascade) return { toile: t, pied: { x: Math.round(w / 2), y: h - 1 }, prolonge: true };
  // le rocher du ciel : une masse accrochée au haut de l'image, à la lèvre irrégulière, translucide ; l'eau en tombe
  const gx = Math.round(w * 0.55);
  const levre = (x: number) =>
    haut0 - CIEL + 44 + Math.round(Math.sin(x / 7 + bosses[1]!) * 4) - Math.round(Math.abs(x - gx) / 9);
  for (let x = Math.round(w * 0.2); x < w * 0.92; x++) {
    for (let y = 0; y < levre(x); y++) {
      const alpha = 0.45 + 0.3 * (y / Math.max(1, levre(x)));
      const strate = y % 8 === 0 ? -12 : 0;
      c.fillStyle = `rgba(${68 + strate},${62 + strate},${52 + strate},${alpha.toFixed(2)})`;
      c.fillRect(x, y, 1, 1);
    }
    c.fillStyle = 'rgba(46,86,36,0.8)'; // de la mousse qui pend sous la lèvre
    c.fillRect(x, levre(x) - 1, 1, 2 + ((x * 5) % 4));
  }
  const gy = sommet(gx) + 10; // la saillie de la motte qui reçoit l'eau
  c.fillStyle = 'rgba(52,48,40,0.9)';
  c.fillRect(gx - 6, gy, 22, 4);
  c.fillStyle = 'rgba(46,86,36,0.85)';
  c.fillRect(gx - 6, gy, 22, 1);
  const source = levre(gx + 4) + 1;
  c.fillStyle = 'rgba(220,245,255,0.14)'; // le voile d'eau
  c.fillRect(gx, source, 11, gy - source);
  return {
    toile: t,
    pied: { x: Math.round(w / 2), y: h - 1 },
    prolonge: true,
    // les gouttes : des traits clairs qui tombent de la lèvre du rocher du ciel jusqu'à la saillie, un éclat dessus
    anime: (ctx, x, y, tick) => {
      ctx.fillStyle = GOUTTE;
      const chute = gy - source - 4;
      for (let k = 0; k < 8; k++)
        ctx.fillRect(x + gx + ((k * 5) % 11), y + source + ((tick * 3 + k * 19) % chute), 1, 4);
      if (tick % 6 < 3) ctx.fillRect(x + gx - 2 + (tick % 13), y + gy - 1, 3, 1);
    },
  };
}

export const PREMIER_PLAN_TUVES: DefPremierPlan = {
  parallaxe: 1.4,
  sortes: (r) => [
    arbre(190, 125, 1, r),
    arbre(210, 130, -1, r),
    arbre(170, 120, 1, r),
    motte(190, 52, false, r),
    motte(130, 44, false, r),
    motte(190, 52, true, r),
    motte(150, 48, true, r),
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
      // des arbres, des mottes, des cascades
      const tirage = r.suivant();
      const sorte = tirage < 0.45 ? r.entier(0, 2) : tirage < 0.7 ? r.entier(3, 4) : r.entier(5, 6);
      poses.push({ sorte, ...pied(tx, s.ty) });
      tx += r.entier(8, 14);
    }
    return poses;
  },
};
