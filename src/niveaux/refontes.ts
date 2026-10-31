import { CARTE_BEAUVAIS_REFONTE } from './refontes/17-beauvais';
import { CARTE_LIMERICK_REFONTE, DECOR_LIMERICK_REFONTE } from './refontes/18-limerick';
import { CARTE_LUND_REFONTE } from './refontes/19-lund';
import { CARTE_NEW_YORK_REFONTE } from './refontes/20-new-york';
import { CARTE_MARSEILLE_REFONTE } from './refontes/21-marseille';
import { CARTE_OTTAWA_REFONTE, DECOR_OTTAWA_REFONTE } from './refontes/23-ottawa';
import type { DefNiveau } from './format';

/**
 * Le chantier du level design : des niveaux refaits (à la manière de Broforce : du relief, des vides, plusieurs routes ; voir
 * outils/mesure-niveaux.py), qui vivent à côté des niveaux d'origine le temps d'être essayés.
 *
 * Une refonte remplace ce qu'elle donne (la carte, le décor...) dans le niveau du même `id`, qui garde sa place dans la liste :
 * les sauvegardes (niveaux faits, partie en cours) ne bougent pas. Les joueurs n'ont une refonte qu'une fois publiée ; avant,
 * le mode essai (`?essai` dans l'adresse, voir ui/essai.ts) la fait jouer à part, à côté de l'original (menus-refontes.ts).
 */
export const REFONTES: Readonly<Record<string, Partial<DefNiveau>>> = {
  marseille: { carte: CARTE_MARSEILLE_REFONTE },
  // l'International Tour
  beauvais: { carte: CARTE_BEAUVAIS_REFONTE },
  limerick: { carte: CARTE_LIMERICK_REFONTE, decor: DECOR_LIMERICK_REFONTE },
  lund: { carte: CARTE_LUND_REFONTE },
  newyork: { carte: CARTE_NEW_YORK_REFONTE },
  ottawa: { carte: CARTE_OTTAWA_REFONTE, decor: DECOR_OTTAWA_REFONTE },
};

/**
 * Les refontes essayées et validées : tous les joueurs les ont. En publier une change les cartes que l'hôte et les invités
 * doivent partager : augmenter VERSION_PROTOCOLE (reseau/protocole.ts) dans le même temps.
 */
export const REFONTES_PUBLIEES: ReadonlySet<string> = new Set<string>([
  'marseille',
  'beauvais',
  'limerick',
  'lund',
  'newyork',
  'ottawa',
]);

/**
 * Les nouvelles versions de niveaux déjà publiés, le temps de les essayer : le mode essai les joue à la place de la version
 * publiée (« après »), les joueurs gardent la publiée. Validée, une nouvelle version prend la place de la refonte ci-dessus.
 */
export const ESSAIS: Readonly<Record<string, Partial<DefNiveau>>> = {};

/** La version d'un niveau à jouer : en essai, sa nouvelle version ou sa refonte ; sinon sa refonte publiée, ou l'original. */
export function versionDe(def: DefNiveau, essai: boolean): DefNiveau {
  const r = (essai && ESSAIS[def.id]) || REFONTES[def.id];
  return r && (essai || REFONTES_PUBLIEES.has(def.id)) ? { ...def, ...r } : def;
}

/** Vrai si le niveau a une refonte que les joueurs n'ont pas encore (le mode essai la fait jouer). */
export function refonteEnEssai(id: string): boolean {
  return id in ESSAIS || (id in REFONTES && !REFONTES_PUBLIEES.has(id));
}
