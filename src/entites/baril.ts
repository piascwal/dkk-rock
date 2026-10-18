import { TUILE } from '../config';
import type { Cible, Contexte, EntiteSimulee } from '../jeu/contexte';
import { G, type EntiteVue } from '../jeu/vue';
import { appliqueGravite, deplace, nouveauCorps, type Corps } from '../monde/physique';

/** Le baril explosif : deux secondes de clignotement après le premier coup, puis il explose. */
export const DUREE_MECHE = 120;
/** Le rayon de l'explosion, en pixels du monde : un cinquième de plus que celui d'un caisson de basses (40 px). */
export const RAYON_BARIL = 48;
/** Les dégâts de l'explosion : ceux d'un caisson de basses. */
const DEGATS_BARIL = 5;

/**
 * Un baril rouge posé au sol, dans le garage et la ville. Il s'allume au premier tir qui le touche (ceux des héros comme
 * ceux des ennemis) ou au premier souffle d'une explosion ; deux secondes après, il explose et casse ce qui se casse
 * autour de lui. Personne ne le vise : il ne compte dans aucun camp (voir `Contexte.props`).
 */
export class Baril implements EntiteSimulee, Cible {
  readonly id: number;
  readonly camp = 'tous' as const;
  readonly corps: Corps;
  fini = false;
  /** ticks restants avant l'explosion ; 0 tant que le baril n'a pas été touché */
  private meche = 0;

  constructor(ctx: Contexte, tx: number, ty: number) {
    this.id = ctx.prochainId();
    this.corps = nouveauCorps(tx * TUILE + 1, ty * TUILE + TUILE - 16, 14, 16);
  }

  get x(): number {
    return this.corps.x;
  }
  get y(): number {
    return this.corps.y;
  }
  get w(): number {
    return this.corps.w;
  }
  get h(): number {
    return this.corps.h;
  }

  vivant(): boolean {
    return !this.fini;
  }

  blesse(_degats: number, ctx: Contexte): void {
    if (this.fini || this.meche > 0) return;
    this.meche = DUREE_MECHE;
    ctx.son('rebond', this.corps.x, this.corps.y);
  }

  maj(ctx: Contexte): void {
    appliqueGravite(this.corps);
    deplace(this.corps, ctx.carte);
    if (this.meche === 0) return;
    if (--this.meche > 0) return;
    this.fini = true;
    ctx.explosion(
      this.corps.x + this.corps.w / 2,
      this.corps.y + this.corps.h / 2,
      RAYON_BARIL,
      DEGATS_BARIL,
      'tous',
    );
  }

  vue(): EntiteVue | null {
    if (this.fini) return null;
    const c = this.corps;
    return {
      id: this.id,
      g: G.BARIL,
      x: c.x + c.w / 2,
      y: c.y + c.h,
      gauche: false,
      // un clignotement rapide pendant la mèche : il passe au blanc une fois sur deux
      clignote: this.meche > 0 && Math.floor(this.meche / 6) % 2 === 1,
      e: 0,
      f: 0,
    };
  }
}
