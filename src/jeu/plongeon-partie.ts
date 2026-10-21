import { VIES_DEPART } from '../config';
import { suivantDansMonde } from '../niveaux/arcs';
import { ConcoursPlongeon, NIVEAU_PLONGEON } from './plongeon';
import { Partie } from './partie';

export type { ConcoursPlongeon };

const siegesPresents = (p: Partie): number[] => p.joueurs.flatMap((j, s) => (j ? [s] : []));

/**
 * Lance le concours de plongeon : chaque joueur présent saute à son tour. `miniJeu` : depuis le menu des mini-jeux (on rejoue au
 * podium) plutôt qu'après le pont des Tuves (le podium passé, le van reprend la route).
 */
export function lancePlongeon(p: Partie, miniJeu: boolean): void {
  p.plongeon = new ConcoursPlongeon(siegesPresents(p), miniJeu);
  p.phase = 'plongeon';
  p.page = 0;
}

/** Un pas du concours ; le podium passé (dans l'histoire), le niveau est fait et le van prend la route du suivant. */
export function majPlongeon(p: Partie): void {
  const c = p.plongeon;
  if (!c) return;
  c.maj(p.commandes, siegesPresents(p), (nom) => p.son(nom, 0, 0));
  if (!c.fini) return;
  p.plongeon = null;
  p.drapeau = -1;
  p.onProgression({ ...p.progression(), niveau: suivantDansMonde(p.niveau) ?? p.niveau }, true, p.niveau);
  p.phase = 'carte';
  p.page = 0;
}

/** Une partie qui n'est que le concours de plongeon (le menu des mini-jeux) : un joueur, qui rejoue au podium. */
export function nouveauPlongeon(membre: number): Partie {
  const p = new Partie({ niveau: NIVEAU_PLONGEON, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, membre);
  lancePlongeon(p, true);
  return p;
}
