import { HAUTEUR_VUE } from '../config';
import { Aleatoire } from '../moteur/maths';
import { disque } from './formes-pixels';
import { LARGEUR_MONDE, rect } from './plongeon-monde';

/**
 * Le lointain du plongeon, derrière le pont et entre les rives : il défile moins vite que les gorges (parallaxe, voir plongeon.ts).
 * En haut le ciel et ses nuages, puis les collines des Préalpes et leurs barres calcaires, Saint-Cézaire sur sa crête, les pentes
 * couvertes de chênes verts et de pins ; en bas, la Siagne en amont : un ruban turquoise qui
 * vient du fond des gorges, coupé de vasques de tuf et de petites cascades, entre deux rideaux de feuillage.
 */

type Ctx = CanvasRenderingContext2D;

/** La hauteur (px) de l'image du lointain. */
export const HAUTEUR_PAYSAGE = 560;
const W = LARGEUR_MONDE;
const H = HAUTEUR_PAYSAGE;
/** Le bord de la rivière lointaine qui touche la vraie (quand la caméra est en bas, c'est l'eau des gorges). */
const EAU_BAS = H - HAUTEUR_VUE + 76;
const HORIZON_EAU = EAU_BAS - 52;

const FEUILLAGES = ['#2f5a2a', '#3a6a30', '#466f34', '#2a4f2a', '#557d3a', '#5f8a40'];

function ciel(c: Ctx, r: Aleatoire): void {
  const g = c.createLinearGradient(0, 0, 0, 170);
  g.addColorStop(0, '#2f7fd8');
  g.addColorStop(1, '#a9d6ee');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  for (let i = 0; i < 6; i++) {
    const x = r.entier(0, W);
    const y = r.entier(10, 110);
    for (let k = 0; k < 6; k++) {
      c.fillStyle = k < 4 ? 'rgba(255,255,255,0.75)' : 'rgba(225,235,245,0.8)';
      disque(c, x + k * 6 - 15, y + (k % 2) * 2 + (k >= 4 ? 3 : 0), r.entier(4, 8));
    }
  }
}

/** Une crête : sa ligne, remplie jusqu'en bas ; renvoie la hauteur de crête de chaque colonne. */
function crete(c: Ctx, r: Aleatoire, base: number, ampl: number, couleur: string): number[] {
  const haut: number[] = [];
  let h = 0;
  let pente = 0;
  for (let x = 0; x < W; x++) {
    pente = Math.max(-0.8, Math.min(0.8, pente + r.entre(-0.12, 0.12)));
    h = Math.max(-ampl, Math.min(ampl, h + pente));
    haut.push(Math.round(base - h));
    rect(c, x, base - h, 1, H, couleur);
  }
  return haut;
}

/** Des houppiers ronds serrés, du sommet `haut` jusqu'à `bas`, plus clairs vers le haut à gauche (le soleil). */
function foret(c: Ctx, r: Aleatoire, haut: number[], bas: number, n: number, taille: number): void {
  for (let i = 0; i < n; i++) {
    const x = r.entier(0, W - 1);
    const y = r.entier(haut[x]! + 2, bas);
    const t = r.entier(taille - 1, taille + 2);
    c.fillStyle = r.choix(FEUILLAGES);
    disque(c, x, y, t);
    c.fillStyle = 'rgba(150,200,90,0.35)';
    disque(c, x - 1, y - 1, Math.max(1, t - 2));
  }
}

