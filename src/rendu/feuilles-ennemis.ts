// Fichier généré par outils/fixe-ennemis.py : ne pas modifier à la main.
import { G, type Genre } from '../jeu/vue';
import type { Feuille } from './feuilles';

export const FEUILLES_ENNEMIS: Partial<Record<Genre, Feuille>> = {
  [G.FETARD]: { fichier: 'fetards.png', w: 157, h: 240, images: [4], variantes: true, densite: 6 },
  [G.VIDEUR]: { fichier: 'videurs.png', w: 161, h: 276, images: [2], variantes: true, densite: 6 },
  [G.INFLUENCEUR]: { fichier: 'influenceurs.png', w: 127, h: 240, images: [1], variantes: true, densite: 6 },
  [G.YETI]: { fichier: 'yetis.png', w: 262, h: 300, images: [1], variantes: true, densite: 6 },
  [G.DANSEUR]: { fichier: 'danseurs.png', w: 174, h: 240, images: [1], variantes: true, densite: 6 },
  [G.LANCEUR]: { fichier: 'lanceurs.png', w: 122, h: 240, images: [1], variantes: true, densite: 6 },
};
