import { G, type EntiteVue } from '../jeu/vue';
import { ecritCentre, largeurTexte } from './police';

/**
 * Au-dessus de chaque cage encore fermée, une petite bulle qui flotte : « +1 vie ». Elle se dessine tout à la fin, par-dessus le
 * décor et le premier plan, pour qu'on voie de loin où libérer un DKK. (Une cage ouverte, `e` = 1, n'en a plus.)
 */
const TEXTE = '+1 VIE';
/** la hauteur de la cage (le sprite dépasse un peu sa boîte) et l'écart entre elle et la bulle */
const HAUT_CAGE = 22;
const ECART = 4;

export function dessineBullesCages(
  ctx: CanvasRenderingContext2D,
  entites: readonly EntiteVue[],
  camX: number,
  camY: number,
  largeur: number,
  tick: number,
): void {
  for (const v of entites) {
    if (v.g !== G.CAGE || v.e !== 0) continue;
    const x = Math.round(v.x - camX);
    if (x < -30 || x > largeur + 30) continue;
    // la bulle flotte doucement, d'un pixel
    const y = Math.round(v.y - camY - HAUT_CAGE - ECART + Math.sin(tick / 14 + v.id) * 1.5);
    const demi = Math.ceil(largeurTexte(TEXTE, 1) / 2) + 3;
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.fillRect(x - demi - 1, y - 11, 2 * demi + 2, 11); // le liseré
    ctx.fillRect(x - 1, y, 3, 2); // la pointe, vers la cage
    ctx.fillStyle = '#fff6c8';
    ctx.fillRect(x - demi, y - 10, 2 * demi, 9);
    ctx.fillRect(x, y - 1, 1, 2);
    ctx.fillStyle = '#d63a4a';
    ecritCentre(ctx, TEXTE, x, y - 8, '#d63a4a');
    ctx.restore();
  }
}
