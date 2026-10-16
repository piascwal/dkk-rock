import { describe, expect, it } from 'vitest';
import { NIVEAUX, niveauLu } from '../src/niveaux';
import { Carte } from '../src/monde/carte';
import { semeDecor } from '../src/rendu/decor';

describe('le décor', () => {
  it.each(NIVEAUX.map((n, i) => [n.id, i] as const))(
    '%s ne pose jamais un accessoire devant une échelle',
    (_id, i) => {
      const lu = niveauLu(i);
      const carte = new Carte(lu.largeur, lu.hauteur, lu.tuiles, lu.fond);
      const poses = semeDecor(carte, NIVEAUX[i]!.theme, 11 + i);
      for (const p of poses)
        for (let dx = -2; dx <= 2; dx++)
          for (let dy = 1; dy <= 5; dy++)
            expect(carte.props(p.tx + dx, p.ty - dy).echelle, `${p.quoi} en ${p.tx},${p.ty}`).toBe(false);
    },
  );
});
