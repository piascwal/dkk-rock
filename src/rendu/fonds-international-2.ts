import type { Aleatoire } from '../moteur/maths';
import { brume, palmierPixel } from './fonds-arbres';
import type { Peinture } from './fonds-bretagne';
import { L, pignon, rect, relief, type Ctx } from './fonds-international';

/**
 * Les fonds de l'International Tour (2/2) :
 * - New York : la ligne des gratte-ciel de Manhattan (l'Empire State et son mât, le Chrysler et sa couronne en écailles), la
 *   statue de la Liberté au loin sur son île ; devant, les immeubles de brique, leurs escaliers de secours en zigzag et leurs
 *   châteaux d'eau en bois sur le toit ;
 * - Marseille : la mer, le château d'If sur son rocher, la colline de Notre-Dame de la Garde et la Bonne Mère dorée tout en haut,
 *   les falaises blanches des calanques ; devant, les façades ocre, jaunes et roses du Panier, leurs volets, le linge aux fenêtres.
 */

// ———————————————————————————————————— New York

/** Un gratte-ciel lointain : une tour en gradins, ses fenêtres allumées au hasard. */
function tourLointaine(
  c: Ctx,
  r: Aleatoire,
  x: number,
  sol: number,
  w: number,
  h: number,
  couleur: string,
): void {
  rect(c, x, sol - h, w, h, couleur);
  for (let fy = sol - h + 3; fy < sol - 2; fy += 4)
    for (let fx = x + 2; fx < x + w - 1; fx += 3) if (r.suivant() < 0.25) rect(c, fx, fy, 1, 2, '#f0e0a0');
}

/** L'Empire State Building : trois gradins, le mât. */
function empireState(c: Ctx, x: number, sol: number): void {
  const pierre = '#9aa0ae';
  rect(c, x, sol - 120, 30, 120, pierre);
  rect(c, x + 5, sol - 140, 20, 20, pierre);
  rect(c, x + 10, sol - 152, 10, 12, pierre);
  rect(c, x + 13, sol - 172, 4, 20, pierre);
  rect(c, x + 14, sol - 186, 2, 14, '#7a808e');
  for (let fy = sol - 116; fy < sol; fy += 4) rect(c, x + 3, fy, 24, 1, 'rgba(40,50,70,0.35)');
}

/** Le Chrysler Building : la tour, sa couronne en écailles d'acier, sa flèche. */
function chrysler(c: Ctx, x: number, sol: number): void {
  rect(c, x, sol - 110, 24, 110, '#a8aebc');
  for (let k = 0; k < 5; k++) {
    // les arcs de la couronne, en gradins, et leurs fenêtres triangulaires
    const w = 20 - k * 4;
    rect(c, x + 12 - w / 2, sol - 118 - k * 7, w, 7, '#d8dce6');
    for (let fx = x + 13 - w / 2; fx < x + 11 + w / 2; fx += 3)
      rect(c, fx, sol - 115 - k * 7, 1, 2, '#3a4250');
  }
  rect(c, x + 11, sol - 168, 2, 18, '#e8ecf2');
}

/** La statue de la Liberté, sur son socle, la torche levée. */
function liberte(c: Ctx, x: number, sol: number): void {
  rect(c, x - 6, sol - 14, 12, 14, '#9a9a8a'); // le socle
  rect(c, x - 3, sol - 30, 6, 16, '#6aa89a');
  rect(c, x - 2, sol - 34, 4, 4, '#6aa89a');
  for (let k = 0; k < 5; k++) rect(c, x - 3 + k * 1.5, sol - 37 + (k % 2), 1, 2, '#6aa89a'); // la couronne
  rect(c, x + 3, sol - 44, 2, 14, '#6aa89a'); // le bras levé
  rect(c, x + 2, sol - 47, 4, 3, '#ffd23f'); // la flamme
}

/** Un château d'eau en bois sur le toit, sur ses pieds de métal, chapeau conique. */
function chateauDEau(c: Ctx, x: number, y: number): void {
  rect(c, x + 1, y - 6, 1, 6, '#2a2a30');
  rect(c, x + 9, y - 6, 1, 6, '#2a2a30');
  rect(c, x, y - 18, 11, 12, '#8a6038');
  for (let k = y - 16; k < y - 6; k += 3) rect(c, x, k, 11, 1, '#5a3a20');
  pignon(c, x - 1, y - 18, 13, 6, '#3a3036');
}

/** Un immeuble de brique, ses fenêtres et son escalier de secours en zigzag. */
function immeubleBrique(c: Ctx, r: Aleatoire, x: number, sol: number, w: number, h: number): void {
  rect(c, x, sol - h, w, h + 40, r.choix(['#8a3e2a', '#7a3424', '#9a4a32', '#6a4a3a']));
  for (let fy = sol - h + 5; fy < sol - 8; fy += 10)
    for (let fx = x + 3; fx < x + w - 4; fx += 7)
      rect(c, fx, fy, 4, 6, r.suivant() < 0.3 ? '#f0d890' : '#2a3040');
  const ex = x + Math.floor(w / 3);
  for (let fy = sol - h + 12; fy < sol - 10; fy += 10) {
    rect(c, ex - 2, fy, 14, 1, '#1a1a20');
    for (let s = 0; s < 10; s++)
      rect(c, ex + (Math.floor(fy / 10) % 2 ? s : 10 - s), fy - s, 1, 1, '#1a1a20');
  }
  rect(c, x - 1, sol - h - 2, w + 2, 2, '#4a2a1a');
  if (r.suivant() < 0.45) chateauDEau(c, x + r.entier(2, Math.max(3, w - 13)), sol - h - 2);
}

