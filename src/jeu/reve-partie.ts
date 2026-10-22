import { VIES_DEPART } from '../config';
import { suivantDansMonde } from '../niveaux/arcs';
import { Partie } from './partie';
import { ConcoursReve, NIVEAU_REVE } from './reve';

export type { ConcoursReve };

const siegesPresents = (p: Partie): number[] => p.joueurs.flatMap((j, s) => (j ? [s] : []));

/**
 * Lance le rêve de JBT : chaque joueur présent vole à son tour. `miniJeu` : depuis le menu des mini-jeux (on rejoue au podium)
 * plutôt qu'entre la Ville Autotunée et le Club Infini (le podium passé, JBT se réveille et le van reprend la route).
 */
export function lanceReve(p: Partie, miniJeu: boolean): void {
  p.reve = new ConcoursReve(siegesPresents(p), miniJeu);
  p.phase = 'reve';
  p.page = 0;
}

/** Un pas du rêve ; le podium passé (dans l'histoire), le niveau est fait et le van prend la route du suivant. */
export function majReve(p: Partie): void {
  const c = p.reve;
  if (!c) return;
  c.maj(p.commandes, siegesPresents(p), (nom) => p.son(nom, 0, 0));
  if (!c.fini) return;
  p.reve = null;
  p.drapeau = -1;
  p.onProgression({ ...p.progression(), niveau: suivantDansMonde(p.niveau) ?? p.niveau }, true, p.niveau);
  p.phase = 'carte';
  p.page = 0;
}

/** Une partie qui n'est que le rêve de JBT (le menu des mini-jeux) : un joueur, qui rejoue au podium. */
export function nouveauReve(membre: number): Partie {
  const p = new Partie({ niveau: NIVEAU_REVE, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, membre);
  lanceReve(p, true);
  return p;
}
