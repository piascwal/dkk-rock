import type { Contexte } from '../jeu/contexte';
import { Projectile } from './projectile';
import {
  BOULET_AMPLI,
  CORNEMUSE,
  FLAMME,
  ONDE_GONG,
  TRIANGLE,
  VINYLE,
  type DefProjectile,
} from './projectiles-defs';

/** Celui qui tire : la bouche de l'arme, le sens, et l'angle au-dessus de l'horizontale (radians). */
export interface Tireur {
  x: number;
  y: number;
  dir: 1 | -1;
  angle?: number;
}

export interface DefArme {
  nom: string;
  /** ticks entre deux tirs */
  cadence: number;
  /** munitions d'une arme ramassée (les instruments sont illimités) */
  munitions: number;
  son: string;
  tir: (ctx: Contexte, t: Tireur) => void;
  /** ce que dit le héros en la ramassant : on découvre la richesse d'une musique... sans l'admettre */
  repliques: string[];
}

/** Tire un projectile depuis la bouche de l'arme, avec un angle vertical. */
export function tire(ctx: Contexte, t: Tireur, def: DefProjectile, vy = 0, vitesse = def.vitesse): void {
  // `vy` est un écart perpendiculaire à la visée (éventail, cloche) : on tourne le tout avec l'angle
  const a = t.angle ?? 0;
  const vx = t.dir * (vitesse * Math.cos(a) + vy * Math.sin(a));
  const vyFinal = -vitesse * Math.sin(a) + vy * Math.cos(a);
  ctx.ajoute(new Projectile(ctx, def, 'heros', t.x, t.y, vx, vyFinal));
}

/** Les armes que l'on trouve en chemin. L'index 0 est réservé à l'instrument du héros. */
export const ARMES_RAMASSABLES: DefArme[] = [
  {
    nom: 'Ampli à lampes',
    cadence: 30,
    munitions: 8,
    son: 'ampli',
    tir: (ctx, t) => tire(ctx, t, BOULET_AMPLI, -0.6),
    repliques: [
      'Un ampli à lampes de 1965. Enfin un objet qui comprend la vie.',
      "Il chauffe, il bourdonne, il sent le grillé. C'est parfait.",
    ],
  },
  {
    nom: 'Vinyle de jazz',
    cadence: 14,
    munitions: 20,
    son: 'vinyle',
    tir: (ctx, t) => tire(ctx, t, VINYLE, -0.4),
    repliques: [
      "Du jazz modal... Bon, techniquement c'est brillant. Mais y'a pas de disto, donc non.",
      "Miles Davis ? Connais pas. Ça coupe, c'est tout ce que je lui demande.",
    ],
  },
  {
    nom: 'Accordéon-flamme',
    cadence: 3,
    munitions: 90,
    son: 'flamme',
    tir: (ctx, t) => tire(ctx, t, FLAMME, ctx.rng.entre(-0.6, 0.6)),
    repliques: [
      "La musette, c'est du punk avec des bretelles. ... Oubliez ce que je viens de dire.",
      'Trois rangs de basses, un soufflet de feu. Mon grand-père avait raison, en fait.',
    ],
  },
  {
    nom: 'Cornemuse',
    cadence: 36,
    munitions: 6,
    son: 'cornemuse',
    tir: (ctx, t) => tire(ctx, t, CORNEMUSE, -3),
    repliques: [
      "La cornemuse : le premier mur d'amplis de l'histoire. Ça s'entend à trois vallées.",
      'Elle sent le mouton. Elle hurle comme une Gibson. Je ne sais plus quoi penser.',
    ],
  },
  {
    nom: 'Triangle laser',
    cadence: 8,
    munitions: 30,
    son: 'triangle',
    tir: (ctx, t) => tire(ctx, t, TRIANGLE),
    repliques: ["Le triangle. L'instrument le plus sous-estimé de l'orchestre. Ding.", 'Ding. Ding. DING.'],
  },
  {
    nom: 'Gong sacré',
    cadence: 40,
    munitions: 4,
    son: 'gong',
    tir: (ctx, t) => tire(ctx, t, ONDE_GONG),
    repliques: [
      "Un gong de 80 centimètres. Les percussions d'Asie ont mille ans d'avance. On s'en fiche, ça fait BOUM.",
    ],
  },
];

/** L'arme d'index `i` (1 et plus : ramassées), ou null pour l'instrument. */
export const armeRamassee = (i: number): DefArme | null => ARMES_RAMASSABLES[i - 1] ?? null;