const newyork: Peinture = (c, r, th, plan) => {
  if (plan === 0) {
    for (let x = 0; x < L; x += r.entier(14, 26))
      tourLointaine(
        c,
        r,
        x,
        232,
        r.entier(12, 22),
        r.entier(40, 110),
        r.choix([th.lointain, '#7a88a0', '#98a4b8']),
      );
    empireState(c, 420, 232);
    chrysler(c, 560, 232);
    rect(c, 0, 230, L, 10, '#4a6a8a'); // l'East River, l'Hudson
    liberte(c, 120, 232);
    brume(c, L, 150, 240, 'rgba(240,220,190,0.22)');
    return;
  }
  for (let x = 0; x < L; x += 0) {
    const w = r.entier(28, 44);
    immeubleBrique(c, r, x, 238, w, r.entier(40, 70));
    x += w + r.entier(0, 2);
  }
};

// ———————————————————————————————————— Marseille

/** La colline de la Garde, la basilique (pierre blanche et verte, en bandes), son clocher et la Bonne Mère dorée au sommet. */
function bonneMere(c: Ctx, x: number, sol: number): void {
  c.fillStyle = '#9a9478';
  c.beginPath();
  c.moveTo(x - 110, sol);
  c.quadraticCurveTo(x, sol - 90, x + 110, sol);
  c.fill();
  const haut = sol - 66;
  rect(c, x - 22, haut - 18, 44, 18, '#e8e2d0'); // la basilique
  for (let k = 0; k < 18; k += 4) rect(c, x - 22, haut - 18 + k, 44, 1, '#6a8a6a'); // les bandes vertes
  c.fillStyle = '#d8d2c0';
  c.beginPath();
  c.arc(x - 6, haut - 18, 8, Math.PI, 0); // la coupole
  c.fill();
  rect(c, x + 8, haut - 52, 10, 34, '#e8e2d0'); // le clocher
  for (let k = 0; k < 34; k += 5) rect(c, x + 8, haut - 52 + k, 10, 1, '#6a8a6a');
  rect(c, x + 11, haut - 60, 4, 8, '#ffd23f'); // la Bonne Mère, dorée
  rect(c, x + 12, haut - 63, 2, 3, '#ffd23f');
}

/** Le château d'If, sur son rocher au milieu de la mer. */
function chateauDIf(c: Ctx, x: number, y: number): void {
  rect(c, x - 18, y - 4, 36, 6, '#c8c0a8');
  rect(c, x - 10, y - 14, 20, 10, '#d8d0b8');
  rect(c, x - 4, y - 22, 8, 8, '#d8d0b8');
  for (let k = -10; k < 10; k += 4) rect(c, x + k, y - 16, 2, 2, '#d8d0b8');
}

/** Une façade du Panier : ocre, jaune, rose ou saumon ; volets verts ou bleus ; toit de tuiles ; du linge entre les fenêtres. */
function facadePanier(c: Ctx, r: Aleatoire, x: number, sol: number, w: number, h: number): void {
  rect(c, x, sol - h, w, h + 40, r.choix(['#e0a85a', '#e8c86a', '#e89a7a', '#d8b890', '#f0d0a0']));
  const volet = r.choix(['#4f8a5a', '#4a7ab0', '#6a9a8a']);
  for (let fy = sol - h + 6; fy < sol - 8; fy += 11)
    for (let fx = x + 4; fx < x + w - 6; fx += 10) {
      rect(c, fx, fy, 4, 6, '#3a2a1a');
      rect(c, fx - 2, fy, 2, 6, volet);
      rect(c, fx + 4, fy, 2, 6, volet);
    }
  for (let k = 0; k < 4; k++)
    rect(c, x - 2 + k, sol - h - k, w + 4 - k * 2, 1, k % 2 ? '#c8592e' : '#b04a28');
  if (r.suivant() < 0.5) {
    // une corde à linge, et le linge qui sèche au mistral
    const fy = sol - h + 15;
    rect(c, x + 2, fy, w - 4, 1, '#5a5a5a');
    for (let fx = x + 4; fx < x + w - 5; fx += 5)
      rect(
        c,
        fx,
        fy + 1,
        3,
        r.entier(3, 5),
        r.choix(['#ffffff', '#3fa7f2', '#e5432f', '#ffd23f', '#7cfc7c']),
      );
  }
}

const marseille: Peinture = (c, r, th, plan) => {
  if (plan === 0) {
    rect(c, 0, 200, L, 40, '#2a7ab8'); // la mer
    for (let x = 0; x < L; x += 9) rect(c, x, 204 + (x % 7) * 4, 4, 1, '#7ac0e8');
    chateauDIf(c, 160, 214);
    // les calanques : des falaises blanches qui plongent dans le bleu, à droite
    c.fillStyle = '#e8e2d2';
    c.beginPath();
    c.moveTo(680, 238);
    for (let x = 680; x <= L; x += 20) c.lineTo(x, 196 - ((x * 7) % 26));
    c.lineTo(L, 238);
    c.fill();
    bonneMere(c, 480, 236);
    relief(c, r, 236, 6, 40, th.lointain);
    brume(c, L, 170, 236, 'rgba(255,248,230,0.2)');
    return;
  }
  for (let x = 0; x < L; x += 0) {
    const w = r.entier(26, 40);
    facadePanier(c, r, x, 238, w, r.entier(30, 56));
    if (r.suivant() < 0.2) palmierPixel(c, x + w + 3, 240, r.entier(24, 34), '#3f7a3a');
    x += w;
  }
};

export const PEINTURES_INTERNATIONAL_2 = { newyork, marseille };
