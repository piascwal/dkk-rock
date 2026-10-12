import { TUILE } from '../config';
import type { Contexte, EntiteSimulee } from '../jeu/contexte';
import { G, type EntiteVue, type Genre } from '../jeu/vue';
import { appliqueGravite, deplace, nouveauCorps, type Corps } from '../monde/physique';
import type { Tuile } from '../monde/tuiles';

export type SorteObjet = 'cage' | 'drapeau' | 'van' | 'arme' | 'soin';

const GENRES: Record<SorteObjet, Genre> = {
  cage: G.CAGE,
  drapeau: G.DRAPEAU,
  van: G.VAN,
  arme: G.ARME,
  soin: G.SOIN,
};

const TAILLES: Record<SorteObjet, [number, number]> = {
  cage: [16, 18],
  drapeau: [10, 32],
  van: [44, 24],
  arme: [12, 12],
  soin: [10, 10],
};

/**
 * Ce qui attend les héros dans le niveau : cages, drapeaux, le van, armes et
 * médiators. Les objets sont passifs : la partie regarde qui les touche.
 */
export class Objet implements EntiteSimulee {
  readonly id: number;
  readonly corps: Corps;
  fini = false;
  /** cage ouverte, drapeau levé */
  active = false;
  private anim = 0;

  constructor(
    ctx: Contexte,
    readonly sorte: SorteObjet,
    /** coin haut gauche de la case du repère */
    tx: number,
    ty: number,
    /** index de l'arme, membre dans la cage... */
    public variante = 0,
  ) {
    this.id = ctx.prochainId();
    const [w, h] = TAILLES[sorte];
    this.corps = nouveauCorps(tx + (TUILE - w) / 2, ty + TUILE - h, w, h);
  }

  maj(ctx: Contexte): void {
    this.anim++;
    // tout retombe si on détruit le sol dessous (sauf le van, garé pour de bon)
    if (this.sorte !== 'van') {
      appliqueGravite(this.corps);
      deplace(this.corps, ctx.carte);
      if (this.corps.y > ctx.carte.hauteur * TUILE + 32) this.fini = true;
    }
  }

  vue(): EntiteVue {
    const c = this.corps;
    return {
      id: this.id,
      g: GENRES[this.sorte],
      x: c.x + c.w / 2,
      y: c.y + c.h,
      gauche: false,
      clignote: false,
      e: this.active ? 1 : 0,
      f: this.sorte === 'arme' || this.sorte === 'cage' ? this.variante : this.anim & 255,
    };
  }
}

/** Une tuile qui tombe (caisse, sable, neige) : elle écrase ce qu'elle rencontre et se repose. */
export class BlocTombant implements EntiteSimulee {
  readonly id: number;
  readonly corps: Corps;
  fini = false;

  constructor(
    ctx: Contexte,
    readonly tuile: Tuile,
    tx: number,
    ty: number,
  ) {
    this.id = ctx.prochainId();
    this.corps = nouveauCorps(tx * TUILE + 1, ty * TUILE, TUILE - 2, TUILE);
  }

  maj(ctx: Contexte): void {
    const c = this.corps;
    appliqueGravite(c);
    deplace(c, ctx.carte);
    for (const cible of ctx.cibles('tous')) {
      if (c.vy < 1 || cible.x > c.x + c.w || cible.x + cible.w < c.x) continue;
      if (cible.y < c.y + c.h && cible.y + cible.h > c.y + c.h - 6) cible.blesse(2, ctx, 0, true);
    }
    if (c.auSol) {
      const tx = Math.floor((c.x + c.w / 2) / TUILE);
      const ty = Math.floor((c.y + c.h / 2) / TUILE);
      if (ctx.carte.get(tx, ty) === 0) ctx.carte.pose(tx, ty, this.tuile);
      ctx.son('chute', c.x, c.y);
      this.fini = true;
    }
    if (c.y > ctx.carte.hauteur * TUILE + 32) this.fini = true;
  }

  vue(): EntiteVue {
    const c = this.corps;
    return {
      id: this.id,
      g: G.BLOC,
      x: c.x + c.w / 2,
      y: c.y + c.h,
      gauche: false,
      clignote: false,
      e: 0,
      f: this.tuile,
    };
  }
}
