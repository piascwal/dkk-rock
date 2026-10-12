import { C, type EtatCommandes } from '../jeu/commandes';

const QUART = Math.PI / 4;

/**
 * Vers où tire le héros, en radians au-dessus de l'horizontale (négatif : en dessous).
 * Haut seul : droit en l'air ; haut et côté : en diagonale. En l'air, bas fait de même
 * vers le sol ; à terre, bas ne sert qu'à se baisser ou descendre d'une plateforme.
 */
export function angleVisee(k: EtatCommandes, enLAir: boolean): number {
  const cote = k.tenu(C.GAUCHE) || k.tenu(C.DROITE);
  if (k.tenu(C.HAUT)) return cote ? QUART : 2 * QUART;
  if (k.tenu(C.BAS) && enLAir) return cote ? -QUART : -2 * QUART;
  return 0;
}

/** L'angle en un code de 0 à 4 (vue réseau) et retour : devant, diagonale haut, haut, diagonale bas, bas. */
export const codeVisee = (angle: number): number =>
  angle > QUART * 1.5 ? 2 : angle > 0 ? 1 : angle < -QUART * 1.5 ? 4 : angle < 0 ? 3 : 0;

export const angleDuCode = (code: number): number => [0, QUART, 2 * QUART, -QUART, -2 * QUART][code] ?? 0;
