import { ACCESSOIRES_SUPPLEMENTAIRES } from './decor-accessoires';
import type { Pinceau } from './pinceau';

/**
 * Les accessoires du décor, dessinés autour du milieu de leur base (0, 0), la base en bas.
 * `v` (0 à 255) varie la taille ou la couleur d'un exemplaire à l'autre.
 */
export type Accessoire = (p: Pinceau, v: number) => void;

const sapin =
  (feuilles: string, neige: string | null): Accessoire =>
  (p, v) => {
    const h = 4 + (v % 3);
    p(-1, -6, 3, 6, '#5e3b1a');
    for (let i = 0; i < h; i++) {
      const y = -6 - i * 6;
      const l = 14 - i * 2;
      p(-l / 2, y - 5, l, 6, feuilles);
      if (neige) p(-l / 2 + 1, y - 5, l - 2, 2, neige);
    }
  };

const buisson =
  (c1: string, c2: string): Accessoire =>
  (p, v) => {
    const l = 10 + (v % 8);
    p(-l / 2, -6, l, 6, c1);
    p(-l / 2 + 2, -9, l - 4, 4, c1);
    p(-l / 2 + 3, -8, 2, 2, c2);
    p(l / 2 - 5, -5, 2, 2, c2);
  };

const rocher =
  (c1: string, c2: string): Accessoire =>
  (p, v) => {
    const l = 10 + (v % 10);
    p(-l / 2, -5, l, 5, c1);
    p(-l / 2 + 2, -8, l - 5, 4, c1);
    p(-l / 2 + 2, -8, l - 7, 1, c2);
  };

const lampadaire =
  (lumiere: string): Accessoire =>
  (p) => {
    p(0, -30, 2, 30, '#3a3a44');
    p(-1, -32, 6, 2, '#3a3a44');
    p(-2, -31, 4, 2, lumiere);
    p(-8, -30, 18, 22, 'rgba(255,230,150,0.07)');
  };

const poubelle: Accessoire = (p) => {
  p(-3, -8, 7, 8, '#5d6b73');
  p(-4, -9, 9, 2, '#7d8d96');
  p(-2, -6, 1, 5, '#46525a');
};

const palmier: Accessoire = (p, v) => {
  const h = 26 + (v % 12);
  p(0, -h, 3, h, '#8b6a3a');
  p(1, -h * 0.5, 3, 3, '#8b6a3a');
  for (const [dx, dy, w] of [
    [-9, -2, 10],
    [3, -3, 10],
    [-6, -6, 8],
    [2, -7, 8],
    [-2, -9, 5],
  ] as const)
    p(dx, -h + dy, w, 3, '#2f9e5a');
  p(0, -h + 2, 3, 3, '#c98b3a');
};

const parasol: Accessoire = (p, v) => {
  const [a, b] = v % 2 ? ['#ff4f6d', '#ffffff'] : ['#3fa7f2', '#ffd23f'];
  p(0, -18, 1, 18, '#cfcfcf');
  p(-9, -20, 19, 3, a);
  for (let i = -9; i < 10; i += 6) p(i, -20, 3, 3, b);
  p(-6, -23, 13, 3, a);
  p(5, -3, 8, 3, b);
};

const transat: Accessoire = (p) => {
  p(-6, -6, 12, 2, '#ffd23f');
  p(-6, -10, 2, 6, '#ffd23f');
  p(-5, -4, 1, 4, '#8b6a3a');
  p(4, -4, 1, 4, '#8b6a3a');
};

const bonhommeDeNeige: Accessoire = (p) => {
  p(-5, -9, 10, 9, '#f4f9ff');
  p(-4, -16, 8, 8, '#f4f9ff');
  p(-2, -14, 1, 1, '#111');
  p(1, -14, 1, 1, '#111');
  p(0, -12, 3, 1, '#ff8a3d');
  p(-4, -18, 8, 2, '#222');
  p(-2, -21, 5, 3, '#222');
};

const panneau =
  (texte: string): Accessoire =>
  (p) => {
    p(0, -16, 2, 16, '#6b4a2a');
    p(-8, -20, 18, 7, '#c49a5a');
    p(-7, -19, 16, 5, texte);
  };

const vacheCasque: Accessoire = (p, v) => {
  p(-7, -11, 14, 7, '#f4f4f4');
  p(-4, -11, 4, 3, '#222');
  p(2, -8, 4, 3, '#222');
  p(-6, -4, 2, 4, '#f4f4f4');
  p(4, -4, 2, 4, '#f4f4f4');
  p(7, -13, 5, 5, '#f4f4f4');
  p(11, -10, 2, 2, '#ffb3c1');
  p(8, -15, 3, 2, '#111');
  p(7, -15, 5, 1, v % 2 ? '#ff4fd8' : '#3fe0ff');
};

const cloture: Accessoire = (p) => {
  for (let x = -8; x <= 6; x += 5) p(x, -9, 2, 9, '#a8743a');
  p(-8, -7, 16, 2, '#c49a5a');
  p(-8, -3, 16, 2, '#c49a5a');
};

