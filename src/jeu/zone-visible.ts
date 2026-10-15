import { ZONE_VISIBLE } from '../config';
import type { Cible } from './contexte';

/**
 * Le point (x, y) est-il dans la zone de jeu visible d'au moins un héros ? (La simulation ne connaît pas la caméra : voir
 * ZONE_VISIBLE.) Sans héros vivant, tout est « visible » : il n'y a personne à protéger ni à viser.
 */
export function zoneVisible(heros: readonly Cible[], x: number, y: number): boolean {
  if (!heros.length) return true;
  return heros.some((h) => {
    const dx = Math.abs(x - (h.x + h.w / 2));
    const dy = y - (h.y + h.h / 2);
    return dx <= ZONE_VISIBLE.demiLargeur && dy >= -ZONE_VISIBLE.haut && dy <= ZONE_VISIBLE.bas;
  });
}
