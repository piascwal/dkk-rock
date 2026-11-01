import { CONTOUR, D, N, type Pinceau, hasard, teinte } from './tuiles-hd-outils';

/**
 * Les murs en haute définition (voir tuiles-hd.ts) : la brique, le béton, le métal, la vitre et la paroi de fond. Chaque tuile a
 * ses variantes (la case donne la graine) : des briques de teintes différentes, une ébréchée, une fissure dans le béton, une
 * vitre allumée ou éteinte.
 */

/** La brique : des briques de 8 × 4 (pixels du jeu) en quinconce, joints en retrait, arêtes claires et sombres, une ébréchée. */
export function brique(pi: Pinceau, graine: number): void {
  const joint = '#4a3a33';
  pi.p(0, 0, N, N, joint);
  for (let r = 0; r < 4; r++) {
    const dec = r % 2 ? 4 * D : 0;
    for (let k = -1; k < 2; k++) {
      const x = k * 8 * D + dec + 1;
      const y = r * 4 * D + 1;
      const w = 8 * D - 2;
      const h = 4 * D - 2;
      const h0 = hasard(graine + k, r, 61);
      const base = h0 < 0.3 ? '#93382b' : h0 < 0.7 ? '#a3402f' : '#b04a36';
      pi.p(x, y, w, h, base);
      pi.p(x, y, w, 1, teinte(base, 0.25));
      pi.p(x, y + 1, 1, h - 1, teinte(base, 0.12));
      pi.p(x, y + h - 1, w, 1, teinte(base, -0.3));
      pi.p(x + w - 1, y, 1, h, teinte(base, -0.2));
      // le grain de la terre cuite
      for (let i = 0; i < 4; i++)
        pi.p(
          x + 2 + ((graine * 5 + i * 9 + k * 13) % (w - 4)),
          y + 2 + (i % 3) * 3,
          1,
          1,
          teinte(base, -0.18),
        );
      // de temps en temps, un coin ébréché
      if (hasard(graine + k * 3, r, 62) < 0.12) pi.p(x + w - 4, y, 4, 3, joint);
    }
  }
}

/** Le béton : un gris moucheté, un joint de banche, des bullages ; une fissure, parfois, et une coulure. */
export function beton(pi: Pinceau, graine: number): void {
  pi.p(0, 0, N, N, '#8d8d86');
  pi.grain('#7b7b74', 40, graine, 2);
  pi.grain('#a2a29a', 24, graine + 7, 1);
  pi.grain('#5e5e58', 10, graine + 3, 2);
  pi.p(0, 0, N, 1, '#a8a8a0');
  pi.p(0, N - 2, N, 2, '#6a6a64');
  // le joint de banche
  pi.p(0, 8 * D, N, 1, '#6f6f68');
  pi.p(0, 8 * D + 1, N, 1, '#a0a098');
  if (hasard(graine, 1, 63) < 0.3) {
    // une fissure qui zigzague
    let x = 10 + (graine % 30);
    for (let y = 2; y < N - 6; y += 3) {
      pi.p(x, y, 1, 3, '#55554f');
      x += (graine + y) % 3 === 0 ? 1 : (graine + y) % 3 === 1 ? -1 : 0;
    }
  }
  if (hasard(graine, 2, 64) < 0.25) pi.p(30 + (graine % 20), 8 * D + 2, 2, 5 * D, 'rgba(60,50,40,0.25)');
}

/** Le métal : une plaque à bords biseautés, quatre rivets, des rayures. */
export function metal(pi: Pinceau, graine: number): void {
  pi.p(0, 0, N, N, CONTOUR);
  pi.p(1, 1, N - 2, N - 2, '#7d8996');
  pi.p(3, 3, N - 6, N - 6, '#95a2b0');
  pi.p(1, 1, N - 2, 2, '#c4ced8');
  pi.p(1, 1, 2, N - 2, '#b0bcc8');
  pi.p(1, N - 3, N - 2, 2, '#5c6670');
  pi.p(N - 3, 1, 2, N - 2, '#66717c');
  for (const [x, y] of [
    [7, 7],
    [N - 10, 7],
    [7, N - 10],
    [N - 10, N - 10],
  ] as const) {
    pi.p(x, y, 4, 4, '#4c555e');
    pi.p(x, y, 2, 2, '#d4dce4');
  }
  for (let i = 0; i < 3; i++) {
    const y = 18 + ((graine * 7 + i * 13) % 28);
    pi.p(14 + ((graine + i * 11) % 20), y, 8 + i * 3, 1, '#a9b5c1');
  }
}

/** La vitre : un cadre, des petits bois, un reflet en biais ; allumée (une lumière chaude, un rideau) ou éteinte (le ciel). */
export function vitre(pi: Pinceau, graine: number, allumee: boolean): void {
  pi.p(0, 0, N, N, '#4b525c');
  pi.p(2, 2, N - 4, N - 4, CONTOUR);
  const verre = allumee ? '#ffcf66' : '#6fb4dc';
  pi.p(4, 4, N - 8, N - 8, verre);
  pi.p(4, 4, N - 8, 6 * D, allumee ? '#ffe08a' : '#8cc8e8');
  if (allumee && hasard(graine, 3, 65) < 0.5) {
    // un rideau tiré d'un côté
    pi.p(4, 4, 4 * D, N - 8, '#c4573f');
    for (let y = 4; y < N - 4; y += 4) pi.p(4 + D, y, 1, 2, '#9a3f2c');
  }
  // les petits bois
  pi.p(N / 2 - 1, 4, 3, N - 8, '#4b525c');
  pi.p(4, N / 2 - 1, N - 8, 3, '#4b525c');
  // le reflet en biais
  for (let i = 0; i < 10; i++) {
    pi.p(10 + i, 22 - i * 2, 2, 2, 'rgba(255,255,255,0.55)');
    pi.p(16 + i, 26 - i * 2, 1, 2, 'rgba(255,255,255,0.35)');
  }
  // l'appui, en bas
  pi.p(0, N - 4, N, 4, '#6a727c');
  pi.p(0, N - 4, N, 1, '#9aa3ad');
}

/** La paroi de fond (derrière la matière détruite, l'intérieur des bâtiments) : la couleur du thème, un grain, des pierres à peine marquées. */
export function paroi(pi: Pinceau, couleur: string, graine: number): void {
  pi.p(0, 0, N, N, couleur);
  // des blocs à peine dessinés, plus sombres que la paroi, pour qu'elle reste au fond
  for (let r = 0; r < 2; r++) {
    const dec = r % 2 ? 6 * D : 0;
    for (let k = -1; k < 2; k++) {
      const x = k * 12 * D + dec;
      pi.p(x, r * 8 * D, 12 * D, 1, teinte(couleur, -0.25));
      pi.p(x, r * 8 * D, 1, 8 * D, teinte(couleur, -0.2));
    }
  }
  pi.grain(teinte(couleur, -0.3), 18, graine, 2);
  pi.grain(teinte(couleur, 0.08), 10, graine + 5, 1);
  pi.p(0, 0, N, 1, 'rgba(0,0,0,0.25)');
}
