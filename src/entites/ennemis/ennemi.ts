import { TUILE } from '../../config';
import { appliqueGravite, deplace, ligneDeVue, nouveauCorps, type Corps } from '../../monde/physique';
import type { Camp, Cible, Contexte, EntiteSimulee } from '../../jeu/contexte';
import { ANIM, type EntiteVue, type Genre } from '../../jeu/vue';
import type { DefEnnemi } from './definitions';

export type EtatEnnemi = 'patrouille' | 'alerte' | 'attaque' | 'perdu';

/**
 * Un ennemi ordinaire : il patrouille, repère un héros (« ! »), l'attaque à sa
 * façon (voir comportements.ts), puis le perd de vue (« ? ») et retourne à sa
 * ronde. Tout ce qui le distingue des autres est dans sa définition.
 */
export class Ennemi implements Cible, EntiteSimulee {
  readonly camp: Camp = 'ennemis';
  readonly id: number;
  /** l'apparence tirée au sort (voir DefEnnemi.genres) */
  readonly genre: Genre;
  readonly corps: Corps;
  fini = false;
  pv: number;
  dir: 1 | -1 = -1;
  etat: EtatEnnemi = 'patrouille';
  minuteur = 0;
  recharge = 30;
  cible: Cible | null = null;
  /** dernier tick où la cible a été vue */
  vuA = 0;
  anim = 0;
  /** mémoire libre pour le comportement (rafale en cours, fuite...) */
  memoire = 0;
  private flash = 0;

