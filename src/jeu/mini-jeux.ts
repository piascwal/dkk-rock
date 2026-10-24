import { lanceAvion, majAvion, nouveauAvion } from './avion-partie';
import { lanceDrift, majDrift, nouveauConcours } from './drift-partie';
import type { Partie } from './partie';
import { lancePlongeon, majPlongeon, nouveauPlongeon } from './plongeon-partie';
import { lanceReve, majReve, nouveauReve } from './reve-partie';
import type { Phase } from './vue';

export type { ConcoursAvion } from './avion-partie';
export type { ConcoursDrift } from './drift-partie';
export type { ConcoursPlongeon } from './plongeon-partie';
export type { ConcoursReve } from './reve-partie';

/**
 * Les mini-jeux croisés en chemin : le concours de drift du pré du Clos, le plongeon du pont des Tuves, le rêve de JBT, l'avion
 * de JBG. Chacun a sa phase (du même nom), qui lit les commandes elle-même (SAUT et TIR n'y tournent pas les pages) ; ce module
 * les aiguille.
 */
export type MiniJeu = 'drift' | 'plongeon' | 'reve' | 'avion';

const MINI_JEUX: Record<
  MiniJeu,
  {
    lance: (p: Partie, miniJeu: boolean) => void;
    maj: (p: Partie) => void;
    nouveau: (membre: number) => Partie;
  }
> = {
  drift: { lance: lanceDrift, maj: majDrift, nouveau: nouveauConcours },
  plongeon: { lance: lancePlongeon, maj: majPlongeon, nouveau: nouveauPlongeon },
  reve: { lance: lanceReve, maj: majReve, nouveau: nouveauReve },
  avion: { lance: lanceAvion, maj: majAvion, nouveau: nouveauAvion },
};

export const PHASES_MINI_JEUX: ReadonlySet<Phase> = new Set<Phase>(Object.keys(MINI_JEUX) as MiniJeu[]);

/** Les mini-jeux sans joystick : un toucher n'importe où sur l'écran tient lieu du bouton (le rêve de JBT). */
export const SANS_JOYSTICK: ReadonlySet<Phase> = new Set<Phase>(['reve']);

/**
 * Les mini-jeux au balayage, façon Subway Surfers (l'avion de JBG) : ni joystick ni bouton ; on glisse le doigt n'importe où sur
 * l'écran (gauche, droite, haut, bas), un simple toucher vaut le saut.
 */
export const AU_BALAYAGE: ReadonlySet<Phase> = new Set<Phase>(['avion']);

/** Le libellé du bouton SAUT de l'écran tactile dans chaque mini-jeu (voir Tactile.pilote). */
export const BOUTON_MINI_JEU: Partial<Record<Phase, string>> = {
  drift: 'GAZ',
  plongeon: 'PLONGE',
  reve: 'VOLE',
  avion: 'SAUTE',
};

/** L'intro d'un niveau à mini-jeu est lue : le mini-jeu commence à la place du niveau (dans l'histoire). */
export function lanceMiniJeu(p: Partie, quel: MiniJeu): void {
  MINI_JEUX[quel].lance(p, false);
}

/** Un pas du mini-jeu en cours, s'il y en a un. */
export function majMiniJeux(p: Partie): void {
  if (PHASES_MINI_JEUX.has(p.phase)) MINI_JEUX[p.phase as MiniJeu].maj(p);
}

/** Une partie qui n'est que ce mini-jeu (le menu des mini-jeux) : un joueur, qui rejoue au podium. */
export function nouveauMiniJeu(quel: MiniJeu, membre: number): Partie {
  return MINI_JEUX[quel].nouveau(membre);
}
