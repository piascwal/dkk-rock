import type { Feuille } from './feuilles';

/**
 * Les planches de JBT, d'après ses images fournies (outils/prepare-jbt.py, sources dans assets-sources/heros/jbt-source/) : repos 4,
 * course 4, saut, à terre ; à part, en l'air, contre une paroi, de dos sur une échelle (l'image et son miroir : les deux temps de la
 * montée), pendu à une tyrolienne. Déclarées à la main : outils/anime-instrument.py, fixe-objets.py et prepare-tyroliennes.py ne le
 * fabriquent plus. 161 pixels pour JBT debout (l'ancien en faisait 118, à la densité 6) : 7,6 le fait un peu plus grand que les
 * autres (comme Mat), sa silhouette fine se voit mieux.
 */
const DENSITE = 7.6;

export const FEUILLE_JBT: Feuille = {
  fichier: 'jbt-instrument.png',
  w: 166,
  h: 162,
  pied: 83,
  densite: DENSITE,
  images: [4, 4, 1, 0, 0, 0, 1],
  compacte: true,
  rythme: 5,
  cycle: 12,
};

const decor = (nom: string, w: number, h: number, pied: number, images = [1]): Feuille => ({
  fichier: `jbt-${nom}.png`,
  w,
  h,
  pied,
  images,
  rythme: 1,
  densite: DENSITE,
});

/** En l'air, contre une paroi, de dos sur une échelle, sur une tyrolienne : une image à part (voir dessin-entites.ts). */
export const DECOR_JBT: Record<string, Feuille> = {
  'jbt-saut': decor('saut', 146, 154, 73),
  'jbt-mur': decor('mur', 105, 147, 73),
  'jbt-echelle': decor('echelle', 84, 160, 42, [1, 1]),
  'jbt-tyrolienne': decor('tyrolienne', 85, 158, 53),
};
