import type { Carte } from '../monde/carte';
import { T } from '../monde/tuiles';

/** Deux voitures ne se suivent jamais de plus près (en tuiles) : un fil rouge du décor, pas un parking. */
export const ECART_VOITURES = 24;

export const SOLS_DECORES: number[] = [
  T.TERRE,
  T.BRIQUE,
  T.NEIGE,
  T.SABLE,
  T.BETON,
  T.ROCHE,
  T.METAL,
  T.BOIS,
  T.GLACE,
  T.PLATEFORME,
  T.PITON,
];

/** Une tuile d'herbe : de la terre à l'air libre (rien de plein au-dessus, pas de paroi de fond). */
export const dehors = (carte: Carte, tx: number, ty: number): boolean =>
  carte.get(tx, ty) === T.TERRE && !carte.solide(tx, ty - 1) && !carte.aFond(tx, ty - 1);

/** Un sol décoré à l'air libre, de n'importe quelle matière (béton des villes compris) : rien de plein au-dessus. */
export const solLibre = (carte: Carte, tx: number, ty: number): boolean =>
  SOLS_DECORES.includes(carte.get(tx, ty)) && !carte.solide(tx, ty - 1) && !carte.aFond(tx, ty - 1);
