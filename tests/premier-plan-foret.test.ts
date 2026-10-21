import { describe, expect, it } from 'vitest';
import { TUILE } from '../src/config';
import { Aleatoire } from '../src/moteur/maths';
import { T } from '../src/monde/tuiles';
import { NIVEAUX, niveauLu } from '../src/niveaux';
import { terrainDe } from '../src/rendu/premier-plan';
import { PREMIER_PLAN_FORET } from '../src/rendu/premier-plan-foret';

describe('le premier plan de la forêt bretonne', () => {
  it('des chênes posés sur le sol, tout au long du niveau, jamais sur les planches', () => {
    const lu = niveauLu(NIVEAUX.findIndex((n) => n.id === 'foret'));
    const terrain = terrainDe(lu);
    const poses = PREMIER_PLAN_FORET.pose(terrain, new Aleatoire(29));
    expect(poses.length).toBeGreaterThan(20);
    expect(Math.max(...poses.map((o) => o.x))).toBeGreaterThan((lu.largeur - 25) * TUILE);
    for (const o of poses) {
      const s = terrain.surface(Math.floor(o.x / TUILE))!;
      expect(o.y).toBe(s.ty * TUILE); // le pied touche la surface
      expect([T.TERRE, T.ROCHE]).toContain(s.tuile);
    }
  });

  it('le thème de la forêt en déclare un, avec ses sortes d’éléments', () => {
    const ctx = new Proxy({}, { get: () => () => {}, set: () => true });
    (globalThis as unknown as { document: unknown }).document = {
      createElement: () => ({ width: 0, height: 0, getContext: () => ctx }),
    };
    try {
      const sortes = PREMIER_PLAN_FORET.sortes(new Aleatoire(29));
      expect(sortes.length).toBeGreaterThanOrEqual(3);
      for (const s of sortes) expect(s.prolonge).toBe(true); // le tronc plonge jusqu'au fond du niveau
    } finally {
      delete (globalThis as { document?: unknown }).document;
    }
  });
});