const boiteAuxLettres: Accessoire = (p) => {
  p(0, -12, 2, 12, '#6b4a2a');
  p(-3, -16, 9, 5, '#e5432f');
  p(2, -15, 4, 1, '#ffd23f');
};

const arbre: Accessoire = (p, v) => {
  p(-1, -14, 3, 14, '#6b4423');
  p(-8, -26, 17, 12, '#3f8f3a');
  p(-5, -30, 11, 6, '#4aa044');
  p(-6 + (v % 5), -24, 3, 3, '#2f7a2f');
};

const affiche =
  (c1: string, c2: string): Accessoire =>
  (p) => {
    p(-8, -28, 18, 20, '#1d1d28');
    p(-7, -27, 16, 18, c1);
    p(-4, -22, 10, 3, c2);
    p(-4, -17, 7, 2, c2);
    p(0, -8, 2, 8, '#3a3a44');
  };

const voiture: Accessoire = (p, v) => {
  const c = ['#c1121f', '#2a6fdb', '#e8c13a'][v % 3]!;
  p(-14, -9, 28, 6, c);
  p(-8, -15, 15, 7, c);
  p(-6, -14, 5, 5, '#9fd8f0');
  p(1, -14, 5, 5, '#9fd8f0');
  p(-11, -4, 6, 4, '#111');
  p(6, -4, 6, 4, '#111');
};

// repli en code de la borne à incendie (planche borne.png, voir decor-sprites.ts)
const borne: Accessoire = (p) => {
  p(-2, -8, 5, 8, '#c1121f');
  p(-3, -6, 7, 2, '#c1121f');
};

const enceinteDeco: Accessoire = (p, v) => {
  const h = 2 + (v % 2);
  for (let i = 0; i < h; i++) {
    p(-8, -14 - i * 14, 16, 14, '#151515');
    p(-5, -11 - i * 14, 10, 8, '#000');
    p(-2, -8 - i * 14, 4, 3, '#444');
    p(-8, -14 - i * 14, 16, 1, '#ff4fd8');
  }
};

const projecteur: Accessoire = (p, v) => {
  p(0, -14, 2, 14, '#333');
  p(-5, -4, 12, 2, '#333');
  p(-3, -20, 7, 6, '#222');
  const c = ['rgba(255,79,216,0.25)', 'rgba(63,224,255,0.25)', 'rgba(124,252,124,0.25)'][v % 3]!;
  p(-7, -34, 15, 14, c);
};

const plante: Accessoire = (p) => {
  p(-3, -5, 7, 5, '#7a4a2a');
  p(-5, -13, 4, 8, '#2f9e5a');
  p(0, -15, 4, 10, '#3fb86a');
  p(3, -11, 4, 6, '#2f9e5a');
};

const caisseDeco: Accessoire = (p, v) => {
  p(-6, -10, 12, 10, '#6b4520');
  p(-5, -9, 10, 8, '#8a5a2b');
  if (v % 2) p(-3, -17, 8, 7, '#7a4e22');
};

const etagere: Accessoire = (p) => {
  p(-9, -24, 18, 2, '#6b4520');
  p(-9, -14, 18, 2, '#6b4520');
  p(-9, -24, 2, 24, '#6b4520');
  p(7, -24, 2, 24, '#6b4520');
  p(-6, -22, 4, 8, '#c1121f');
  p(-1, -20, 5, 6, '#2a6fdb');
  p(-6, -12, 6, 4, '#ffd23f');
};

export const ACCESSOIRES = {
  sapin: sapin('#2f5a33', null),
  sapinNeige: sapin('#3d6a58', '#f4f9ff'),
  buisson: buisson('#3f8f3a', '#ffd23f'),
  buissonNeige: buisson('#dfe9f5', '#9fd8f0'),
  buissonSable: buisson('#7aa83a', '#e8cf8a'),
  rocher: rocher('#6d6d78', '#8a8a96'),
  rocherNeige: rocher('#8a96a3', '#f4f9ff'),
  lampadaire: lampadaire('#ffd56b'),
  lampadaireNeon: lampadaire('#ff4fd8'),
  poubelle,
  palmier,
  parasol,
  transat,
  bonhommeDeNeige,
  panneauNeige: panneau('#9fd8f0'),
  panneauLounge: panneau('#7cfc7c'),
  vacheCasque,
  cloture,
  boiteAuxLettres,
  arbre,
  afficheRose: affiche('#3a1a4a', '#ff4fd8'),
  afficheBleue: affiche('#102a4a', '#3fe0ff'),
  voiture,
  borne,
  enceinteDeco,
  // repli en code de l'enceinte de 3/4 (planche enceinte-34.png, voir decor.ts)
  enceinte34: enceinteDeco,
  // repli en code de l'enceinte rose du club (planche enceinte-rose.png, voir decor-sprites.ts)
  enceinteRose: enceinteDeco,
  projecteur,
  plante,
  caisseDeco,
  etagere,
  ...ACCESSOIRES_SUPPLEMENTAIRES,
} satisfies Record<string, Accessoire>;

export type NomAccessoire = keyof typeof ACCESSOIRES;
