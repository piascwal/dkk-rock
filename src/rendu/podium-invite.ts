import { ecritCentre } from './police';

/**
 * L'invite du podium, clignotante : à la suite de l'histoire, SAUT passe au niveau suivant (les boutons de ui/fin-mini-jeu.ts
 * proposent aussi de rejouer) ; depuis le menu des mini-jeux, SAUT rejoue.
 */
export function invitePodium(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  miniJeu: boolean,
  suite: string,
): void {
  if (miniJeu) return ecritCentre(ctx, 'SAUT : REJOUER', x, y, '#ffffff');
  ecritCentre(ctx, `SAUT : ${suite}`, x, y, '#ffffff');
}
