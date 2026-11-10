import type { Feuille } from './feuilles';

/**
 * Les planches du spectacle de l'écran titre (ui/titre-batterie.ts et titre-concert.ts) : la batterie de JBT (seule, JBT qui en
 * joue, puis qui la casse ; une image par ligne, outils/prepare-batterie.py), Mat qui casse sa basse et Tom sa guitare (une pose par
 * ligne, outils/prepare-casse.py), JBM qui fait du rodéo sur Fadatchi (outils/prepare-jbm-kiwi.py). Déclarées à la main : outils/fixe-objets.py ne les fabrique pas.
 */
const image = (
  fichier: string,
  w: number,
  h: number,
  pied: number,
  lignes: number,
  densite?: number,
): Feuille => ({
  fichier,
  w,
  h,
  pied,
  images: Array(lignes).fill(1),
  rythme: 1,
  densite,
});

export const DECOR_CONCERT: Record<string, Feuille> = {
  batterie: image('batterie.png', 256, 247, 128, 9),
  // Mat y fait sa taille de jeu (densité 5,45) ; Tom aussi (sa tête y est plus petite : 4,6)
  'mat-basse': image('mat-basse.png', 101, 121, 46, 4, 5.45),
  'tom-guitare': image('tom-guitare.png', 112, 132, 59, 3, 4.6),
  // JBM sur Fadatchi (outils/prepare-jbm-kiwi.py) : il attend, tient la selle, un bras levé, décollé ; à la densité de JBM
  'jbm-kiwi': image('jbm-kiwi.png', 152, 186, 75, 4, 7.5),
};
