import type { EntiteVue } from '../jeu/vue';
import { dessineDecorFeuille } from './feuilles-images';

/** Les rockers de la planche (outils/fixe-objets.py) : un ennemi vaincu n'est pas tué, il est converti au rock. */
const NB_ROCKERS = 12;

/**
 * L'ennemi qu'on vient de convertir : à sa place, un rocker tiré au sort (toujours le même pour un ennemi donné) qui reste
 * là, debout, et s'estompe à la fin. Assez transparent, avec un léger halo doré : on comprend qu'il a changé de camp, sans le
 * prendre pour un ennemi encore debout. Dessiné pieds en (0, 0) ; false si la planche n'est pas encore chargée (l'ennemi couché
 * sert alors de repli).
 */
export function dessineRockerConverti(ctx: CanvasRenderingContext2D, v: EntiteVue): boolean {
  ctx.globalAlpha = 0.5 * Math.min(1, v.f / 40);
  ctx.shadowColor = 'rgba(255,214,90,0.85)';
  ctx.shadowBlur = 5;
  return dessineDecorFeuille(ctx, 'rocker', v.id % NB_ROCKERS);
}
