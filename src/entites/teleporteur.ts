import { TUILE } from '../config';
import { C, type EtatCommandes } from '../jeu/commandes';
import type { Cible, Contexte, EntiteSimulee } from '../jeu/contexte';
import { G, type EntiteVue } from '../jeu/vue';
import type { Corps } from '../monde/physique';

/**
 * Le téléporteur (`>` en haut, `<` en bas : chaque haut est relié au bas le plus proche, et inversement) : une porte éteinte qui
 * s'allume quand un héros s'arrête devant, et l'emmène à l'autre porte, au cœur des caves. On ne l'impose jamais (les échelles et le
 * terrain y mènent aussi) : le haut au bord du chemin, le bas dans la grande salle d'où partent les boyaux. Le héros qui reste
 * devant un peu de temps y passe ; la flèche du bas (ou l'accroupissement) le fait aussitôt, une fois la porte allumée.
 * À l'arrivée il faut s'éloigner puis revenir pour la reprendre : on ne rebondit pas d'une porte à l'autre.
 */

/** Demi-largeur de la zone devant la porte, tolérance en hauteur (pixels) et durées (ticks). */
const DEVANT = 12;
const HAUTEUR = 4;
/** Le temps pour qu'elle s'allume, avant lequel la flèche du bas ne sert encore à rien ; puis celui, tranquille, d'y passer. */
const ALLUME = 14;
const ATTENTE = 80;
/** Combien de temps (ticks) les deux portes restent ouvertes après un passage. */
const FLASH = 14;
/** Le tour du tourbillon : la période de `f`, en ticks (voir rendu/dessins-nouveautes.ts). */
export const TOUR = 144;

const corpsDe = (c: Cible): Corps | undefined => (c as Partial<{ corps: Corps }>).corps;
const commandesDe = (c: Cible): EtatCommandes | undefined =>
  (c as Partial<{ commandes: EtatCommandes }>).commandes;

export class Teleporteur implements EntiteSimulee {
  readonly id: number;
  fini = false;
  /** le milieu de la porte et son sol, en pixels */
  readonly x: number;
  readonly y: number;
  /** l'autre porte (voir `relie`) */
  autre: Teleporteur | null = null;
  private presence = 0;
  /** un héros vient d'arriver : la porte attend qu'il s'éloigne */
  private verrou = false;
  private flash = 0;
  private age = 0;

  constructor(ctx: Contexte, tx: number, ty: number) {
    this.id = ctx.prochainId();
    // la case du repère : la porte pose sur le sol, au bas de cette case
    this.x = tx * TUILE + TUILE / 2;
    this.y = (ty + 1) * TUILE;
  }

  /** Relie deux portes (dans les deux sens). */
  static relie(a: Teleporteur, b: Teleporteur): void {
    a.autre = b;
    b.autre = a;
  }

  /** Le premier héros vivant qui se tient devant la porte, s'il y en a un. */
  private devant(ctx: Contexte): Cible | undefined {
    return ctx.heros().find((h) => {
      const c = corpsDe(h);
      return (
        c &&
        h.vivant() &&
        Math.abs(c.x + c.w / 2 - this.x) <= DEVANT &&
        Math.abs(c.y + c.h - this.y) <= HAUTEUR
      );
    });
  }

  maj(ctx: Contexte): void {
    this.age = (this.age + 1) % TOUR;
    if (this.flash > 0) this.flash--;
    const heros = this.devant(ctx);
    if (!heros) {
      [this.presence, this.verrou] = [0, false];
      return;
    }
    if (this.verrou || !this.autre) return;
    this.presence++;
    const bas = commandesDe(heros)?.tenu(C.BAS) ?? false;
    if (this.presence >= ATTENTE || (bas && this.presence >= ALLUME)) this.emmene(ctx, heros);
  }

  /** Le héros passe à l'autre porte : il y arrive à l'arrêt, devant, et la porte ne le reprend qu'après qu'il s'en soit éloigné. */
  private emmene(ctx: Contexte, heros: Cible): void {
    const [c, autre] = [corpsDe(heros), this.autre];
    if (!c || !autre) return;
    c.x = autre.x - c.w / 2;
    c.y = autre.y - c.h;
    c.vx = c.vy = 0;
    for (const p of [this, autre]) {
      p.flash = FLASH;
      p.presence = 0;
      p.verrou = true;
      ctx.evenement({ k: 'impact', x: p.x, y: p.y - 10, c: '#7fd4ff' });
    }
  }

  vue(): EntiteVue {
    // e : 0 éteinte, 1 elle s'allume (la lumière vacille), 2 ouverte (le tourbillon tourne) ; f : le tour du tourbillon
    const e = this.verrou || this.flash > 0 || this.presence >= ALLUME ? 2 : this.presence > 0 ? 1 : 0;
    return {
      id: this.id,
      g: G.TELEPORTEUR,
      x: this.x,
      y: this.y,
      gauche: false,
      clignote: false,
      e,
      f: this.age,
    };
  }
}
