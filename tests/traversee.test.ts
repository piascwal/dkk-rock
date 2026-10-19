import { describe, expect, it } from 'vitest';
import { HEROS_HAUTEUR, TUILE, VIES_DEPART } from '../src/config';
import { Partie } from '../src/jeu/partie';
import { G } from '../src/jeu/vue';
import { T } from '../src/monde/tuiles';

/** La traversée (niveau 9 de la liste), le héros sur le pont (déjà à bord). */
function surLePont() {
  const p = new Partie({ niveau: 9, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, 0);
  while (p.phase === 'histoire') p.suivant();
  const emb = p.lu.embarquement!;
  const j = p.joueurs[0]!;
  Object.assign(j.corps, { x: emb.x + 5 * TUILE, y: emb.y + TUILE - HEROS_HAUTEUR });
  const pas = (n: number) => {
    for (let i = 0; i < n; i++) {
      j.invulnerable = 9999;
      p.avance();
      p.releveEvenements();
    }
  };
  return { p, emb, j, pas };
}

describe('la traversée en ferry (niveau à part)', () => {
  it('la carte du ferry a son embarquement, et la porte du pont est fermée au chargement', () => {
    const p = new Partie({ niveau: 9, drapeau: -1, vies: VIES_DEPART, score: 0 });
    const emb = p.lu.embarquement!;
    expect(emb).not.toBeNull();
    expect(p.carte.get(emb.tx + 19, emb.ty)).toBe(T.SOCLE);
    expect(p.traversee).toBeNull();
    // les autres niveaux n'ont pas de ferry
    for (const n of [6, 7, 8])
      expect(new Partie({ niveau: n, drapeau: -1, vies: 5, score: 0 }).lu.embarquement).toBeNull();
  });

  it('le pont se ferme derrière les héros à bord, et les vagues montent à l’abordage', () => {
    const { p, emb, pas } = surLePont();
    pas(5);
    const t = p.traversee!;
    expect(t).not.toBeNull();
    expect(p.carte.get(emb.tx - 1, emb.ty)).toBe(T.SOCLE);
    // la première vague : deux marins
    pas(200);
    expect(t.vague).toBe(1);
    expect(t.ennemis).toHaveLength(2);
    expect(t.ennemis.every((e) => e.def.genre === G.MARIN)).toBe(true);
    // la vue transporte le temps de traversée
    expect(p.vue().traversee).toBe(t.sillage);
  });

  it('la porte ne s’ouvre qu’à la dernière vague vaincue, et le fond cesse alors de défiler', () => {
    const { p, emb, pas } = surLePont();
    pas(5);
    const t = p.traversee!;
    for (let i = 0; i < 8000 && t.arrivee < 0; i++) {
      // chaque assaillant est vaincu dès qu'il monte à bord
      for (const e of t.ennemis) if (e.vivant()) e.meurt(p);
      // tant que des vagues restent à venir, la porte reste fermée
      if (t.vague < 5) expect(p.carte.get(emb.tx + 19, emb.ty)).toBe(T.SOCLE);
      pas(1);
    }
    expect(t.vague).toBe(5);
    expect(t.arrivee).toBeGreaterThan(0);
    expect(p.carte.get(emb.tx + 19, emb.ty)).toBe(T.VIDE);
    const figee = p.vue().traversee;
    pas(120);
    expect(p.vue().traversee).toBe(figee);
  });

  it('un héros qui réapparaît en pleine traversée revient sur le pont, pas sur le quai', () => {
    const { p, emb, pas } = surLePont();
    pas(5);
    const [x] = p.pointApparition();
    expect(x).toBeGreaterThan(emb.x);
    expect(x).toBeLessThan(emb.x + 19 * TUILE);
  });
});
