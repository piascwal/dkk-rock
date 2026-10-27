import type { NomTheme } from '../rendu/themes';
import type { Depart } from './departs';
import type { Trace } from './tyroliennes-tracees';

/** [nom, colonne, rangée du sol, apparence choisie (sans elle : celle qui sort du tirage de la case)] */
export type Decor = [string, number, number, number?];

/** un personnage choisi sur la case d'une lettre : [colonne, rangée, clé] (voir entites/ennemis/gens.ts) */
export type Gens = [number, number, string];

/** Un module préconstruit (voir outils/exporte-modules.py) : un rectangle de carte, sa rangée de sol, son décor. */
export interface ModuleEditeur {
  id: string;
  nom: string;
  famille: string;
  sol: number;
  lignes: string[];
  decor: Decor[];
  gens?: Gens[];
}

/** Ce qu'on exporte (et réimporte) : de quoi refaire le niveau tel quel, ou en faire un niveau du jeu. */
export interface NiveauExporte {
  format: 'dkk-niveau';
  version: 1;
  nom: string;
  theme: NomTheme;
  /** le niveau du jeu dont on est parti, s'il y en a un (son identifiant) */
  depart: string | null;
  carte: string[];
  decor: Decor[];
  gens?: Gens[];
  /** battle royale : le départ de chaque joueur (siège 0 à 7), ou null */
  departs?: Depart[];
  /** les tyroliennes tracées poteau par poteau (voir tyroliennes-tracees.ts) */
  tyroliennes?: Trace[];
}
