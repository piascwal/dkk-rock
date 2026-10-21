import { lanceDrift, majDrift, nouveauConcours } from './drift-partie';
import type { Partie } from './partie';
import { lancePlongeon, majPlongeon, nouveauPlongeon } from './plongeon-partie';
import type { Phase } from './vue';

export type { ConcoursDrift } from './drift-partie';
export type { ConcoursPlongeon } from './plongeon-partie';

/**
 * Les mini-jeux croisés en chemin : le concours de drift du pré du Clos, le plongeon du pont des Tuves. Chacun a sa phase, qui
 * lit les commandes elle-même (SAUT et TIR n'y tournent pas les pages) ; ce module les aiguille.
 */
export type MiniJeu = 'drift' | 'plongeon';

export const PHASES_MINI_JEUX: ReadonlySet<Phase> = new Set<Phase>(['drift', 'plongeon']);

/** L'intro d'un niveau à mini-jeu est lue : le mini-jeu commence à la place du niveau (dans l'histoire). */
export function lanceMiniJeu(p: Partie, quel: MiniJeu): void {
  if (quel === 'drift') lanceDrift(p, false);
  else lancePlongeon(p, false);
}

/** Un pas du mini-jeu en cours, s'il y en a un. */
export function majMiniJeux(p: Partie): void {
  if (p.phase === 'drift') majDrift(p);
  else if (p.phase === 'plongeon') majPlongeon(p);
}

/** Une partie qui n'est que ce mini-jeu (le menu des mini-jeux) : un joueur, qui rejoue au podium. */
export function nouveauMiniJeu(quel: MiniJeu, membre: number): Partie {
  return quel === 'drift' ? nouveauConcours(membre) : nouveauPlongeon(membre);
}
