import { VIES_ARENE_MAX } from '../jeu/arene';
import { G, type EtatVue } from '../jeu/vue';
import { ecritCentre, largeurTexte } from './police';

/**
 * Au-dessus de chaque cage encore fermée, une petite bulle qui flotte : « +1 vie », en vert. Elle se dessine tout à la fin,
 * par-dessus le décor et le premier plan, pour qu'on voie de loin où libérer un DKK. (Une cage ouverte, `e` = 1, n'en a plus.)
 * Quand on a déjà toutes ses vies, la cage n'en donne plus : la bulle le dit (« vies max », en gris) plutôt que de promettre.
 */
const VERT = '#1f9d3f';
const GRIS = '#7d7d8c';
/** la hauteur de la cage (le sprite dépasse un peu sa boîte) et l'écart entre elle et la bulle */
const HAUT_CAGE = 22;
const ECART = 4;

export function dessineBullesCages(
  ctx: CanvasRenderingContext2D,
  vue: EtatVue,
  siegeLocal: number,
  camX: number,
  camY: number,
  largeur: number,
  tick: number,
): void {
  // plein : en battle royale seulement, où les vies sont plafonnées (dans l'histoire, une cage en donne toujours une)
  const plein = !!vue.arene && (vue.arene.vies[siegeLocal] ?? 0) >= VIES_ARENE_MAX;
  const texte = plein ? 'VIES MAX' : '+1 VIE';
  for (const v of vue.entites) {
    if (v.g !== G.CAGE || v.e !== 0) continue;
    const x = Math.round(v.x - camX);
    if (x < -30 || x > largeur + 30) continue;
    // la bulle flotte doucement, d'un pixel
    const y = Math.round(v.y - camY - HAUT_CAGE - ECART + Math.sin(tick / 14 + v.id) * 1.5);
    const demi = Math.ceil(largeurTexte(texte, 1) / 2) + 3;
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.fillRect(x - demi - 1, y - 11, 2 * demi + 2, 11); // le liseré
    ctx.fillRect(x - 1, y, 3, 2); // la pointe, vers la cage
    ctx.fillStyle = '#fff6c8';
    ctx.fillRect(x - demi, y - 10, 2 * demi, 9);
    ctx.fillRect(x, y - 1, 1, 2);
    ecritCentre(ctx, texte, x, y - 8, plein ? GRIS : VERT);
    ctx.restore();
  }
}
