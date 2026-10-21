import { afterEach, describe, expect, it } from 'vitest';
import { dessineAura } from '../src/rendu/aura';

/** Un faux contexte de canvas : il note, à chaque rectangle tracé, le flou de l'ombre portée alors actif. */
function faux() {
  const reglages: Record<string, unknown> = {};
  const rectangles: number[] = [];
  const appels: string[] = [];
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (_, nom: string) => {
      if (nom === 'fillRect') return () => rectangles.push(Number(reglages.shadowBlur ?? 0));
      if (nom in reglages) return reglages[nom];
      return (...args: unknown[]) => void appels.push(`${nom}:${args.length}`);
    },
    set: (_, nom: string, v) => {
      reglages[nom] = v;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, reglages, rectangles, appels };
}

describe('l’aura d’invincibilité', () => {
  afterEach(() => {
    delete (globalThis as { document?: unknown }).document;
  });

  it('ne se trace jamais sous l’ombre portée des mondes sombres, et reste légère à tracer', () => {
    // les images du halo se fabriquent sur des canvas à part : un faux document suffit
    const toile = faux();
    (globalThis as unknown as { document: unknown }).document = {
      createElement: () => ({ width: 0, height: 0, getContext: () => toile.ctx }),
    };
    const f = faux();
    f.reglages.shadowBlur = 10; // la lueur d'un monde sombre est active quand l'aura se dessine
    f.reglages.shadowColor = '#8fe8ff';
    for (const temps of [0, 700, 1900, 40000]) {
      f.rectangles.length = 0;
      dessineAura(f.ctx, temps);
      expect(f.rectangles.length).toBeLessThan(150); // le halo et les rayons viennent d'une image, pas de 400 rectangles
      expect(f.rectangles.every((flou) => flou === 0)).toBe(true); // jamais de flou : un flou par rectangle ramait à 1 image/s
    }
    expect(f.appels.some((a) => a.startsWith('drawImage'))).toBe(true);
  });
});
