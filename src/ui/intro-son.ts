import type { Synthe } from '../audio/synthe';

/**
 * La musique de l'intro, réglée sur l'image (voir intro.ts) : un accord à chaque héros qui entre, une cymbale quand ils
 * sortent leurs instruments, un gros coup quand le logo s'écrase, puis un riff qui pousse jusqu'au menu.
 */
export const ENTREES = [0.3, 0.75, 1.2, 1.65, 2.1];
export const INSTRUMENTS = 2.8;
export const IMPACT = 3.6;
export const FIN = 7.6;

const MI3 = 164.81;
const accords = [MI3, 196, 220, 246.94, 293.66];

export function joueIntro(s: Synthe): void {
  const ctx = s.ctx;
  if (!ctx) return;
  const t0 = ctx.currentTime + 0.05;
  const accord = (t: number, f: number, duree = 0.4, v = 0.12) => {
    s.note({ freq: f, duree, type: 'sawtooth', volume: v, distordu: true, quand: t0 + t });
    s.note({ freq: f * 1.5, duree, type: 'sawtooth', volume: v * 0.8, distordu: true, quand: t0 + t });
  };
  const grosse = (t: number, v = 0.5) =>
    s.note({ freq: 140, vers: 40, duree: 0.25, type: 'sine', volume: v, quand: t0 + t });
  const claire = (t: number) => s.bruit({ duree: 0.14, volume: 0.25, passeHaut: 1600, quand: t0 + t });
  ENTREES.forEach((t, i) => {
    accord(t, accords[i]!);
    grosse(t, 0.35);
  });
  // les instruments : roulement de caisse claire, cymbale, accord tenu
  for (let k = 0; k < 4; k++) claire(INSTRUMENTS - 0.32 + k * 0.08);
  s.bruit({ duree: 1.4, volume: 0.22, passeHaut: 3500, quand: t0 + INSTRUMENTS });
  accord(INSTRUMENTS, MI3, 0.8, 0.14);
  // le logo s'écrase
  s.note({ freq: 110, vers: 30, duree: 0.7, type: 'sine', volume: 0.8, quand: t0 + IMPACT });
  s.bruit({ duree: 1, volume: 0.45, passeBas: 900, quand: t0 + IMPACT });
  accord(IMPACT, MI3 / 2, 1.2, 0.16);
  // le riff qui pousse : croches étouffées, grosse caisse et caisse claire (150 à la noire)
  const riff = [1, 1, 1, 1, 1.189, 1.189, 1.335, 1.335];
  for (let k = 0; k < 16; k++) {
    const t = IMPACT + 0.8 + k * 0.2;
    s.note({
      freq: MI3 * riff[k % 8]!,
      duree: 0.12,
      type: 'sawtooth',
      volume: 0.1,
      distordu: true,
      filtre: 900,
      quand: t0 + t,
    });
    if (k % 2 === 0) grosse(t, 0.4);
    if (k % 4 === 2) claire(t);
  }
  accord(IMPACT + 4, MI3, 1.2, 0.14);
}
