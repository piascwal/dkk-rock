import { HEROS_HAUTEUR } from '../config';
import { ANIM } from '../jeu/vue';
import { FEUILLES_DECOR } from './feuilles-objets';

/**
 * L'image d'un héros en l'air (`<nom>-saut`) ou sur une tyrolienne : la sienne s'il en a une (`<nom>-tyrolienne`, deux temps
 * qui se balancent), sinon celle du saut. Renvoie son nom, la ligne à dessiner, et de combien la descendre (pixels du jeu) : sur
 * le câble, les poings tiennent le câble (2 pixels au-dessus du héros), le corps pend dessous.
 */
export function imageEnLair(nom: string, e: number): [string, number, number] {
  const tyro = `${nom}-tyrolienne`;
  const f = FEUILLES_DECOR[tyro];
  if (e !== ANIM.TYROLIENNE || !f) return [`${nom}-saut`, 0, 0];
  const hauteur = (f.h * (f.echelle ?? 1)) / (f.densite ?? 1);
  return [tyro, Math.floor(performance.now() / 380) & 1, Math.max(0, hauteur - HEROS_HAUTEUR - 2)];
}
