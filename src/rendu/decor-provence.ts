import type { Accessoire, NomAccessoire } from './decor-objets';

/**
 * Le décor du pays de Grasse (Saint-Cézaire et les gorges de la Siagne), dessiné en code à trois tons : oliviers, cyprès,
 * figuiers, chênes verts, lavande, pots de géraniums, la fontaine des Mulets, un puits, une croix de chemin, les balises jaunes
 * des sentiers, les roseaux de la rivière. Même convention que decor-objets.ts : autour du milieu de la base (0, 0), la base en
 * bas ; un héros fait 28 de haut.
 */

/** Un houppier arrondi : une ellipse de feuillage, rangée par rangée, avec un liseré de lumière sur le haut. */
function houppier(
  p: Parameters<Accessoire>[0],
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  feuille: string,
  lumiere: string,
): void {
  for (let dy = -ry; dy <= ry; dy++) {
    const l = Math.round(rx * Math.sqrt(1 - (dy / (ry + 0.5)) ** 2));
    p(cx - l, cy + dy, 2 * l + 1, 1, feuille);
    if (dy < -ry / 3) p(cx - l + 1, cy + dy, Math.max(1, l), 1, lumiere);
  }
}

/** L'olivier : un tronc gris noueux, fourchu, et des touffes de feuillage argenté, légères, qui laissent passer le jour. */
const olivier: Accessoire = (p, v) => {
  const h = 28 + (v % 6);
  p(-2, -12, 4, 12, '#6e6458');
  p(-1, -10, 1, 8, '#8a8070');
  p(-5, -18, 3, 7, '#6e6458');
  p(2, -20, 3, 9, '#6e6458');
  houppier(p, -8, -h + 6, 8, 4, '#7a8a5a', '#a8b88a');
  houppier(p, 4, -h + 2, 9, 5, '#73845a', '#a8b88a');
  houppier(p, -2, -h + 10, 7, 3, '#7a8a5a', '#9aaa7a');
  for (let i = 0; i < 5; i++) p(-12 + ((i * 7 + v) % 22), -h + 2 + ((i * 3) % 9), 1, 1, '#c8d0a8');
};

/** Le cyprès : une haute flamme vert sombre. */
const cypres: Accessoire = (p, v) => {
  const h = 50 + (v % 16);
  p(-1, -4, 3, 4, '#4a3420');
  for (let k = 4; k < h; k += 2) {
    const l = Math.max(2, Math.round(9 * Math.sin(((k - 4) / (h - 4)) * Math.PI)));
    p(-l / 2, -k - 2, l, 2, k % 6 ? '#2a4224' : '#34502c');
  }
};

/** Le figuier : un tronc gris lisse, des branches basses, un large houppier de grandes feuilles vert foncé, des figues violettes. */
const figuier: Accessoire = (p, v) => {
  p(-2, -16, 5, 16, '#9a948a');
  p(-9, -22, 4, 9, '#9a948a');
  p(5, -24, 4, 11, '#9a948a');
  houppier(p, -10, -34, 12, 7, '#2f5a2a', '#4f8a3a');
  houppier(p, 10, -36, 12, 7, '#2f5a2a', '#4f8a3a');
  houppier(p, 0, -42, 11, 6, '#3a6a2e', '#5a9a40');
  for (let i = 0; i < 7; i++) p(-18 + ((i * 7 + v) % 36), -40 + ((i * 5) % 12), 2, 2, '#5a2a5a');
};

/** Le chêne vert : un tronc court, une couronne ronde, dense et sombre. */
const cheneVert: Accessoire = (p, v) => {
  const h = 34 + (v % 10);
  p(-2, -16, 5, 16, '#4a3a2a');
  houppier(p, -6, -h + 10, 12, 8, '#2f4a2a', '#4a6a3a');
  houppier(p, 7, -h + 12, 10, 7, '#2a4424', '#4a6a3a');
  houppier(p, 0, -h + 4, 10, 6, '#34502c', '#5a7a44');
};

/** Une touffe de lavande : des épis violets sur un pied vert-gris. */
const lavande: Accessoire = (p, v) => {
  p(-8, -4, 16, 4, '#6a7a5a');
  for (let i = 0; i < 6; i++) {
    const x = -7 + i * 3;
    const h = 7 + ((i + v) % 3);
    p(x, -h, 1, h - 3, '#7a8a6a');
    p(x, -h - 2, 1, 3, '#8a5ab8');
  }
};

/** Un pot de terre cuite et ses géraniums rouges. */
const potGeranium: Accessoire = (p) => {
  p(-4, -7, 9, 7, '#b8603a');
  p(-5, -8, 11, 2, '#c8784a');
  p(-6, -13, 13, 5, '#3f7a32');
  p(-4, -15, 3, 3, '#e83a3a');
  p(1, -14, 3, 3, '#e83a3a');
};

/** Un banc de pierre, sous les platanes de la place. */
const banc: Accessoire = (p) => {
  p(-12, -7, 24, 3, '#c8b896');
  p(-12, -7, 24, 1, '#e2d6b8');
  p(-10, -4, 4, 4, '#a8987a');
  p(6, -4, 4, 4, '#a8987a');
};

