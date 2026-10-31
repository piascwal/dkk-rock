import { describe, expect, it } from 'vitest';
import { VIES_DEPART } from '../src/config';
import { Partie } from '../src/jeu/partie';

// l'écran de fin compte depuis le début du niveau : une défaite (plus de vies) ou « recommencer » ne remet à zéro ni le temps,
// ni les convertis, ni le score ; seul un nouveau niveau repart de zéro
describe('les statistiques du niveau', () => {
  const enJeu = () => {
    const p = new Partie({ niveau: 0, drapeau: -1, vies: VIES_DEPART, score: 0 });
    p.ajouteJoueur(0, 0);
    while (p.phase === 'histoire') p.suivant();
    p.tempsNiveau = 1234;
    p.convertis[0] = 7;
    p.score = 4200;
    return p;
  };

  it('survivent à une défaite', () => {
    const p = enJeu();
    p.phase = 'perdu';
    while (p.phase === 'perdu') p.suivant();
    expect(p.phase).toBe('jeu');
    expect(p.tempsNiveau).toBeGreaterThanOrEqual(1234);
    expect(p.convertis[0]).toBe(7);
    expect(p.score).toBe(4200);
  });

  it('survivent à « recommencer »', () => {
    const p = enJeu();
    p.recommence(true);
    expect(p.tempsNiveau).toBe(1234);
    expect(p.convertis[0]).toBe(7);
  });

  it('repartent de zéro au niveau suivant', () => {
    const p = enJeu();
    p.charge(1, -1);
    expect(p.tempsNiveau).toBe(0);
    expect(p.convertis[0]).toBe(0);
  });
});
