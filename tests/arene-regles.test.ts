import { describe, expect, it } from 'vitest';
import { HEROS } from '../src/entites/heros';
import { BAGUETTE } from '../src/entites/projectiles-defs';
import { Partie } from '../src/jeu/partie';
import { NIVEAUX } from '../src/niveaux';
import type { Evenement } from '../src/jeu/vue';
import { nomArene } from '../src/ui/noms-arene';

const TOUR = NIVEAUX.findIndex((d) => d.id === 'arene-tour-de-mixage');

/** Un battle royale hors ligne à `n` joueurs, au combat. */
function combat(n: number): Partie {
  const p = new Partie({ niveau: TOUR, drapeau: -1, vies: 0, score: 0 });
  for (let s = 0; s < n; s++) p.ajouteJoueur(s, 0);
  p.ouvreArene({ ennemis: false }, false);
  for (let i = 0; i < 200; i++) p.avance();
  return p;
}

const garde = (p: Partie, n: number): Evenement[] => {
  const l: Evenement[] = [];
  for (let i = 0; i < n; i++) {
    p.avance();
    l.push(...p.releveEvenements());
  }
  return l;
};

describe('le battle royale : règles de combat', () => {
  it('aucune protection après un coup reçu : le suivant touche aussi', () => {
    const p = combat(2);
    const b = p.joueurs[1]!;
    b.invulnerable = 0;
    b.blesse(1, p, 1);
    expect(b.invulnerable).toBe(0);
    p.avance();
    b.blesse(1, p, 1);
    expect(b.pv).toBe(1);
  });

  it('chaque manche tire les personnages au hasard, sans doublon', () => {
    const vus = new Set<string>();
    for (let k = 0; k < 8; k++) {
      const p = combat(5);
      const membres = p.joueurs.flatMap((j) => (j ? [j.membre] : []));
      expect(new Set(membres).size).toBe(HEROS.length);
      vus.add(membres.join(','));
    }
    expect(vus.size).toBeGreaterThan(1);
  });

  it('le fil des éliminations : qui a éliminé qui, ou qui s’est éliminé seul ; pas de message de mort habituel', () => {
    const p = combat(2);
    const [a, b] = [p.joueurs[0]!, p.joueurs[1]!];
    b.dernierTireur = a.id;
    b.meurt(p);
    a.dernierTireur = null;
    a.meurt(p);
    const l = garde(p, 3);
    const elim = l.filter((e) => e.k === 'elim');
    expect(elim).toHaveLength(2);
    expect(elim).toContainEqual({ k: 'elim', tueur: 0, victime: 1 });
    expect(elim).toContainEqual({ k: 'elim', tueur: -1, victime: 0 });
    expect(l.some((e) => e.k === 'bulle')).toBe(false);
  });

  it('les noms sont les pseudos ; un joueur de l’ordinateur s’appelle « Ordi » et son siège', () => {
    expect(nomArene(['Léa', ''], 0)).toBe('Léa');
    expect(nomArene(['Léa', ''], 1)).toBe('Ordi 1');
  });

  it('la baguette de JBT part tout droit', () => {
    expect(BAGUETTE.gravite).toBe(0);
  });
});
