import { HAUTEUR_VUE } from '../config';
import { Aleatoire } from '../moteur/maths';
import { PREMIER_PLAN_TUVES } from './premier-plan-tuves';
import type { Decor } from './themes';

/**
 * Le premier plan : entre le jeu et l'écran, des éléments tout proches (un feuillage, des gouttes qui tombent...) qui
 * défilent plus vite que le jeu. Ils sont clairsemés et peints en couleurs translucides : ils cachent un peu du jeu, par
 * endroits et le temps de passer, pour la profondeur. Un monde qui en veut un le déclare dans PREMIERS_PLANS ; la bande est
 * peinte une fois, à la hauteur de la vue, et se répète.
 */
export interface DefPremierPlan {
  /** la largeur de la bande, en pixels du jeu (plus elle est large, plus les éléments sont rares) */
  largeur: number;
  /** de combien la bande défile pour un pixel de caméra : au-delà de 1, plus vite que le jeu, elle passe devant */
  parallaxe: number;
  /** peint la bande, une fois pour toutes */
  peint: (c: CanvasRenderingContext2D, r: Aleatoire) => void;
  /** ce qui bouge, à chaque image ; `x0` : où commence la bande à l'écran */
  anime?: (ctx: CanvasRenderingContext2D, x0: number, tick: number) => void;
}

const PREMIERS_PLANS: Partial<Record<Decor, DefPremierPlan>> = {
  tuves: PREMIER_PLAN_TUVES,
};

export class PremierPlan {
  private readonly def: DefPremierPlan | undefined;
  private readonly toile: HTMLCanvasElement | null = null;

  constructor(decor: Decor) {
    this.def = PREMIERS_PLANS[decor];
    if (!this.def) return;
    this.toile = document.createElement('canvas');
    this.toile.width = this.def.largeur;
    this.toile.height = HAUTEUR_VUE;
    this.def.peint(this.toile.getContext('2d')!, new Aleatoire(29));
  }

  /** Après les personnages et les particules, avant les indicateurs. */
  dessine(ctx: CanvasRenderingContext2D, camX: number, largeur: number, tick: number): void {
    const d = this.def;
    if (!d || !this.toile) return;
    const decale = (((camX * d.parallaxe) % d.largeur) + d.largeur) % d.largeur;
    for (let x = -Math.round(decale); x < largeur; x += d.largeur) {
      ctx.drawImage(this.toile, x, 0);
      d.anime?.(ctx, x, tick);
    }
  }
}
