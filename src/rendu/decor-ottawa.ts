import type { Accessoire } from './decor-objets';

/**
 * Les accessoires d'Ottawa, dessinés en code comme les autres (autour du milieu de la base, un héros fait 28 de haut) : le
 * drapeau à la feuille d'érable, l'érable nu sous la neige, le panneau d'arrêt bilingue, le kiosque à poutine, la cage de hockey.
 */

const drapeauCanada: Accessoire = (p, v) => {
  p(0, -40, 1, 40, '#8a8a90');
  const y = -40 + (v % 2);
  p(1, y, 4, 10, '#d52b1e');
  p(5, y, 6, 10, '#ffffff');
  p(11, y, 4, 10, '#d52b1e');
  p(7, y + 1, 2, 7, '#d52b1e'); // la feuille d'érable
  p(6, y + 3, 4, 3, '#d52b1e');
  p(5, y + 4, 6, 1, '#d52b1e');
};

const erableNeige: Accessoire = (p, v) => {
  p(-2, -30, 4, 30, '#4a3426');
  for (const [x, y, w] of [
    [-10, -30, 8],
    [2, -34, 9],
    [-6, -40, 3],
    [4, -44, 2],
  ] as const) {
    p(x, y, w, 2, '#4a3426');
    p(x, y - 1, w, 1, '#f4f9ff');
  }
  p(-6, -44, 3, 4, '#4a3426');
  if (v % 3 === 0) {
    p(8, -37, 2, 2, '#d52b1e'); // une dernière feuille rouge
    p(-9, -33, 2, 2, '#e8602a');
  }
};

const panneauArret: Accessoire = (p) => {
  p(0, -22, 1, 22, '#8a8a90');
  p(-5, -32, 11, 10, '#d52b1e');
  p(-4, -33, 9, 12, '#d52b1e');
  p(-3, -30, 7, 1, '#ffffff'); // ARRÊT
  p(-3, -26, 7, 1, '#ffffff'); // STOP
};

const kiosquePoutine: Accessoire = (p) => {
  p(-16, -30, 32, 6, '#d52b1e');
  p(-16, -30, 32, 1, '#ff6a5a');
  p(-15, -24, 1, 24, '#5a5a62');
  p(14, -24, 1, 24, '#5a5a62');
  p(-14, -11, 28, 11, '#8a5a2b');
  p(-14, -11, 28, 1, '#a8743a');
  p(-6, -21, 12, 6, '#f4e2b0'); // l'enseigne
  p(-4, -19, 8, 2, '#8a4a1a');
};

const cageHockey: Accessoire = (p) => {
  p(-10, -12, 20, 1, '#d52b1e');
  p(-10, -12, 1, 12, '#d52b1e');
  p(9, -12, 1, 12, '#d52b1e');
  for (let x = -8; x < 9; x += 2) p(x, -11, 1, 11, 'rgba(255,255,255,0.7)');
  for (let y = -10; y < 0; y += 2) p(-9, y, 18, 1, 'rgba(255,255,255,0.5)');
};

export const ACCESSOIRES_OTTAWA = { drapeauCanada, erableNeige, panneauArret, kiosquePoutine, cageHockey };