/** Une lanterne de rue à l'ancienne : un poteau de fer noir, une lanterne. */
const lanterne: Accessoire = (p) => {
  p(-1, -34, 2, 34, '#2a2a2e');
  p(-4, -40, 8, 6, '#2a2a2e');
  p(-3, -39, 6, 4, '#ffd88a');
  p(-5, -41, 10, 1, '#2a2a2e');
};

/** La fontaine des Mulets, sur la place : un bassin de pierre, une colonne, ses deux becs qui coulent. */
const fontaineMulets: Accessoire = (p, v) => {
  p(-22, -10, 44, 10, '#c8b896');
  p(-22, -10, 44, 2, '#e2d6b8');
  p(-19, -8, 38, 3, '#5ab0d0');
  p(-4, -34, 8, 24, '#bfae8a');
  p(-6, -36, 12, 3, '#d2c4a2');
  p(-3, -40, 6, 4, '#bfae8a');
  // les becs et leur filet d'eau, qui scintille
  p(-8, -26, 4, 2, '#8a7a5a');
  p(4, -26, 4, 2, '#8a7a5a');
  p(-9, -24, 1, 16, v % 2 ? '#bfeaff' : '#8fd0f0');
  p(8, -24, 1, 16, v % 2 ? '#8fd0f0' : '#bfeaff');
};

/** Un puits de pierre, son arceau de fer et son seau. */
const puits: Accessoire = (p) => {
  p(-10, -12, 20, 12, '#c8b896');
  p(-10, -12, 20, 2, '#e2d6b8');
  p(-9, -30, 2, 18, '#2a2a2e');
  p(7, -30, 2, 18, '#2a2a2e');
  p(-9, -31, 18, 2, '#2a2a2e');
  p(-2, -24, 5, 5, '#8a6a3a');
};

/** Une croix de chemin, en pierre, sur son socle. */
const croix: Accessoire = (p) => {
  p(-5, -6, 10, 6, '#bfae8a');
  p(-1, -30, 3, 24, '#d2c4a2');
  p(-6, -24, 13, 3, '#d2c4a2');
};

/** Le poteau de bois des sentiers, ses flèches (« Pont des Tuves 1 h ») et son trait de balisage jaune. */
const balise: Accessoire = (p) => {
  p(-1, -30, 3, 30, '#8a6a3a');
  p(-1, -20, 3, 2, '#ffd23f');
  p(-12, -30, 14, 4, '#c89a5a');
  p(1, -25, 13, 4, '#c89a5a');
  p(-10, -29, 9, 1, '#5a3a1a');
  p(3, -24, 9, 1, '#5a3a1a');
};

/** Des roseaux, au bord de l'eau. */
const roseaux: Accessoire = (p, v) => {
  for (let i = 0; i < 7; i++) {
    const h = 18 + ((i * 5 + v) % 12);
    p(-9 + i * 3, -h, 1, h, i % 2 ? '#4f8a3a' : '#3f6a2a');
    if (i % 2 === 0) p(-9 + i * 3, -h - 4, 2, 4, '#6a4a2a');
  }
};

/** Un rocher de calcaire blanc, comme ceux des gorges. */
const rocherCalcaire: Accessoire = (p, v) => {
  const l = 16 + (v % 10);
  p(-l / 2, -9, l, 9, '#cfc6ae');
  p(-l / 2 + 2, -12, l - 6, 4, '#ded6c0');
  p(-l / 2, -2, l, 2, '#a89e86');
};

export const ACCESSOIRES_PROVENCE = {
  olivier,
  cypres,
  figuier,
  cheneVert,
  lavande,
  potGeranium,
  banc,
  lanterne,
  fontaineMulets,
  puits,
  croix,
  balise,
  roseaux,
  rocherCalcaire,
} satisfies Record<string, Accessoire>;

/** Ce que l'on sème à Saint-Cézaire et le long de la Siagne (voir decor-semis.ts) : dehors, et derrière un mur d'intérieur. */
export const SEMIS_PROVENCE: Record<
  'stc' | 'tuves',
  { dehors: NomAccessoire[]; dedans: NomAccessoire[]; densite: number }
> = {
  stc: {
    dehors: [
      'olivier',
      'olivier',
      'cypres',
      'cypres',
      'lavande',
      'lavande',
      'potGeranium',
      'potGeranium',
      'banc',
      'lanterne',
      'rocherCalcaire',
      'figuier',
      'enceinte34',
    ],
    dedans: ['caisseDeco', 'etagere', 'tonneau', 'flambeau', 'potGeranium', 'enceinte34'],
    densite: 0.8,
  },
  tuves: {
    dehors: [
      'cheneVert',
      'cheneVert',
      'figuier',
      'figuier',
      'roseaux',
      'roseaux',
      'rocherCalcaire',
      'rocherCalcaire',
      'fougere',
      'fougere',
      'souche',
      'champignons',
      'balise',
      'cairn',
      'tronc',
    ],
    dedans: ['caisseDeco', 'tonneau', 'flambeau', 'sacs'],
    densite: 0.9,
  },
};
