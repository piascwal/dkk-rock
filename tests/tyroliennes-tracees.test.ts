import { describe, expect, it } from 'vitest';
import { TUILE } from '../src/config';
import { DocumentNiveau } from '../src/editeur/document';
import { TraceTyrolienne } from '../src/editeur/tyroliennes-tracees';
import { litNiveau } from '../src/niveaux/format';
import { valideDef } from '../src/niveaux/mes-niveaux';
import { chaineDeTyroliennes } from '../src/niveaux/tyroliennes';

describe('les tyroliennes tracées poteau par poteau', () => {
  it('une tyrolienne se lit dans le sens où on l’a tracée, mais ne revient pas en arrière', () => {
    const l = chaineDeTyroliennes([
      [30, 4],
      [20, 9],
      [10, 2],
    ]);
    expect(l.map((t) => t.x1)).toEqual([10 * TUILE + 8, 20 * TUILE + 8]);
    expect(l[0]!.suivante).toBe(l[1]);
    expect(l[1]!.precedente).toBe(l[0]);
    expect(() => chaineDeTyroliennes([[3, 3]])).toThrow(/un seul poteau/);
    expect(() =>
      chaineDeTyroliennes([
        [3, 3],
        [8, 3],
        [5, 3],
      ]),
    ).toThrow(/en arrière/);
  });

  it('deux tyroliennes qui se croisent, l’une commencée avant la fin de l’autre : rien n’est déduit', () => {
    const d = DocumentNiveau.arene(60, 30);
    const outil = new TraceTyrolienne();
    const trace = (poteaux: [number, number][]) => {
      for (const [x, y] of [...poteaux, poteaux.at(-1)!]) {
        d.commence();
        outil.poteau(d, x, y);
        d.termine();
      }
    };
    trace([
      [5, 4],
      [40, 20],
    ]); // en haut à gauche, vers le bas à droite
    trace([
      [10, 20],
      [30, 12],
      [50, 3],
    ]); // en bas à gauche, vers le haut : elle croise la première
    expect(d.tyroliennes).toEqual([
      [
        [5, 4],
        [40, 20],
      ],
      [
        [10, 20],
        [30, 12],
        [50, 3],
      ],
    ]);
    const lu = litNiveau(d.versDef('croisees'));
    expect(lu.tyroliennes.length).toBe(3);
    // l'annulation retire le dernier poteau posé, l'export et Mes niveaux gardent tout
    d.annule();
    expect(d.tyroliennes[1]!.length).toBe(2);
    d.refait();
    const relu = DocumentNiveau.depuisJSON(JSON.stringify(d.versJSON()));
    expect(relu.tyroliennes).toEqual(d.tyroliennes);
    expect(valideDef(d.versDef('x'), 'y')!.tyroliennes).toEqual(d.tyroliennes);
  });

  it('reprendre une tyrolienne par un bout, la gomme, un poteau seul qui s’en va', () => {
    const d = DocumentNiveau.arene(60, 30);
    const outil = new TraceTyrolienne();
    d.tyroliennes = [
      [
        [5, 4],
        [15, 8],
      ],
    ];
    outil.poteau(d, 15, 8); // le bout : on la reprend
    outil.poteau(d, 25, 6);
    expect(d.tyroliennes[0]).toEqual([
      [5, 4],
      [15, 8],
      [25, 6],
    ]);
    expect(outil.dernier(d)).toEqual([25, 6]);
    outil.poteau(d, 20, 3); // dans l'autre sens : celle-ci est finie, une autre commence
    expect(d.tyroliennes.length).toBe(2);
    outil.finit(d); // un seul poteau : elle s'en va
    expect(d.tyroliennes.length).toBe(1);
    outil.gomme(d, 15, 8);
    expect(d.tyroliennes[0]!.length).toBe(2);
    outil.gomme(d, 25, 6);
    expect(d.tyroliennes).toEqual([]);
  });
});
