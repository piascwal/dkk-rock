import { TUILE } from '../config';
import type { Cible, Contexte, EntiteSimulee } from '../jeu/contexte';
import { ANIM, G, type EntiteVue } from '../jeu/vue';
import { appliqueGravite, deplace, nouveauCorps, type Corps } from '../monde/physique';
import { Projectile } from './projectile';
import { OEUF_KIWI } from './projectiles-defs';

const CRIS = ['Kiii-wiii !', 'FADATCHI !', '*picore*', 'Kiwi. (Il a l’air déçu.)'];

/**
 * Fadatchi, le kiwi mascotte du groupe : « espèce totalement disparue », selon
 * JBM, qui n'a jamais vérifié. Il suit un héros, picore les ennemis proches et
 * pond de temps en temps un œuf (énorme, comme tous les œufs de kiwi) qui explose.
 */
export class Kiwi implements EntiteSimulee {
  readonly id: number;
  readonly corps: Corps;
  fini = false;
  private dir: 1 | -1 = 1;
  private bec = 0;
  private ponte = 400;
  private anim = 0;

  constructor(
    ctx: Contexte,
    x: number,
    y: number,
    /** le héros suivi */
    private chef: () => Cible | null,
  ) {
    this.id = ctx.prochainId();
    this.corps = nouveauCorps(x, y, 8, 8);
  }

  maj(ctx: Contexte): void {
    this.anim++;
    if (this.bec > 0) this.bec--;
    if (this.ponte > 0) this.ponte--;
    const c = this.corps;
    const chef = this.chef();
    const proie = this.proie(ctx);

    let vise = c.x;
    if (proie) vise = proie.x + proie.w / 2;
    else if (chef) vise = chef.x + chef.w / 2 - this.dir * 18;
    const dx = vise - (c.x + c.w / 2);
    if (Math.abs(dx) > 6) {
      this.dir = dx > 0 ? 1 : -1;
      c.vx = this.dir * (proie ? 1.6 : Math.min(2.4, Math.abs(dx) / 20 + 0.6));
    } else c.vx = 0;
    if (c.auSol && (c.mur || (chef && chef.y + chef.h < c.y - 20))) c.vy = -5.5;
    appliqueGravite(c);
    deplace(c, ctx.carte);

    if (proie && this.bec === 0 && Math.abs(dx) < 10 && Math.abs(proie.y + proie.h - c.y - c.h) < 16) {
      proie.blesse(1, ctx, this.dir, false);
      this.bec = 30;
      ctx.son('picore', c.x, c.y);
    }
    if (proie && this.ponte === 0 && Math.abs(dx) < 120) {
      ctx.ajoute(new Projectile(ctx, OEUF_KIWI, 'heros', c.x + 4, c.y, this.dir * 2, -2));
      ctx.texte(c.x, c.y - 10, 'ŒUF !', '#e8cf8a');
      this.ponte = 600;
    }
    if (ctx.rng.suivant() < 0.0008) ctx.texte(c.x, c.y - 10, ctx.rng.choix(CRIS), '#e8cf8a');

    // perdu, tombé, coincé : il rejoint son héros, comme par magie (les kiwis sont discrets)
    const loin = chef && Math.hypot(chef.x - c.x, chef.y - c.y) > 260;
    if (chef && (loin || c.y > ctx.carte.hauteur * TUILE)) {
      Object.assign(c, { x: chef.x, y: chef.y - 4, vx: 0, vy: 0 });
    }
  }

  private proie(ctx: Contexte): Cible | null {
    const c = this.corps;
    let meilleure: Cible | null = null;
    let dMin = 90;
    for (const e of ctx.cibles('ennemis')) {
      const d = Math.hypot(e.x - c.x, e.y - c.y);
      if (d < dMin) {
        dMin = d;
        meilleure = e;
      }
    }
    return meilleure;
  }

  vue(): EntiteVue {
    const c = this.corps;
    const pique = this.bec > 12;
    let e: number = ANIM.DEBOUT;
    if (pique) e = ANIM.ATTAQUE;
    else if (!c.auSol) e = ANIM.SAUT;
    else if (Math.abs(c.vx) > 0.2) e = ANIM.COURT;
    return {
      id: this.id,
      g: G.KIWI,
      x: c.x + c.w / 2,
      y: c.y + c.h,
      gauche: this.dir < 0,
      clignote: false,
      e,
      // un coup de bec se joue depuis son début : l'image dépend du temps écoulé depuis le coup
      f: pique ? 30 - this.bec : this.anim & 255,
    };
  }
}
