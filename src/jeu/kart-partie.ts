import { VIES_DEPART } from '../config';
import { suivantDansMonde } from '../niveaux/arcs';
import { ConcoursKart, NIVEAU_KART } from './kart';
import { Partie } from './partie';

export type { ConcoursKart };

const siegesPresents = (p: Partie): number[] => p.joueurs.flatMap((j, s) => (j ? [s] : []));

/**
 * Lance le Grand Prix de la Sarré : chaque joueur présent choisit son pilote (son héros, proposé d'office). `miniJeu` : depuis le
 * menu des mini-jeux (on rejoue au podium) plutôt qu'après Gréau (le podium passé, le van prend la route des Plages).
 */
export function lanceKart(p: Partie, miniJeu: boolean): void {
  const sieges = siegesPresents(p);
  p.kart = new ConcoursKart(
    sieges,
    sieges.map((s) => p.joueurs[s]!.membre),
    miniJeu,
  );
  p.phase = 'kart';
  p.page = 0;
}

/** Un pas du Grand Prix ; le podium passé (dans l'histoire), le niveau est fait et le van prend la route du suivant. */
export function majKart(p: Partie): void {
  const c = p.kart;
  if (!c) return;
  c.maj(p.commandes, siegesPresents(p), (nom) => p.son(nom, 0, 0));
  if (!c.fini) return;
  p.kart = null;
  p.drapeau = -1;
  p.onProgression({ ...p.progression(), niveau: suivantDansMonde(p.niveau) ?? p.niveau }, true, p.niveau);
  p.phase = 'carte';
  p.page = 0;
}

/** Une partie qui n'est que le Grand Prix (le menu des mini-jeux) : un joueur, qui rejoue au podium. */
export function nouveauKart(membre: number): Partie {
  const p = new Partie({ niveau: NIVEAU_KART, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, membre);
  lanceKart(p, true);
  return p;
}
