import type { Px } from './carte-monde-decor';

/**
 * Les décors de l'île de l'International Tour sur la carte du monde (tuiles de 8 px ; les grands font 2 × 2 tuiles) : la
 * cathédrale de Beauvais et son avion, le château du roi Jean et les moutons de Limerick, les tours jumelles et les maisons rouges
 * de Lund, les gratte-ciel, la statue de la Liberté et les taxis de New York, la Bonne Mère et les pointus de Marseille.
 */

export const cathedrale = (p: Px, x: number, y: number) => {
  p(x + 3, y + 5, 10, 10, '#1a120c');
  p(x + 4, y + 6, 8, 9, '#cfc6aa');
  p(x + 5, y + 2, 6, 4, '#5a5a62'); // le toit pentu
  p(x + 7, y + 1, 2, 1, '#5a5a62');
  for (const fx of [5, 7, 9]) p(x + fx, y + 8, 1, 5, '#4a5a7a');
  p(x + 1, y + 9, 2, 6, '#a89f88'); // un arc-boutant
  p(x + 13, y + 9, 2, 6, '#a89f88');
};

export const avion = (p: Px, x: number, y: number) => {
  p(x + 1, y + 3, 6, 2, '#f2f2f2');
  p(x + 3, y + 1, 2, 6, '#f2f2f2');
  p(x + 1, y + 2, 1, 2, '#1a3a8a');
};

export const chateauRond = (p: Px, x: number, y: number) => {
  p(x + 1, y + 7, 14, 8, '#1a1a1a');
  p(x + 2, y + 8, 12, 7, '#8a8a86');
  for (const tx of [1, 11]) {
    p(x + tx, y + 4, 4, 11, '#1a1a1a');
    p(x + tx + 1, y + 5, 2, 10, '#7a7a76');
    p(x + tx, y + 3, 1, 1, '#7a7a76');
    p(x + tx + 3, y + 3, 1, 1, '#7a7a76');
  }
  p(x + 7, y + 3, 1, 5, '#3a3a40');
  p(x + 8, y + 3, 1, 1, '#169b62');
  p(x + 9, y + 3, 1, 1, '#f2f2f2');
  p(x + 10, y + 3, 1, 1, '#ff883e');
};

export const mouton = (p: Px, x: number, y: number) => {
  p(x + 1, y + 3, 5, 3, '#f2f2ec');
  p(x + 2, y + 2, 3, 1, '#f2f2ec');
  p(x + 6, y + 3, 2, 2, '#1a1a1a');
  p(x + 2, y + 6, 1, 1, '#1a1a1a');
  p(x + 5, y + 6, 1, 1, '#1a1a1a');
};

export const toursJumelles = (p: Px, x: number, y: number) => {
  for (const tx of [2, 9]) {
    p(x + tx, y + 5, 5, 10, '#1a1a22');
    p(x + tx + 1, y + 6, 3, 9, '#6a6a7a');
    p(x + tx + 1, y + 2, 3, 3, '#3a5a4a');
    p(x + tx + 2, y + 1, 1, 1, '#3a5a4a');
    p(x + tx + 2, y + 8, 1, 2, '#e8a85a');
  }
};

export const maisonRouge = (p: Px, x: number, y: number) => {
  p(x + 1, y + 3, 6, 4, '#2a1a12');
  p(x + 2, y + 4, 4, 3, '#8a2a22');
  p(x + 1, y + 1, 6, 2, '#f2f6fa');
  p(x + 3, y + 5, 2, 1, '#ffcf6b');
};

export const gratteCiel = (p: Px, x: number, y: number) => {
  p(x + 4, y + 1, 7, 14, '#1a1a22');
  p(x + 5, y + 2, 5, 13, '#8a98b0');
  for (let fy = 3; fy < 14; fy += 2) p(x + 6, y + fy, 3, 1, '#f0e0a0');
  p(x + 7, y, 1, 1, '#c8ccd6');
  p(x + 11, y + 8, 3, 7, '#7a3424'); // un immeuble de brique, et son château d'eau
  p(x + 12, y + 6, 2, 2, '#8a6038');
};

export const liberte = (p: Px, x: number, y: number) => {
  p(x + 5, y + 11, 6, 4, '#9a9a8a');
  p(x + 7, y + 5, 3, 6, '#6aa89a');
  p(x + 7, y + 3, 3, 2, '#6aa89a');
  p(x + 10, y + 1, 1, 5, '#6aa89a');
  p(x + 10, y, 1, 1, '#ffd23f');
};

export const taxi = (p: Px, x: number, y: number) => {
  p(x + 1, y + 3, 6, 3, '#ffd23f');
  p(x + 2, y + 2, 4, 1, '#ffd23f');
  p(x + 2, y + 6, 1, 1, '#1a1a1a');
  p(x + 5, y + 6, 1, 1, '#1a1a1a');
  p(x + 3, y + 3, 2, 1, '#3a4250');
};

export const bonneMere = (p: Px, x: number, y: number) => {
  p(x + 1, y + 11, 14, 4, '#9a9478'); // la colline
  p(x + 3, y + 9, 10, 2, '#9a9478');
  p(x + 5, y + 6, 6, 3, '#e8e2d0'); // la basilique
  p(x + 5, y + 7, 6, 1, '#6a8a6a');
  p(x + 9, y + 2, 2, 4, '#e8e2d0'); // le clocher
  p(x + 9, y, 2, 2, '#ffd23f'); // la Bonne Mère
};

export const pointu = (p: Px, x: number, y: number) => {
  p(x + 1, y + 5, 6, 2, '#3fa7f2');
  p(x + 2, y + 4, 4, 1, '#f2f2f2');
  p(x + 4, y + 1, 1, 3, '#5a3a22');
};
