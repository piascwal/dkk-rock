import { TUILE } from '../../config';
import type { Cible, Contexte, EntiteSimulee } from '../../jeu/contexte';
import { G, type EntiteVue } from '../../jeu/vue';
import { nouveauCorps, type Corps } from '../../monde/physique';
import { tireur, type Comportement } from './comportements';
import type { DefEnnemi } from './definitions';
import { Ennemi } from './ennemi';

/**
 * L'alarme, qu'on découvre de niveau en niveau (voir jeu/nouveautes.ts) : une sirène (`}`) et son sonneur (`?`). Dès qu'il vous
 * repère, le sonneur court à la sirène la plus proche au lieu de se battre ; s'il l'atteint, elle hurle et des renforts tombent du
 * ciel. On l'en empêche en le mettant au tapis avant, ou en cassant la sirène (trois coups). Sans sirène, il se bat comme un fêtard.
 *
 * Et le porteur de pancarte (`]`) : sa pancarte arrête tout ce qui vient de face. Il faut le prendre à revers (il met du temps à se
 * retourner), lui tirer dessus d'en haut, ou le faire sauter : une explosion ne s'arrête pas à une pancarte.
 */

const PV_SIRENE = 3;
/** Combien de renforts, et combien de temps la sirène hurle (ticks, pour le dessin). */
const RENFORTS = 3;
const DUREE_HURLE = 240;

export class Sirene implements EntiteSimulee, Cible {
  readonly id: number;
  readonly camp = 'tous' as const;
  readonly corps: Corps;
  fini = false;
  /** elle a déjà sonné : elle ne resservira pas */
  sonnee = false;
  private pv = PV_SIRENE;
  private hurle = 0;
  private flash = 0;

  constructor(
    ctx: Contexte,
    tx: number,
    ty: number,
    /** qui tombe du ciel quand elle sonne */
    private readonly renfort: DefEnnemi,
  ) {
    this.id = ctx.prochainId();
    this.corps = nouveauCorps(tx * TUILE + 4, ty * TUILE + TUILE - 22, 8, 22);
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

  blesse(degats: number, ctx: Contexte): void {
    if (this.fini) return;
    this.flash = 6;
    this.pv -= Math.max(1, degats);
    if (this.pv > 0) return;
    this.fini = true;
    ctx.evenement({ k: 'confettis', x: this.corps.x + 4, y: this.corps.y + 6 });
    ctx.texte(this.corps.x + 4, this.corps.y - 6, 'Sirène coupée !', '#ffd23f');
    ctx.son('rebond', this.corps.x, this.corps.y);
  }

  /** Le sonneur l'a atteinte : elle hurle, les renforts tombent autour d'elle. */
  declenche(ctx: Contexte): void {
    if (this.sonnee || this.fini) return;
    this.sonnee = true;
    this.hurle = DUREE_HURLE;
    const c = this.corps;
    ctx.texte(c.x + 4, c.y - 10, 'ALERTE ! Des renforts !', '#ff4fd8');
    ctx.son('alerte', c.x, c.y);
    ctx.secoue(6);
    for (let i = 0; i < RENFORTS; i++) {
      const x = c.x + (i - (RENFORTS - 1) / 2) * 26;
      // au-dessus de la sirène, dans le premier espace libre (ils tombent, puis cherchent le héros)
      let y = c.y - 110;
      while (y < c.y - TUILE && ctx.carte.solideEnPixel(x + 4, y + 10)) y += TUILE;
      if (ctx.carte.solideEnPixel(x + 4, y + 10)) continue;
      const e = new Ennemi(ctx, this.renfort, x - (TUILE - this.renfort.w) / 2, y - TUILE + this.renfort.h);
      e.passeEnAlerte(ctx);
      ctx.ajoute(e);
    }
  }

  maj(): void {
    if (this.hurle > 0) this.hurle--;
    if (this.flash > 0) this.flash--;
  }

  vue(): EntiteVue | null {
    if (this.fini) return null;
    const c = this.corps;
    return {
      id: this.id,
      g: G.SIRENE,
      x: c.x + c.w / 2,
      y: c.y + c.h,
      gauche: false,
      clignote: this.flash > 0,
      // 0 : en veille ; 1 : elle hurle ; 2 : elle a sonné, éteinte
      e: this.hurle > 0 ? 1 : this.sonnee ? 2 : 0,
      f: this.hurle & 255,
    };
  }
}

const estSirene = (c: Cible): c is Sirene => c instanceof Sirene;

/** Le sonneur : il court à la sirène la plus proche (à moins de 30 tuiles) ; sans sirène à sonner, il se bat comme un fêtard. */
export const sonneur: Comportement = (e, ctx, cible) => {
  let sirene: Sirene | null = null;
  for (const p of ctx.props())
    if (
      estSirene(p) &&
      !p.sonnee &&
      Math.abs(p.x - e.cx) < 30 * TUILE &&
      Math.abs(p.y + p.h - (e.y + e.h)) < 5 * TUILE
    )
      if (!sirene || Math.abs(p.x - e.cx) < Math.abs(sirene.x - e.cx)) sirene = p;
  if (!sirene) return tireur(e, ctx, cible);
  const but = sirene.x + sirene.w / 2;
  if (Math.abs(but - e.cx) < 8 && Math.abs(sirene.y + sirene.h - (e.y + e.h)) < TUILE * 1.5) {
    sirene.declenche(ctx);
    e.corps.vx = 0;
    return;
  }
  // il file, et saute ce qui lui barre la route (une marche, une caisse)
  e.dir = but > e.cx ? 1 : -1;
  e.corps.vx = e.dir * e.def.vitesse * 2.1;
  if (e.corps.mur && e.corps.auSol) e.corps.vy = -5.2;
  if (ctx.tick % 50 === 0) ctx.texte(e.cx, e.corps.y - 12, 'L’alarme !', '#ff4fd8');
};

/** Le temps qu'il met à se retourner (ticks) : de quoi lui passer dans le dos. */
const DEMI_TOUR = 42;

/** Le porteur de pancarte : il avance sur le héros, pancarte en avant, et se retourne lentement. */
export const pancarte: Comportement = (e, ctx, cible) => {
  const vers = cible.x + cible.w / 2 > e.cx ? 1 : -1;
  if (vers !== e.dir) {
    e.corps.vx = 0;
    if (++e.memoire >= DEMI_TOUR) [e.dir, e.memoire] = [vers, 0];
    return;
  }
  e.memoire = 0;
  e.corps.vx = e.corps.auSol && !e.solDevant(ctx) ? 0 : e.dir * e.def.vitesse;
};

/** Les deux nouveaux venus, par repère de carte (les lettres sont toutes prises). */
export const ENNEMIS_NOUVEAUX: Record<string, DefEnnemi> = {
  ']': {
    nom: 'Porteur de pancarte',
    genre: G.PANCARTE,
    pv: 4,
    w: 9,
    h: 20,
    vitesse: 0.55,
    vision: 170,
    visionVerticale: 50,
    cadence: 0,
    points: 300,
    comportement: pancarte,
    contact: 1,
    bouclier: true,
    cris: ['NON AU ROCK !', 'Autotune pour tous !', 'Vous ne passerez pas.'],
  },
  '?': {
    nom: 'Sonneur d’alarme',
    genre: G.SONNEUR,
    pv: 2,
    w: 8,
    h: 19,
    vitesse: 0.9,
    vision: 190,
    visionVerticale: 60,
    cadence: 90,
    points: 200,
    comportement: sonneur,
    cris: ['DES ROCKEURS !', 'À l’alarme !', 'Sécurité !'],
  },
};
