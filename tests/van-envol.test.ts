import { describe, expect, it } from 'vitest';
import { VIES_DEPART } from '../src/config';
import { Objet } from '../src/entites/objets';
import { Partie } from '../src/jeu/partie';
import { G } from '../src/jeu/vue';

/** Le van du niveau, lancé : sa hauteur avant et après `n` pas. */
function depart(niveau: number, n: number): { avant: number; apres: number; e: number; g: number } {
  const p = new Partie({ niveau, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, 0);
  while (p.phase === 'histoire') p.suivant();
  const van = p.entites.find((e): e is Objet => e instanceof Objet && e.sorte === 'van')!;
  const avant = van.corps.y;
  p.lanceDepart(van);
  for (let i = 0; i < n; i++) {
    p.avance();
    p.releveEvenements();
  }
  return { avant, apres: van.corps.y, e: van.vue().e, g: van.vue().g };
}

describe('le van, au départ', () => {
  it('au sommet des Cimes, il décolle', () => {
    const { avant, apres, e, g } = depart(2, 60);
    expect(apres).toBeLessThan(avant - 20);
    expect(e).toBe(4);
    expect(g).toBe(G.VAN_REACTEUR);
  });

  it('ailleurs, il part sur la route', () => {
    const { avant, apres, e, g } = depart(0, 60);
    expect(apres).toBe(avant);
    expect(e).toBe(2);
    expect(g).toBe(G.VAN); // le van d'origine, sans réacteur
  });
});
