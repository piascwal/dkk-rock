import { TUILE } from '../config';
import type { Contexte, EntiteSimulee } from '../jeu/contexte';
import { G, type EntiteVue, type Genre } from '../jeu/vue';
import { appliqueGravite, deplace, nouveauCorps, type Corps } from '../monde/physique';
import type { Tuile } from '../monde/tuiles';

export type SorteObjet = 'cage' | 'drapeau' | 'van' | 'arme' | 'soin' | 'coeur' | 'coeurOr' | 'sibylle';

const GENRES: Record<SorteObjet, Genre> = {
  cage: G.CAGE,
  drapeau: G.DRAPEAU,
  van: G.VAN,
  arme: G.ARME,
  soin: G.SOIN,
  coeur: G.COEUR,
  coeurOr: G.COEUR_OR,
  sibylle: G.SIBYLLE,
};

/** Le départ du van : ticks d'attente moteur lancé, puis accélération (px/tick²) jusqu'à la vitesse maximale (px/tick). */
export const ATTENTE_VAN = 28;
const ACCELERATION_VAN = 0.3;
const VITESSE_VAN = 10;
/** Le décollage (au sommet, au bout du monde) : il avance à peine (px/tick, px/tick²), son réacteur le monte jusqu'à MONTEE_ENVOL px/tick. */
const VITESSE_ENVOL = 0.5;
const ACCELERATION_ENVOL = 0.04;
const MONTEE_ENVOL = 4.5;

const TAILLES: Record<SorteObjet, [number, number]> = {
  cage: [20, 18],
  drapeau: [10, 32],
  van: [48, 28],
  arme: [12, 12],
  soin: [10, 10],
  coeur: [10, 9],
  coeurOr: [12, 11],
  sibylle: [14, 20],
};

/**
 * Ce qui attend les héros dans le niveau : cages, drapeaux, le van, armes et
 * médiators, cartes Sibylle. Les objets sont passifs : la partie regarde qui les touche.
 */
export class Objet implements EntiteSimulee {
  readonly id: number;
  readonly corps: Corps;
  fini = false;
  /** cage ouverte, drapeau levé */
  active = false;
  private anim = 0;
  /** le van qui démarre : il attend un instant, puis file vers la droite en accélérant à fond */
  partant = false;
  /** au sommet : le van décolle (son réacteur l'emporte vers le haut) au lieu de filer sur la route */
  envol = false;
  private vx = 0;
  private depuis = 0;

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

  /** Les héros sont montés : le van démarre. */
  demarre(): void {
    this.partant = true;
  }

  /** Le van roule à `vx` px par image, sans démarrer en trombe (il monte sur le ferry) ; 0 : il est garé. */
  conduit(vx: number): void {
    this.vx = vx;
    this.corps.x += vx;
  }

  maj(ctx: Contexte): void {
    this.anim++;
    if (this.partant) {
      this.depuis++;
      if (this.depuis > ATTENTE_VAN) {
        if (this.envol) {
          // le décollage : il avance à peine, son réacteur l'emporte vers le haut, de plus en plus vite
          this.vx = Math.min(VITESSE_ENVOL, this.vx + ACCELERATION_ENVOL);
          this.corps.x += this.vx;
          this.corps.y -= Math.min(MONTEE_ENVOL, (this.depuis - ATTENTE_VAN) * 0.09);
        } else {
          this.vx = Math.min(VITESSE_VAN, this.vx + ACCELERATION_VAN);
          this.corps.x += this.vx;
        }
        if (this.depuis === ATTENTE_VAN + 1) ctx.son('derapage', this.corps.x, this.corps.y);
      } else if (this.depuis % 8 === 0) ctx.secoue(2);
    }
    // tout retombe si on détruit le sol dessous (sauf le van, garé pour de bon, et la carte Sibylle, qui lévite)
    if (this.sorte !== 'van' && this.sorte !== 'sibylle') {
      appliqueGravite(this.corps);
      deplace(this.corps, ctx.carte);
      if (this.corps.y > ctx.carte.hauteur * TUILE + 32) this.fini = true;
    }
  }

  vue(): EntiteVue {
    const c = this.corps;
    return {
      id: this.id,
      g: this.envol ? G.VAN_REACTEUR : GENRES[this.sorte],
      x: c.x + c.w / 2,
      y: c.y + c.h,
      gauche: false,
      clignote: false,
      // e = 2 : le van démarre en trombe (fumée, graviers) ; e = 3 : il roule tranquillement (il monte sur le ferry) ; f : sa vitesse (×20)
      e: this.partant ? (this.envol ? 4 : 2) : this.vx > 0 ? 3 : this.active ? 1 : 0,
      f:
        this.partant || this.vx > 0
          ? Math.round(this.vx * 20)
          : this.sorte === 'arme' || this.sorte === 'cage' || this.sorte === 'sibylle'
            ? this.variante
            : this.anim & 255,
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
