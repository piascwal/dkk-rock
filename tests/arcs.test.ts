import { describe, expect, it } from 'vitest';
import { ARCS, arcDe, niveauOuvert, suivantDansArc } from '../src/niveaux/arcs';
import { NIVEAUX } from '../src/niveaux';

describe('les arcs de l’histoire', () => {
  it('chaque niveau appartient à un seul arc, et tous les niveaux sont dans un arc', () => {
    const tous = ARCS.flatMap((a) => a.niveaux);
    expect(new Set(tous).size).toBe(tous.length);
    expect([...tous].sort((a, b) => a - b)).toEqual(NIVEAUX.map((_, i) => i));
  });

  it('on passe d’un niveau au suivant de son arc, puis l’arc se termine', () => {
    const arc = ARCS[0]!;
    expect(suivantDansArc(arc.niveaux[0]!)).toBe(arc.niveaux[1]);
    expect(suivantDansArc(arc.niveaux.at(-1)!)).toBeNull();
    expect(arcDe(arc.niveaux[2]!)).toBe(arc);
  });

  it('un niveau s’ouvre quand le précédent de son arc est fait', () => {
    const [a, b, c] = ARCS[0]!.niveaux;
    expect(niveauOuvert(a!, [])).toBe(true);
    expect(niveauOuvert(b!, [])).toBe(false);
    expect(niveauOuvert(b!, [a!])).toBe(true);
    expect(niveauOuvert(c!, [a!])).toBe(false);
  });
});
