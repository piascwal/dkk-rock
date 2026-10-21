/** L'ambiance de chaque monde : couleurs du ciel, du sol, décor de fond, météo et musique. */

export type NomTheme =
  | 'garage'
  | 'montagne'
  | 'neige'
  | 'plage'
  | 'ville'
  | 'club'
  | 'foret'
  | 'port'
  | 'groix'
  | 'mer'
  | 'fise'
  | 'stc'
  | 'tuves';

export type Decor =
  | 'pavillons'
  | 'montagnes'
  | 'pics'
  | 'palmiers'
  | 'immeubles'
  | 'club'
  | 'sousbois'
  | 'quais'
  | 'falaises'
  | 'large'
  | 'fise'
  | 'stc'
  | 'tuves';

export interface Theme {
  /** dégradé du ciel, du haut vers l'horizon */
  ciel: [string, string];
  /** silhouettes lointaines, puis proches */
  lointain: string;
  proche: string;
  /** paroi visible derrière la matière détruite */
  paroi: string;
  /** dessus de la terre (herbe, neige...) */
  dessus: string;
  terre: string;
  decor: Decor;
  /** monde sombre : la lueur qui détache héros et ennemis du fond (liseré lumineux) */
  lueur?: { heros: string; ennemis: string };
  meteo: 'neige' | 'lucioles' | 'confettis' | null;
  /** motif musical (voir audio/musique.ts) */
  musique: 'garage' | 'montagne' | 'neige' | 'plage' | 'ville' | 'boss';
}

export const THEMES: Record<NomTheme, Theme> = {
  garage: {
    ciel: ['#2b1d4e', '#e0795a'],
    lointain: '#4a3561',
    proche: '#2e2140',
    paroi: '#3a2a22',
    dessus: '#4f9a3a',
    terre: '#6b4429',
    decor: 'pavillons',
    meteo: 'lucioles',
    musique: 'garage',
  },
  montagne: {
    ciel: ['#5fa8e8', '#cfeaff'],
    lointain: '#8fb3cf',
    proche: '#5e8a5a',
    paroi: '#3b3a33',
    dessus: '#62b346',
    terre: '#7a5232',
    decor: 'montagnes',
    meteo: null,
    musique: 'montagne',
  },
  neige: {
    ciel: ['#1e3358', '#8fb8de'],
    lointain: '#c8d8ea',
    proche: '#7f97b3',
    paroi: '#2d3646',
    dessus: '#f4f9ff',
    terre: '#6d7a8c',
    decor: 'pics',
    meteo: 'neige',
    musique: 'neige',
  },
  plage: {
    ciel: ['#ff9e5e', '#ffe2a8'],
    lointain: '#3aa6c9',
    proche: '#2c7a4b',
    paroi: '#6e5434',
    dessus: '#f0d58c',
    terre: '#b08a52',
    decor: 'palmiers',
    meteo: null,
    musique: 'plage',
  },
  ville: {
    ciel: ['#0d0b24', '#4b2a6e'],
    lointain: '#241d45',
    proche: '#15122c',
    paroi: '#26252e',
    dessus: '#7b7b85',
    terre: '#55555e',
    decor: 'immeubles',
    lueur: { heros: '#8fe8ff', ennemis: '#ff7ad9' },
    meteo: null,
    musique: 'ville',
  },
  club: {
    ciel: ['#07020f', '#2a0838'],
    lointain: '#3b0f52',
    proche: '#1a0726',
    paroi: '#16101f',
    dessus: '#3d3550',
    terre: '#2a2438',
    decor: 'club',
    lueur: { heros: '#8fe8ff', ennemis: '#ff7ad9' },
    meteo: 'confettis',
    musique: 'boss',
  },
  // l'arc breton : une forêt mystique (brume, lucioles, vieux chênes), un port de granit, l'île et ses falaises
  foret: {
    ciel: ['#142a2e', '#5f8a7a'],
    lointain: '#2e4a44',
    proche: '#1a2e28',
    paroi: '#2a2620',
    dessus: '#3f7a3a',
    terre: '#4a3a2a',
    decor: 'sousbois',
    lueur: { heros: '#d8ffb0', ennemis: '#ffb07a' },
    meteo: 'lucioles',
    musique: 'montagne',
  },
  port: {
    ciel: ['#5a7a9a', '#d8dfe0'],
    lointain: '#7a8a96',
    proche: '#3a4650',
    paroi: '#3a3a40',
    dessus: '#8a8a86',
    terre: '#5e5a56',
    decor: 'quais',
    meteo: null,
    musique: 'ville',
  },
  groix: {
    ciel: ['#3f86c8', '#bfe2f0'],
    lointain: '#2f6f9a',
    proche: '#4a6a3a',
    paroi: '#4a4238',
    dessus: '#7aa04a',
    terre: '#6a5a46',
    decor: 'falaises',
    meteo: null,
    musique: 'plage',
  },
  // la traversée en ferry : la pleine mer, des îles au loin
  mer: {
    ciel: ['#3f7fc0', '#d6ecf5'],
    lointain: '#2f6f9a',
    proche: '#2a5f86',
    paroi: '#3a3a40',
    dessus: '#8a8a86',
    terre: '#5e5a56',
    decor: 'large',
    meteo: null,
    musique: 'plage',
  },
  // le FISE de Montpellier : plein soleil sur le béton des skateparks, au bord du Lez
  fise: {
    ciel: ['#3f8fe0', '#cfeeff'],
    lointain: '#dccfb2',
    proche: '#3fb0a8',
    paroi: '#3a3a40',
    dessus: '#b4b0a8',
    terre: '#7a746c',
    decor: 'fise',
    meteo: null,
    musique: 'plage',
  },
  // Saint-Cézaire (STC), village perché au-dessus de la Siagne : un matin d'été, la pierre claire, les oliviers
  stc: {
    ciel: ['#4f9fe0', '#e8f4ff'],
    lointain: '#9aaccc',
    proche: '#5a6a48',
    paroi: '#7a6a52',
    dessus: '#7aa04a',
    terre: '#9a7350',
    decor: 'stc',
    meteo: null,
    musique: 'garage',
  },
  // le pont des Tuves, au fond des gorges de la Siagne : l'ombre verte, l'eau fraîche, la boue des figuiers
  tuves: {
    ciel: ['#5aa8d8', '#d8f0e8'],
    lointain: '#c8bea4',
    proche: '#2f5a2a',
    paroi: '#4a4234',
    dessus: '#4f9a3a',
    terre: '#6a5038',
    decor: 'tuves',
    meteo: null,
    musique: 'montagne',
  },
};
