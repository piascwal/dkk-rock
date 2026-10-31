import { describe, expect, it } from 'vitest';
import { NIVEAUX, niveauLu } from '../src/niveaux';
import { ErreurNiveau, litNiveau } from '../src/niveaux/format';
import { ENNEMIS_PAR_LETTRE } from '../src/entites/ennemis/definitions';
import { casesAccessibles } from './accessibilite';
import { ESSAIS, REFONTES, versionDe } from '../src/niveaux/refontes';

describe('les niveaux', () => {
  it.each(NIVEAUX.map((n, i) => [n.id, i] as const))('%s se lit sans erreur', (_id, i) => {
    const lu = niveauLu(i);
    for (const e of lu.ennemis) expect(ENNEMIS_PAR_LETTRE[e.lettre], `ennemi ${e.lettre}`).toBeDefined();
    // une arène du battle royale n'a ni histoire ni fin (voir arene.test.ts)
    if (lu.def.arene) return;
    expect(lu.def.intro.length).toBeGreaterThan(0);
    // un mini-jeu (le pré du Clos) n'a ni niveau de plateforme à parcourir ni bilan
    if (lu.def.miniJeu) return;
    expect(lu.largeur).toBeGreaterThan(60);
    expect(lu.def.outro.length).toBeGreaterThan(0);
  });

  it.each(NIVEAUX.flatMap((n, i) => (n.arene ? [] : [[n.id, i] as const])))(
    '%s : on atteint la fin sans rien détruire',
    (_id, i) => {
      const lu = niveauLu(i);
      const acces = casesAccessibles(lu);
      const cible = lu.boss.find((b) => b.lettre === 'Z') ?? lu.fin!;
      const atteint = [...acces].some((k) => {
        const [x, y] = k.split(',').map(Number) as [number, number];
        return Math.abs(x - cible.tx) <= 2 && Math.abs(y - cible.ty) <= 1;
      });
      expect(atteint).toBe(true);
    },
  );

  it('chaque drapeau est atteignable', () => {
    NIVEAUX.forEach((_n, i) => {
      const lu = niveauLu(i);
      const acces = casesAccessibles(lu);
      for (const d of lu.drapeaux)
        expect(acces.has(`${d.tx},${d.ty}`), `${lu.def.id} drapeau ${d.tx}`).toBe(true);
    });
  });

  it('refuse une carte incohérente', () => {
    const base = { ...NIVEAUX[0]!, dialogues: {} };
    expect(() => litNiveau({ ...base, carte: ['   ', '###'] })).toThrow(ErreurNiveau);
    expect(() => litNiveau({ ...base, carte: [' @ F ', '#####', ' ?   '] })).toThrow(/inconnu/);
    expect(() => litNiveau({ ...base, carte: ['@ ( F', '#####'] })).toThrow(/tyrolienne/);
    expect(() => litNiveau({ ...base, carte: ['@ 7 F', '#####'] })).toThrow(/dialogue/);
  });
});

// les niveaux refaits (voir niveaux/refontes.ts), publiés ou encore en essai : les mêmes exigences que les originaux
describe('les niveaux refaits', () => {
  const refaits = NIVEAUX.filter((n) => n.id in REFONTES || n.id in ESSAIS).map((n) =>
    litNiveau(versionDe(n, true)),
  );
  it.each(refaits.map((lu) => [lu.def.id, lu] as const))(
    '%s : on atteint la fin et chaque drapeau sans rien détruire',
    (_id, lu) => {
      for (const e of lu.ennemis) expect(ENNEMIS_PAR_LETTRE[e.lettre], `ennemi ${e.lettre}`).toBeDefined();
      const acces = casesAccessibles(lu);
      const cible = lu.boss.find((b) => b.lettre === 'Z') ?? lu.fin!;
      const atteint = [...acces].some((k) => {
        const [x, y] = k.split(',').map(Number) as [number, number];
        return Math.abs(x - cible.tx) <= 2 && Math.abs(y - cible.ty) <= 1;
      });
      expect(atteint).toBe(true);
      for (const d of lu.drapeaux) expect(acces.has(`${d.tx},${d.ty}`), `drapeau ${d.tx}`).toBe(true);
    },
  );
});
