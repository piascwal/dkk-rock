import { HAUTEUR_VUE } from '../config';
import { HEROS } from '../entites/heros';
import type { EtatVue } from '../jeu/vue';
import { ecritCentre } from './police';

/**
 * En multijoueur, chacun a sa caméra et on peut perdre les autres de vue : une petite flèche au bord de l'écran montre,
 * pour chaque équipier hors champ, la direction où le retrouver. Côté rendu seulement, d'après la vue.
 */
const COULEURS = ['#ff6b6b', '#4fc3ff', '#ffd23f', '#7cfc7c'];
/** les marges qui laissent libres la barre du haut et les bords : gauche, droite, haut, bas (pixels du jeu) */
const MARGES = { gauche: 12, droite: 12, haut: 26, bas: 16 };
/** une flèche qui regarde vers la droite ; X : plein */
const FLECHE = ['...X...', '...XX..', 'XXXXXXX', '...XX..', '...X...'];

export interface Indicateur {
  x: number;
  y: number;
  /** l'angle de la direction à suivre, en radians (0 : vers la droite) */
  angle: number;
}

/**
 * Où dessiner la flèche d'un équipier dont la position à l'écran est (sx, sy) : null s'il est visible (rien à montrer),
 * sinon le point du bord de l'écran, sur la droite qui va du centre vers lui.
 */
export function indicateurVers(sx: number, sy: number, largeur: number, hauteur: number): Indicateur | null {
  const cx = largeur / 2;
  const cy = hauteur / 2;
  const dx = sx - cx;
  const dy = sy - cy;
  const demiX = cx - MARGES.gauche;
  const demiY = cy - MARGES.haut;
  if (Math.abs(dx) <= demiX && Math.abs(dy) <= demiY && sy <= hauteur - MARGES.bas) return null;
  // la droite centre → équipier, coupée par le rectangle des marges (le haut et le bas n'ont pas la même marge)
  const t = Math.min(
    dx ? (dx > 0 ? largeur - MARGES.droite - cx : cx - MARGES.gauche) / Math.abs(dx) : Infinity,
    dy ? (dy > 0 ? hauteur - MARGES.bas - cy : cy - MARGES.haut) / Math.abs(dy) : Infinity,
  );
  return { x: cx + dx * t, y: cy + dy * t, angle: Math.atan2(dy, dx) };
}

export function dessineIndicateurs(
  ctx: CanvasRenderingContext2D,
  vue: EtatVue,
  siegeLocal: number,
  camX: number,
  camY: number,
  largeur: number,
  tick: number,
): void {
  vue.joueurs.forEach((j, siege) => {
    if (siege === siegeLocal || !j.present || j.mort) return;
    const ind = indicateurVers(j.x - camX, j.y - camY, largeur, HAUTEUR_VUE);
    if (!ind) return;
    const couleur = COULEURS[siege % COULEURS.length]!;
    // la flèche bat doucement : on la remarque sans qu'elle gêne
    const pas = Math.round(Math.sin(tick / 8) * 1.5);
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.translate(Math.round(ind.x), Math.round(ind.y));
    ctx.rotate(ind.angle);
    ctx.translate(pas, 0);
    for (const [couleurPixel, dx, dy] of [
      ['#000', -1, 0],
      ['#000', 1, 0],
      ['#000', 0, -1],
      ['#000', 0, 1],
      [couleur, 0, 0],
    ] as const) {
      ctx.fillStyle = couleurPixel;
      FLECHE.forEach((ligne, y) => {
        for (let x = 0; x < ligne.length; x++)
          if (ligne[x] === 'X') ctx.fillRect(x - 3 + dx, y - 2 + dy, 1, 1);
      });
    }
    ctx.restore();
    // le nom du personnage, du côté du centre de l'écran
    const nom = HEROS[j.membre]?.qui ?? '';
    const lx = ind.x - Math.cos(ind.angle) * 13;
    const ly = ind.y - Math.sin(ind.angle) * 9 - 3;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ecritCentre(ctx, nom, Math.round(lx), Math.round(ly), couleur);
    ctx.restore();
  });
}
