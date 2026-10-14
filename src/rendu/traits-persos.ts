import { TUILE } from '../config';
import { ANIM, G, type EtatVue } from '../jeu/vue';
import type { Carte } from '../monde/carte';
import type { Pose } from './decor';
import type { Emojis } from './emojis';

/**
 * Les petits traits propres à chaque personnage (Tom craque pour les rondins...). Une fonctionnalité de personnage
 * est une entrée de TRAITS : le héros concerné, ce qui la déclenche, et son effet. Tout se passe côté rendu, d'après la
 * vue : l'hôte et les clients distants les voient pareil, sans toucher à la simulation ni au protocole.
 *
 * Pour en ajouter un : un objet de plus dans TRAITS ; pour un nouveau déclencheur (un ennemi vaincu, un instrument
 * ramassé...), un nouveau type de `Declencheur` géré dans `TraitsPersos.maj`.
 */
export interface Effets {
  emojis: Emojis;
}

export interface TraitPerso {
  /** le héros concerné (G.TOM...) */
  genre: number;
  /** quand le héros croise un de ces éléments du décor... */
  croise?: {
    decors: readonly string[];
    /** ...voici ce qui se passe, au pied (x, y) du héros */
    effet: (x: number, y: number, fx: Effets, id: number) => void;
  };
}

export const TRAITS: readonly TraitPerso[] = [
  {
    genre: G.TOM,
    croise: {
      decors: ['tronc'],
      effet: (x, y, fx, id) => fx.emojis.pop('coeur', x, y - 24, { id, dx: 0, dy: -24 }),
    },
  },
];

/** Une même pose ne redéclenche pas son effet pendant ce nombre d'images. */
const REPOS = 150;
/** À quelle hauteur du sol (en pixels) on est « sur » l'élément, et au-delà de quel saut on ne le croise pas. */
const ECART_Y = 20;
const SAUT_MAX = 40;

export class TraitsPersos {
  private readonly precedent = new Map<number, number>();
  private readonly dernier = new Map<Pose, number>();
  private image = 0;

  /** Repart de zéro (changement de niveau). */
  reinitialise(): void {
    this.precedent.clear();
    this.dernier.clear();
  }

  maj(vue: EtatVue, poses: readonly Pose[], carte: Carte, fx: Effets): void {
    this.image++;
    for (const v of vue.entites) {
      const trait = TRAITS.find((t) => t.genre === v.g);
      if (!trait?.croise || v.e === ANIM.MORT) continue;
      const avant = this.precedent.get(v.id);
      this.precedent.set(v.id, v.x);
      if (avant === undefined || Math.abs(v.x - avant) > SAUT_MAX) continue;
      const lo = Math.min(avant, v.x);
      const hi = Math.max(avant, v.x);
      for (const o of poses) {
        if (!trait.croise.decors.includes(o.quoi)) continue;
        const ox = o.tx * TUILE + TUILE / 2;
        if (ox < lo || ox > hi || Math.abs(v.y - o.ty * TUILE) > ECART_Y) continue;
        // l'élément doit encore être là : son sol tient, rien dessus
        if (!carte.props(o.tx, o.ty).solide || carte.solide(o.tx, o.ty - 1)) continue;
        if (this.image - (this.dernier.get(o) ?? -REPOS) < REPOS) continue;
        this.dernier.set(o, this.image);
        trait.croise.effet(v.x, v.y, fx, v.id);
      }
    }
  }
}
