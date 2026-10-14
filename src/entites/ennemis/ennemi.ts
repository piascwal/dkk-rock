import { TUILE } from '../../config';
import { appliqueGravite, deplace, ligneDeVue, nouveauCorps, type Corps } from '../../monde/physique';
import type { Camp, Cible, Contexte, EntiteSimulee } from '../../jeu/contexte';
import { ANIM, type EntiteVue } from '../../jeu/vue';
import type { DefEnnemi } from './definitions';

/** Combien de temps (en ticks) un ennemi vaincu reste étendu sur la scène avant de s'effacer. */
const DUREE_A_TERRE = 300;

export type EtatEnnemi = 'patrouille' | 'alerte' | 'attaque' | 'perdu';

/**
 * Un ennemi ordinaire : il patrouille, repère un héros (« ! »), l'attaque à sa
 * façon (voir comportements.ts), puis le perd de vue (« ? ») et retourne à sa
 * ronde. Tout ce qui le distingue des autres est dans sa définition.
 */
export class Ennemi implements Cible, EntiteSimulee {
  readonly camp: Camp = 'ennemis';
  readonly id: number;
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
  /** délai avant un nouveau demi-tour : évite de pivoter à chaque pas contre un obstacle */
  virage = 0;
  private flash = 0;
  /** ticks restants à terre une fois vaincu (0 : debout) ; il ne gêne ni ne se bat plus */
  private aTerre = 0;
  /** le côté où le dernier coup l'a projeté */
  private projete: 1 | -1 = 1;

  constructor(
    ctx: Contexte,
    readonly def: DefEnnemi,
    x: number,
    y: number,
  ) {
    this.id = ctx.prochainId();
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
    return !this.fini && this.aTerre === 0;
  }

  blesse(degats: number, ctx: Contexte, dx: number, explosion: boolean): void {
    if (this.fini || this.aTerre > 0) return;
    if (dx) this.projete = dx > 0 ? 1 : -1;
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
    if (this.fini || this.aTerre > 0) return;
    ctx.ennemiVaincu(this.cx, this.cy, this.def.points);
    if (this.def.explose) {
      this.fini = true;
      ctx.explosion(this.cx, this.cy, this.def.explose.rayon, this.def.explose.degats, 'tous');
      return;
    }
    // pas de sang : il est mis au tapis, un petit saut en arrière, puis il reste là, estompé
    this.aTerre = DUREE_A_TERRE;
    this.etat = 'perdu';
    this.cible = null;
    this.corps.vx = this.projete * 1.4;
    this.corps.vy = -2.2;
  }

  /** Étendu : il retombe et glisse un peu, puis s'efface. */
  private estALaTerre(ctx: Contexte): void {
    this.anim++;
    const c = this.corps;
    if (c.auSol) c.vx *= 0.8;
    appliqueGravite(c);
    deplace(c, ctx.carte);
    if (--this.aTerre <= 0 || c.y > ctx.carte.hauteur * TUILE + 32) this.fini = true;
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
    if (this.aTerre > 0) {
      this.estALaTerre(ctx);
      return;
    }
    this.anim++;
    if (this.flash > 0) this.flash--;
    if (this.recharge > 0) this.recharge--;
    if ((ctx.tick + this.id) % 8 === 0) this.percoit(ctx);
    if (this.cible && !this.cible.vivant()) this.cible = null;

    switch (this.etat) {
      case 'alerte':
        this.corps.vx = 0;
        if (this.cible) this.faceA(this.cible);
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

  /**
   * Marche, demi-tour au bord du vide ou contre un mur, petites pauses. Le demi-tour se décide avant de
   * choisir la vitesse, sur la géométrie d'ici et maintenant, et pas plus d'une fois toutes les 30 images.
   */
  patrouille(ctx: Contexte): void {
    const c = this.corps;
    if (this.virage > 0) this.virage--;
    const bloque = this.murDevant(ctx) || (!this.def.vole && c.auSol && !this.solDevant(ctx));
    if (bloque && this.virage === 0) {
      this.dir = -this.dir as 1 | -1;
      this.virage = 30;
    }
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
  }

  solDevant(ctx: Contexte): boolean {
    const px = this.dir > 0 ? this.corps.x + this.corps.w + 2 : this.corps.x - 2;
    return ctx.carte.props(Math.floor(px / TUILE), Math.floor((this.corps.y + this.corps.h + 2) / TUILE))
      .solide;
  }

  /** Un mur plein juste devant, au niveau des pieds, du torse ou de la tête (un ennemi peut être grand). */
  murDevant(ctx: Contexte): boolean {
    const px = this.dir > 0 ? this.corps.x + this.corps.w + 4 : this.corps.x - 4;
    const { y, h } = this.corps;
    return [y + 3, y + h / 2, y + h - 3].some((py) => ctx.carte.solideEnPixel(px, py));
  }

  /** Se tourne vers une cible, sauf quand elle est à peu près à la verticale (sinon on pivote à chaque pas). */
  faceA(cible: Cible): void {
    const dx = cible.x + cible.w / 2 - this.cx;
    if (Math.abs(dx) > 6) this.dir = dx > 0 ? 1 : -1;
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
    if (this.aTerre > 0)
      return {
        id: this.id,
        g: this.def.genre,
        x: this.cx,
        y: this.corps.y + this.corps.h,
        gauche: this.dir < 0,
        clignote: false,
        e: ANIM.TERRASSE,
        f: Math.min(255, Math.ceil(this.aTerre / 2)),
      };
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
      g: this.def.genre,
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
