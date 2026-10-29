import { HAUTEUR_VUE, TUILE } from '../config';
import { Aleatoire } from '../moteur/maths';
import { T } from '../monde/tuiles';
import type { NiveauLu } from '../niveaux/format';
import { PREMIER_PLAN_FORET } from './premier-plan-foret';
import { PREMIER_PLAN_TUVES } from './premier-plan-tuves';
import type { Decor } from './themes';

/**
 * Le premier plan : entre le jeu et l'écran, des éléments tout proches (un arbre feuillu, une motte, une cascade...) qui
 * défilent plus vite que le jeu en largeur. En hauteur, ils sont cloués au monde, comme le terrain : en sautant, en montant
 * ou en descendant, rien ne bouge de son propre chef. Chacun est posé sur le terrain, à un endroit du niveau : on le croise
 * en passant, une fois dépassé il est derrière nous. Pour ne jamais montrer leur pied en sautant, ceux qui le demandent
 * (`prolonge`) sont étirés vers le bas jusqu'au fond du niveau, là où l'on tombe. Ils sont clairsemés et peints en couleurs
 * translucides : ils cachent un peu du jeu, par endroits et le temps de passer, pour la profondeur.
 *
 * Un monde qui en veut un le déclare dans PREMIERS_PLANS : ses sortes d'éléments (peintes une fois) et où les poser.
 */

/** Une sorte d'élément, peinte une fois : une image, son pied (le point posé sur le terrain), ce qui bouge dessus. */
export interface Sorte {
  toile: HTMLCanvasElement;
  /** le pied de l'élément dans l'image : au milieu en bas pour un arbre */
  pied: { x: number; y: number };
  /** la dernière rangée de l'image est étirée vers le bas jusqu'au fond du niveau (un tronc, un sol) */
  prolonge?: boolean;
  /** de 0 à 1 : l'élément est translucide (on voit un peu le jeu à travers) ; absent : 1 */
  opacite?: number;
  /** ce qui bouge à chaque image ; (x, y) : le coin haut gauche de l'image à l'écran */
  anime?: (ctx: CanvasRenderingContext2D, x: number, y: number, tick: number) => void;
}

/** Un élément posé : sa sorte (indice dans `sortes`) et son pied, en pixels du monde. */
export interface Pose {
  sorte: number;
  x: number;
  y: number;
}

/** Le terrain d'un niveau, tel que le voit un premier plan pour poser ses éléments. */
export interface Terrain {
  /** la largeur du niveau, en tuiles */
  largeur: number;
  /** la première tuile en partant du haut de la colonne `tx` (hors échelles) : sa rangée et sa nature, ou null s'il n'y en a pas */
  surface(tx: number): { ty: number; tuile: number } | null;
}

export interface DefPremierPlan {
  /** de combien l'élément défile en largeur pour un pixel de caméra : au-delà de 1, il passe devant le jeu */
  parallaxe: number;
  sortes(r: Aleatoire): Sorte[];
  pose(terrain: Terrain, r: Aleatoire): Pose[];
}

const PREMIERS_PLANS: Partial<Record<Decor, DefPremierPlan>> = {
  tuves: PREMIER_PLAN_TUVES,
  sousbois: PREMIER_PLAN_FORET,
};

/** Une image vide, pour y peindre une sorte. */
export function toile(largeur: number, hauteur: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const t = document.createElement('canvas');
  t.width = largeur;
  t.height = hauteur;
  return [t, t.getContext('2d')!];
}

export function terrainDe(lu: NiveauLu): Terrain {
  return {
    largeur: lu.largeur,
    surface: (tx) => {
      for (let ty = 0; ty < lu.hauteur; ty++) {
        const tuile = lu.tuiles[ty * lu.largeur + tx]!;
        if (tuile !== T.VIDE && tuile !== T.ECHELLE) return { ty, tuile };
      }
      return null;
    },
  };
}

export class PremierPlan {
  private readonly def: DefPremierPlan | undefined;
  private sortes: Sorte[] = [];
  private poses: Pose[] = [];
  /** le fond du niveau, en pixels du monde */
  private readonly fond: number;

  constructor(decor: Decor, lu: NiveauLu) {
    this.def = PREMIERS_PLANS[decor];
    this.fond = lu.hauteur * TUILE;
    if (!this.def) return;
    const r = new Aleatoire(29);
    this.sortes = this.def.sortes(r);
    this.poses = this.def.pose(terrainDe(lu), r);
  }

  /** Après les personnages et les particules, avant les indicateurs. */
  dessine(ctx: CanvasRenderingContext2D, camX: number, camY: number, largeur: number, tick: number): void {
    const p = this.def?.parallaxe;
    if (!p) return;
    // sur les pixels de la toile (pas du jeu) : le premier plan défile aussi régulièrement que le terrain
    const g = ctx.getTransform().a || 1;
    const cale = (v: number) => Math.round(v * g) / g;
    for (const o of this.poses) {
      const s = this.sortes[o.sorte]!;
      // la parallaxe en largeur est centrée sur l'écran ; en hauteur, l'élément est au monde, comme le terrain
      const x = cale((o.x - camX - largeur / 2) * p + largeur / 2 - s.pied.x);
      const y = Math.round(o.y - s.pied.y) - camY;
      const bas = s.prolonge ? Math.min(HAUTEUR_VUE, Math.round(this.fond) - camY) : y + s.toile.height;
      if (x + s.toile.width < 0 || x > largeur || y + s.toile.height < 0 || y > HAUTEUR_VUE) continue;
      ctx.globalAlpha = s.opacite ?? 1;
      ctx.drawImage(s.toile, x, y);
      const h = s.toile.height;
      if (s.prolonge && bas > y + h)
        ctx.drawImage(s.toile, 0, h - 1, s.toile.width, 1, x, y + h, s.toile.width, bas - y - h);
      ctx.globalAlpha = 1;
      s.anime?.(ctx, x, y, tick);
    }
  }
}

/** Le pied d'un élément posé sur la tuile (tx, ty) : le milieu de la tuile, à sa surface. */
export const pied = (tx: number, ty: number): { x: number; y: number } => ({
  x: (tx + 0.5) * TUILE,
  y: ty * TUILE,
});