  constructor(
    ctx: Contexte,
    readonly def: DefEnnemi,
    x: number,
    y: number,
  ) {
    this.id = ctx.prochainId();
    this.genre = def.genres && def.genres.length > 1 ? ctx.rng.choix(def.genres) : def.genre;
    this.pv = def.pv;
    this.corps = nouveauCorps(x + (TUILE - def.w) / 2, y + TUILE - def.h, def.w, def.h);
    this.dir = ctx.rng.suivant() < 0.5 ? -1 : 1;
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
  get vx(): number {
    return this.corps.vx;
  }
  set vx(v: number) {
    this.corps.vx = v;
  }
  get cx(): number {
    return this.corps.x + this.corps.w / 2;
  }
  get cy(): number {
    return this.corps.y + this.corps.h / 2;
  }

  vivant(): boolean {
    return !this.fini;
  }

  blesse(degats: number, ctx: Contexte, dx: number, explosion: boolean): void {
    if (this.fini) return;
    // le bouclier arrête ce qui vient de face, pas les explosions
    if (this.def.bouclier && !explosion && dx === -this.dir) {
      ctx.evenement({ k: 'impact', x: this.cx + this.dir * 6, y: this.cy, c: '#9fd8f0' });
      ctx.son('bouclier', this.cx, this.cy);
      return;
    }
    this.pv -= degats;
    this.flash = 4;
    if (explosion) this.corps.vy = -3;
    if (this.etat === 'patrouille' && dx) {
      this.dir = dx > 0 ? -1 : 1;
      this.passeEnAlerte(ctx);
    }
    if (this.pv <= 0) this.meurt(ctx);
  }

  meurt(ctx: Contexte): void {
    if (this.fini) return;
    this.fini = true;
    ctx.ennemiVaincu(this.cx, this.cy, this.def.points);
    if (this.def.explose)
      ctx.explosion(this.cx, this.cy, this.def.explose.rayon, this.def.explose.degats, 'tous');
  }

  passeEnAlerte(ctx: Contexte): void {
    if (this.etat === 'attaque' || this.etat === 'alerte') return;
    this.etat = 'alerte';
    this.minuteur = 30;
    ctx.son('alerte', this.cx, this.cy);
    if (this.def.cris.length && ctx.rng.suivant() < 0.5)
      ctx.texte(this.cx, this.corps.y - 14, ctx.rng.choix(this.def.cris), '#ff4fd8');
  }

  /** Cherche un héros visible : devant soi en patrouille, partout une fois en alerte. */
  private percoit(ctx: Contexte): void {
    const def = this.def;
    let meilleure: Cible | null = null;
    let dMin = Infinity;
    for (const h of ctx.heros()) {
      const dx = h.x + h.w / 2 - this.cx;
      const dy = h.y + h.h / 2 - this.cy;
      if (Math.abs(dx) > def.vision || Math.abs(dy) > def.visionVerticale) continue;
      if (this.etat === 'patrouille' && Math.sign(dx) !== this.dir && Math.abs(dx) > 24) continue;
      if (!ligneDeVue(ctx.carte, this.cx, this.corps.y + 4, h.x + h.w / 2, h.y + 4)) continue;
      const d = Math.hypot(dx, dy);
      if (d < dMin) {
        dMin = d;
        meilleure = h;
      }
    }
    if (meilleure) {
      this.cible = meilleure;
      this.vuA = ctx.tick;
      if (this.etat === 'patrouille' || this.etat === 'perdu') this.passeEnAlerte(ctx);
    }
  }

  maj(ctx: Contexte): void {
    this.anim++;
    if (this.flash > 0) this.flash--;
    if (this.recharge > 0) this.recharge--;
    if ((ctx.tick + this.id) % 8 === 0) this.percoit(ctx);
    if (this.cible && !this.cible.vivant()) this.cible = null;

    switch (this.etat) {
      case 'alerte':
        this.corps.vx = 0;
        if (this.cible) this.dir = this.cible.x > this.corps.x ? 1 : -1;
        if (--this.minuteur <= 0) this.etat = 'attaque';
        break;
      case 'attaque':
        if (!this.cible || ctx.tick - this.vuA > 180) {
          this.etat = 'perdu';
          this.minuteur = 60;
          this.cible = null;
          break;
        }
        this.def.comportement(this, ctx, this.cible);
        break;
      case 'perdu':
        this.corps.vx = 0;
        if (--this.minuteur <= 0) this.etat = 'patrouille';
        break;
      default:
        this.patrouille(ctx);
    }

    if (!this.def.vole) appliqueGravite(this.corps);
    deplace(this.corps, ctx.carte);
    if (this.corps.y > ctx.carte.hauteur * TUILE + 32) this.fini = true;
    this.contact(ctx);
  }

  /** Marche, demi-tour au bord du vide ou contre un mur, petites pauses. */
  patrouille(ctx: Contexte): void {
    const c = this.corps;
    if (this.def.vole) {
      c.vx = this.dir * this.def.vitesse * 0.5;
      c.vy = Math.sin(this.anim / 20) * 0.3;
    } else if (this.memoire > 0) {
      this.memoire--;
      c.vx = 0;
    } else {
      c.vx = this.dir * this.def.vitesse * 0.5;
      if (ctx.rng.suivant() < 0.004) this.memoire = 60;
    }
    if (c.mur || (c.auSol && !this.solDevant(ctx)) || (this.def.vole && this.murDevant(ctx)))
      this.dir = -this.dir as 1 | -1;
  }

  solDevant(ctx: Contexte): boolean {
    const px = this.dir > 0 ? this.corps.x + this.corps.w + 2 : this.corps.x - 2;
    return ctx.carte.props(Math.floor(px / TUILE), Math.floor((this.corps.y + this.corps.h + 2) / TUILE))
      .solide;
  }

  murDevant(ctx: Contexte): boolean {
    const px = this.dir > 0 ? this.corps.x + this.corps.w + 4 : this.corps.x - 4;
    return ctx.carte.solideEnPixel(px, this.cy);
  }

  /** Va vers une position horizontale sans tomber dans le vide. */
  marcheVers(ctx: Contexte, x: number, vitesse: number): void {
    const dx = x - this.cx;
    if (Math.abs(dx) < 4) {
      this.corps.vx = 0;
      return;
    }
    this.dir = dx > 0 ? 1 : -1;
    this.corps.vx = this.corps.auSol && !this.solDevant(ctx) ? 0 : this.dir * vitesse;
  }

  private contact(ctx: Contexte): void {
    if (!this.def.contact) return;
    for (const h of ctx.heros()) {
      if (
        h.x < this.corps.x + this.corps.w &&
        h.x + h.w > this.corps.x &&
        h.y < this.corps.y + this.corps.h &&
        h.y + h.h > this.corps.y
      )
        h.blesse(this.def.contact, ctx, h.x > this.corps.x ? 1 : -1, false);
    }
  }

  vue(): EntiteVue {
    const e =
      this.etat === 'alerte'
        ? ANIM.ALERTE
        : this.etat === 'perdu'
          ? ANIM.PERDU
          : Math.abs(this.corps.vx) > 0.2
            ? ANIM.COURT
            : ANIM.DEBOUT;
    return {
      id: this.id,
      g: this.genre,
      x: this.cx,
      y: this.corps.y + this.corps.h,
      gauche: this.dir < 0,
      clignote: this.flash > 0,
      e:
        this.etat === 'attaque' && this.recharge > 0 && this.def.cadence - this.recharge < 8
          ? ANIM.ATTAQUE
          : e,
      f: this.anim & 255,
    };
  }
}
