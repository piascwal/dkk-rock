import type { VueArene } from '../jeu/arene';
import { equipeDeLaCase } from '../jeu/equipes';
import { COULEURS_SIEGES } from './indicateurs';

/** Rouge et bleu : la couleur de chaque équipe du battle royale. */
export const COULEURS_EQUIPES = ['#e5432f', '#3fa7f2'] as const;

/**
 * La couleur d'un joueur en battle royale : celle de son équipe (on reconnaît ses alliés d'un coup d'œil), ou, chacun pour soi,
 * celle de son siège.
 */
export function couleurDuSiege(ar: VueArene | undefined, siege: number): string {
  const n = ar?.places[siege] ?? -1;
  if (ar?.equipes && n >= 0) return COULEURS_EQUIPES[equipeDeLaCase(n)]!;
  return COULEURS_SIEGES[siege % COULEURS_SIEGES.length]!;
}
