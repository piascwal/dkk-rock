import { describe, expect, it } from 'vitest';
import { SPECIAUX_MAX, VIES_DEPART } from '../src/config';
import { Objet } from '../src/entites/objets';
import { Partie } from '../src/jeu/partie';

const nouvelle = () => {
  const p = new Partie({ niveau: 0, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, 0);
  while (p.phase === 'histoire') p.suivant();
  return p;
};

/** Pose un médiator d'or sur le héros et le laisse le ramasser. */
const ramasse = (p: Partie) => {
  const j = p.joueurs[0]!;
  p.ajoute(new Objet(p, 'soin', j.corps.x, j.corps.y));
  for (let i = 0; i < 2; i++) {
    p.commande(0, 0);
    p.avance();
    p.releveEvenements();
  }
  return j;
};

describe('le médiator d’or', () => {
  it('redonne un spécial mais ne soigne pas', () => {
    const p = nouvelle();
    const j = p.joueurs[0]!;
    j.speciaux = 1;
    j.pv = 4;
    ramasse(p);
    expect(j.speciaux).toBe(2);
    expect(j.pv).toBe(4);
  });

  it(`ne fait pas dépasser ${SPECIAUX_MAX} spéciaux`, () => {
    const p = nouvelle();
    const j = p.joueurs[0]!;
    j.speciaux = SPECIAUX_MAX;
    ramasse(p);
    expect(j.speciaux).toBe(SPECIAUX_MAX);
  });
});
