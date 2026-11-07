import { ANIM } from '../jeu/vue';
import { FEUILLES_DECOR } from './feuilles-objets';

/**
 * L'image d'un héros en l'air (`<nom>-saut`) ou sur une tyrolienne : la sienne s'il en a une (`<nom>-tyrolienne`, deux temps
 * qui se balancent), sinon celle du saut. Renvoie son nom et la ligne à dessiner.
 */
export function imageEnLair(nom: string, e: number): [string, number] {
  const tyro = `${nom}-tyrolienne`;
  if (e === ANIM.TYROLIENNE && FEUILLES_DECOR[tyro]) return [tyro, Math.floor(performance.now() / 380) & 1];
  return [`${nom}-saut`, 0];
}
