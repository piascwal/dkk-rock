import { describe, expect, it } from 'vitest';
import { TUILE } from '../src/config';
import { ANIM, G, type EntiteVue, type EtatVue } from '../src/jeu/vue';
import type { Carte } from '../src/monde/carte';
import type { Pose } from '../src/rendu/decor';
import type { Emojis } from '../src/rendu/emojis';
import { TraitsPersos } from '../src/rendu/traits-persos';

const carte = { props: () => ({ solide: true }), solide: () => false } as unknown as Carte;
const tronc: Pose = { tx: 10, ty: 5, quoi: 'tronc', v: 0, devant: false };
const sol = 5 * TUILE;

const vue = (g: number, x: number, y = sol, e: number = ANIM.COURT) =>
  ({ entites: [{ id: 1, g, x, y, e } as EntiteVue] }) as unknown as EtatVue;

function essai(g: number, trajet: number[], y = sol): number {
  const traits = new TraitsPersos();
  let coeurs = 0;
  const fx = { emojis: { pop: () => coeurs++ } as unknown as Emojis };
  for (const x of trajet) traits.maj(vue(g, x, y), [tronc], carte, fx);
  return coeurs;
}

describe('les traits des personnages', () => {
  const devant = tronc.tx * TUILE + TUILE / 2;
  it('Tom fait surgir un cœur en croisant un rondin', () => {
    expect(essai(G.TOM, [devant - 6, devant - 2, devant + 2, devant + 6])).toBe(1);
  });
  it("une seule fois par passage, de n'importe quel côté", () => {
    expect(essai(G.TOM, [devant - 4, devant + 4, devant - 4, devant + 4])).toBe(1);
  });
  it('pas à un autre étage, ni pour un autre personnage, ni sans passer', () => {
    expect(essai(G.TOM, [devant - 4, devant + 4], sol - 90)).toBe(0);
    expect(essai(G.JBT, [devant - 4, devant + 4])).toBe(0);
    expect(essai(G.TOM, [devant - 30, devant - 20])).toBe(0);
  });
});
