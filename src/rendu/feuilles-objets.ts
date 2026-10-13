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
};
