import type { Contexte } from '../jeu/contexte';
import { Projectile } from './projectile';
import {
  BOITIER,
  DONUT,
  FLIPPER,
  FRISBEE,
  JET_FLAMME,
  MINIDISC,
  PILE,
  type DefProjectile,
} from './projectiles-defs';

/** Celui qui tire : la bouche de l'arme, le sens, et l'angle au-dessus de l'horizontale (radians). */
export interface Tireur {
  x: number;
  y: number;
  dir: 1 | -1;
  angle?: number;
}

/** Un compagnon qui tient lieu de bouche à l'arme du héros (le chauffage soufflant). */
export interface Compagnon {
  readonly fini: boolean;
  /** Se tourne vers la visée du héros et rend où part le tir : le centre du cercle de sa grille. */
  bouche(visee: Tireur): Tireur;
}

export interface DefArme {
  nom: string;
  /** ticks entre deux tirs */
  cadence: number;
  /** munitions d'une arme ramassée (les instruments sont illimités) */
  munitions: number;
  son: string;
  /** la planche de l'icône du bonus (en jeu, dans le HUD, sur le bouton de tir) ; sans elle, le dessin de son tir */
  sprite?: string;
  tir: (ctx: Contexte, t: Tireur) => void;
  /** l'arme est un compagnon (voir `Compagnon`) : le tir part de lui, et il reste tant qu'il y a des munitions */
  compagnon?: boolean;
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
    nom: 'Lecteur minidisc',
    cadence: 18,
    munitions: 16,
    son: 'minidisc',
    sprite: 'arme-minidisc',
    tir: (ctx, t) => tire(ctx, t, MINIDISC),
    repliques: [
      'Un minidisc. Le futur, version 1999. Le son est compressé, mais pas le propos.',
      'Il lance des disques avec des ondes. Le lecteur CD a toujours su.',
    ],
  },
  {
    nom: 'Pile alcaline',
    cadence: 4,
    munitions: 70,
    son: 'pile',
    sprite: 'arme-pile',
    tir: (ctx, t) => tire(ctx, t, PILE, ctx.rng.entre(-0.35, 0.35)),
    repliques: [
      "Une pile alcaline. L'énergie, ça se lance.",
      'Tout le groupe tourne sur piles. Là, en rafale.',
    ],
  },
  {
    nom: 'Flipper',
    cadence: 30,
    munitions: 8,
    son: 'flipper',
    sprite: 'arme-flipper',
    tir: (ctx, t) => tire(ctx, t, FLIPPER, -2.2),
    repliques: [
      'Flipper ? Le dauphin ? ... Il a l’air content de rebondir. Moi aussi.',
      'Un dauphin. Pourquoi pas.',
    ],
  },
  {
    nom: 'Frisbee',
    cadence: 16,
    munitions: 14,
    son: 'frisbee',
    sprite: 'arme-frisbee',
    tir: (ctx, t) => tire(ctx, t, FRISBEE),
    repliques: ['Un frisbee téléguidé. Il revient toujours. Enfin, vers les autres.'],
  },
  {
    nom: 'Machine à donuts',
    cadence: 22,
    munitions: 14,
    son: 'donut',
    sprite: 'arme-donuts',
    tir: (ctx, t) => tire(ctx, t, DONUT, -1.4),
    repliques: [
      'Une machine à donuts. Explosifs, évidemment. Je vote pour.',
      'Sucré, rond, et ça fait boum.',
    ],
  },
  {
    nom: 'Boîtier de CD « L5 »',
    cadence: 26,
    munitions: 12,
    son: 'boitier',
    sprite: 'arme-boitier',
    // trois boîtiers lancés en cloche, en éventail
    tir: (ctx, t) => {
      for (const ecart of [-1.2, 0, 1.2]) tire(ctx, t, BOITIER, ecart);
    },
    repliques: [
      'L5. Il traînait dans la boîte à gants. Personne ne dira à qui il est.',
      'Tout le monde jure ne pas connaître. Pourtant, personne ne saute la piste 4.',
    ],
  },
  {
    nom: 'Chauffage soufflant',
    cadence: 3,
    munitions: 110,
    son: 'flamme',
    compagnon: true,
    tir: (ctx, t) => tire(ctx, t, JET_FLAMME, ctx.rng.entre(-0.5, 0.5)),
    repliques: [
      'Un chauffage soufflant. Il ronronne comme un vieil ampli. Il me suit partout : mignon ou inquiétant ?',
      "Il sent la poussière brûlée, c'est la base du rock. Et il crache du feu. Je l'adopte.",
    ],
  },
];

/** L'index de l'arme-compagnon dans ARMES_RAMASSABLES, plus un (comme `JoueurVue.arme`). */
export const ARME_CHAUFFAGE = ARMES_RAMASSABLES.findIndex((a) => a.compagnon) + 1;

/** L'arme d'index `i` (1 et plus : ramassées), ou null pour l'instrument. */
export const armeRamassee = (i: number): DefArme | null => ARMES_RAMASSABLES[i - 1] ?? null;
