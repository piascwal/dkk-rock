import type { Feuille } from './feuilles';

/**
 * Les héros sur une tyrolienne : deux poses qui se balancent, les deux mains au câble (outils/prepare-tyroliennes.py, d'après leurs
 * bandes fournies ; celle de JBM est dans feuilles-jbm.ts). Mat n'en a pas encore : il garde l'image de son saut.
 */
const tyrolienne = (nom: string, w: number, h: number, densite: number): Feuille => ({
  fichier: `${nom}-tyrolienne.png`,
  w,
  h,
  pied: Math.floor(w / 2),
  images: [1, 1],
  rythme: 1,
  densite,
});

export const DECOR_TYROLIENNES: Record<string, Feuille> = {
  'jbg-tyrolienne': tyrolienne('jbg', 125, 162, 6.8),
  'tom-tyrolienne': tyrolienne('tom', 120, 128, 6),
  'jbt-tyrolienne': tyrolienne('jbt', 131, 159, 7.2),
};
