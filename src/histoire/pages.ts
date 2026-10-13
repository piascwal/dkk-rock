import type { Phase } from '../jeu/vue';
import { NIVEAUX } from '../niveaux';
import { arcDe } from '../niveaux/arcs';
import type { Replique } from '../niveaux/format';

export const DEFAITE: Replique[] = [
  { qui: 'NARRATEUR', texte: 'Le groupe s’est séparé. Encore. « Divergences artistiques. »' },
  { qui: 'JBM', texte: 'Tournée de reformation ! On reprend au dernier drapeau.' },
];

/** Les pages d'histoire d'une phase : identiques chez tous les joueurs, seul l'index de page voyage. */
export function pagesDe(phase: Phase, niveau: number): Replique[] {
  const def = NIVEAUX[niveau];
  if (!def) return [];
  switch (phase) {
    case 'histoire':
      return def.intro;
    case 'bilan':
      return def.outro;
    case 'fin':
      return arcDe(niveau).fin;
    case 'perdu':
      return DEFAITE;
    default:
      return [];
  }
}
