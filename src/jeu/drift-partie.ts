import { VIES_DEPART } from '../config';
import { ConcoursDrift, DRIFT_APRES } from './drift';
import { Partie } from './partie';

export type { ConcoursDrift };

/** Les sièges occupés de la partie. */
const siegesPresents = (p: Partie): number[] => p.joueurs.flatMap((j, s) => (j ? [s] : []));

/**
 * Lance le concours de drift : chaque joueur présent conduit à son tour. `miniJeu` : depuis le menu des mini-jeux (on rejoue
 * au podium) plutôt qu'entre le garage et la tournée (le podium passé, le van prend la route).
 */
export function lanceDrift(p: Partie, miniJeu: boolean): void {
  p.drift = new ConcoursDrift(siegesPresents(p), miniJeu);
  p.phase = 'drift';
  p.page = 0;
}

/** Un pas du concours ; le podium passé (dans l'histoire), le van prend la route : la carte du monde. */
export function majDrift(p: Partie): void {
  const d = p.drift;
  if (!d) return;
  d.maj(p.commandes, siegesPresents(p), (nom) => p.son(nom, 0, 0));
  if (!d.fini) return;
  p.drift = null;
  p.phase = 'carte';
  p.page = 0;
}

/** Une partie qui n'est que le concours de drift (le menu des mini-jeux) : un joueur, qui rejoue au podium. */
export function nouveauConcours(membre: number): Partie {
  const p = new Partie({ niveau: DRIFT_APRES, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, membre);
  lanceDrift(p, true);
  return p;
}
