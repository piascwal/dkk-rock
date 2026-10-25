import type { NomTheme } from '../../rendu/themes';
import { ENNEMIS_PAR_LETTRE, type DefEnnemi } from './definitions';
import { ennemiDuCoin } from './locaux';

/**
 * Les gens choisis dans l'éditeur de niveau (`gens` d'un niveau, case par case) : une clé dit qui poser sur la case d'une lettre.
 * - « a » : la lettre telle quelle (dans une ville de l'International Tour, le « a » du coin) ;
 * - « ottawa/a » : celui d'une ville, même ailleurs ; « _/a » : l'ordinaire, même dans une ville ;
 * - « …#2 » : une apparence précise, pour ceux qui en ont plusieurs (la bigoudène et ses trois instruments).
 */

/**
 * L'apparence d'un ennemi suit son identifiant, modulo leur nombre (1 à 4, voir rendu/feuilles.ts : `variantes`). Un identifiant qui
 * vaut l'apparence voulue modulo 12 tombe juste quel que soit ce nombre : la simulation n'a pas à le connaître.
 */
export const CYCLE_APPARENCES = 12;

export interface Personnage {
  def: DefEnnemi;
  apparence: number | null;
}

export function lisPersonnage(cle: string, theme: NomTheme): Personnage | null {
  const m = /^(?:([a-z_]+)\/)?([a-z])(?:#(\d{1,2}))?$/.exec(cle);
  if (!m) return null;
  const [, ville, lettre, apparence] = m as unknown as [
    string,
    string | undefined,
    string,
    string | undefined,
  ];
  const def =
    ville === '_'
      ? ENNEMIS_PAR_LETTRE[lettre]
      : (ennemiDuCoin(lettre, (ville ?? theme) as NomTheme) ?? ENNEMIS_PAR_LETTRE[lettre]);
  return def ? { def, apparence: apparence === undefined ? null : Number(apparence) } : null;
}

/** Saute des identifiants jusqu'à ce que le prochain donne l'apparence voulue (quelques numéros perdus, sans conséquence). */
export function aligneIdentifiant(prochainId: () => number, apparence: number): void {
  let id = prochainId();
  for (let i = 0; i < CYCLE_APPARENCES && (id + 1) % CYCLE_APPARENCES !== apparence % CYCLE_APPARENCES; i++)
    id = prochainId();
}
