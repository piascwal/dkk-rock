import { C, type EtatCommandes } from '../jeu/commandes';

const QUART = Math.PI / 4;

/**
 * Vers où tire le héros, en radians au-dessus de l'horizontale (négatif : en dessous).
 * Haut seul : droit en l'air ; haut et côté : en diagonale. Bas fait de même vers le sol, partout : à terre, en l'air, sur une
 * échelle, une tyrolienne ou contre un mur (bas sert aussi à descendre d'une échelle ou à se laisser tomber d'une plateforme,
 * mais on tire en même temps dans la direction visée). Haut l'emporte si les deux sont tenus.
 */
export function angleVisee(k: EtatCommandes): number {
  const cote = k.tenu(C.GAUCHE) || k.tenu(C.DROITE);
  if (k.tenu(C.HAUT)) return cote ? QUART : 2 * QUART;
  if (k.tenu(C.BAS)) return cote ? -QUART : -2 * QUART;
  return 0;
}

/** L'angle en un code de 0 à 4 (vue réseau) et retour : devant, diagonale haut, haut, diagonale bas, bas. */
export const codeVisee = (angle: number): number =>
  angle > QUART * 1.5 ? 2 : angle > 0 ? 1 : angle < -QUART * 1.5 ? 4 : angle < 0 ? 3 : 0;

export const angleDuCode = (code: number): number => [0, QUART, 2 * QUART, -QUART, -2 * QUART][code] ?? 0;
