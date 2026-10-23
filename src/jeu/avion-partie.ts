import { VIES_DEPART } from '../config';
import { suivantDansMonde } from '../niveaux/arcs';
import { Partie } from './partie';
import { ConcoursAvion, NIVEAU_AVION } from './avion';

export type { ConcoursAvion };

const siegesPresents = (p: Partie): number[] => p.joueurs.flatMap((j, s) => (j ? [s] : []));

/**
 * Lance l'avion de JBG : chaque joueur présent court à son tour. `miniJeu` : depuis le menu des mini-jeux (on rejoue au podium)
 * plutôt qu'en tête du Breizh Tour (le podium passé, on file vers la Bretagne).
 */
export function lanceAvion(p: Partie, miniJeu: boolean): void {
  p.avion = new ConcoursAvion(siegesPresents(p), miniJeu);
  p.phase = 'avion';
  p.page = 0;
}

/** Un pas de la course ; le podium passé (dans l'histoire), le niveau est fait et le van prend la route du suivant. */
export function majAvion(p: Partie): void {
  const c = p.avion;
  if (!c) return;
  c.maj(p.commandes, siegesPresents(p), (nom) => p.son(nom, 0, 0));
  if (!c.fini) return;
  p.avion = null;
  p.drapeau = -1;
  p.onProgression({ ...p.progression(), niveau: suivantDansMonde(p.niveau) ?? p.niveau }, true, p.niveau);
  p.phase = 'carte';
  p.page = 0;
}

/** Une partie qui n'est que l'avion de JBG (le menu des mini-jeux) : un joueur, qui rejoue au podium. */
export function nouveauAvion(membre: number): Partie {
  const p = new Partie({ niveau: NIVEAU_AVION, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, membre);
  lanceAvion(p, true);
  return p;
}
