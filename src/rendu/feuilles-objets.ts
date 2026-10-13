// Fichier généré par outils/fixe-objets.py : ne pas modifier à la main.
import { G, type Genre } from '../jeu/vue';
import type { Feuille } from './feuilles';

export const FEUILLES_OBJETS: Partial<Record<Genre, Feuille>> = {
  [G.VAN]: { fichier: 'van.png', w: 336, h: 199, images: [1], rythme: 1, densite: 6, pied: 168 },
  [G.CAGE]: { fichier: 'cage.png', w: 132, h: 107, images: [1, 1], rythme: 1, densite: 6, pied: 66 },
  [G.YETI_ALPHA]: {
    fichier: 'yeti-alpha.png',
    w: 292,
    h: 288,
    images: [1, 1, 1, 1, 1, 1],
    rythme: 1,
    densite: 6,
    pied: 146,
  },
  [G.ENCEINTE]: {
    fichier: 'enceinte.png',
    w: 132,
    h: 205,
    images: [1, 1, 1, 1],
    rythme: 1,
    densite: 6,
    pied: 66,
  },
};

/** Les planches du décor, sans genre : une ligne par apparence. */
export const FEUILLES_DECOR: Record<string, Feuille> = {
  vache: {
    fichier: 'vache.png',
    w: 124,
    h: 117,
    images: [1, 1, 1, 1, 1, 1],
    rythme: 1,
    densite: 6,
    pied: 62,
  },
  lampadaire: { fichier: 'lampadaire.png', w: 90, h: 240, images: [1], rythme: 1, densite: 6, pied: 45 },
  'enceinte-34': {
    fichier: 'enceinte-34.png',
    w: 156,
    h: 216,
    images: [1, 1],
    rythme: 1,
    densite: 6,
    pied: 78,
  },
};
