// Fichier généré par outils/anime-instrument.py : ne pas modifier à la main.
import { G, type Genre } from '../jeu/vue';
import type { Feuille } from './feuilles';

// repos 4, course 6, saut, échelle 2, tyrolienne, mur, mort, tir 2, puis la course en visant (codes 1 à 4)
const ANIMATIONS_HEROS = [4, 6, 1, 2, 1, 1, 1, 0, 0, 0, 2, 6, 6, 6, 6];

/** Un héros avec son instrument dans le sprite ; `pied` : milieu des pieds dans l'image. */
const heros = (fichier: string, w: number, h: number, pied: number): Feuille => ({
  fichier,
  w,
  h,
  pied,
  densite: 6,
  visees: 11,
  images: ANIMATIONS_HEROS,
  rythme: 5,
  cycle: 12,
});

export const FEUILLES_HEROS: Partial<Record<Genre, Feuille>> = {
  [G.JBT]: heros('jbt-instrument.png', 121, 122, 65),
  [G.JBM]: heros('jbm-instrument.png', 118, 123, 68),
  [G.JBG]: heros('jbg-instrument.png', 121, 123, 67),
  [G.MAT]: heros('mat-instrument.png', 124, 124, 70),
  [G.TOM]: heros('tom-instrument.png', 125, 144, 73),
};
