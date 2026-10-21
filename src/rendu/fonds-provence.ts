import type { Aleatoire } from '../moteur/maths';
import { arbreRond, brume } from './fonds-arbres';
import type { Peinture } from './fonds-bretagne';

/**
 * Les fonds du pays de Grasse, au-dessus de la Siagne (le début de la tournée) :
 * - Saint-Cézaire (STC), village perché au bord de sa falaise : au loin, les roches rouges de l'Estérel et les Maures
 *   bleutées, un fil de mer ; au milieu, la vallée de la Siagne, ses collines de chênes et ses restanques d'oliviers, quelques
 *   mas ; devant, les maisons de pierre et leurs toits de tuiles, le clocher, la tour du château, les cyprès ;
 * - le pont des Tuves, au fond des gorges : la rivière toujours là, derrière le chemin, turquoise, ses rochers blancs, ses
 *   cascades ; sur l'autre rive, une forêt luxuriante (chênes, aulnes, figuiers) sous les falaises de calcaire ; devant, des
 *   roseaux, des fougères et de grandes feuilles.
 * Bandes de 960 × 270, le sol à 238 (voir fonds.ts).
 */

type Ctx = CanvasRenderingContext2D;

const L = 960;

const rect = (c: Ctx, x: number, y: number, w: number, h: number, couleur: string) => {
  c.fillStyle = couleur;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

/** Une ligne de relief douce, remplie jusqu'en bas de la bande. */
function relief(c: Ctx, r: Aleatoire, base: number, ampl: number, pas: number, couleur: string): void {
  c.fillStyle = couleur;
  c.beginPath();
  c.moveTo(0, 270);
  let y = base;
  for (let x = 0; x <= L; x += pas) {
    y = Math.max(base - ampl, Math.min(base, y + r.entre(-ampl / 3, ampl / 3)));
    c.lineTo(x, y);
  }
  c.lineTo(L, 270);
  c.fill();
}

/** Les roches rouges de l'Estérel, découpées, au loin ; les Maures plus douces et bleutées entre elles ; un fil de mer. */
function lointainProvence(c: Ctx, r: Aleatoire): void {
  rect(c, 0, 196, L, 4, '#7fb8d8'); // la mer, tout au fond
  relief(c, r, 205, 26, 40, '#9aaccc');
  c.fillStyle = '#b8705e';
  for (let x = 0; x < L; x += r.entier(120, 220)) {
    // un massif de l'Estérel : des pics rouges
    c.beginPath();
    c.moveTo(x, 214);
    for (let k = 0; k <= 8; k++) c.lineTo(x + k * 12, 214 - r.entier(10, 34) * Math.sin((k / 8) * Math.PI));
    c.lineTo(x + 96, 214);
    c.fill();
  }
  brume(c, L, 190, 238, 'rgba(255,240,230,0.28)');
}

/** Un olivier de loin : un tronc gris, une couronne argentée. */
function olivierLoin(c: Ctx, x: number, y: number, h: number): void {
  rect(c, x, y - h / 2, 1, h / 2, '#6a5a48');
  rect(c, x - h / 2, y - h, h, h / 2, '#8a9a6a');
  rect(c, x - h / 2 + 1, y - h, h - 2, 1, '#b0bc8a');
}

/** Un cyprès : une flamme vert sombre. */
function cypres(c: Ctx, x: number, y: number, h: number, couleur: string): void {
  for (let k = 0; k < h; k++) {
    const l = Math.max(1, Math.round(3 * Math.sin((k / h) * Math.PI) + 1));
    rect(c, x - l / 2, y - k, l, 1, couleur);
  }
}

/** Un mas : murs ocre, toit de tuiles à deux pentes. */
function mas(c: Ctx, x: number, y: number, w: number, h: number): void {
  rect(c, x, y - h, w, h, '#d2b88a');
  for (let k = 0; k < 4; k++) rect(c, x - 1 + k, y - h - k, w + 2 - 2 * k, 1, '#b8592e');
  rect(c, x + 2, y - h + 3, 2, 2, '#4a3a2a');
  rect(c, x + w - 4, y - h + 3, 2, 2, '#4a3a2a');
}

/** La vallée de la Siagne : collines de chênes verts, restanques d'oliviers, mas et cyprès. */
function vallee(c: Ctx, r: Aleatoire): void {
  relief(c, r, 215, 30, 30, '#5f7f45');
  for (let x = 0; x < L; x += r.entier(6, 12))
    arbreRond(c, x, 225 - r.entier(0, 18), r.entier(8, 14), r.choix(['#4a6a38', '#557a40', '#3f5f32']));
  // les restanques : des murets clairs en gradins, des oliviers dessus
  for (let k = 0; k < 4; k++) {
    const y = 226 + k * 4;
    rect(c, 0, y, L, 1, 'rgba(220,205,170,0.55)');
    for (let x = r.entier(0, 10); x < L; x += r.entier(9, 15)) olivierLoin(c, x, y, r.entier(4, 6));
  }
  for (let x = 40; x < L; x += r.entier(150, 260)) {
    mas(c, x, 224, r.entier(14, 22), r.entier(8, 11));
    cypres(c, x - 4, 224, r.entier(14, 20), '#2f4a2a');
    cypres(c, x + 26, 224, r.entier(12, 18), '#2f4a2a');
  }
  brume(c, L, 200, 250, 'rgba(255,245,230,0.16)');
}

/** Saint-Cézaire, au premier plan : les maisons de pierre et leurs toits, le clocher à campanile, la tour du château. */
function village(c: Ctx, r: Aleatoire): void {
  for (let x = 0; x < L; x += r.entier(26, 44)) {
    const w = r.entier(24, 40);
    const h = r.entier(22, 44);
    const y = 238;
    rect(c, x, y - h, w, h + 40, r.choix(['#c8b088', '#bfa67c', '#d2bc94']));
    // le toit de tuiles, une pente
    for (let k = 0; k < 5; k++)
      rect(c, x - 2 + k, y - h - k, w + 4 - k * 2, 1, k % 2 ? '#b8492e' : '#a8402a');
    // des fenêtres à volets verts ou bleus
    const volet = r.choix(['#4f7a5a', '#5a7aa0', '#6a8a6a']);
    for (let fy = y - h + 6; fy < y - 8; fy += 10)
      for (let fx = x + 4; fx < x + w - 6; fx += 10) {
        rect(c, fx, fy, 4, 6, '#2a2018');
        rect(c, fx - 2, fy, 2, 6, volet);
        rect(c, fx + 4, fy, 2, 6, volet);
      }
    if (r.suivant() < 0.15) {
      // le clocher, et son campanile de fer forgé
      rect(c, x + w / 2 - 5, y - h - 34, 10, 34, '#c2a87e');
      rect(c, x + w / 2 - 3, y - h - 28, 6, 8, '#2a2018');
      rect(c, x + w / 2 - 4, y - h - 40, 8, 6, '#3a3a40');
      rect(c, x + w / 2, y - h - 46, 1, 6, '#3a3a40');
    } else if (r.suivant() < 0.12) {
      // la tour carrée du château, crénelée
      rect(c, x + 4, y - h - 22, 16, 22, '#b8a07a');
      for (let k = 0; k < 4; k++) rect(c, x + 4 + k * 4, y - h - 25, 3, 3, '#b8a07a');
    }
    if (r.suivant() < 0.5) cypres(c, x + w + 2, y, r.entier(26, 40), '#22381f');
  }
}

/** Les falaises de calcaire des gorges, au loin, et les forêts qui les coiffent. */
function gorges(c: Ctx, r: Aleatoire): void {
  relief(c, r, 186, 40, 24, '#c8bea4');
  c.fillStyle = 'rgba(150,140,120,0.35)';
  for (let i = 0; i < 60; i++)
    rect(c, r.entier(0, L), r.entier(160, 230), 1, r.entier(6, 20), 'rgba(150,140,120,0.35)');
  for (let x = 0; x < L; x += r.entier(5, 10))
    arbreRond(c, x, 176 + r.entier(0, 14), r.entier(8, 13), r.choix(['#3f6a32', '#4a7a3a']));
  brume(c, L, 170, 240, 'rgba(230,245,235,0.25)');
}

/** La Siagne, toujours là : l'autre rive luxuriante, l'eau turquoise, ses rochers blancs, ses rapides et ses cascades. */
function siagne(c: Ctx, r: Aleatoire): void {
  // la forêt de l'autre rive, dense, de tous les verts
  for (let x = -10; x < L; x += r.entier(5, 11))
    arbreRond(
      c,
      x,
      214 - r.entier(0, 14),
      r.entier(16, 30),
      r.choix(['#2f6a2a', '#3f7a32', '#4f8a3a', '#2a5a2a', '#5a9a40']),
    );
  // l'eau
  rect(c, 0, 214, L, 30, '#3fa8b8');
  rect(c, 0, 214, L, 2, '#2f7a6a');
  for (let i = 0; i < 90; i++)
    rect(c, r.entier(0, L), r.entier(218, 242), r.entier(4, 14), 1, 'rgba(220,250,250,0.55)');
  // des rochers blancs dans le courant, l'écume autour
  for (let x = r.entier(10, 40); x < L; x += r.entier(40, 90)) {
    const w = r.entier(8, 18);
    rect(c, x, 226 - r.entier(0, 6), w, 6, '#d8d2c0');
    rect(c, x, 226, w, 1, '#ffffff');
    rect(c, x - 3, 232, w + 6, 1, 'rgba(255,255,255,0.8)');
  }
  // une cascade de loin en loin : une coulée blanche depuis la falaise, un bouillon d'écume en bas
  for (let x = r.entier(60, 200); x < L; x += r.entier(300, 420)) {
    rect(c, x - 10, 176, 26, 40, '#b8ae94');
    for (let k = 0; k < 6; k++) rect(c, x - 4 + k * 2, 178, 1, 38, k % 2 ? '#ffffff' : '#cfeff5');
    rect(c, x - 10, 214, 26, 4, '#ffffff');
  }
}

/** Le premier plan de la rivière : roseaux, fougères, grandes feuilles de figuier. */
function berge(c: Ctx, r: Aleatoire): void {
  for (let x = 0; x < L; x += r.entier(3, 7)) {
    const h = r.entier(10, 24);
    rect(c, x, 252 - h, 1, h, r.choix(['#3f6a2a', '#5a8a3a', '#4a7a32']));
    if (r.suivant() < 0.2) rect(c, x, 252 - h - 3, 1, 3, '#6a4a2a'); // un plumeau de roseau
  }
  for (let x = r.entier(0, 40); x < L; x += r.entier(60, 120)) {
    // une fougère, ou une grande feuille de figuier
    for (let k = 0; k < 5; k++) rect(c, x + k * 3, 246 - k * 2, 8 - k, 2, '#2f5a2a');
    rect(c, x + 22, 236, 10, 8, '#3a6a2a');
    rect(c, x + 24, 238, 6, 1, '#5a8a3a');
  }
}

export const PEINTURE_STC: Peinture = (c, r, _th, plan) => {
  if (plan === 0) lointainProvence(c, r);
  else if (plan === 1) vallee(c, r);
  else village(c, r);
};

export const PEINTURE_TUVES: Peinture = (c, r, _th, plan) => {
  if (plan === 0) gorges(c, r);
  else if (plan === 1) siagne(c, r);
  else berge(c, r);
};
