import { TUILE } from '../../config';
import type { Camp, Cible, Contexte, EntiteSimulee } from '../../jeu/contexte';
import type { EntiteVue, Genre } from '../../jeu/vue';
import { nouveauCorps, type Corps } from '../../monde/physique';

/**
 * Socle commun des boss : une barre de vie, un réveil quand un héros approche,
 * et un rythme : les boss de ce monde attaquent sur le temps (BPM).
 */
export abstract class Boss implements Cible, EntiteSimulee {
  readonly camp: Camp = 'ennemis';
  readonly id: number;
  readonly corps: Corps;
  fini = false;
  pv: number;
  eveille = false;
  dir: 1 | -1 = -1;
  protected flash = 0;
  protected anim = 0;
  /** état d'animation pour la vue */
  protected pose = 0;

  constructor(
    ctx: Contexte,
    readonly genre: Genre,
    readonly pvMax: number,
    x: number,
    y: number,
    w: number,
    h: number,
    readonly points: number,
    /** distance de réveil */
    private readonly reveil = 200,
  ) {
    this.id = ctx.prochainId();
    this.pv = pvMax;
    this.corps = nouveauCorps(x + (TUILE - w) / 2, y + TUILE - h, w, h);
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
  get cx(): number {
    return this.corps.x + this.corps.w / 2;
  }
  get cy(): number {
    return this.corps.y + this.corps.h / 2;
  }
  get ratio(): number {
    return Math.max(0, this.pv / this.pvMax);
  }

  vivant(): boolean {
    return !this.fini;
  }

  /** facteur de dégâts (un boss protégé encaisse moins) */
  protected resistance(): number {
    return 1;
  }

  blesse(degats: number, ctx: Contexte): void {
    if (this.fini || !this.eveille) return;
    this.pv -= degats * this.resistance();
    this.flash = 5;
    if (this.pv <= 0) {
      this.fini = true;
      this.meurt(ctx);
    }
  }

  protected abstract meurt(ctx: Contexte): void;
  protected abstract agit(ctx: Contexte, cible: Cible): void;

  /** Le héros vivant le plus proche. */
  protected plusProche(ctx: Contexte): Cible | null {
    let m: Cible | null = null;
    let d = Infinity;
    for (const h of ctx.heros()) {
      const dh = Math.hypot(h.x - this.cx, h.y - this.cy);
      if (dh < d) {
        d = dh;
        m = h;
      }
    }
    return m;
  }

  maj(ctx: Contexte): void {
    this.anim++;
    if (this.flash > 0) this.flash--;
    const cible = this.plusProche(ctx);
    if (!this.eveille) {
      if (cible && Math.abs(cible.x - this.cx) < this.reveil && Math.abs(cible.y - this.cy) < 120) {
        this.eveille = true;
        this.reveille(ctx);
      }
      return;
    }
    if (cible) this.agit(ctx, cible);
    for (const h of ctx.heros()) {
      const c = this.corps;
      if (h.x < c.x + c.w && h.x + h.w > c.x && h.y < c.y + c.h && h.y + h.h > c.y)
        h.blesse(1, ctx, h.x > this.cx ? 1 : -1, false);
    }
  }

  protected reveille(_ctx: Contexte): void {}

  vue(): EntiteVue {
    const c = this.corps;
    return {
      id: this.id,
      g: this.genre,
      x: c.x + c.w / 2,
      y: c.y + c.h,
      gauche: this.dir < 0,
      clignote: this.flash > 0,
      e: this.pose,
      f: this.anim & 255,
    };
  }
}
