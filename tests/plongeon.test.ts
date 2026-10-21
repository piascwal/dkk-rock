import { describe, expect, it } from 'vitest';
import { VIES_DEPART } from '../src/config';
import { C } from '../src/jeu/commandes';
import { Partie } from '../src/jeu/partie';
import {
  ConcoursPlongeon,
  DUREE_CHUTE,
  EAU,
  ENTREE,
  NIVEAU_PLONGEON,
  note,
  PROFOND,
  tirage,
  ZONE,
} from '../src/jeu/plongeon';
import { NIVEAUX } from '../src/niveaux';
import { niveauOuvert, suivantDansMonde } from '../src/niveaux/arcs';
import { decodeEtat, encodeEtat } from '../src/reseau/protocole';

const pas = (c: ConcoursPlongeon, bits = 0) => c.maj([bits, 0, 0, 0], [0], () => {});
const appuie = (c: ConcoursPlongeon, bits = C.SAUT) => {
  pas(c, bits);
  pas(c, 0);
};

/** Vise jusqu'à ce que le curseur passe à moins de 0,3 m de `cible`, puis saute. */
function sauteVers(c: ConcoursPlongeon, cible: number): void {
  for (let t = 0; t < 600 && Math.abs(c.visee - cible) > 0.3; t++) pas(c);
  pas(c, C.SAUT);
}

describe('le concours de plongeon du pont des Tuves', () => {
  it('la note : le milieu du trou d’eau vaut 100, son bord 70 ; l’eau peu profonde blesse, la berge vaut zéro', () => {
    expect(note(2, 2, ENTREE.GAINEE)).toEqual({ zone: ZONE.PROFOND, score: 100 });
    expect(note(2 + PROFOND, 2, ENTREE.GAINEE)).toEqual({ zone: ZONE.PROFOND, score: 70 });
    // deux mètres au-delà du trou : l'eau baisse (−14) et les galets coûtent 10 points
    expect(note(2 + PROFOND + 2, 2, ENTREE.GAINEE)).toEqual({ zone: ZONE.BAS, score: 46 });
    expect(note(EAU + 1, 2, ENTREE.PARFAITE)).toEqual({ zone: ZONE.BERGE, score: 0 });
    // l'entrée : bras tendus au dernier moment, +10 ; à plat, −20
    expect(note(2 + PROFOND, 2, ENTREE.PARFAITE).score).toBe(80);
    expect(note(2 + PROFOND, 2, ENTREE.PLAT).score).toBe(50);
    expect(note(2, 2, ENTREE.PARFAITE).score).toBe(100); // pas plus de 100
  });

  it('la rivière de chaque saut est tirée d’après son numéro : la même pour l’hôte et pour l’écran', () => {
    for (let m = 1; m < 60; m++) {
      const t = tirage(m);
      expect(t).toEqual(tirage(m));
      expect(Math.abs(t.fosse) + PROFOND).toBeLessThan(EAU); // le trou d'eau est dans l'eau
      expect(Math.abs(t.oiseau.x - t.fosse)).toBeLessThanOrEqual(2); // l'hirondelle passe au-dessus du trou
      expect(t.rafales).toHaveLength(2);
    }
  });

  it('un saut : on vise, on tombe en 3,4 s, on tend les bras au dernier moment, on touche l’eau, puis le podium', () => {
    const c = new ConcoursPlongeon([0], false);
    expect(c.etape).toBe('visee');
    const { fosse } = tirage(c.manche);
    sauteVers(c, fosse);
    expect(c.etape).toBe('chute');
    expect(Math.abs(c.x - fosse)).toBeLessThan(0.4);
    for (let t = 0; t < DUREE_CHUTE - 10; t++) pas(c);
    expect(c.hauteur).toBeGreaterThan(0);
    appuie(c); // les bras tendus, à quelques images de l'eau
    while (c.etape === 'chute') pas(c);
    expect(c.etape).toBe('impact');
    expect(c.entree).toBe(ENTREE.PARFAITE);
    expect(c.zone).not.toBe(ZONE.BERGE);
    expect(c.scores[0]).toBe(c.score);
    while (c.etape === 'impact' || c.etape === 'resultat') pas(c);
    expect(c.etape).toBe('podium');
    for (let t = 0; t < 70; t++) pas(c);
    appuie(c);
    expect(c.fini).toBe(true);
  });

  it('sans tendre les bras, c’est un plat ; visé sur la berge, Tom s’y plante', () => {
    const plat = new ConcoursPlongeon([0], false);
    sauteVers(plat, tirage(plat.manche).fosse);
    while (plat.etape === 'chute') pas(plat);
    if (plat.zone !== ZONE.BERGE) expect(plat.entree).toBe(ENTREE.PLAT);
    const berge = new ConcoursPlongeon([0], false);
    sauteVers(berge, 14.8);
    while (berge.etape === 'chute') pas(berge);
    expect(berge.zone).toBe(ZONE.BERGE);
    expect(berge.score).toBe(0);
  });

  it('en l’air, on se dirige : le joystick déplace le point de chute', () => {
    const tombe = (bits: number) => {
      const c = new ConcoursPlongeon([0], false);
      sauteVers(c, 0);
      while (c.etape === 'chute') pas(c, bits);
      return c.x;
    };
    expect(tombe(C.DROITE) - tombe(0)).toBeGreaterThan(5);
    expect(tombe(C.GAUCHE) - tombe(0)).toBeLessThan(-5);
  });

  it('vient juste après le pont des Tuves, se laisse de côté, et passe par le réseau', () => {
    const tuves = NIVEAUX.findIndex((n) => n.id === 'tuves');
    const alpages = NIVEAUX.findIndex((n) => n.id === 'alpages');
    expect(NIVEAUX[NIVEAU_PLONGEON]!.miniJeu).toBe('plongeon');
    expect(suivantDansMonde(tuves)).toBe(NIVEAU_PLONGEON);
    expect(suivantDansMonde(NIVEAU_PLONGEON)).toBe(alpages);
    expect(niveauOuvert(alpages, [0, tuves])).toBe(true); // facultatif : on peut le laisser de côté

    // dans l'histoire : son intro lue, le concours commence ; sa vue fait l'aller-retour par le réseau
    const p = new Partie({ niveau: NIVEAU_PLONGEON, drapeau: -1, vies: VIES_DEPART, score: 0 });
    p.ajouteJoueur(0, 0);
    while (p.phase === 'histoire') p.suivant();
    expect(p.phase).toBe('plongeon');
    for (let t = 0; t < 40; t++) p.avance();
    p.commande(0, C.SAUT);
    p.avance();
    p.commande(0, 0);
    for (let t = 0; t < 30; t++) p.avance();
    const v = p.vue();
    expect(v.plongeon?.etape).toBe('chute');
    const d = decodeEtat(encodeEtat(v))!;
    expect(d.plongeon).toMatchObject({ etape: 'chute', manche: v.plongeon!.manche, siege: 0 });
    expect(d.plongeon!.x).toBeCloseTo(v.plongeon!.x, 1);
  });
});
