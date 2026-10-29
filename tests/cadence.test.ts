import { describe, expect, it } from 'vitest';
import { cadence } from '../src/rendu/cadence';

/** Combien d'images sont dessinées en une seconde, pour un écran à `hz` images par seconde (avec un peu de gigue). */
const dessinees = (hz: number, gigue = 0) => {
  const a = cadence(1000 / 60);
  let n = 0;
  for (let i = 0, t = 1000; i < hz; i++, t += 1000 / hz + (i % 2 ? gigue : -gigue)) if (a(t)) n++;
  return n;
};

describe('la cadence du rendu', () => {
  it('dessine toutes les images à 60 Hz, même avec un peu de gigue', () => {
    expect(dessinees(60)).toBeGreaterThanOrEqual(59);
    expect(dessinees(60, 1.5)).toBeGreaterThanOrEqual(59);
  });

  it('ne dessine qu’une image sur deux à 120 Hz, deux sur trois à 90 Hz : 60 par seconde', () => {
    for (const hz of [90, 120, 144]) {
      expect(dessinees(hz)).toBeGreaterThanOrEqual(58);
      expect(dessinees(hz)).toBeLessThanOrEqual(61);
    }
  });

  it('dessine chaque image sur un écran lent (30 Hz)', () => {
    expect(dessinees(30)).toBe(30);
  });
});
