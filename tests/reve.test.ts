import { describe, expect, it } from 'vitest';
import { VIES_DEPART } from '../src/config';
import { C } from '../src/jeu/commandes';
import { Partie } from '../src/jeu/partie';
import { BONUS_LUNE, ConcoursReve, NIVEAU_REVE, PLANTE_X, VIES } from '../src/jeu/reve';
import {
  boutsArc,
  LONGUEUR,
  parcours,
  PLAFOND,
  posEtoile,
  posMeteore,
  SOL,
  vitesse,
} from '../src/jeu/reve-parcours';
import { NIVEAUX } from '../src/niveaux';
import { niveauOuvert, suivantDansMonde } from '../src/niveaux/arcs';
import { decodeEtat, encodeEtat } from '../src/reseau/protocole';

const pas = (c: ConcoursReve, bits = 0) => c.maj([bits, 0, 0, 0], [0], () => {});
const appuie = (c: ConcoursReve) => {
  pas(c, C.SAUT);
  pas(c, 0);
};
/** Un ciel vide : rien à éviter, rien à ramasser (pour tester le vol seul). */
const videLeCiel = (c: ConcoursReve) => {
  Object.assign(c.ciel, { arcs: [], meteores: [], etoiles: [], piles: [] });
};

describe('le rêve de JBT', () => {
  it('le parcours de chaque vol est tiré d’après son numéro : des arcs, des météorites, des étoiles filantes, des piles', () => {
    for (let m = 1; m < 40; m++) {
      const p = parcours(m);
      expect(p).toEqual(parcours(m));
      expect(p.arcs.length).toBeGreaterThan(10);
      expect(p.meteores.length).toBeGreaterThan(5);
      expect(p.etoiles.length).toBeGreaterThan(3);
      expect(p.piles.length).toBeGreaterThan(200);
      expect(p.piles.some((x) => x.or)).toBe(true);
      // tout est dans le ciel, entre le plafond et les toits
      for (const a of p.arcs) {
        const [, y1, , y2] = boutsArc(a, a.x);
        if (a.rotation === 0) for (const y of [y1, y2]) expect(y).toBeGreaterThanOrEqual(PLAFOND - 1);
        if (a.rotation === 0) for (const y of [y1, y2]) expect(y).toBeLessThanOrEqual(SOL + 1);
      }
      for (const x of p.piles) expect(x.y).toBeGreaterThan(PLAFOND);
      for (const x of p.piles) expect(x.y).toBeLessThan(SOL);
    }
  });

  it('les obstacles bougent avec la distance : la météorite fonce, l’étoile filante part après son alerte', () => {
    const m = { x: 1000, y: 80, rayon: 10, derive: 0.5, ampl: 0, phase: 0 };
    expect(posMeteore(m, 0).x).toBe(1000);
    expect(posMeteore(m, 900).x).toBeLessThan(1000);
    const e = { x: 2000, y: 60 };
    expect(posEtoile(e, 1990)).toBeNull();
    expect(posEtoile(e, 2100)!.x).toBeLessThan(posEtoile(e, 2000)!.x);
    expect(vitesse(LONGUEUR)).toBeGreaterThan(vitesse(0));
  });

  it('on tient pour monter, on lâche pour descendre, sans jamais sortir du ciel', () => {
    const c = new ConcoursReve([0], false);
    videLeCiel(c);
    appuie(c);
    expect(c.etape).toBe('vol');
    const y0 = c.y;
    for (let t = 0; t < 20; t++) pas(c, C.SAUT);
    expect(c.y).toBeLessThan(y0 - 5);
    expect(c.pousse).toBe(true);
    for (let t = 0; t < 200; t++) pas(c, C.HAUT);
    expect(c.y).toBeGreaterThanOrEqual(PLAFOND);
    for (let t = 0; t < 300; t++) pas(c);
    expect(c.y).toBeLessThanOrEqual(SOL);
    expect(c.distance).toBeGreaterThan(500);
  });

  it('les piles se ramassent (une en or en vaut dix) ; trois chocs, et JBT se réveille', () => {
    const c = new ConcoursReve([0], false);
    videLeCiel(c);
    appuie(c);
    const x = c.distance + 20;
    c.ciel.piles.push({ x, y: c.y, or: false }, { x: x + 15, y: c.y, or: true });
    for (let t = 0; t < 20; t++) pas(c);
    expect(c.piles).toBe(11);
    expect(c.collectees).toEqual([0, 1]);
    // trois météorites sur sa route, l'une après l'autre
    for (let k = 0; k < VIES; k++) {
      c.ciel.meteores = [{ x: c.distance + 6, y: c.y, rayon: 10, derive: 0, ampl: 0, phase: 0 }];
      pas(c);
      expect(c.vies).toBe(VIES - k - 1);
      c.invulnerable = 0;
    }
    expect(c.etape).toBe('reveil');
    while (c.etape === 'reveil') pas(c);
    expect(c.etape).toBe('resultat');
    expect(c.score).toBe(11);
    expect(c.scores[0]).toBe(11);
  });

  it('un arc électrique et une étoile filante touchent aussi ; on est invulnérable un moment après un choc', () => {
    const c = new ConcoursReve([0], false);
    videLeCiel(c);
    appuie(c);
    c.ciel.arcs = [{ x: c.distance + 4, y: c.y, longueur: 60, angle: Math.PI / 2, rotation: 0 }];
    pas(c);
    expect(c.vies).toBe(VIES - 1);
    pas(c);
    expect(c.vies).toBe(VIES - 1); // invulnérable
    c.invulnerable = 0;
    c.ciel.arcs = [];
    const e = { x: c.distance - 100, y: c.y };
    c.ciel.etoiles = [e];
    for (let t = 0; t < 60 && c.vies === VIES - 1; t++) {
      e.y = c.y; // elle file droit sur lui
      pas(c);
    }
    expect(c.vies).toBe(VIES - 2);
  });

  it('au bout du ciel, JBT plante sa tête dans la lune : bonus, podium', () => {
    const c = new ConcoursReve([0], false);
    videLeCiel(c);
    appuie(c);
    c.distance = LONGUEUR - 1;
    c.piles = 42;
    pas(c);
    expect(c.etape).toBe('lune');
    while (!c.plante) pas(c);
    expect(c.distance).toBe(PLANTE_X);
    while (c.etape === 'lune') pas(c);
    expect(c.etape).toBe('resultat');
    expect(c.score).toBe(42 + BONUS_LUNE);
    while (c.etape === 'resultat') pas(c);
    expect(c.etape).toBe('podium');
    for (let t = 0; t < 70; t++) pas(c);
    appuie(c);
    expect(c.fini).toBe(true);
  });

  it('vient entre la Ville Autotunée et le Club Infini, se laisse de côté, et passe par le réseau', () => {
    const ville = NIVEAUX.findIndex((n) => n.id === 'ville');
    const club = NIVEAUX.findIndex((n) => n.id === 'club');
    expect(NIVEAUX[NIVEAU_REVE]!.miniJeu).toBe('reve');
    expect(suivantDansMonde(ville)).toBe(NIVEAU_REVE);
    expect(suivantDansMonde(NIVEAU_REVE)).toBe(club);
    expect(niveauOuvert(club, [ville])).toBe(true); // facultatif : on peut le laisser de côté

    const p = new Partie({ niveau: NIVEAU_REVE, drapeau: -1, vies: VIES_DEPART, score: 0 });
    p.ajouteJoueur(0, 0);
    while (p.phase === 'histoire') p.suivant();
    expect(p.phase).toBe('reve');
    p.commande(0, C.SAUT);
    p.avance();
    for (let t = 0; t < 40; t++) p.avance();
    const v = p.vue();
    expect(v.reve?.etape).toBe('vol');
    const d = decodeEtat(encodeEtat(v))!;
    expect(d.reve).toMatchObject({
      etape: 'vol',
      manche: v.reve!.manche,
      siege: 0,
      vies: v.reve!.vies,
      pousse: v.reve!.pousse,
    });
    expect(d.reve!.distance).toBeCloseTo(v.reve!.distance, 0);
    expect(d.reve!.y).toBeCloseTo(v.reve!.y, 0);
  });
});
