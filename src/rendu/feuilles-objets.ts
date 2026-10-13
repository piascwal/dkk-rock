// Fichier généré par outils/fixe-objets.py : ne pas modifier à la main.
import { G, type Genre } from '../jeu/vue';
import type { Feuille } from './feuilles';

export const FEUILLES_OBJETS: Partial<Record<Genre, Feuille>> = {
  [G.VAN]: { fichier: 'van.png', w: 336, h: 199, images: [1], rythme: 1, densite: 6, pied: 168 },
};
