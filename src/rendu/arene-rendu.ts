import { HAUTEUR_VUE, TUILE } from '../config';
import type { EtatVue } from '../jeu/vue';
import { COULEURS_SIEGES } from './indicateurs';

/**
 * Le battle royale à l'écran (d'après la vue) : la zone qui se referme (dehors, un voile rouge et un bord qui bat), et un repère
 * de couleur au-dessus de chaque joueur (plusieurs peuvent jouer le même héros : la couleur dit qui est qui).
 */
export function dessineArene(
  ctx: CanvasRenderingContext2D,
  vue: EtatVue,
  siegeLocal: number,
  camX: number,
  camY: number,
  largeur: number,
  tick: number,
): void {
  const ar = vue.arene;
  if (!ar || vue.phase !== 'jeu') return;
  if (ar.etape === 'combat') {
    const g = Math.round(ar.zone[0] - camX);
    const d = Math.round(ar.zone[1] - camX);
    ctx.save();
    ctx.fillStyle = 'rgba(200, 20, 40, 0.28)';
    if (g > 0) ctx.fillRect(0, 0, Math.min(g, largeur), HAUTEUR_VUE);
    if (d < largeur) ctx.fillRect(Math.max(0, d), 0, largeur - Math.max(0, d), HAUTEUR_VUE);
    ctx.fillStyle = tick % 30 < 15 ? '#ff4060' : '#ffb0c0';
    for (const x of [g, d]) if (x >= -2 && x <= largeur + 2) ctx.fillRect(x - 1, 0, 2, HAUTEUR_VUE);
    ctx.restore();
  }
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
