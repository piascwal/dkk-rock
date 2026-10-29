import { describe, expect, it } from 'vitest';
import { cadence } from '../src/rendu/cadence';

/** Les images dessinées en `secondes` pour un écran à `hz`, avec de la gigue (ms) : leur nombre par seconde, et le plus long écart. */
const simule = (hz: number, gigue = 0, secondes = 20) => {
  const a = cadence(1000 / 60);
  let n = 0;
  let t = 1000;
  let derniere = 0;
  let plusLong = 0;
  for (let i = 0; i < hz * secondes; i++) {
    t += 1000 / hz + (i % 3 === 0 ? gigue : i % 3 === 1 ? -gigue : 0);
    if (!a(t)) continue;
    n++;
    if (derniere && i > hz) plusLong = Math.max(plusLong, t - derniere);
    derniere = t;
  }
  return { parSeconde: n / secondes, plusLong };
};

describe('la cadence du rendu', () => {
  it('ne touche à rien à 60 Hz ni en dessous, même avec de la gigue', () => {
    for (const hz of [24, 30, 50, 60])
      for (const gigue of [0, 1, 3]) expect(simule(hz, gigue).parSeconde).toBeCloseTo(hz, 0);
    // pas une seule image sautée : le plus long écart reste celui d'un seul intervalle (+ la gigue)
    expect(simule(60, 3).plusLong).toBeLessThan(1000 / 60 + 7);
  });

  it('dessine aussi chaque image à 72 et 75 Hz (pas de saccades)', () => {
    for (const hz of [72, 75]) expect(simule(hz, 1).parSeconde).toBeCloseTo(hz, 0);
  });

  it('plafonne à 60 images par seconde sur les écrans à 90, 120, 144 et 165 Hz', () => {
    for (const hz of [90, 120, 144, 165]) {
      const { parSeconde } = simule(hz, 0.5);
      expect(parSeconde).toBeGreaterThan(58);
      expect(parSeconde).toBeLessThan(62);
    }
  });

  it('un écran qui passe en économie d’énergie (de 120 à 60 Hz) reprend le dessin de chaque image', () => {
    const a = cadence(1000 / 60);
    let t = 0;
    for (let i = 0; i < 240; i++) a((t += 1000 / 120));
    let n = 0;
    for (let i = 0; i < 120; i++) if (a((t += 1000 / 60))) n++;
    expect(n).toBeGreaterThanOrEqual(115);
  });
});
