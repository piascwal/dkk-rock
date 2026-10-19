import type { Accessoire } from './decor-objets';

/**
 * Des accessoires de plus, dessinés en code (formes plates à trois tons) en attendant de vrais sprites : de quoi peupler
 * les niveaux. Même convention que decor-objets.ts : autour du milieu de la base (0, 0), la base en bas.
 */

const tonneau: Accessoire = (p) => {
  p(-4, -11, 9, 11, '#6b4520');
  p(-5, -9, 11, 7, '#6b4520');
  p(-3, -10, 2, 9, '#8a5a2b');
  p(-5, -8, 11, 1, '#3a3a40');
  p(-5, -3, 11, 1, '#3a3a40');
  p(-3, -11, 7, 1, '#a8743a');
};

const sacs: Accessoire = (p) => {
  for (const [x, c] of [
    [-9, '#c2a878'],
    [-3, '#b69a68'],
    [3, '#c2a878'],
  ] as const) {
    p(x, -4, 6, 4, c);
    p(x + 1, -5, 4, 1, c);
    p(x, -1, 6, 1, '#8a7448');
  }
  p(-6, -8, 6, 4, '#b69a68');
  p(0, -8, 6, 4, '#c2a878');
  p(-5, -9, 4, 1, '#b69a68');
  p(1, -9, 4, 1, '#c2a878');
  p(-6, -5, 6, 1, '#8a7448');
};

const pneus: Accessoire = (p) => {
  p(-6, -4, 12, 4, '#1a1a1e');
  p(-5, -5, 10, 1, '#2e2e34');
  p(-2, -3, 4, 1, '#55555e');
  p(-5, -8, 10, 4, '#222228');
  p(-4, -9, 8, 1, '#34343c');
  p(-2, -7, 4, 1, '#55555e');
};

const fougere: Accessoire = (p, v) => {
  p(0, -4, 1, 4, '#2f6a2a');
  for (const [x, y, w, c] of [
    [-8, -4, 7, '#3f8f3a'],
    [-7, -6, 6, '#4f9a3a'],
    [-5, -8, 5, '#3f8f3a'],
    [1, -8, 5, '#4f9a3a'],
    [2, -6, 6, '#3f8f3a'],
    [2, -4, 7, '#4f9a3a'],
    [-2, -10 - (v % 3), 4, '#7cc04a'],
  ] as const)
    p(x, y, w, 2, c);
};

const souche: Accessoire = (p) => {
  p(-5, -6, 10, 6, '#6b4423');
  p(-5, -7, 10, 2, '#a8743a');
  p(-2, -6, 4, 1, '#6b4423');
  p(-6, -1, 2, 1, '#6b4423');
  p(4, -1, 3, 1, '#6b4423');
  p(-4, -4, 1, 4, '#4a2e12');
};

const champignons: Accessoire = (p, v) => {
  p(-4, -5, 5, 2, '#e5432f');
  p(-3, -4, 1, 1, '#ffffff');
  p(-2, -3, 1, 3, '#f4e8d0');
  p(3, -4, 4, 2, v % 2 ? '#ff9b2f' : '#e5432f');
  p(4, -2, 1, 2, '#f4e8d0');
};

const tronc: Accessoire = (p) => {
  p(-10, -5, 20, 5, '#6b4423');
  p(-10, -5, 20, 1, '#8a5a2b');
  p(-11, -4, 3, 4, '#a8743a');
  p(-10, -3, 1, 2, '#6b4423');
  for (const x of [-4, 2, 7]) p(x, -3, 2, 1, '#4a2e12');
};

const cairn: Accessoire = (p) => {
  p(-5, -3, 10, 3, '#8a8a96');
  p(-4, -6, 8, 3, '#6d6d78');
  p(-2, -8, 4, 2, '#9393a0');
  p(-5, -3, 10, 1, '#a5a5b0');
};

const pot: Accessoire = (p, v) => {
  p(-3, -5, 7, 5, '#a8553a');
  p(-4, -6, 9, 2, '#c46b4a');
  p(-2, -10, 5, 5, '#3f8f3a');
  p(-1, -11, 2, 2, v % 2 ? '#ff4fd8' : '#ffd23f');
  p(2, -9, 2, 2, v % 2 ? '#ffd23f' : '#3fe0ff');
};

const panneauFleche: Accessoire = (p, v) => {
  p(0, -15, 2, 15, '#6b4520');
  const s = v % 2 ? -1 : 1;
  p(s > 0 ? -5 : -9, -15, 14, 5, '#c49a5a');
  p(s > 0 ? 9 : -11, -14, 2, 3, '#c49a5a');
  p(s > 0 ? -4 : -8, -13, 8, 1, '#6b4520');
};

/** Une flamme qui danse : trois images, des braises qui montent. (Le temps vient de l'horloge du navigateur.) */
function flamme(p: Parameters<Accessoire>[0], x: number, y: number, h: number): void {
  const t = Math.floor(Date.now() / 90);
  const f = t % 3;
  p(x - 2, y - h, 5, h, '#ff6b35');
  p(x - 1, y - h - 1 - (f === 1 ? 1 : 0), 3, h, '#ff9b2f');
  p(x - 1, y - h + 2, 3, h - 3, '#ffd23f');
  p(x, y - h - 2 - f, 1, 2, f === 2 ? '#ffd23f' : '#ff6b35');
  if (t % 5 === 0) p(x + 3, y - h - 3, 1, 1, '#ffd23f');
}

const torche: Accessoire = (p) => {
  p(0, -14, 2, 14, '#5e3b1a');
  p(-2, -16, 6, 3, '#333338');
  flamme(p, 1, -16, 5);
};

const feuDeCamp: Accessoire = (p) => {
  p(-8, -2, 16, 2, '#6d6d78');
  p(-6, -3, 3, 1, '#8a8a96');
  p(-5, -5, 11, 2, '#6b4423');
  flamme(p, 0, -5, 8);
};

/** Une pierre levée (repli en code du sprite menhir) : une pointe, un ventre éclairé à gauche, de la mousse au pied. */
const menhir: Accessoire = (p) => {
  p(-4, -22, 8, 22, '#8a929b');
  p(-3, -24, 6, 2, '#8a929b');
  p(-4, -22, 2, 22, '#b0b8c0');
  p(2, -20, 2, 20, '#5a626b');
  p(-4, -6, 8, 2, '#4f7a3a');
};

/** Un dolmen : deux pierres de soutien et une table qui déborde ; dessiné en code seulement (pas de planche). */
const dolmen: Accessoire = (p) => {
  p(-10, -9, 4, 9, '#6d7680');
  p(6, -9, 4, 9, '#6d7680');
  p(-13, -12, 26, 3, '#8a929b');
  p(-13, -12, 26, 1, '#b0b8c0');
  p(-13, -10, 26, 1, '#4e565e');
  p(-10, -2, 4, 2, '#4f7a3a');
  p(6, -2, 4, 2, '#4f7a3a');
};

export const ACCESSOIRES_SUPPLEMENTAIRES = {
  menhir,
  dolmen,
  tonneau,
  sacs,
  pneus,
  fougere,
  souche,
  champignons,
  tronc,
  cairn,
  pot,
  panneauFleche,
  torche,
  flambeau: torche,
  feuDeCamp,
} satisfies Record<string, Accessoire>;
