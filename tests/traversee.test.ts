import { describe, expect, it } from 'vitest';
import { TUILE, VIES_DEPART } from '../src/config';
import { Objet } from '../src/entites/objets';
import { Partie } from '../src/jeu/partie';
import { T } from '../src/monde/tuiles';
import { decodeEtape, geometrieNavire, NAVIRE } from '../src/niveaux/navire';

/** La traversée (niveau 9 de la liste), un héros, l'intro passée. */
function ferry() {
  const p = new Partie({ niveau: 9, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, 0);
  while (p.phase === 'histoire') p.suivant();
  const emb = p.lu.embarquement!;
  const g = geometrieNavire(emb);
  const t = p.traversee!;
  const van = p.entites.find((e): e is Objet => e instanceof Objet && e.sorte === 'van')!;
  const pas = (n = 1) => {
    for (let i = 0; i < n; i++) {
      for (const j of p.joueurs) if (j) j.invulnerable = 9999;
      p.avance();
      p.releveEvenements();
    }
  };
  /** avance jusqu'à l'étape voulue (ou échoue au bout de `max` pas) */
  const jusqua = (etape: string, max = 3000) => {
    for (let i = 0; i < max && t.etape !== etape; i++) pas();
    expect(t.etape).toBe(etape);
  };
  return { p, emb, g, t, van, pas, jusqua };
}

describe('la traversée en ferry', () => {
  it('seul le navire est solide, indestructible ; dessous et autour, la mer (le vide)', () => {
    const { p, emb, g } = ferry();
    const pont = emb.ty + 1;
    const avant = [5, 15, 25].map((dx) => p.carte.get(emb.tx + dx, pont + 2));
    expect(p.carte.get(emb.tx + 5, pont)).toBe(T.SOCLE);
    // une grosse explosion contre la coque ne l'entame pas : impossible de creuser sous le bateau
    p.explosion(g.poupe + 10 * TUILE, g.pont + 2 * TUILE, 80, 99, 'tous');
    p.releveEvenements();
    expect([5, 15, 25].map((dx) => p.carte.get(emb.tx + dx, pont + 2))).toEqual(avant);
    // sous la quille, et entre le navire et les quais (dessinés), rien
    expect(p.carte.get(emb.tx + 5, pont + NAVIRE.coque + 1)).toBe(T.VIDE);
    expect(p.carte.get(emb.tx - 3, pont)).toBe(T.VIDE);
    expect(p.carte.get(emb.tx + NAVIRE.longueur + 1, pont)).toBe(T.VIDE);
  });

  it('l’intro : le van monte à bord avec les héros, se gare ; la rampe se relève, puis les héros descendent', () => {
    const { p, g, t, van, pas, jusqua } = ferry();
    expect(van.corps.x).toBeLessThan(g.poupe);
    pas();
    expect(p.joueurs[0]!.embarque).toBe(true);
    jusqua('rampe');
    expect(Math.abs(van.corps.x - g.parking)).toBeLessThan(1);
    expect(p.joueurs[0]!.embarque).toBe(true);
    jusqua('appareillage');
    const j = p.joueurs[0]!;
    expect(j.embarque).toBe(false);
    expect(j.corps.x).toBeGreaterThan(g.poupe);
    expect(j.corps.x).toBeLessThan(g.proue);
    // la vue transmet l'étape au rendu
    expect(decodeEtape(p.vue().navire).etape).toBe('appareillage');
    expect(t.vitesse).toBeLessThan(0.1);
  });

  it('en mer, toucher le van ne fait rien : il ne repart qu’à Groix', () => {
    const { p, van, jusqua } = ferry();
    jusqua('traversee');
    p.lanceDepart(van);
    expect(p.departDans).toBe(-1);
    expect(p.joueurs[0]!.embarque).toBe(false);
  });

  it('les vagues vaincues, le ferry accoste, la rampe s’abaisse et le van redescend : fin du niveau', () => {
    const { p, t, pas, jusqua } = ferry();
    jusqua('traversee');
    for (let i = 0; i < 9000 && t.etape === 'traversee'; i++) {
      for (const e of t.ennemis) if (e.vivant()) e.meurt(p);
      pas();
    }
    expect(t.vague).toBe(5);
    jusqua('debarquement');
    // le ferry est à quai : le fond ne défile plus
    const sillage = p.vue().traversee;
    pas(20);
    expect(p.vue().traversee).toBe(sillage);
    for (let i = 0; i < 600 && p.phase === 'jeu'; i++) pas();
    expect(p.joueurs[0]!.embarque).toBe(true);
    expect(p.phase).toBe('convertis');
  });

  it('un héros qui réapparaît en pleine traversée revient sur le pont', () => {
    const { p, g, jusqua } = ferry();
    jusqua('traversee');
    const [x, y] = p.pointApparition();
    expect(x).toBeGreaterThan(g.poupe);
    expect(x).toBeLessThan(g.proue);
    expect(y).toBeLessThan(g.pont);
  });

  it('les autres niveaux n’ont pas de ferry', () => {
    for (const n of [6, 7, 8])
      expect(new Partie({ niveau: n, drapeau: -1, vies: 5, score: 0 }).traversee).toBeNull();
  });
});
