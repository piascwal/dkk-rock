import { TUILE } from '../config';
import { C, type EtatCommandes } from '../jeu/commandes';
import type { Cible, Contexte, EntiteSimulee } from '../jeu/contexte';
import { G, type EntiteVue } from '../jeu/vue';
import type { Corps } from '../monde/physique';

/**
 * Le trampoline mural (`` ` `` dans la carte, une case vide contre un mur) : la grosse caisse posée de biais contre la paroi, la
 * peau tournée vers le haut et vers le large. Qui le heurte sans pousser vers le mur (en tombant, ou en sautant à côté de lui) part
 * en cloche, loin du mur : de quoi franchir un vide jusqu'au rebord d'en face. Qui grimpe (en poussant vers le mur) passe à côté.
 */

/** La vitesse du lancer : vers le haut et à l'opposé du mur (la vitesse d'un saut de héros : 5,5). */
const LANCER_Y = 7.6;
const LANCER_X = 4.2;
/** La boîte qui reçoit : sa largeur depuis la paroi et sa hauteur depuis le bas de la case (pixels). */
const LARGEUR = 14;
const HAUTEUR = 22;
/** Les ticks de compression de la peau (pour le dessin) et d'attente entre deux lancers. */
const ENFONCE = 10;
const ATTENTE = 14;

const corpsDe = (c: Cible): Corps | undefined => (c as Partial<{ corps: Corps }>).corps;
const commandesDe = (c: Cible): EtatCommandes | undefined =>
  (c as Partial<{ commandes: EtatCommandes }>).commandes;

export class TremplinMural implements EntiteSimulee {
  readonly id: number;
  fini = false;
  /** de quel côté est le mur : -1 à gauche (le trampoline lance vers la droite), 1 à droite */
  private readonly mur: -1 | 1;
  /** la paroi (x) et le bas de la case (y), en pixels */
  private readonly px: number;
  private readonly py: number;
  private readonly metal: boolean;
  private enfonce = 0;
  private attente = 0;

  constructor(ctx: Contexte, tx: number, ty: number) {
    this.id = ctx.prochainId();
    this.mur = ctx.carte.props(tx - 1, ty).solide || !ctx.carte.props(tx + 1, ty).solide ? -1 : 1;
    this.px = this.mur === -1 ? tx * TUILE : (tx + 1) * TUILE;
    this.py = (ty + 1) * TUILE;
    this.metal = tx % 2 === 1;
  }

  maj(ctx: Contexte): void {
    if (this.enfonce > 0) this.enfonce--;
    if (this.attente > 0) {
      this.attente--;
      return;
    }
    const x0 = this.mur === -1 ? this.px : this.px - LARGEUR;
    for (const cible of ctx.cibles('tous')) {
      const c = corpsDe(cible);
      if (!c || !cible.vivant()) continue;
      if (c.x + c.w <= x0 || c.x >= x0 + LARGEUR || c.y + c.h <= this.py - HAUTEUR || c.y >= this.py)
        continue;
      const k = commandesDe(cible);
      // qui pousse vers le mur grimpe : il passe à côté ; les autres, en tombant (ou en sautant pour un héros), sont lancés
      if (k && k.horizontal === this.mur) continue;
      if (!(c.vy > 0.5 || (k && k.appuye(C.SAUT)))) continue;
      c.vy = -LANCER_Y;
      c.vx = -this.mur * LANCER_X;
      this.enfonce = ENFONCE;
      this.attente = ATTENTE;
      ctx.son('rebond', this.px, this.py);
      ctx.evenement({ k: 'impact', x: this.px - this.mur * 8, y: this.py - 12, c: '#f5ecd6' });
      return;
    }
  }

  vue(): EntiteVue {
    // e : 0 en bois, 1 en métal ; f : les ticks de compression de la peau ; gauche : le mur est à droite (le dessin est retourné)
    return {
      id: this.id,
      g: G.TREMPLIN_MURAL,
      x: this.px,
      y: this.py,
      gauche: this.mur === 1,
      clignote: false,
      e: this.metal ? 1 : 0,
      f: this.enfonce,
    };
  }
}
