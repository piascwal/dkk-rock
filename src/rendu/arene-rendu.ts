import { HAUTEUR_VUE, TUILE } from '../config';
import type { EtatVue } from '../jeu/vue';
import { COULEURS_SIEGES } from './indicateurs';

/**
 * Le battle royale à l'écran (d'après la vue) : un repère de couleur au-dessus de chaque joueur (plusieurs peuvent jouer le même
 * héros : la couleur dit qui est qui).
 */
export function dessineArene(
  ctx: CanvasRenderingContext2D,
  vue: EtatVue,
  siegeLocal: number,
  camX: number,
  camY: number,
  largeur: number,
): void {
  const ar = vue.arene;
  if (!ar || vue.phase !== 'jeu') return;
  // un petit triangle de la couleur du joueur au-dessus de sa tête (le sien, plus discret)
  vue.joueurs.forEach((j, s) => {
    if (!j.present || j.mort) return;
    const x = Math.round(j.x - camX);
    const y = Math.round(j.y - camY - TUILE - 4);
    if (x < -8 || x > largeur + 8 || y < -8 || y > HAUTEUR_VUE + 8) return;
    ctx.globalAlpha = s === siegeLocal ? 0.55 : 1;
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 3, y - 1, 7, 4);
    ctx.fillStyle = COULEURS_SIEGES[s % COULEURS_SIEGES.length]!;
    ctx.fillRect(x - 2, y, 5, 1);
    ctx.fillRect(x - 1, y + 1, 3, 1);
    ctx.fillRect(x, y + 2, 1, 1);
    ctx.globalAlpha = 1;
  });
}
