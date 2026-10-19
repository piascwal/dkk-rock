import { TUILE } from '../src/config';
import type { Ennemi } from '../src/entites/ennemis/ennemi';
import type { Partie } from '../src/jeu/partie';

/**
 * Parmi `ennemis`, le premier qui a `d` tuiles de sol plat et dégagé à sa gauche (de quoi y poser le héros et le voir venir,
 * sans trou ni mur entre eux) : les cartes sont générées, un test ne doit pas dépendre de ce qui entoure le premier venu.
 */
export function auSolPlat<E extends Ennemi>(p: Partie, ennemis: E[], d = 10): E {
  const plat = (e: E) => {
    const tx = Math.floor(e.cx / TUILE);
    const ty = Math.floor((e.corps.y + e.corps.h - 1) / TUILE);
    for (let k = -d; k <= 2; k++)
      if (!p.carte.solide(tx + k, ty + 1) || p.carte.solide(tx + k, ty) || p.carte.solide(tx + k, ty - 1))
        return false;
    return true;
  };
  return ennemis.find(plat) ?? ennemis[0]!;
}
