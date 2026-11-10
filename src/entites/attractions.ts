import { TUILE } from '../config';
import type { Cible, Contexte, EntiteSimulee } from '../jeu/contexte';
import { G, type EntiteVue } from '../jeu/vue';
import { appliqueGravite, deplace, nouveauCorps, type Corps } from '../monde/physique';

/**
 * Les attractions de la scène, qu'on découvre de niveau en niveau (voir jeu/nouveautes.ts) :
 * - la grosse caisse couchée (`_`) : un trampoline. Qui tombe dessus rebondit haut : héros (plus haut encore en tenant le saut),
 *   ennemis, bonbonnes. On passe devant en marchant.
 * - la bonbonne de fumée (`:`) : au premier coup elle siffle, puis file comme une fusée du côté opposé au coup (droit en l'air sous
 *   une explosion) et explose au premier obstacle, mur, sol ou personnage.
 * Elles se combinent : une bonbonne qui retombe sur une grosse caisse repart en cloche.
 */

/** La vitesse du rebond (un saut de héros : 5,5) ; les bonbonnes, plus lourdes, rebondissent moins haut. */
const REBOND = 8.4;
const REBOND_OBJET = 5.2;
/** Combien de temps la peau de la grosse caisse reste enfoncée après un rebond (ticks, pour le dessin). */
const DUREE_ENFONCE = 10;

const corpsDe = (c: Cible): Corps | undefined => (c as Partial<{ corps: Corps }>).corps;

export class Tremplin implements EntiteSimulee {
  readonly id: number;
  readonly corps: Corps;
  fini = false;
  private enfonce = 0;

  constructor(ctx: Contexte, tx: number, ty: number) {
    this.id = ctx.prochainId();
    this.corps = nouveauCorps(tx * TUILE - 2, ty * TUILE + TUILE - 8, 20, 8);
  }

  get x(): number {
    return this.corps.x;
  }

  maj(ctx: Contexte): void {
    const t = this.corps;
    appliqueGravite(t);
    deplace(t, ctx.carte);
    if (t.y > ctx.carte.hauteur * TUILE + 32) this.fini = true;
    if (this.enfonce > 0) this.enfonce--;
    for (const cible of [...ctx.cibles('tous'), ...ctx.props()]) {
      const c = corpsDe(cible);
      // il tombe, et ses pieds entrent dans la peau
      if (!c || c.vy <= 0.5 || c.x + c.w <= t.x + 1 || c.x >= t.x + t.w - 1) continue;
      const pieds = c.y + c.h;
      if (pieds < t.y - 1 || pieds > t.y + t.h) continue;
      c.y = t.y - c.h;
      c.vy = -(cible.camp === 'tous' ? REBOND_OBJET : REBOND);
      this.enfonce = DUREE_ENFONCE;
      ctx.son('rebond', t.x, t.y);
      ctx.evenement({ k: 'impact', x: t.x + t.w / 2, y: t.y, c: '#f5ecd6' });
    }
  }

  vue(): EntiteVue {
    const c = this.corps;
    return {
      id: this.id,
      g: G.TREMPLIN,
      x: c.x + c.w / 2,
      y: c.y + c.h,
      gauche: false,
      clignote: false,
      e: this.enfonce > 0 ? 1 : 0,
      f: 0,
    };
  }
}

/** La mèche : le temps du sifflement avant le départ. */
const MECHE = 22;
const VITESSE = 5;
const RAYON = 46;
const DEGATS = 5;
/** Au-delà, elle explose en vol (elle a quitté la scène). */
const VOL_MAX = 150;
/** De côté, combien de temps elle file droit avant de retomber (ticks). */
const PORTEE = 64;

export class Bonbonne implements EntiteSimulee, Cible {
  readonly id: number;
  readonly camp = 'tous' as const;
  readonly corps: Corps;
  fini = false;
  /** 0 : posée ; > 0 : elle siffle (ticks restants) ; < 0 : en vol (-ticks de vol) */
  private meche = 0;
  /** le sens du vol : -1, 1, ou 0 (droit en l'air) */
  private sens = 0;

  constructor(ctx: Contexte, tx: number, ty: number) {
    this.id = ctx.prochainId();
    this.corps = nouveauCorps(tx * TUILE + 4, ty * TUILE + TUILE - 15, 8, 15);
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

  blesse(_degats: number, ctx: Contexte, dx: number, explosion: boolean): void {
    if (this.fini || this.meche !== 0) return;
    this.meche = MECHE;
    this.sens = explosion ? 0 : Math.sign(dx);
    ctx.son('alerte', this.corps.x, this.corps.y);
  }

  private explose(ctx: Contexte): void {
    this.fini = true;
    const c = this.corps;
    ctx.explosion(c.x + c.w / 2, c.y + c.h / 2, RAYON, DEGATS, 'tous');
  }

  maj(ctx: Contexte): void {
    const c = this.corps;
    if (this.meche >= 0) {
      // posée, ou qui siffle : elle tombe si on lui retire le sol
      appliqueGravite(c);
      deplace(c, ctx.carte);
      if (c.y > ctx.carte.hauteur * TUILE + 32) this.fini = true;
      if (this.meche > 0 && --this.meche === 0) {
        this.meche = -1;
        [c.vx, c.vy] = this.sens ? [this.sens * VITESSE, 0] : [0, -VITESSE * 1.3];
      }
      return;
    }
    // en vol : de côté, elle file droit au ras du sol (une vingtaine de tuiles), puis s'essouffle et retombe ; en l'air, elle
    // monte, ralentit et retombe ; le premier obstacle la fait exploser
    this.meche--;
    if (!this.sens) appliqueGravite(c, 0.12);
    else if (-this.meche > PORTEE || c.vy !== 0) appliqueGravite(c, 0.5);
    if (this.sens) c.vx = this.sens * VITESSE;
    deplace(c, ctx.carte);
    const touche = ctx
      .cibles('tous')
      .some((o) => o.vivant() && o.x < c.x + c.w && o.x + o.w > c.x && o.y < c.y + c.h && o.y + o.h > c.y);
    const dehors = c.x < -16 || c.x > ctx.carte.largeur * TUILE + 16 || c.y < -200;
    // (les premiers instants, elle ne s'arrête sur rien : elle décolle du sol, à côté de celui qui l'a allumée)
    if (c.mur || c.plafond || dehors || -this.meche > VOL_MAX || (-this.meche > 5 && (c.auSol || touche)))
      this.explose(ctx);
    else if (ctx.tick % 2 === 0)
      ctx.evenement({ k: 'impact', x: c.x + c.w / 2 - this.sens * 6, y: c.y + c.h, c: '#d8d0e0' });
  }

  vue(): EntiteVue | null {
    if (this.fini) return null;
    const c = this.corps;
    return {
      id: this.id,
      g: G.BONBONNE,
      x: c.x + c.w / 2,
      y: c.y + c.h,
      gauche: this.sens < 0,
      clignote: this.meche > 0 && Math.floor(this.meche / 3) % 2 === 1,
      // 0 : posée ; 1 : elle siffle ; 2 : en vol de côté ; 3 : en vol droit en l'air
      e: this.meche === 0 ? 0 : this.meche > 0 ? 1 : this.sens ? 2 : 3,
      f: Math.max(0, this.meche),
    };
  }
}
