import { describe, expect, it } from 'vitest';
import { SAUVEGARDE_VIDE, valideSauvegarde } from '../src/jeu/sauvegarde';

describe('la sauvegarde', () => {
  it('relit une sauvegarde correcte', () => {
    const s = valideSauvegarde(
      {
        version: 1,
        enCours: { niveau: 2, drapeau: 1, vies: 4, score: 900 },
        faits: [0, 1, 1, 9, -2],
        membre: 4,
        pseudo: 'MAT',
        son: false,
        musique: true,
      },
      6,
    );
    expect(s.enCours).toEqual({ niveau: 2, drapeau: 1, vies: 4, score: 900 });
    expect(s).toMatchObject({ faits: [0, 1], membre: 4, pseudo: 'MAT', son: false, musique: true });
  });

  it('lit une ancienne sauvegarde (niveauMax) : les niveaux d’avant sont faits', () => {
    expect(valideSauvegarde({ niveauMax: 3 }, 6).faits).toEqual([0, 1, 2]);
  });

  it('répare une sauvegarde abîmée ou d’une ancienne version du jeu', () => {
    expect(valideSauvegarde(null, 6)).toEqual(SAUVEGARDE_VIDE);
    expect(valideSauvegarde('n’importe quoi', 6)).toEqual(SAUVEGARDE_VIDE);
    const s = valideSauvegarde(
      { enCours: { niveau: 42, drapeau: 'x', vies: -3 }, niveauMax: 99, membre: 12 },
      6,
    );
    expect(s.enCours).toEqual({ niveau: 0, drapeau: -1, vies: 5, score: 0 });
    expect(s.faits).toEqual([]); // niveauMax hors limites : rien n'est compté comme fait
    expect(s.membre).toBe(0);
  });
});
