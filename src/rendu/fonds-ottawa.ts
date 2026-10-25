import type { Aleatoire } from '../moteur/maths';
import { sapinPixel } from './fonds-arbres';
import type { Peinture } from './fonds-bretagne';
import { L, pignon, rect, relief, type Ctx } from './fonds-international';

/**
 * Le fond d'Ottawa, peint une fois au chargement du niveau : au loin, les collines de la Gatineau sous la neige, la colline du
 * Parlement (le bloc du Centre en grès, la tour de la Paix et son horloge, la bibliothèque ronde, leurs toits de cuivre vert-de-gris)
 * et les tourelles du Château Laurier ; devant, les maisons de brique du Glebe et leurs galeries, la neige sur les toits, des
 * érables nus, des drapeaux à la feuille d'érable et les bancs de neige du déneigement. Même format que fonds-international.ts.
 */

const GRES = '#c8b088';
const CUIVRE = '#5a9a8a';
const NEIGE = '#f2f6fc';

/** La colline du Parlement : le bloc du Centre, la tour de la Paix au milieu, la bibliothèque ronde derrière, à droite. */
function parlement(c: Ctx, x: number, sol: number): void {
  rect(c, x - 20, sol - 14, 260, 14, '#8a9aa8'); // la colline, sous la neige
  rect(c, x, sol - 50, 200, 36, GRES);
  pignon(c, x - 2, sol - 50, 204, 10, CUIVRE);
  for (let k = 0; k < 12; k++) rect(c, x + 8 + k * 16, sol - 40, 4, 14, '#5a4a3a');
  for (const tx of [x + 4, x + 186]) {
    rect(c, tx, sol - 66, 10, 18, GRES);
    pignon(c, tx - 1, sol - 66, 12, 12, CUIVRE);
  }
  // la tour de la Paix, son horloge, sa flèche de cuivre
  rect(c, x + 88, sol - 132, 24, 84, GRES);
  rect(c, x + 92, sol - 120, 16, 16, '#f2ead8');
  rect(c, x + 99, sol - 118, 2, 8, '#2a2a30');
  rect(c, x + 99, sol - 112, 6, 2, '#2a2a30');
  for (let k = 0; k < 4; k++) rect(c, x + 94 + k * 4, sol - 96, 2, 30, '#5a4a3a');
  pignon(c, x + 86, sol - 132, 28, 30, CUIVRE);
  rect(c, x + 99, sol - 172, 2, 10, '#c8303a'); // le drapeau
  rect(c, x + 101, sol - 172, 10, 6, '#d52b1e');
  rect(c, x + 104, sol - 172, 4, 6, '#ffffff');
  // la bibliothèque, ronde, coiffée de son dôme
  c.fillStyle = GRES;
  c.beginPath();
  c.arc(x + 230, sol - 34, 22, Math.PI, 0);
  c.fill();
  rect(c, x + 208, sol - 34, 44, 20, GRES);
  pignon(c, x + 214, sol - 54, 32, 22, CUIVRE);
}

/** Le Château Laurier : un château de calcaire clair, ses tourelles pointues de cuivre, ses fenêtres allumées. */
function chateauLaurier(c: Ctx, x: number, sol: number): void {
  rect(c, x, sol - 60, 90, 60, '#d8d0c0');
  pignon(c, x - 2, sol - 60, 94, 16, CUIVRE);
  for (const tx of [x - 6, x + 26, x + 82]) {
    rect(c, tx, sol - 74, 14, 74, '#d8d0c0');
    pignon(c, tx - 1, sol - 74, 16, 20, CUIVRE);
  }
  for (let fy = sol - 50; fy < sol - 8; fy += 12)
    for (let fx = x + 6; fx < x + 86; fx += 10) rect(c, fx, fy, 4, 6, '#3a3a48');
}

/** Une maison du Glebe : brique rouge, une galerie de bois devant, la neige sur le toit et sur la rampe. */
function maisonGlebe(c: Ctx, r: Aleatoire, x: number, sol: number, w: number, h: number): void {
  rect(c, x, sol - h, w, h + 40, r.choix(['#8a3a2a', '#7a3426', '#94442e', '#6a5a4a']));
  for (let fx = x + 4; fx < x + w - 6; fx += 9) {
    rect(c, fx - 1, sol - h + 5, 7, 9, '#e8e0d0');
    rect(c, fx, sol - h + 6, 5, 7, r.suivant() < 0.5 ? '#ffd88a' : '#3a3a48');
  }
  rect(c, x - 2, sol - 12, w + 4, 2, '#e8e0d0'); // la galerie
  for (let k = x; k <= x + w; k += 6) rect(c, k, sol - 12, 1, 12, '#e8e0d0');
  rect(c, x - 2, sol - 13, w + 4, 1, NEIGE);
  pignon(c, x - 3, sol - h, w + 6, 14, '#3a3038');
  pignon(c, x - 3, sol - h, w + 6, 4, NEIGE);
}

/** Un érable nu de l'hiver : le tronc, des branches en fourche, la neige posée dessus. */
function erableNu(c: Ctx, x: number, sol: number, h: number): void {
  rect(c, x - 2, sol - h, 4, h, '#3a2a20');
  for (const [dx, dy, w] of [
    [-12, 0.55, 10],
    [2, 0.7, 11],
    [-8, 0.85, 7],
    [3, 0.95, 6],
  ] as const) {
    rect(c, x + dx, sol - h * dy, w, 2, '#3a2a20');
    rect(c, x + dx, sol - h * dy - 1, w, 1, NEIGE);
  }
}

/** Un drapeau du Canada sur son mât : rouge, blanc, rouge, la feuille d'érable au milieu. */
function drapeau(c: Ctx, x: number, sol: number): void {
  rect(c, x, sol - 46, 2, 46, '#8a8a90');
  rect(c, x + 2, sol - 46, 5, 12, '#d52b1e');
  rect(c, x + 7, sol - 46, 8, 12, '#ffffff');
  rect(c, x + 15, sol - 46, 5, 12, '#d52b1e');
  rect(c, x + 10, sol - 44, 2, 8, '#d52b1e');
  rect(c, x + 8, sol - 42, 6, 3, '#d52b1e');
}

const ottawa: Peinture = (c, r, th, plan) => {
  if (plan === 0) {
    relief(c, r, 214, 14, 60, th.lointain); // les collines de la Gatineau
    relief(c, r, 222, 6, 40, '#c8d4e4');
    parlement(c, 300, 232);
    chateauLaurier(c, 640, 232);
    relief(c, r, 238, 3, 40, '#dfe8f4'); // la rivière gelée, la plaine
    return;
  }
  for (let x = 0; x < L; x += r.entier(36, 52)) {
    const w = r.entier(28, 38);
    maisonGlebe(c, r, x, 238, w, r.entier(26, 38));
    if (r.suivant() < 0.35) erableNu(c, x + w + 6, 240, r.entier(26, 38));
    else if (r.suivant() < 0.3) sapinPixel(c, x + w + 6, 240, r.entier(18, 26), '#2a4a3a', NEIGE);
    if (r.suivant() < 0.15) drapeau(c, x + w + 2, 240);
  }
  for (let x = 0; x < L; x += 24) rect(c, x, 234 + ((x / 24) % 3), 26, 8, NEIGE); // les bancs de neige
};

export const PEINTURES_OTTAWA = { ottawa };