function collines(c: Ctx, r: Aleatoire): void {
  // le lointain bleuté, puis la grande colline aux barres calcaires
  crete(c, r, 142, 8, '#9fbcc4');
  const haut = crete(c, r, 162, 14, '#5d8458');
  for (let i = 0; i < 9; i++) {
    const x = r.entier(10, W - 40);
    const w = r.entier(14, 40);
    for (let k = 0; k < w; k++) {
      const y = haut[x + k]! + 3;
      rect(c, x + k, y, 1, r.entier(5, 11), r.choix(['#c9c3ad', '#b8b29a', '#d6d0bb']));
    }
  }
  foret(c, r, haut, 215, 260, 3);
  // Saint-Cézaire sur sa crête, à gauche : quelques maisons, le clocher
  const xv = 40;
  const yv = haut[xv]! - 1;
  for (let k = 0; k < 6; k++) {
    rect(c, xv + k * 5, yv - 4 - (k % 2), 4, 5 + (k % 2), '#e2d2ae');
    rect(c, xv + k * 5, yv - 5 - (k % 2), 4, 1, '#b8492e');
  }
  rect(c, xv + 13, yv - 12, 2, 8, '#d8c69e');
  rect(c, xv + 13, yv - 13, 2, 1, '#9a3a26');
  // la pente boisée qui descend vers la rivière : des chênes verts, des pins
  const pente = crete(c, r, 215, 10, '#3b6331');
  foret(c, r, pente, H, 1500, 5);
  for (let i = 0; i < 10; i++) {
    const x = r.entier(0, W - 1);
    const y = r.entier(240, HORIZON_EAU);
    for (let k = 0; k < 9; k++) rect(c, x - Math.floor(k / 2), y - 18 + k * 2, k + 1, 2, '#24452a'); // un pin
  }
}

/** La Siagne en amont : elle vient du fond des gorges, s'élargit vers nous, tombe de vasque en vasque. */
function riviere(c: Ctx, r: Aleatoire): void {
  for (let y = HORIZON_EAU; y < H; y++) {
    const k = Math.min(1, (y - HORIZON_EAU) / (EAU_BAS - HORIZON_EAU));
    const demi = 6 + k * k * (W / 2);
    const centre = W / 2 + Math.sin(k * 3) * 30 * (1 - k);
    const eau = `rgb(${Math.round(40 + 30 * k)},${Math.round(170 + 30 * k)},${Math.round(170 + 15 * k)})`;
    rect(c, centre - demi, y, 2 * demi, 1, eau);
    // les berges de tuf, ocre, moussues
    rect(c, centre - demi - 3 - k * 8, y, 3 + k * 8, 1, y % 3 ? '#c8a868' : '#a88a50');
    rect(c, centre + demi, y, 3 + k * 8, 1, y % 3 ? '#c8a868' : '#a88a50');
  }
  // les marches de tuf, et l'eau blanche qui en tombe
  for (const k of [0.25, 0.55]) {
    const y = Math.round(HORIZON_EAU + k * (EAU_BAS - HORIZON_EAU));
    const demi = 6 + k * k * (W / 2);
    const centre = W / 2 + Math.sin(k * 3) * 30 * (1 - k);
    rect(c, centre - demi, y, 2 * demi, 2, '#d4b878');
    for (let x = centre - demi; x < centre + demi; x += 2)
      rect(c, x, y + 2, 1, r.entier(2, 5), r.choix(['#ffffff', '#e6f7f6', '#bfeeea']));
  }
  // les reflets
  for (let i = 0; i < 30; i++)
    rect(c, r.entier(0, W), r.entier(HORIZON_EAU + 10, H), r.entier(2, 6), 1, 'rgba(255,255,255,0.4)');
  // deux rideaux de feuillage de part et d'autre de la rivière
  for (const cote of [-1, 1])
    for (let i = 0; i < 140; i++) {
      const y = r.entier(HORIZON_EAU - 40, H);
      const k = Math.max(0, (y - HORIZON_EAU) / (EAU_BAS - HORIZON_EAU));
      const bord = W / 2 + cote * (20 + k * W * 0.42);
      const x = cote < 0 ? r.entier(0, Math.max(1, bord)) : r.entier(Math.min(W - 1, bord), W);
      c.fillStyle = r.choix(FEUILLAGES);
      disque(c, x, y, r.entier(3, 7));
    }
}

let dernier: { manche: number; toile: HTMLCanvasElement } | null = null;

/** Le lointain de ce saut, peint une fois. */
export function paysage(manche: number): HTMLCanvasElement {
  if (dernier?.manche === manche) return dernier.toile;
  const toile = document.createElement('canvas');
  toile.width = W;
  toile.height = H;
  const c = toile.getContext('2d')!;
  const r = new Aleatoire(manche * 17 + 3);
  ciel(c, r);
  collines(c, r);
  riviere(c, r);
  dernier = { manche, toile };
  return toile;
}
