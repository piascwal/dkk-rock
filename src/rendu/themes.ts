/** L'ambiance de chaque monde : couleurs du ciel, du sol, décor de fond, météo et musique. */

export type NomTheme = 'garage' | 'montagne' | 'neige' | 'plage' | 'ville' | 'club';

export type Decor = 'pavillons' | 'montagnes' | 'pics' | 'palmiers' | 'immeubles' | 'club';

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
    meteo: 'confettis',
    musique: 'boss',
  },
};
