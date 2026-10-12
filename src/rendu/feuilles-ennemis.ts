// Fichier généré par outils/fixe-ennemis.py : ne pas modifier à la main.
import { G, type Genre } from '../jeu/vue';
import type { Feuille } from './feuilles';

export const FEUILLES_ENNEMIS: Partial<Record<Genre, Feuille>> = {
  [G.FETARD]: { fichier: 'fetards.png', w: 26, h: 40, images: [4], variantes: true },
  [G.VIDEUR]: { fichier: 'videurs.png', w: 27, h: 46, images: [2], variantes: true },
  [G.INFLUENCEUR]: { fichier: 'influenceurs.png', w: 21, h: 40, images: [1], variantes: true },
  [G.YETI]: { fichier: 'yetis.png', w: 44, h: 50, images: [1], variantes: true },
  [G.DANSEUR]: { fichier: 'danseurs.png', w: 27, h: 40, images: [1], variantes: true },
  [G.LANCEUR]: { fichier: 'lanceurs.png', w: 17, h: 40, images: [1], variantes: true },
};
