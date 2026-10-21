import { describe, expect, it } from 'vitest';
import { VIES_DEPART } from '../src/config';
import { C } from '../src/jeu/commandes';
import { Partie } from '../src/jeu/partie';
import {
  ConcoursPlongeon,
  DUREE_SURVOL,
  EAU,
  ENTREE,
  GORGE,
  HAUTEUR,
  jaugeDe,
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
const appuie = (c: ConcoursPlongeon) => {
  pas(c, C.SAUT);
  pas(c, 0);
};

/** Le survol passé, Tom se place au-dessus de `x`, attend que la jauge d'élan soit au milieu, et saute. */
function saute(c: ConcoursPlongeon, x: number): void {
  while (c.vise < DUREE_SURVOL) pas(c);
  for (let t = 0; t < 2000 && Math.abs(c.x - x) > 0.06; t++) pas(c, c.x < x ? C.DROITE : C.GAUCHE);
  for (let t = 0; t < 200 && Math.abs(jaugeDe(c.vise)) > 0.06; t++) pas(c);
  pas(c, C.SAUT);
  pas(c, 0);
}

describe('le concours de plongeon du pont des Tuves', () => {
  it('la note : 100 au milieu du trou d’eau, 70 à son bord ; l’eau peu profonde blesse, la berge vaut zéro', () => {
    expect(note(2, 2, ENTREE.GAINEE)).toEqual({ zone: ZONE.PROFOND, score: 100 });
    expect(note(2 + PROFOND, 2, ENTREE.GAINEE)).toEqual({ zone: ZONE.PROFOND, score: 70 });
    // deux mètres au-delà du trou : l'eau baisse vite (−24) et les galets coûtent 10 points
    expect(note(PROFOND + 2, 0, ENTREE.GAINEE)).toEqual({ zone: ZONE.BAS, score: 36 });
    expect(note(EAU + 0.5, 2, ENTREE.PARFAITE)).toEqual({ zone: ZONE.BERGE, score: 0 });
    // l'entrée : bras tendus au dernier moment +10, à plat −25 ; chaque branche heurtée −5
    expect(note(2 + PROFOND, 2, ENTREE.PARFAITE).score).toBe(80);
    expect(note(2 + PROFOND, 2, ENTREE.PLAT).score).toBe(45);
    expect(note(2, 2, ENTREE.PARFAITE, 3).score).toBe(95);
  });

  it('les gorges de chaque saut sont tirées d’après son numéro : beaucoup de branches, trois hirondelles, trois couloirs de vent', () => {
    for (let m = 1; m < 60; m++) {
      const t = tirage(m);
      expect(t).toEqual(tirage(m));
      expect(Math.abs(t.fosse) + PROFOND).toBeLessThan(EAU); // le trou d'eau est dans l'eau
      expect(t.branches.length).toBeGreaterThanOrEqual(8);
      for (const b of t.branches) {
        expect(b.y).toBeGreaterThan(5);
        expect(b.y).toBeLessThan(HAUTEUR - 4);
        expect(b.longueur).toBeLessThan(GORGE - 2); // il reste toujours un passage
      }
      expect(t.oiseaux).toHaveLength(3);
      expect(t.vents).toHaveLength(3);
    }
  });

  it('un saut : le survol, la place sur le parapet, l’élan, la chute, les bras tendus au dernier moment, l’eau, le podium', () => {
    const c = new ConcoursPlongeon([0], false);
    expect(c.etape).toBe('visee');
    saute(c, c.fosse);
    expect(c.etape).toBe('chute');
    expect(Math.abs(c.vx)).toBeLessThan(0.3); // l'élan pris au milieu de la jauge : on tombe droit
    while (c.y < HAUTEUR - 5) pas(c);
    appuie(c);
    while (c.etape === 'chute') pas(c);
    expect(c.etape).toBe('impact');
    if (c.zone !== ZONE.BERGE) expect(c.entree).toBe(ENTREE.PARFAITE);
    expect(c.scores[0]).toBe(c.score);
    while (c.etape === 'impact' || c.etape === 'resultat') pas(c);
    expect(c.etape).toBe('podium');
    for (let t = 0; t < 70; t++) pas(c);
    appuie(c);
    expect(c.fini).toBe(true);
  });

  it('une branche heurtée : on y laisse sa vitesse et cinq points', () => {
    const c = new ConcoursPlongeon([0], false);
    saute(c, 0);
    const b = tirage(c.manche).branches[2]!;
    Object.assign(c, { x: b.cote * (GORGE - b.longueur / 2), y: b.y - 0.05, vx: 0, vy: 11 });
    pas(c);
    expect(c.eraflures).toBe(1);
    expect(c.vy).toBeLessThan(5);
  });

  it('en l’air, on se dirige ; tendre les bras trop tôt fait perdre le contrôle et l’entrée parfaite', () => {
    const tombe = (bits: number, brasTot = false) => {
      const c = new ConcoursPlongeon([0], false);
      saute(c, 0);
      if (brasTot) appuie(c);
      while (c.etape === 'chute') pas(c, bits);
      return c;
    };
    // sans rien toucher, le vent et les branches emportent Tom : il faut piloter pour revenir
    const rien = tombe(0).x;
    expect(tombe(C.DROITE).x - rien).toBeGreaterThan(2);
    expect(tombe(C.GAUCHE).x).toBeLessThan(rien);
    const tot = tombe(0, true);
    if (tot.zone !== ZONE.BERGE) expect(tot.entree).toBe(ENTREE.GAINEE);
    expect(tombe(C.DROITE, true).x - tot.x).toBeLessThan(tombe(C.DROITE).x - rien);
  });

  it('vient juste après le pont des Tuves, se laisse de côté, et passe par le réseau', () => {
    const tuves = NIVEAUX.findIndex((n) => n.id === 'tuves');
    const alpages = NIVEAUX.findIndex((n) => n.id === 'alpages');
    expect(NIVEAUX[NIVEAU_PLONGEON]!.miniJeu).toBe('plongeon');
    expect(suivantDansMonde(tuves)).toBe(NIVEAU_PLONGEON);
    expect(suivantDansMonde(NIVEAU_PLONGEON)).toBe(alpages);
    expect(niveauOuvert(alpages, [0, tuves])).toBe(true); // facultatif : on peut le laisser de côté

    const p = new Partie({ niveau: NIVEAU_PLONGEON, drapeau: -1, vies: VIES_DEPART, score: 0 });
    p.ajouteJoueur(0, 0);
    while (p.phase === 'histoire') p.suivant();
    expect(p.phase).toBe('plongeon');
    for (const bits of [C.SAUT, 0, C.SAUT, 0]) {
      p.commande(0, bits); // le premier appui passe le survol, le second fait sauter
      p.avance();
    }
    for (let t = 0; t < 30; t++) p.avance();
    const v = p.vue();
    expect(v.plongeon?.etape).toBe('chute');
    const d = decodeEtat(encodeEtat(v))!;
    expect(d.plongeon).toMatchObject({
      etape: 'chute',
      manche: v.plongeon!.manche,
      siege: 0,
      temps: v.plongeon!.temps,
    });
    expect(d.plongeon!.y).toBeCloseTo(v.plongeon!.y, 1);
  });
});
