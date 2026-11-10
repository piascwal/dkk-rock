import { TUILE } from '../config';
import type { Cible, Contexte, EntiteSimulee } from '../jeu/contexte';
import { G, type EntiteVue } from '../jeu/vue';
import { zoneLibre, nouveauCorps, type Corps } from '../monde/physique';

/**
 * Le monte-charge (`>` dans la carte, à la case de son sommet) : une plate-forme de deux tuiles qui descend dans un puits creusé
 * jusqu'au sol d'une cave, pour donner envie d'y aller (on ne l'impose jamais : les échelles et le terrain y mènent aussi). Un
 * héros qui s'y tient une demi-seconde l'emmène ; en bas, il repart de même (ou, laissé seul, il remonte au bout de six secondes).
 * Ceux qui sont dessus, ennemis compris, voyagent avec lui. Il est plein (`Carte.obstacles`) : on s'y pose, on s'y cogne la tête.
 */

const VITESSE = 1;
const LARGEUR = 30;
const EPAISSEUR = 6;
/** Combien de temps (ticks) un héros doit s'y tenir pour le mettre en marche, et combien il attend seul en bas avant de remonter. */
const ATTENTE_DEPART = 30;
/** À l'arrivée, celui qui reste dessus attend plus longtemps (de quoi en descendre) avant que la plate-forme ne reparte. */
const ATTENTE_ARRIVEE = 90;
const ATTENTE_RETOUR = 360;

const corpsDe = (c: Cible): Corps | undefined => (c as Partial<{ corps: Corps }>).corps;

export class MonteCharge implements EntiteSimulee {
  readonly id: number;
  readonly corps: Corps;
  fini = false;
  /** le haut du puits (où il attend) et le bas (le sol de la cave), en pixels : le dessus de la plate-forme */
  private readonly haut: number;
  private readonly bas: number;
  private mouvement: 0 | 1 | -1 = 0;
  private compte = 0;
  private seul = 0;
  /** un délai de plus avant de repartir, juste après une arrivée */
  private delai = 0;

  constructor(ctx: Contexte, tx: number, ty: number) {
    this.id = ctx.prochainId();
    // le puits : libre jusqu'au premier sol sous ses deux colonnes
    let r = ty + 1;
    while (r < ctx.carte.hauteur - 1 && !ctx.carte.props(tx, r).solide && !ctx.carte.props(tx + 1, r).solide)
      r++;
    this.haut = ty * TUILE;
    this.bas = Math.max(this.haut, r * TUILE);
    this.corps = nouveauCorps(tx * TUILE + (TUILE * 2 - LARGEUR) / 2, this.haut, LARGEUR, EPAISSEUR);
  }

  /** Ce qui se tient dessus (les pieds sur la plate-forme, qui n'a pas sauté) parmi `cibles`. */
  private dessus(cibles: readonly Cible[], sortie: Corps[]): void {
    const t = this.corps;
    for (const cible of cibles) {
      const c = corpsDe(cible);
      if (!c || c.vy < 0 || c.x + c.w <= t.x || c.x >= t.x + t.w || Math.abs(c.y + c.h - t.y) > 1.5) continue;
      sortie.push(c);
    }
  }

  /** Un corps (qui n'est pas dessus) gênerait-il la plate-forme à sa nouvelle hauteur ? */
  private gene(cibles: readonly Cible[], y: number, passagers: readonly Corps[]): boolean {
    const t = this.corps;
    for (const cible of cibles) {
      const c = corpsDe(cible);
      if (!c || passagers.includes(c)) continue;
      if (c.x < t.x + t.w && c.x + c.w > t.x && c.y < y + t.h && c.y + c.h > y) return true;
    }
    return false;
  }

  maj(ctx: Contexte): void {
    const t = this.corps;
    const passagers: Corps[] = [];
    this.dessus(ctx.cibles('tous'), passagers);
    this.dessus(ctx.props(), passagers);
    const heros = ctx.heros();
    const unHeros = passagers.some((c) => heros.some((h) => corpsDe(h) === c));
    if (this.mouvement === 0) {
      const enHaut = t.y <= this.haut;
      const enBas = t.y >= this.bas;
      // `compte` : les ticks passés avec un héros dessus (zéro s'il descend), `seul` : ceux d'une attente à vide en bas
      this.compte = unHeros ? this.compte + 1 : 0;
      this.seul = !unHeros && enBas ? this.seul + 1 : 0;
      if (unHeros && this.compte >= ATTENTE_DEPART + this.delai && (enHaut || enBas))
        [this.mouvement, this.compte, this.delai] = [enHaut ? 1 : -1, 0, 0];
      else if (this.seul >= ATTENTE_RETOUR) [this.mouvement, this.seul] = [-1, 0];
      return;
    }
    const y = Math.min(this.bas, Math.max(this.haut, t.y + this.mouvement * VITESSE));
    const dy = y - t.y;
    // il avance d'un pas, avec ceux qui sont dessus ; rien ne doit s'y coincer (un plafond au-dessus d'un passager, un corps dessous)
    const bloque =
      this.gene(ctx.cibles('tous'), y, passagers) ||
      this.gene(ctx.props(), y, passagers) ||
      (dy < 0 && passagers.some((c) => !zoneLibre(ctx.carte, c.x, c.y + dy, c.w, c.h)));
    if (!bloque) {
      for (const c of passagers) c.y += dy;
      t.y = y;
    }
    if (t.y <= this.haut || t.y >= this.bas)
      [this.mouvement, this.compte, this.delai] = [0, 0, unHeros ? ATTENTE_ARRIVEE - ATTENTE_DEPART : 0];
  }

  vue(): EntiteVue {
    const t = this.corps;
    return {
      id: this.id,
      g: G.MONTE_CHARGE,
      x: t.x + t.w / 2,
      y: t.y + t.h,
      gauche: false,
      clignote: false,
      // e : 1 en mouvement ; f : la longueur de ses câbles au-dessus de lui (en demi-pixels), de quoi les voir monter
      e: this.mouvement === 0 ? 0 : 1,
      f: Math.min(255, Math.round((t.y - this.haut) / 2) + 20),
    };
  }
}
