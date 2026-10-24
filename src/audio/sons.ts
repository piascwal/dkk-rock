import { noteDe } from './melodies';
import type { Synthe } from './synthe';

type Son = (s: Synthe, v: number) => void;

const accord = (s: Synthe, v: number, f: number, d = 0.18) => {
  s.note({ freq: f, duree: d, type: 'sawtooth', volume: 0.12 * v, distordu: true });
  s.note({ freq: f * 1.5, duree: d, type: 'sawtooth', volume: 0.1 * v, distordu: true });
};

/** Le catalogue des bruitages, par nom (les noms sont ceux que la partie émet). */
const SONS: Record<string, Son> = {
  // le tir de base de JBT : un claquement de baguette, assez fort pour se détacher de la musique
  baguette: (s, v) => {
    s.bruit({ duree: 0.05, volume: 0.5 * v, passeHaut: 3000 });
    s.note({ freq: 1400, vers: 900, duree: 0.03, type: 'triangle', volume: 0.12 * v });
  },
  cri: (s, v) => {
    s.note({
      freq: 520 + Math.random() * 80,
      vers: 380,
      duree: 0.25,
      type: 'sawtooth',
      volume: 0.08 * v,
      filtre: 1800,
    });
    s.bruit({ duree: 0.2, volume: 0.08 * v, passeHaut: 1200 });
  },
  accord: (s, v) => accord(s, v, [82, 98, 110, 123][Math.floor(Math.random() * 4)]!),
  riff: (s, v) => accord(s, v, [110, 147][Math.floor(Math.random() * 2)]!, 0.12),
  basse: (s, v) =>
    s.note({ freq: 55, vers: 40, duree: 0.35, type: 'sawtooth', volume: 0.3 * v, filtre: 400 }),
  solo: (s, v) =>
    s.note({
      freq: 660 + Math.random() * 600,
      duree: 0.09,
      type: 'sawtooth',
      volume: 0.08 * v,
      distordu: true,
    }),
  special: (s, v) => accord(s, v, 82, 0.6),
  ampli: (s, v) => {
    accord(s, v, 65, 0.4);
    s.bruit({ duree: 0.3, volume: 0.2 * v, passeBas: 800 });
  },
  // un boîtier de CD qui claque : un petit clac de plastique, un cliquetis
  boitier: (s, v) => {
    s.note({ freq: 1100, vers: 600, duree: 0.05, type: 'square', volume: 0.07 * v });
    s.bruit({ duree: 0.04, volume: 0.06 * v, passeHaut: 4000 });
  },
  // les armes du lot 9 : un disque qui siffle, un clic de pile, le cri d'un dauphin, un coup de vent, un « pop » sucré
  minidisc: (s, v) => {
    s.note({ freq: 520, vers: 940, duree: 0.2, type: 'triangle', volume: 0.12 * v });
    s.bruit({ duree: 0.08, volume: 0.04 * v, passeHaut: 3000 });
  },
  pile: (s, v) => {
    s.note({ freq: 1500, vers: 900, duree: 0.04, type: 'square', volume: 0.06 * v });
    s.bruit({ duree: 0.03, volume: 0.05 * v, passeHaut: 2500 });
  },
  flipper: (s, v) => {
    s.note({ freq: 1500, vers: 2400, duree: 0.12, type: 'sine', volume: 0.12 * v });
    s.note({
      freq: 2400,
      vers: 1700,
      duree: 0.1,
      type: 'sine',
      volume: 0.1 * v,
      quand: s.ctx ? s.ctx.currentTime + 0.1 : 0,
    });
  },
  frisbee: (s, v) => {
    s.bruit({ duree: 0.18, volume: 0.06 * v, passeHaut: 1500 });
    s.note({ freq: 380, vers: 720, duree: 0.2, type: 'triangle', volume: 0.07 * v });
  },
  donut: (s, v) => {
    s.note({ freq: 320, vers: 140, duree: 0.12, type: 'sine', volume: 0.16 * v });
    s.bruit({ duree: 0.06, volume: 0.05 * v, passeBas: 1500 });
  },
  flamme: (s, v) => s.bruit({ duree: 0.08, volume: 0.06 * v, passeBas: 1200 }),
  cornemuse: (s, v) => {
    s.note({ freq: 233, duree: 0.5, type: 'sawtooth', volume: 0.07 * v, filtre: 1500 });
    s.note({ freq: 466, duree: 0.5, type: 'square', volume: 0.04 * v, filtre: 2000 });
  },
  triangle: (s, v) => s.note({ freq: 2637, duree: 0.6, type: 'sine', volume: 0.12 * v }),
  gong: (s, v) => {
    s.note({ freq: 110, duree: 1.4, type: 'sine', volume: 0.3 * v });
    s.note({ freq: 157, duree: 1.2, type: 'triangle', volume: 0.12 * v });
  },
  // le van démarre : un moteur qui s'emballe, puis les pneus qui crissent et les graviers
  demarrage: (s, v) => {
    s.note({
      freq: 60,
      vers: 140,
      duree: 0.5,
      type: 'sawtooth',
      volume: 0.16 * v,
      filtre: 600,
      distordu: true,
    });
    s.bruit({ duree: 0.4, volume: 0.1 * v, passeBas: 900 });
  },
  derapage: (s, v) => {
    s.note({
      freq: 140,
      vers: 420,
      duree: 1.3,
      type: 'sawtooth',
      volume: 0.16 * v,
      filtre: 900,
      distordu: true,
    });
    s.bruit({ duree: 0.9, volume: 0.18 * v, passeHaut: 1800 });
    s.bruit({ duree: 1.2, volume: 0.14 * v, passeBas: 2200 });
  },
  saut: (s, v) => s.note({ freq: 260, vers: 520, duree: 0.1, type: 'square', volume: 0.05 * v }),
  // la glissade de JBG sous un portique : un frottement qui descend
  glisse: (s, v) => s.bruit({ duree: 0.25, volume: 0.08 * v, passeBas: 1400 }),
  aie: (s, v) => s.note({ freq: 300, vers: 120, duree: 0.2, type: 'square', volume: 0.12 * v }),
  mort: (s, v) =>
    s.note({ freq: 440, vers: 60, duree: 0.7, type: 'sawtooth', volume: 0.12 * v, distordu: true }),
  alerte: (s, v) => s.note({ freq: 880, duree: 0.08, type: 'square', volume: 0.05 * v }),
  autotune: (s, v) => {
    const f = [523, 587, 659, 784][Math.floor(Math.random() * 4)]!;
    s.note({ freq: f, duree: 0.18, type: 'square', volume: 0.05 * v, filtre: 3000 });
  },
  drop: (s, v) => s.note({ freq: 900, vers: 100, duree: 0.5, type: 'sine', volume: 0.12 * v }),
  flash: (s, v) => s.bruit({ duree: 0.1, volume: 0.15 * v, passeHaut: 4000 }),
  boum: (s, v) => s.note({ freq: 140, vers: 40, duree: 0.25, type: 'sine', volume: 0.35 * v }),
  laser: (s, v) => s.note({ freq: 1600, vers: 400, duree: 0.12, type: 'square', volume: 0.05 * v }),
  hypnose: (s, v) => s.note({ freq: 300, vers: 900, duree: 0.6, type: 'sine', volume: 0.1 * v }),
  explosion: (s, v) => {
    s.bruit({ duree: 0.5, volume: 0.4 * v, passeBas: 2000 });
    s.note({ freq: 90, vers: 30, duree: 0.4, type: 'sine', volume: 0.3 * v });
  },
  'grosse-explosion': (s, v) => {
    s.bruit({ duree: 1, volume: 0.5 * v, passeBas: 1500 });
    s.note({ freq: 70, vers: 25, duree: 0.8, type: 'sine', volume: 0.4 * v });
  },
  colle: (s, v) => s.note({ freq: 200, duree: 0.05, type: 'square', volume: 0.06 * v }),
  rebond: (s, v) => s.note({ freq: 700, duree: 0.04, type: 'triangle', volume: 0.05 * v }),
  picore: (s, v) => s.note({ freq: 1800, duree: 0.03, type: 'square', volume: 0.05 * v }),
  chute: (s, v) => s.bruit({ duree: 0.15, volume: 0.15 * v, passeBas: 600 }),
  // le plongeur entre dans la rivière : une gerbe d'écume et un « ploc » grave
  plouf: (s, v) => {
    s.bruit({ duree: 0.5, volume: 0.28 * v, passeBas: 1400 });
    s.note({ freq: 220, vers: 70, duree: 0.25, type: 'sine', volume: 0.2 * v });
  },
  // le rêve de JBT : une pile ramassée, un choc électrique, une étoile filante, le réveil qui sonne
  tintement: (s, v) => s.note({ freq: 1320, vers: 1980, duree: 0.06, type: 'sine', volume: 0.07 * v }),
  zap: (s, v) => {
    s.note({ freq: 1200, vers: 90, duree: 0.25, type: 'sawtooth', volume: 0.12 * v });
    s.bruit({ duree: 0.2, volume: 0.12 * v, passeHaut: 3000 });
  },
  // l'avion de JBG : les réacteurs qui montent en régime
  moteur: (s, v) => {
    s.bruit({ duree: 1.4, volume: 0.12 * v, passeBas: 500 });
    s.note({ freq: 90, vers: 160, duree: 1.4, type: 'sawtooth', volume: 0.05 * v, filtre: 400 });
  },
  fuse: (s, v) => s.bruit({ duree: 0.35, volume: 0.07 * v, passeHaut: 3500 }),
  reveil: (s, v) =>
    [0, 1, 2, 3, 4, 5, 6, 7].forEach((i) =>
      s.note({
        freq: i % 2 ? 1760 : 2093,
        duree: 0.07,
        type: 'square',
        volume: 0.06 * v,
        quand: (s.ctx?.currentTime ?? 0) + i * 0.08,
      }),
    ),
  tyrolienne: (s, v) => s.bruit({ duree: 0.4, volume: 0.06 * v, passeHaut: 2500 }),
  rugissement: (s, v) => {
    s.note({ freq: 90, vers: 60, duree: 0.8, type: 'sawtooth', volume: 0.2 * v, filtre: 600 });
    s.bruit({ duree: 0.6, volume: 0.15 * v, passeBas: 900 });
  },
  sirene: (s, v) =>
    s.note({ freq: 400, vers: 1200, duree: 1, type: 'sawtooth', volume: 0.08 * v, filtre: 2000 }),
  liberation: (s, v) =>
    [392, 494, 587, 784].forEach((f, i) =>
      s.note({
        freq: f,
        duree: 0.15,
        type: 'square',
        volume: 0.07 * v,
        quand: (s.ctx?.currentTime ?? 0) + i * 0.08,
      }),
    ),
  drapeau: (s, v) => [330, 440, 554, 659].forEach((f, i) => accordRetarde(s, v, f / 4, i * 0.1)),
  ramasse: (s, v) =>
    [660, 880, 1320].forEach((f, i) =>
      s.note({
        freq: f,
        duree: 0.1,
        type: 'square',
        volume: 0.06 * v,
        quand: (s.ctx?.currentTime ?? 0) + i * 0.05,
      }),
    ),
  victoire: (s, v) => [82, 110, 123, 165].forEach((f, i) => accordRetarde(s, v, f, i * 0.18, 0.5)),
};

function accordRetarde(s: Synthe, v: number, f: number, retard: number, d = 0.25): void {
  const t = (s.ctx?.currentTime ?? 0) + retard;
  s.note({ freq: f, duree: d, type: 'sawtooth', volume: 0.12 * v, distordu: true, quand: t });
  s.note({ freq: f * 1.5, duree: d, type: 'sawtooth', volume: 0.1 * v, distordu: true, quand: t });
}

/** Joue les sons, en atténuant ceux qui viennent de loin et en évitant les rafales du même son. */
export class Bruitages {
  private derniers = new Map<string, number>();

  constructor(private readonly s: Synthe) {}

  joue(nom: string, distance = 0): void {
    if (!this.s.pret) return;
    const v = Math.max(0, 1 - distance / 450);
    if (v <= 0.05) return;
    const t = performance.now();
    const base = nom.split(':')[0]!;
    if (t - (this.derniers.get(base) ?? 0) < 45) return;
    this.derniers.set(base, t);
    const note = noteDe(nom);
    if (note) {
      note.m.joue(this.s, v, note.pas);
      this.s.retireMusique(v);
    } else SONS[base]?.(this.s, v);
  }
}
