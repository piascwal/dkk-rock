import { TUILE } from '../config';
import type { Contexte, EntiteSimulee } from '../jeu/contexte';
import { ANIM, G, type EntiteVue } from '../jeu/vue';
import { appliqueGravite, deplace, nouveauCorps, type Corps } from '../monde/physique';
import { ARME_CHAUFFAGE, type Compagnon, type Tireur } from './armes';
import type { JoueurBase } from './joueur-base';

/**
 * Où part le jet : le centre du cercle de la grille, depuis le milieu des pieds, en pixels du jeu
 * (vers l'avant, puis au-dessus du sol). Valeurs données par outils/fixe-chauffage.py.
 */
export const BOUCHE = { avant: 1.5, haut: 7 } as const;

/** Un petit bond : assez pour avancer, pas assez pour qu'on le confonde avec un saut de héros. */
const BOND = -2.3;
/** Bond de rattrapage : un mur, ou un héros bien plus haut. */
const GRAND_BOND = -4.6;
/** Ticks de repos entre deux bonds. */
const REPOS = 7;
/** Écart voulu avec le héros : derrière lui au repos, devant lui quand il souffle. */
const DERRIERE = 17;
const DEVANT = 22;
/** Ticks pendant lesquels le chauffage reste « en train de souffler » après un tir (secousse du sprite). */
const SOUFFLE = 8;

/**
 * Le chauffage soufflant : une arme qui est aussi un compagnon. Il suit le héros qui l'a ramassé à la place de
 * Fadatchi, en avançant par petits bonds, passe devant lui quand il tire et crache un gros jet de flammes par le
 * centre du cercle de sa grille. Quand les munitions s'épuisent (ou que le héros change d'arme ou tombe), il s'en va
 * et le kiwi revient.
 */
export class Chauffage implements EntiteSimulee, Compagnon {
  readonly id: number;
  readonly corps: Corps;
  fini = false;
  private dir: 1 | -1 = 1;
  private souffle = 0;
  private repos = 0;
  private anim = 0;

  constructor(
    ctx: Contexte,
    x: number,
    y: number,
    private readonly maitre: JoueurBase,
  ) {
    this.id = ctx.prochainId();
    this.corps = nouveauCorps(x, y, 10, 20);
    this.dir = maitre.dir;
    maitre.compagnon = this;
  }

  bouche(visee: Tireur): Tireur {
    const c = this.corps;
    this.dir = visee.dir;
    this.souffle = SOUFFLE;
    return {
      x: c.x + c.w / 2 + visee.dir * BOUCHE.avant,
      y: c.y + c.h - BOUCHE.haut,
      dir: visee.dir,
      angle: visee.angle,
    };
  }

  maj(ctx: Contexte): void {
    const m = this.maitre;
    // plus d'arme (munitions épuisées, autre arme ramassée) ou héros à terre : il s'en va
    if (m.mort || m.arme !== ARME_CHAUFFAGE) return this.part(ctx);
    this.anim++;
    if (this.souffle > 0) this.souffle--;
    if (this.repos > 0) this.repos--;
    const c = this.corps;

    // il regarde du côté du héros ; en tirant, il passe devant lui, sinon il le suit de près, derrière
    if (this.souffle === 0) this.dir = m.dir;
    const voulu = m.cx + m.dir * (this.souffle > 0 ? DEVANT : -DERRIERE);
    const dx = voulu - (c.x + c.w / 2);
    const ecart = this.souffle > 0 ? 3 : 8;

    if (c.auSol) {
      c.vx = 0;
      // un bond à la fois : il ne bouge qu'en sautant
      if (this.repos === 0 && (Math.abs(dx) > ecart || m.corps.y + m.corps.h < c.y - 20)) {
        c.vy = c.mur || m.corps.y + m.corps.h < c.y - 20 ? GRAND_BOND : BOND;
        // en retard, il enchaîne les bonds plus vite pour rattraper son héros
        const retard = Math.abs(dx) > 30;
        c.vx = Math.sign(dx) * Math.min(retard ? 3.4 : 2.6, Math.abs(dx) / 6 + 0.9);
        this.repos = retard ? 3 : REPOS;
      }
    }
    appliqueGravite(c);
    deplace(c, ctx.carte);

    // perdu, tombé, coincé : il rejoint son héros, comme par magie
    const loin = Math.hypot(m.cx - c.x, m.cy - c.y) > 240;
    if (loin || c.y > ctx.carte.hauteur * TUILE) Object.assign(c, { x: m.cx, y: m.corps.y, vx: 0, vy: 0 });
  }

  private part(ctx: Contexte): void {
    this.fini = true;
    if (this.maitre.compagnon === this) this.maitre.compagnon = null;
    const c = this.corps;
    ctx.texte(c.x, c.y - 8, 'PFFFT…', '#cfcfcf');
    ctx.son('picore', c.x, c.y);
  }

  vue(): EntiteVue {
    const c = this.corps;
    let e: number = ANIM.DEBOUT;
    if (this.souffle > 0) e = ANIM.ATTAQUE;
    else if (!c.auSol) e = ANIM.SAUT;
    else if (this.repos > 0) e = ANIM.COURT;
    return {
      id: this.id,
      g: G.CHAUFFAGE,
      x: c.x + c.w / 2,
      y: c.y + c.h,
      gauche: this.dir < 0,
      clignote: false,
      e,
      f: this.anim & 255,
    };
  }
}
