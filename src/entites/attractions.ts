import { TUILE } from '../config';
import type { Cible, Contexte, EntiteSimulee } from '../jeu/contexte';
import { G, type EntiteVue } from '../jeu/vue';
import { appliqueGravite, deplace, nouveauCorps, type Corps } from '../monde/physique';

/**
 * Les attractions de la scène, qu'on découvre de niveau en niveau (voir jeu/nouveautes.ts) :
 * - la grosse caisse couchée (`_`) : un trampoline. Qui tombe dessus rebondit haut : héros (plus haut encore en tenant le saut),
 *   ennemis, bonbonnes. On passe devant en marchant.
 * - la bonbonne de fumée (`:`) : le premier coup la couche tout de suite ; elle clignote (blanc, de plus en plus vite), puis file
 *   comme une fusée dans le sens du coup et explose au premier obstacle, mur ou personnage.
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
    this.rebondit(ctx, ctx.cibles('tous'));
    this.rebondit(ctx, ctx.props());
  }

  /** Ce qui tombe sur la peau repart en l'air (sans rien allouer : appelé à chaque pas). */
  private rebondit(ctx: Contexte, cibles: readonly Cible[]): void {
    const t = this.corps;
    for (const cible of cibles) {
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

/** Combien de temps elle clignote, couchée, avant de partir (ticks : un peu plus d'une seconde) ; elle accélère. */
const MECHE = 78;
const VITESSE = 5;
const RAYON = 46;
const DEGATS = 5;
/** Au-delà, elle explose en vol (elle a quitté la scène). */
const VOL_MAX = 150;
/** Combien de temps elle file droit avant de retomber (ticks). */
const PORTEE = 64;

export class Bonbonne implements EntiteSimulee, Cible {
  readonly id: number;
  readonly camp = 'tous' as const;
  readonly corps: Corps;
  fini = false;
  /** 0 : debout ; > 0 : couchée, elle clignote (ticks restants) ; < 0 : en vol (-ticks de vol) */
  private meche = 0;
  /** le sens où elle bascule, puis où elle file : -1 ou 1 */
  private sens: 1 | -1 = 1;

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

  /** Le premier coup la couche tout de suite, dans le sens du coup (ou du souffle) ; puis elle clignote, puis elle part. */
  blesse(_degats: number, ctx: Contexte, dx: number): void {
    if (this.fini || this.meche !== 0) return;
    this.sens = dx < 0 ? -1 : 1;
    this.meche = MECHE;
    const c = this.corps;
    // couchée : large et basse, les pieds au même sol ; un petit bond dans le sens du coup
    [c.x, c.y, c.w, c.h] = [c.x - 3.5, c.y + c.h - 8, 15, 8];
    [c.vx, c.vy] = [this.sens * 0.9, -1.4];
    ctx.son('rebond', c.x, c.y);
  }

  private explose(ctx: Contexte): void {
    this.fini = true;
    const c = this.corps;
    ctx.explosion(c.x + c.w / 2, c.y + c.h / 2, RAYON, DEGATS, 'tous');
  }

  maj(ctx: Contexte): void {
    const c = this.corps;
    if (this.meche >= 0) {
      // debout, ou couchée : elle tombe si on lui retire le sol, et glisse à peine
      appliqueGravite(c);
      if (c.auSol) c.vx *= 0.7;
      deplace(c, ctx.carte);
      if (c.y > ctx.carte.hauteur * TUILE + 32) this.fini = true;
      if (this.meche > 0 && --this.meche === 0) {
        this.meche = -1;
        [c.vx, c.vy] = [this.sens * VITESSE, 0];
      }
      return;
    }
    // en vol : elle file droit, au ras du sol, puis s'essouffle et retombe ; le premier obstacle la fait exploser
    this.meche--;
    if (-this.meche > PORTEE || c.vy !== 0) appliqueGravite(c, 0.5);
    c.vx = this.sens * VITESSE;
    deplace(c, ctx.carte);
    const touche = ctx
      .cibles('tous')
      .some((o) => o.vivant() && o.x < c.x + c.w && o.x + o.w > c.x && o.y < c.y + c.h && o.y + o.h > c.y);
    const dehors = c.x < -16 || c.x > ctx.carte.largeur * TUILE + 16;
    // (les premiers instants, elle ne s'arrête sur rien : elle décolle, à côté de celui qui l'a allumée)
    if (c.mur || dehors || -this.meche > VOL_MAX || (-this.meche > 5 && (c.auSol || touche)))
      this.explose(ctx);
    else if (ctx.tick % 4 === 0)
      ctx.evenement({ k: 'impact', x: c.x + c.w / 2 - this.sens * 8, y: c.y + c.h / 2, c: '#d8d0e0' });
  }

  vue(): EntiteVue | null {
    if (this.fini) return null;
    const c = this.corps;
    // elle clignote (blanc) de plus en plus vite pendant qu'elle est couchée
    const ecoule = MECHE - this.meche;
    return {
      id: this.id,
      g: G.BONBONNE,
      x: c.x + c.w / 2,
      y: c.y + c.h,
      gauche: this.sens < 0,
      clignote: this.meche > 0 && Math.floor(ecoule / (ecoule < MECHE / 2 ? 8 : 4)) % 2 === 1,
      // 0 : debout ; 1 : couchée ; 2 : en vol
      e: this.meche === 0 ? 0 : this.meche > 0 ? 1 : 2,
      f: 0,
    };
  }
}
