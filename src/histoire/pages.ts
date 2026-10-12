import type { Phase } from '../jeu/vue';
import { NIVEAUX } from '../niveaux';
import type { Replique } from '../niveaux/format';

/** L'épilogue, après la chute de DJ Boucle. */
export const FIN: Replique[] = [
  {
    qui: 'NARRATEUR',
    texte:
      'Les foules se réveillent. Elles retirent leurs casques, clignent des yeux, et découvrent un monde plein de musiques : jazz, techno de Detroit, musette, cumbia, cornemuses, yodel.',
  },
  { qui: 'JBG', texte: 'En vrai... le jazz modal, c’est pas mal.' },
  { qui: 'TOM', texte: 'La cumbia aussi.' },
  { qui: 'MAT', texte: 'J’ai toujours aimé Kraftwerk. Je le dis, maintenant.' },
  { qui: 'JBM', texte: 'Vous rigolez ? ROCK NEVER DIES !' },
  {
    qui: 'NARRATEUR',
    texte:
      'Seb propose un featuring. Les DKK refusent. Puis acceptent. Puis se disputent six mois sur le nom du morceau.',
  },
  {
    qui: 'NARRATEUR',
    texte: 'Le morceau dure 2 minutes 40. Il a un solo. Et un synthé. Lemmy le kiwi est crédité aux chœurs.',
  },
  { qui: 'NARRATEUR', texte: 'FIN. Rock never dies. (Les autres musiques non plus, apparemment.)' },
];

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
      return FIN;
    case 'perdu':
      return DEFAITE;
    default:
      return [];
  }
}
