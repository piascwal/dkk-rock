import { PENTE, pente } from '../jeu/plongeon';
import type { Aleatoire } from '../moteur/maths';
import { disque } from './formes-pixels';
import { px, py, rect, S, XM, YH } from './plongeon-monde';

/**
 * Le pont des Tuves vu de face, comme sur les photos : un vieux pont en dos d'âne pointu, une seule arche en plein cintre de pierres
 * brutes, sans corniche, gris-blanc taché d'ocre, mangé de mousse et de lierre. Sous l'arche, rien : on voit au travers le
 * lointain (le ciel, les arbres, la rivière en amont). Ses culées plongent dans le feuillage des rives.
 */

type Ctx = CanvasRenderingContext2D;

/** La demi-ouverture de l'arche (m), la hauteur de sa naissance et de sa clé sous le tablier, l'épaisseur de l'anneau. */
const DEMI = 7.2;
const NAISSANCE = 8;
const CLE = 0.9;
const ANNEAU = 0.7;
/** Jusqu'où vont les culées, de part et d'autre, et jusqu'à quelle profondeur. */
const CULEE = 13;
const PIED = 11;
/** La clé du dos d'âne, à peine arrondie sur cette demi-largeur (m). */
const ARRONDI = 0.6;

/** Le dessus du tablier à `x` (m) : un dos d'âne en pointe, à peine arrondi à la clé (la pente vient de la simulation). */
export const tablier = (x: number): number =>
  -1.15 + (Math.abs(x) < ARRONDI ? PENTE * ((x * x) / (2 * ARRONDI) + ARRONDI / 2) : pente(x));

/** L'intrados de l'arche à `x` (m), ou rien hors de l'ouverture. */
const intrados = (x: number): number =>
  Math.abs(x) >= DEMI ? Infinity : NAISSANCE - (NAISSANCE - CLE) * Math.sqrt(1 - (x / DEMI) ** 2);

const PIERRES = ['#b4af9e', '#a39d8a', '#c2bdac', '#958f7b', '#aca38a', '#b9ac90', '#8f8a78'];

/** Une pierre brute : un bloc irrégulier, une arête claire en haut, un joint sombre autour. */
function pierre(c: Ctx, r: Aleatoire, x: number, y: number, w: number, h: number): void {
  rect(c, x - 1, y - 1, w + 2, h + 2, '#6e6858');
  rect(c, x, y, w, h, r.choix(PIERRES));
  rect(c, x, y, w, 1, 'rgba(255,255,245,0.35)');
  if (r.suivant() < 0.2) rect(c, x + 1, y + 1, w - 2, h - 1, 'rgba(190,140,70,0.25)'); // une tache ocre
}

/** Un coussin de mousse ou de lierre. */
function mousse(c: Ctx, r: Aleatoire, x: number, y: number, n: number, sombre: boolean): void {
  for (let k = 0; k < n; k++) {
    c.fillStyle = sombre
      ? r.choix(['#2f5a26', '#3a6a2c', '#24481f'])
      : r.choix(['#6a8a3a', '#7a9a44', '#5a7a34']);
    disque(c, x + r.entier(-6, 6), y + r.entier(-4, 4), r.entier(1, 3));
  }
}

export function peintPont(c: Ctx, r: Aleatoire): void {
  // la maçonnerie : des rangs de pierres brutes, du tablier aux culées, en laissant l'arche vide
  for (let y = py(-1.2); y < py(PIED); y += r.entier(4, 6)) {
    let x = px(-CULEE) + r.entier(-4, 0);
    while (x < px(CULEE)) {
      const w = r.entier(3, 9);
      const h = r.entier(2, 5);
      const xm = (x + w / 2) / S - XM;
      const ym = y / S + YH;
      const dessus = py(tablier(xm)) + 4;
      const largeurCulee = CULEE - (ym > NAISSANCE ? (ym - NAISSANCE) * 0.5 : 0);
      if (y >= dessus && ym + h / S < intrados(xm) - 0.1 && Math.abs(xm) < largeurCulee)
        pierre(c, r, x, y, w, h);
      x += w + 1;
    }
  }
  // l'anneau de l'arche : des pierres plates posées de chant, qui rayonnent
  const n = 30;
  for (let i = 0; i < n; i++) {
    const a = Math.PI + ((i + 0.5) / n) * Math.PI;
    const cx = Math.cos(a);
    const sy = Math.sin(a);
    c.save();
    c.translate(px(cx * (DEMI + ANNEAU / 2)), py(NAISSANCE + sy * (NAISSANCE - CLE + ANNEAU / 2)));
    c.rotate(Math.atan2(sy * (NAISSANCE - CLE), cx * DEMI) + Math.PI / 2);
    const l = ANNEAU * S + r.entier(-1, 2);
    rect(c, -l / 2 - 1, -3, l + 2, 6, '#5e5848');
    rect(c, -l / 2, -2, l, 4, r.choix(PIERRES));
    c.restore();
  }
  // l'ombre sous l'arche, contre l'intrados
  for (let x = -DEMI + 0.1; x < DEMI - 0.1; x += 1 / S)
    rect(c, px(x), py(intrados(x)), 1, 3, 'rgba(40,40,30,0.5)');
  // le parapet : un muret de pierres brutes au dessus arrondi, qui suit le dos d'âne
  for (let x = -CULEE; x < CULEE; x += 0.6) {
    const y = tablier(x);
    pierre(c, r, px(x), py(y) - 0.8 * S, 0.6 * S - 1, 0.45 * S);
    pierre(c, r, px(x + 0.3), py(y) - 0.35 * S, 0.6 * S - 1, 0.35 * S);
    rect(c, px(x), py(y) - 0.8 * S - 2, 0.6 * S, 2, '#ddd8c6'); // le chaperon, usé et clair
  }
  // la mousse et le lierre : sur les culées, aux reins de l'arche, en rideau à droite comme sur les photos
  for (let k = 0; k < 40; k++) {
    const x = r.entre(-CULEE + 0.5, CULEE - 0.5);
    const y = r.entre(tablier(x) + 0.2, Math.min(PIED - 1, intrados(x) - 0.3));
    mousse(c, r, px(x), py(y), 6, k % 3 === 0);
  }
  for (let k = 0; k < 16; k++) {
    const x = r.entre(DEMI - 1, CULEE);
    const long = r.entre(1, 4) * S;
    const y0 = py(Math.min(intrados(x), tablier(x) + 0.5));
    for (let j = 0; j < long; j++) {
      c.fillStyle = j % 3 === 0 ? '#4a8a36' : '#24501f';
      c.fillRect(px(x) + Math.round(Math.sin(j / 4 + k) * 2), y0 + j, j % 3 === 0 ? 3 : 2, 1);
    }
  }
  for (let k = 0; k < 8; k++) {
    // le lierre qui pend de la clé et des reins
    const x = r.entre(-DEMI + 1, DEMI - 1);
    const y = intrados(x);
    const long = r.entre(0.6, 2.2) * S;
    for (let j = 0; j < long; j++) {
      c.fillStyle = j % 4 === 0 ? '#5a9a40' : '#2f6a2a';
      c.fillRect(px(x) + Math.round(Math.sin(j / 5 + k) * 1.5), py(y) + j, j % 4 === 0 ? 3 : 1, 1);
    }
  }
}
