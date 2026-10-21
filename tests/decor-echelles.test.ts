import { describe, expect, it } from 'vitest';
import { NIVEAUX, niveauLu } from '../src/niveaux';
import { Carte } from '../src/monde/carte';
import { T } from '../src/monde/tuiles';
import { emprise } from '../src/rendu/decor-sol';
import { semeDecor } from '../src/rendu/decor';

const semis = (i: number) => {
  const lu = niveauLu(i);
  const carte = new Carte(lu.largeur, lu.hauteur, lu.tuiles, lu.fond);
  return { carte, poses: semeDecor(carte, NIVEAUX[i]!.theme, 11 + i, NIVEAUX[i]!.decor, NIVEAUX[i]!.semis) };
};

describe('le décor', () => {
  it.each(NIVEAUX.map((n, i) => [n.id, i] as const))(
    '%s ne pose jamais un accessoire devant une échelle',
    (_id, i) => {
      const { carte, poses } = semis(i);
      for (const p of poses)
        for (let dx = -2; dx <= 2; dx++)
          for (let dy = 1; dy <= 5; dy++)
            expect(carte.props(p.tx + dx, p.ty - dy).echelle, `${p.quoi} en ${p.tx},${p.ty}`).toBe(false);
    },
  );

  it.each(NIVEAUX.map((n, i) => [n.id, i] as const))(
    '%s : un accessoire d’intérieur ne recouvre ni une tuile (caisse, échelle) ni un autre accessoire',
    (_id, i) => {
      const { carte, poses } = semis(i);
      const vues = new Set<string>();
      for (const p of poses) {
        for (const [x, y] of emprise(p.tx, p.ty)) {
          const cle = `${x},${y}`;
          expect(vues.has(cle), `${p.quoi} recouvre une autre case en ${cle}`).toBe(false);
          vues.add(cle);
          if (p.dedans) expect(carte.get(x, y), `${p.quoi} recouvre une tuile en ${cle}`).toBe(T.VIDE);
        }
      }
    },
  );
});
