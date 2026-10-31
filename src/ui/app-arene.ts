import { HEROS } from '../entites/heros';
import type { ReglesArene } from '../jeu/arene';
import { VIES_DEPART } from '../config';
import type { DefNiveau } from '../niveaux/format';
import { Partie } from '../jeu/partie';
import { ajouteNiveauEssai } from '../niveaux';
import type { CarteArene } from './menus-arene';
import type { Menus } from './menus';

/**
 * Une partie de battle royale : la carte (un niveau du jeu, ou un des siens ajouté le temps de la partie), le joueur, et
 * `ia` joueurs de l'ordinateur ; sans eux, c'est un salon en ligne qui attend les amis.
 */
export function partieArene(carte: CarteArene, regles: ReglesArene, ia: number, membre: number): Partie {
  const niveau = 'def' in carte ? ajouteNiveauEssai(carte.def) : carte.niveau;
  const p = new Partie({ niveau, drapeau: -1, vies: 0, score: 0 });
  p.ajouteJoueur(0, membre);
  const sieges = Array.from({ length: ia }, (_, i) => i + 1);
  for (const s of sieges) p.ajouteJoueur(s, Math.floor(Math.random() * HEROS.length));
  p.ouvreArene(regles, ia === 0, sieges);
  return p;
}

/** L'essai d'un niveau de l'éditeur : une carte de battle royale s'essaie contre l'ordinateur ; un autre niveau, seul. */
export function partieEssai(def: DefNiveau, membre: number): Partie {
  if (def.arene) return partieArene({ def }, {}, 3, membre);
  const p = new Partie({ niveau: ajouteNiveauEssai(def), drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, membre);
  return p;
}

/** L'éditeur de niveau, chargé à la première ouverture seulement (il ne pèse pas sur le jeu) ; ses essais passent par `teste`. */
export function ouvreEditeurDe(menus: Menus, teste: (def: DefNiveau, retour: () => void) => void): void {
  menus.ferme();
  void import('../editeur/editeur').then(({ ouvreEditeur }) =>
    ouvreEditeur({ teste, quitte: () => menus.titre() }),
  );
}
