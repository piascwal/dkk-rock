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

/** Les corps des barils encore là : ils sont pleins (voir `Carte.obstacles`), héros et ennemis s'y heurtent et montent dessus. */
export const corpsDesBarils = (entites: readonly EntiteSimulee[]): Corps[] =>
  entites.filter((e): e is Baril => e instanceof Baril && !e.fini).map((b) => b.corps);

/**
 * Un baril rouge posé au sol, dans le garage et la ville. Il s'allume au premier tir qui le touche (ceux des héros comme
 * ceux des ennemis) ou au premier souffle d'une explosion ; deux secondes après, il explose et casse ce qui se casse
 * autour de lui. Personne ne le vise : il ne compte dans aucun camp (voir `Contexte.props`). Il est plein : on bute contre lui,
 * on peut monter dessus.
 */
export class Baril implements EntiteSimulee, Cible {
  readonly id: number;
  readonly camp = 'tous' as const;
  readonly corps: Corps;
  fini = false;
  /** ticks restants avant l'explosion ; 0 tant que le baril n'a pas été touché */
  private meche = 0;
  /** un autre baril est posé dessus : on n'en voit plus le dessus (sa vue est celle du baril « couvert ») */
  private couvert = false;

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
    this.couvert = ctx.props().some((o) => o instanceof Baril && o !== this && !o.fini && this.porte(o));
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

  /** `o` repose-t-il sur ce baril ? (son pied touche le haut de celui-ci, et ils se recouvrent en largeur) */
  private porte(o: Baril): boolean {
    const [a, b] = [this.corps, o.corps];
    return Math.abs(b.y + b.h - a.y) <= 1 && b.x < a.x + a.w && b.x + b.w > a.x;
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
      // la planche a deux lignes : le dessus visible (0), ou recouvert par le baril empilé dessus (1)
      e: this.couvert ? 1 : 0,
      f: 0,
    };
  }
}
