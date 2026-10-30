import { CARTE_MARSEILLE_REFONTE } from './refontes/21-marseille';
import type { DefNiveau } from './format';

/**
 * Le chantier du level design : des niveaux refaits (à la manière de Broforce : du relief, des vides, plusieurs routes ; voir
 * outils/mesure-niveaux.py), qui vivent à côté des niveaux d'origine le temps d'être essayés.
 *
 * Une refonte remplace ce qu'elle donne (la carte, le décor...) dans le niveau du même `id`, qui garde sa place dans la liste :
 * les sauvegardes (niveaux faits, partie en cours) ne bougent pas. Les joueurs n'ont une refonte qu'une fois publiée ; avant,
 * seul le mode essai (`?essai` dans l'adresse, voir ui/essai.ts) la fait jouer, et seulement en solo.
 */
export const REFONTES: Readonly<Record<string, Partial<DefNiveau>>> = {
  marseille: { carte: CARTE_MARSEILLE_REFONTE },
};

/**
 * Les refontes essayées et validées : tous les joueurs les ont. En publier une change les cartes que l'hôte et les invités
 * doivent partager : augmenter VERSION_PROTOCOLE (reseau/protocole.ts) dans le même temps.
 */
export const REFONTES_PUBLIEES: ReadonlySet<string> = new Set<string>(['marseille']);

/** La version d'un niveau à jouer : sa refonte si elle est publiée, ou en mode essai ; sinon l'original. */
export function versionDe(def: DefNiveau, essai: boolean): DefNiveau {
  const r = REFONTES[def.id];
  return r && (essai || REFONTES_PUBLIEES.has(def.id)) ? { ...def, ...r } : def;
}

/** Vrai si le niveau a une refonte que les joueurs n'ont pas encore (le mode essai la fait jouer). */
export function refonteEnEssai(id: string): boolean {
  return id in REFONTES && !REFONTES_PUBLIEES.has(id);
}
