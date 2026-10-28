import { describe, expect, it } from 'vitest';
import { VIES_ARENE } from '../src/jeu/arene';
import { Places } from '../src/jeu/equipes';
import { Partie } from '../src/jeu/partie';
import { NIVEAUX } from '../src/niveaux';
import { decodeArene, encodeArene, OCTETS_ARENE } from '../src/reseau/protocole-arene';
import { valideMsgClient } from '../src/reseau/protocole-ctrl';

const TOUR = NIVEAUX.findIndex((d) => d.id === 'arene-tour-de-mixage');

/** Un battle royale en équipes hors ligne, à `n` joueurs, au combat. */
function enEquipes(n: number, enLigne = false): Partie {
  const p = new Partie({ niveau: TOUR, drapeau: -1, vies: 0, score: 0 });
  for (let s = 0; s < n; s++) p.ajouteJoueur(s, 0);
  p.ouvreArene({ equipes: true }, enLigne);
  if (!enLigne) for (let i = 0; i < 200; i++) p.avance();
  return p;
}

describe('le battle royale en équipes', () => {
  it('les cases : en équipes, chacun arrive dans le camp le moins nombreux ; une case prise ne se prend pas', () => {
    const pl = new Places();
    for (const s of [0, 1, 2, 3]) pl.attribue(s, true);
    expect(pl.cases.slice(0, 4)).toEqual([0, 4, 1, 5]);
    expect(pl.choisit(0, 4)).toBe(false);
    expect(pl.choisit(0, 7)).toBe(true);
    expect(pl.allies(0, 1, true)).toBe(true);
    expect(pl.allies(0, 2, true)).toBe(false);
    expect(pl.allies(0, 1, false)).toBe(false);
    pl.redistribue([0, 1, 2, 3], false);
    expect(pl.cases.slice(0, 4)).toEqual([0, 1, 2, 3]);
  });

  it('un tir ne vise que le camp d’en face : jamais un allié', () => {
    const p = enEquipes(4);
    const [a, allie, ennemi] = [p.joueurs[0]!, p.joueurs[2]!, p.joueurs[1]!];
    expect(p.arene!.allies(0, 2)).toBe(true);
    p.tireur = a.id;
    const cibles = p.cibles('ennemis');
    p.tireur = null;
    expect(cibles).toContain(ennemi);
    expect(cibles).not.toContain(allie);
    expect(cibles).not.toContain(a);
  });

  it('la manche finit quand il ne reste qu’une équipe : ses joueurs sont premiers, les autres seconds', () => {
    const p = enEquipes(4);
    for (const s of [1, 3])
      for (let v = 0; v < VIES_ARENE; v++) {
        p.joueurs[s]!.meurt(p);
        for (let i = 0; i < 100; i++) p.avance();
      }
    const a = p.arene!;
    expect(a.etape).toBe('fin');
    expect([a.rangs[0], a.rangs[2]]).toEqual([1, 1]);
    expect([a.rangs[1], a.rangs[3]]).toEqual([2, 2]);
  });

  it('au salon : on change de case (et de camp) ; l’hôte passe d’un mode à l’autre, les camps se refont', () => {
    const p = enEquipes(3, true);
    const a = p.arene!;
    expect(a.allies(0, 1)).toBe(false);
    a.choisitPlace(1, 3); // le joueur 1 rejoint la rouge
    expect(a.allies(0, 1)).toBe(true);
    a.changeMode(p, false);
    expect(a.equipes).toBe(false);
    expect(a.allies(0, 1)).toBe(false);
  });

  it('les cases et le mode passent dans l’instantané ; le message « place » est validé', () => {
    const p = enEquipes(3, true);
    const d = new DataView(new ArrayBuffer(OCTETS_ARENE));
    encodeArene(d, 0, p.arene!.vue());
    const v = decodeArene(d, 0)!;
    expect(v.equipes).toBe(true);
    expect(v.places).toEqual(p.arene!.vue().places);
    expect(valideMsgClient({ t: 'place', n: 5 })).toEqual({ t: 'place', n: 5 });
    expect(valideMsgClient({ t: 'place', n: 9 })).toBeNull();
  });
});
