import type { Feuille } from './feuilles';

/**
 * Les planches de JBM, d'après ses bandes d'animation fournies (outils/prepare-jbm.py, sources dans assets-sources/heros/jbm-source/) :
 * repos 4, course 4 (foulée et passage alternés), saut, échelle 2 temps, mur, tyrolienne 2 temps, à terre. Déclarées à la main :
 * outils/anime-instrument.py et outils/fixe-objets.py ne le fabriquent plus. Plus fines que celles des autres héros (162 pixels pour
 * JBM debout au lieu de 120) : densité 8,1, la même taille en jeu.
 */
const DENSITE = 8.1;

export const FEUILLE_JBM: Feuille = {
  fichier: 'jbm-instrument.png',
  w: 166,
  h: 163,
  pied: 83,
  densite: DENSITE,
  images: [4, 4, 1, 0, 0, 0, 1],
  compacte: true,
  rythme: 5,
  cycle: 12,
};

const decor = (nom: string, w: number, h: number, pied: number, images = [1]): Feuille => ({
  fichier: `${nom}.png`,
  w,
  h,
  pied,
  images,
  rythme: 1,
  densite: DENSITE,
});

/** En l'air, contre une paroi, de dos sur une échelle, sur une tyrolienne : une image à part (voir dessin-entites.ts). */
export const DECOR_JBM: Record<string, Feuille> = {
  'jbm-saut': decor('jbm-saut', 95, 141, 47),
  'jbm-mur': decor('jbm-mur', 90, 157, 56),
  'jbm-echelle': decor('jbm-echelle', 93, 162, 46, [1, 1]),
  'jbm-tyrolienne': decor('jbm-tyrolienne', 133, 145, 66, [1, 1]),
};
