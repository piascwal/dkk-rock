import { Pelouse, marqueVoiture, type Pose } from '../jeu/drift-pelouse';
import type { VueDrift } from '../jeu/vue';
import { dessineEcranDrift } from './drift-ecrans';
import { SolDrift, type Regard } from './drift-sol';
import { Mottes, dessineVoiture } from './drift-voitures';

/** La caméra se tient à cette distance derrière la voiture (m) ; la voiture y est dessinée à sa taille. */
const RECUL = 7.5;
/** En dessous de cette vitesse (m/s), la caméra se cale sur le cap de la voiture plutôt que sur sa trajectoire. */
const LANCEE = 2.5;

/**
 * Le concours de drift à l'écran, d'après la seule vue (comme chez un invité) : la pelouse est refaite ici à partir des
 * positions successives de la voiture (voir jeu/drift-pelouse.ts), la caméra suit la trajectoire avec un temps de retard (la
 * voiture qui dérape se présente de trois quarts), puis les écrans du concours par-dessus.
 */
export class RenduDrift {
  private readonly sol = new SolDrift();
  private readonly mottes = new Mottes();
  private pelouse = new Pelouse();
  private manche = -1;
  private derniere: Pose | null = null;
  /** le cap de la caméra, et la direction de la trajectoire (relevée sur les déplacements) */
  private cap: number | null = null;
  private trajectoire = Math.PI / 2;

  dessine(ctx: CanvasRenderingContext2D, v: VueDrift, largeur: number, tick: number): void {
    const pose: Pose = { x: v.x, y: v.y, cap: v.cap };
    if (v.manche !== this.manche) {
      // un nouveau tour : une pelouse neuve, la caméra derrière la voiture
      this.manche = v.manche;
      this.pelouse = new Pelouse();
      this.derniere = null;
      this.cap = v.cap;
      this.mottes.vide();
    }
    if (v.etape === 'course' && this.derniere) {
      const dx = pose.x - this.derniere.x;
      const dy = pose.y - this.derniere.y;
      if (Math.hypot(dx, dy) > 0.02) this.trajectoire = Math.atan2(dy, dx);
      marqueVoiture(this.pelouse, this.derniere, pose, v.griffe);
    }
    this.derniere = pose;

    const regard = this.regard(v, pose, tick);
    this.sol.dessine(ctx, largeur, regard, this.pelouse);
    // au choix du pilote, les deux voitures sont sur l'écran du choix ; au podium, le pré seul
    if (v.etape !== 'podium' && v.etape !== 'choix') {
      dessineVoiture(ctx, regard, largeur, pose, v.pilote, RECUL, v.griffe >= 2);
      if (v.etape === 'course') this.mottes.projette(regard, largeur, pose, v.griffe);
      this.mottes.dessine(ctx);
    }
    dessineEcranDrift(ctx, largeur, v, tick);
  }

  /** Où se tient la caméra : derrière la voiture, sur sa trajectoire (en course) ; au choix du pilote, elle tourne autour. */
  private regard(v: VueDrift, pose: Pose, tick: number): Regard {
    let cible = v.cap;
    if (v.etape === 'choix') cible = v.cap + Math.sin(tick / 90) * 0.7;
    else if (v.etape === 'course' && v.vitesse > LANCEE) {
      // en marche arrière, la caméra reste dans l'axe de la voiture
      const avance = Math.cos(this.trajectoire - v.cap) > -0.3;
      if (avance) cible = this.trajectoire;
    }
    const cap = this.cap ?? cible;
    const ecart = Math.atan2(Math.sin(cible - cap), Math.cos(cible - cap));
    this.cap = cap + ecart * (v.etape === 'choix' ? 0.2 : 0.08);
    return {
      x: pose.x - Math.cos(this.cap) * RECUL,
      y: pose.y - Math.sin(this.cap) * RECUL,
      cap: this.cap,
    };
  }
}
