import { describe, expect, it } from 'vitest';
import { SAUVEGARDE_VIDE, valideSauvegarde } from '../src/jeu/sauvegarde';

describe('la sauvegarde', () => {
  it('relit une sauvegarde correcte', () => {
    const s = valideSauvegarde(
      {
        version: 1,
        enCours: { niveau: 2, drapeau: 1, vies: 4, score: 900 },
        niveauMax: 3,
        membre: 4,
        pseudo: 'MAT',
        son: false,
        musique: true,
      },
      6,
    );
    expect(s.enCours).toEqual({ niveau: 2, drapeau: 1, vies: 4, score: 900 });
    expect(s).toMatchObject({ niveauMax: 3, membre: 4, pseudo: 'MAT', son: false, musique: true });
  });

  it('répare une sauvegarde abîmée ou d’une ancienne version du jeu', () => {
    expect(valideSauvegarde(null, 6)).toEqual(SAUVEGARDE_VIDE);
    expect(valideSauvegarde('n’importe quoi', 6)).toEqual(SAUVEGARDE_VIDE);
    const s = valideSauvegarde(
      { enCours: { niveau: 42, drapeau: 'x', vies: -3 }, niveauMax: 99, membre: 12 },
      6,
    );
    expect(s.enCours).toEqual({ niveau: 0, drapeau: -1, vies: 5, score: 0 });
    expect(s.niveauMax).toBe(0);
    expect(s.membre).toBe(0);
  });
});
