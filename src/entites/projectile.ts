import { CHUTE_MAX, GRAVITE, TUILE } from '../config';
import type { Camp, Cible, Contexte, EntiteSimulee } from '../jeu/contexte';
import type { EntiteVue } from '../jeu/vue';
import type { DefProjectile } from './projectiles-defs';

/** Un tir en vol : son comportement découle entièrement de sa définition. */
export class Projectile implements EntiteSimulee {
  readonly id: number;
  fini = false;
  age = 0;
  private rebonds: number;
  private colle = false;
  private readonly touches = new Map<number, number>();

  constructor(
    ctx: Contexte,
    readonly def: DefProjectile,
    readonly camp: Camp,
    /** centre */
    public x: number,
    public y: number,
    public vx: number,
    public vy: number,
  ) {
    this.id = ctx.prochainId();
    this.rebonds = def.rebonds ?? 0;
  }

  get boite(): { x: number; y: number; w: number; h: number } {
    const t = this.def.taille;
    return { x: this.x - t / 2, y: this.y - t / 2, w: t, h: t };
  }

  maj(ctx: Contexte): void {
    if (++this.age >= this.def.duree) return this.termine(ctx);
    if (this.def.guide) this.guide(ctx);
    if (!this.colle) {
      this.vy = Math.min(CHUTE_MAX, this.vy + GRAVITE * this.def.gravite);
      const pas = Math.max(1, Math.ceil(Math.max(Math.abs(this.vx), Math.abs(this.vy)) / 5));
      for (let i = 0; i < pas && !this.fini; i++) {
        this.avance(ctx, this.vx / pas, 0);
        if (!this.fini) this.avance(ctx, 0, this.vy / pas);
      }
    }
    if (this.y > ctx.carte.hauteur * TUILE + 80) this.fini = true;
    const prox = this.def.proximite;
    if (prox && !this.fini) {
      const proche = ctx
        .cibles(this.camp === 'heros' ? 'ennemis' : 'heros')
        .some(
          (c) =>
            Math.abs(c.x + c.w / 2 - this.x) < prox + c.w / 2 &&
            Math.abs(c.y + c.h / 2 - this.y) < prox + c.h / 2,
        );
      if (proche) this.termine(ctx);
    }
  }

  /** Téléguidage : le tir tourne, sans changer de vitesse, vers l'ennemi visible le plus proche (à moins de 150 px). */
  private guide(ctx: Contexte): void {
    let cible: Cible | null = null;
    let dMin = 150 * 150;
    for (const c of ctx.cibles(this.camp === 'heros' ? 'ennemis' : 'heros')) {
      if (!c.vivant() || !ctx.visible(c.x + c.w / 2, c.y + c.h / 2)) continue;
      const d = (c.x + c.w / 2 - this.x) ** 2 + (c.y + c.h / 2 - this.y) ** 2;
      if (d < dMin) {
        dMin = d;
        cible = c;
      }
    }
    if (!cible) return;
    const vitesse = Math.hypot(this.vx, this.vy) || this.def.vitesse;
    const voulu = Math.atan2(cible.y + cible.h / 2 - this.y, cible.x + cible.w / 2 - this.x);
    const actuel = Math.atan2(this.vy, this.vx);
    // le plus court chemin entre deux angles, borné par le virage maximal
    let ecart = ((voulu - actuel + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    ecart = Math.max(-this.def.guide!, Math.min(this.def.guide!, ecart));
    this.vx = Math.cos(actuel + ecart) * vitesse;
    this.vy = Math.sin(actuel + ecart) * vitesse;
  }

  /** Avance d'un petit pas sur un seul axe et règle le choc contre une tuile. */
  private avance(ctx: Contexte, dx: number, dy: number): void {
    const ax = this.x;
    const ay = this.y;
    this.x += dx;
    this.y += dy;
    const tx = Math.floor(this.x / TUILE);
    const ty = Math.floor(this.y / TUILE);
    if (!ctx.carte.solide(tx, ty) && !(this.camp === 'ennemis' && this.bloqueParPlanche(ctx, tx, ty))) return;
    const d = this.def;
    const detruite = ctx.carte.endommage(tx, ty, d.degatsTuile) !== null;
    // une onde qui creuse passe à travers ce qu'elle détruit
    if (d.creuse && detruite) return;
    this.x = ax;
    this.y = ay;
    if (d.colle) {
      this.colle = true;
      this.vx = 0;
      this.vy = 0;
      ctx.son('colle', this.x, this.y);
    } else if (d.roule && dy > 0) {
      this.vy = 0;
      if (this.vx === 0) this.vx = d.vitesse;
    } else if (d.roule && dx !== 0) {
      this.vx = -this.vx;
    } else if (this.rebonds > 0) {
      this.rebonds--;
      if (dx !== 0) this.vx = -this.vx;
      else this.vy = -this.vy * 0.8;
      ctx.son('rebond', this.x, this.y);
    } else {
      this.termine(ctx);
    }
  }

  /** Un tir ennemi ne traverse ni planche ni piton (mais passe devant une échelle) : il reste sur son étage. */
  private bloqueParPlanche(ctx: Contexte, tx: number, ty: number): boolean {
    const p = ctx.carte.props(tx, ty);
    return p.solide && !p.echelle && p.traversable;
  }

  /** La partie signale un contact avec une cible du camp adverse. */
  touche(ctx: Contexte, cible: Cible): void {
    if (this.fini || this.def.proximite) return;
    const d = this.def;
    if (d.perce) {
      const dernier = this.touches.get(cible.id);
      if (dernier !== undefined && (d.retouche === undefined || ctx.tick - dernier < d.retouche)) return;
      this.touches.set(cible.id, ctx.tick);
    }
    const dx = Math.sign(this.vx) || 0;
    if (d.degats > 0) cible.blesse(d.degats, ctx, dx, false);
    if (d.effet && cible.subitEffet) {
      cible.subitEffet(d.effet);
      ctx.texte(this.x, this.y - 12, d.effet === 'hypnose' ? 'HYPNOSE !' : 'FLASH !', '#ff4fd8');
    }
    if (d.recul) {
      const c = cible as Partial<{ vx: number; vy: number }>;
      if (typeof c.vx === 'number') c.vx += dx * d.recul;
    }
    ctx.evenement({ k: 'impact', x: this.x, y: this.y, c: this.camp === 'heros' ? '#ffd23f' : '#ff4fd8' });
    if (!d.perce) this.termine(ctx);
  }

  termine(ctx: Contexte): void {
    if (this.fini) return;
    this.fini = true;
    const d = this.def;
    if (d.explosion) ctx.explosion(this.x, this.y, d.explosion.rayon, d.explosion.degats, this.camp);
    else ctx.evenement({ k: 'impact', x: this.x, y: this.y, c: '#ffffff' });
    if (d.laisse) ctx.ajoute(new Projectile(ctx, d.laisse, this.camp, this.x, this.y - 8, 0, 0));
  }

  vue(): EntiteVue {
    const reste = this.def.duree - this.age;
    return {
      id: this.id,
      g: this.def.genre,
      x: this.x,
      y: this.y + this.def.taille / 2,
      gauche: this.vx < 0,
      clignote: !!this.def.explosion && reste < 40 && reste % 8 < 4,
      e: this.colle ? 1 : 0,
      f: this.age & 255,
    };
  }
}
