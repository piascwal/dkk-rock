import { CHUTE_MAX, GRAVITE, TUILE } from '../../config';
import type { Contexte } from '../../jeu/contexte';
import { appliqueGravite, deplace } from '../../monde/physique';
import { ENNEMIS_PAR_LETTRE } from './definitions';
import { Ennemi } from './ennemi';

/** Les tours qu'il fait sur lui-même entre le haut de l'écran et la piste : deux, assez lents pour se voir. */
const TOURS = 2;
/** Une chute lente, pour voir les tours : la gravité est au dixième de la normale. */
const LENTEUR = 0.1;

/**
 * Un pro du BMX qui arrive d'en haut de l'écran en figure (un tour sur lui-même, en avant ou en arrière) et se pose sur ses
 * roues : à l'atterrissage il est à l'endroit, et fonce sur le héros le plus proche comme un pro ordinaire.
 */
export class Voltigeur extends Ennemi {
  private enVol = true;
  private readonly sens: 1 | -1;
  private readonly yDepart: number;
  private readonly yArrivee: number;

  /** `x` : où il apparaît (centre) ; `yHaut` : le haut de l'écran ; `xCible`, `ySol` : où il se pose (centre, sol). */
  constructor(ctx: Contexte, x: number, yHaut: number, xCible: number, ySol: number) {
    super(ctx, ENNEMIS_PAR_LETTRE.p!, 0, 0);
    const c = this.corps;
    c.x = x - c.w / 2;
    c.y = yHaut;
    // le temps de chute jusqu'au sol, pour viser la bonne colonne et finir son tour à l'arrivée
    let vy = 0;
    let y = c.y + c.h;
    let t = 0;
    while (y < ySol && t < 600) {
      vy = Math.min(vy + GRAVITE * LENTEUR, CHUTE_MAX);
      y += vy;
      t++;
    }
    c.vx = (xCible - x) / Math.max(1, t);
    this.dir = c.vx >= 0 ? 1 : -1;
    this.sens = ctx.rng.suivant() < 0.5 ? 1 : -1;
    this.yDepart = c.y + c.h;
    this.yArrivee = ySol;
    this.foyer = xCible;
  }

  override maj(ctx: Contexte): void {
    if (!this.enVol || !this.vivant()) {
      super.maj(ctx);
      return;
    }
    const c = this.corps;
    this.anim++;
    appliqueGravite(c, LENTEUR);
    deplace(c, ctx.carte);
    const avance = (c.y + c.h - this.yDepart) / Math.max(1, this.yArrivee - this.yDepart);
    this.salto = Math.round(this.sens * TOURS * Math.min(0.97, Math.max(0, avance)) * 256) & 255;
    if (c.y > ctx.carte.hauteur * TUILE) this.fini = true;
    if (!c.auSol) return;
    // posé sur ses roues : à l'endroit, il part à l'attaque du héros le plus proche
    this.enVol = false;
    this.salto = 0;
    this.foyer = this.cx;
    ctx.son('saut', this.cx, this.cy);
    let proche = null;
    let dMin = Infinity;
    for (const h of ctx.heros()) {
      const d = Math.abs(h.x + h.w / 2 - this.cx);
      if (d < dMin) {
        dMin = d;
        proche = h;
      }
    }
    if (proche) {
      this.cible = proche;
      this.vuA = ctx.tick;
      this.etat = 'attaque';
    }
  }
}
