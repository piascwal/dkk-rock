import { G } from '../jeu/vue';
import type { Pinceau } from './pinceau';
import { DESSINS_TIRS } from './dessins-tirs';

type Dessin = (p: Pinceau, e: number, f: number) => void;

/** Le dessin qui sert d'icône à chaque arme ramassable (dans l'ordre d'ARMES_RAMASSABLES). */
const ICONES_ARMES = [G.P_AMPLI, G.P_VINYLE, G.P_FLAMME, G.P_CORNEMUSE, G.P_TRIANGLE, G.P_GONG];

/** Un cœur en pixels (X plein, o reflet), cerné ; (0, 0) : le milieu de sa base. */
function coeur(
  p: Pinceau,
  rangees: readonly string[],
  plein: string,
  reflet: string,
  contour: string,
  haut: number,
): void {
  const w = rangees[0]!.length;
  const x0 = -Math.floor(w / 2);
  const y0 = -haut - rangees.length;
  for (const [dx, dy] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ] as const)
    rangees.forEach((l, y) => {
      for (let x = 0; x < l.length; x++) if (l[x] !== '.') p(x0 + x + dx, y0 + y + dy, 1, 1, contour);
    });
  rangees.forEach((l, y) => {
    for (let x = 0; x < l.length; x++)
      if (l[x] !== '.') p(x0 + x, y0 + y, 1, 1, l[x] === 'o' ? reflet : plein);
  });
}

const COEUR = ['.XX.XX.', 'XoXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
const COEUR_DORE = [
  '.XXX.XXX.',
  'XoXXXXXXX',
  'XoXXXXXXX',
  'XXXXXXXXX',
  '.XXXXXXX.',
  '..XXXXX..',
  '...XXX...',
  '....X....',
];

export const DESSINS_OBJETS: Partial<Record<number, Dessin>> = {
  [G.CAGE]: (p, e) => {
    p(-8, -18, 16, 2, '#555');
    p(-8, -1, 16, 1, '#555');
    if (e === 0) {
      // un membre du groupe, l'air contrarié
      p(-2, -14, 4, 4, '#f1c27d');
      p(-3, -10, 6, 7, '#444');
      p(-1, -12, 1, 1, '#111');
      p(1, -12, 1, 1, '#111');
      for (let x = -8; x <= 6; x += 3) p(x, -16, 1, 15, '#9aa3ad');
    } else {
      for (let x = -8; x <= -2; x += 3) p(x, -16, 1, 15, '#9aa3ad');
      p(6, -16, 1, 15, '#9aa3ad');
    }
  },
  [G.DRAPEAU]: (p, e, f) => {
    p(0, -32, 1, 32, '#cfcfcf');
    p(-1, -33, 3, 1, '#ffd23f');
    if (e === 0) {
      p(1, -30, 6, 8, '#6b6b6b');
      return;
    }
    const v = Math.floor(f / 6) % 2;
    p(1, -31, 12, 9, '#c1121f');
    p(1 + 12, -31 + v, 1, 8, '#c1121f');
    p(3, -29, 8, 1, '#111');
    p(3, -26, 8, 1, '#111');
    p(5, -28, 4, 2, '#ffffff');
  },
  [G.VAN]: (p, _e, f) => {
    p(-22, -22, 44, 12, '#efe6cc');
    p(-22, -11, 44, 8, '#d64545');
    p(-22, -22, 44, 1, '#ffffff');
    for (const x of [-19, -9, 1]) p(x, -20, 8, 6, '#9fd8f0');
    p(12, -20, 8, 7, '#9fd8f0');
    p(-14, -10, 2, 6, '#ffd23f');
    p(-10, -9, 2, 5, '#ff9b2f');
    p(-6, -10, 2, 6, '#ffd23f');
    for (const x of [-15, 11]) {
      p(x, -4, 7, 4, '#111');
      p(x + 2, -3, 3, 2, '#888');
    }
    p(20, -14, 2, 2, f % 30 < 15 ? '#fff3b0' : '#ffd23f');
  },
  [G.ARME]: (p, _e, f) => {
    const b = f % 40 < 20 ? 0 : -1;
    p(-6, -12 + b, 12, 12, '#2b2b2b');
    p(-6, -12 + b, 12, 1, '#ffd23f');
    p(-6, -1 + b, 12, 1, '#ffd23f');
    p(-1, -13 + b, 2, 1, '#888');
  },
  // les cœurs libérés par les tonneaux WOG : ils flottent doucement
  [G.COEUR]: (p, _e, f) => {
    coeur(p, COEUR, '#ff3b6b', '#ffb3c6', '#7a0f30', 2 + Math.round(Math.sin(f / 12)));
  },
  [G.COEUR_OR]: (p, _e, f) => {
    const haut = 2 + Math.round(1.5 * Math.sin(f / 10));
    // le cœur d'or, et des étincelles qui scintillent autour
    coeur(p, COEUR_DORE, '#ffc61a', '#fff6b0', '#8a5a00', haut);
    for (const [dx, dy, d] of [
      [-7, -12, 0],
      [7, -9, 13],
      [5, -16, 26],
    ] as const)
      if ((f + d) % 40 < 14) {
        p(dx, -haut + dy, 1, 3, '#fff6b0');
        p(dx - 1, -haut + dy + 1, 3, 1, '#fff6b0');
      }
  },
  [G.SOIN]: (p, _e, f) => {
    const l = [5, 3, 1, 3][Math.floor(f / 6) % 4]!;
    p(-l, -9, l * 2, 5, '#ffd23f');
    p(-Math.max(1, l - 1), -4, Math.max(2, l * 2 - 2), 2, '#ffd23f');
    p(-1, -2, 2, 1, '#ffd23f');
    p(-l + 1, -8, 1, 1, '#ffffff');
  },
};

/** L'icône dans la mallette d'une arme : le dessin de son tir. */
export function iconeArme(p: Pinceau, variante: number, f: number): void {
  const genre = ICONES_ARMES[variante - 1];
  const d = genre !== undefined ? DESSINS_TIRS[genre] : undefined;
  if (d) d((x, y, w, h, c) => p(x, y - 6, w, h, c), f, 0);
}
