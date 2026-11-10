import { TUILE } from '../config';
import type { Cible, Contexte, EntiteSimulee } from '../jeu/contexte';
import { G, type EntiteVue } from '../jeu/vue';
import { appliqueGravite, deplace, nouveauCorps, type Corps } from '../monde/physique';

/**
 * Les objets suspendus (`"` dans la carte, à la case de la lampe) : un projecteur de scène au bout d'un câble, accroché au premier
 * plafond au-dessus (ou perdu dans le noir). Un tir ou un souffle sur le câble ou sur la lampe le coupe : elle tombe, écrase ce
 * qu'elle touche (ennemis, héros) et, en s'écrasant, souffle autour d'elle : les barils s'allument, les bonbonnes basculent, les
 * caissons sautent, et les projecteurs voisins ont leur câble secoué puis rompu un instant après : une réaction en chaîne.
 */

const DEGATS_ECRASE = 5;
const RAYON_CHOC = 30;
const DEGATS_CHOC = 3;
/** Le câble d'un voisin tient encore (ticks) après le choc, puis cède : la chaîne se voit tomber l'un après l'autre. */
const DELAI_CHAINE = 14;
const PORTEE_CHAINE = 5 * TUILE;
/** Combien de temps (ticks) l'épave reste là. */
const DUREE_EPAVE = 900;

type Etat = 'pend' | 'tombe' | 'brise';

export class Projecteur implements EntiteSimulee, Cible {
  readonly id: number;
  readonly camp = 'tous' as const;
  /** la lampe */
  readonly corps: Corps;
  fini = false;
  private etat: Etat = 'pend';
  /** le haut du câble (y, en pixels) */
  private readonly ancre: number;
  /** ticks avant que son câble ne rompe (0 : rien n'est en cours) */
  private coupeDans = 0;
  private epave = 0;
  private flash = 0;

  constructor(ctx: Contexte, tx: number, ty: number) {
    this.id = ctx.prochainId();
    this.corps = nouveauCorps(tx * TUILE + 1, ty * TUILE + 3, 14, 10);
    // accroché au premier plafond plein au-dessus (sinon, tout en haut de la carte)
    let r = ty - 1;
    while (r >= 0 && !ctx.carte.solide(tx, r)) r--;
    this.ancre = r >= 0 ? (r + 1) * TUILE : 0;
  }

  /** Sa boîte de tir : le câble et la lampe tant qu'elle pend ; la lampe seule ensuite. */
  get x(): number {
    return this.etat === 'pend' ? this.corps.x + 3 : this.corps.x;
  }
  get y(): number {
    return this.etat === 'pend' ? this.ancre : this.corps.y;
  }
  get w(): number {
    return this.etat === 'pend' ? 8 : this.corps.w;
  }
  get h(): number {
    return this.etat === 'pend' ? this.corps.y + this.corps.h - this.ancre : this.corps.h;
  }

  vivant(): boolean {
    return !this.fini && this.etat === 'pend';
  }

  /** Un coup, un souffle : le câble cède. */
  blesse(_degats: number, ctx: Contexte): void {
    if (this.etat !== 'pend') return;
    this.etat = 'tombe';
    this.flash = 6;
    ctx.son('rebond', this.corps.x, this.corps.y);
    ctx.evenement({ k: 'impact', x: this.corps.x + 7, y: this.corps.y - 6, c: '#ffe9a0' });
  }

  /** Le choc d'un voisin la secoue : son câble rompra dans un instant. */
  secoue(): void {
    if (this.etat === 'pend' && this.coupeDans === 0) this.coupeDans = DELAI_CHAINE;
  }

  private atterrit(ctx: Contexte): void {
    this.etat = 'brise';
    this.epave = DUREE_EPAVE;
    const c = this.corps;
    const [cx, cy] = [c.x + c.w / 2, c.y + c.h / 2];
    ctx.explosion(cx, cy, RAYON_CHOC, DEGATS_CHOC, 'tous');
    // la chaîne : les projecteurs voisins sont secoués, et céderont l'un après l'autre
    for (const p of ctx.props())
      if (p instanceof Projecteur && Math.abs(p.corps.x - c.x) <= PORTEE_CHAINE) p.secoue();
  }

  maj(ctx: Contexte): void {
    if (this.flash > 0) this.flash--;
    const c = this.corps;
    if (this.etat === 'pend') {
      if (this.coupeDans > 0 && --this.coupeDans === 0) this.blesse(1, ctx);
      return;
    }
    if (this.etat === 'brise') {
      if (--this.epave <= 0) this.fini = true;
      return;
    }
    appliqueGravite(c);
    deplace(c, ctx.carte);
    // elle écrase ce qu'elle touche en tombant (les héros aussi)
    if (c.vy > 1) {
      for (const o of ctx.cibles('tous'))
        if (o.vivant() && o.x < c.x + c.w && o.x + o.w > c.x && o.y < c.y + c.h && o.y + o.h > c.y) {
          o.blesse(DEGATS_ECRASE, ctx, 0, false);
          return this.atterrit(ctx);
        }
    }
    if (c.auSol || c.y > ctx.carte.hauteur * TUILE + 32) this.atterrit(ctx);
  }

  vue(): EntiteVue | null {
    if (this.fini) return null;
    const c = this.corps;
    return {
      id: this.id,
      g: G.PROJECTEUR,
      x: c.x + c.w / 2,
      y: c.y + c.h,
      gauche: false,
      clignote: this.flash > 0 || (this.coupeDans > 0 && Math.floor(this.coupeDans / 3) % 2 === 1),
      // 0 : il pend ; 1 : il tombe ; 2 : l'épave. f : la longueur du câble (demi-pixels), tant qu'il pend
      e: this.etat === 'pend' ? 0 : this.etat === 'tombe' ? 1 : 2,
      f: this.etat === 'pend' ? Math.min(255, Math.round((c.y - this.ancre) / 2)) : 0,
    };
  }
}
