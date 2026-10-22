import { describe, expect, it } from 'vitest';
import { VIES_DEPART } from '../src/config';
import { C } from '../src/jeu/commandes';
import { Partie } from '../src/jeu/partie';
import {
  ConcoursPlongeon,
  DUREE_SURVOL,
  EAU,
  GORGE,
  HAUTEUR,
  NIVEAU_PLONGEON,
  pente,
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

/**
 * Le survol passé, Tom se place au-dessus de `x`, tire le joystick vers le bas (en visant de côté avec `vise` : 1 tire à gauche,
 * donc part à droite) jusqu'à la tension voulue, et lâche.
 */
function saute(c: ConcoursPlongeon, x: number, tension = 1, vise = 0): void {
  while (c.vise < DUREE_SURVOL) pas(c);
  for (let t = 0; t < 2000 && Math.abs(c.x - x) > 0.06; t++) pas(c, c.x < x ? C.DROITE : C.GAUCHE);
  const cote = vise > 0 ? C.GAUCHE : vise < 0 ? C.DROITE : 0;
  pas(c, C.BAS);
  for (let t = 0; t < 200 && c.tension < tension - 0.02; t++) pas(c, C.BAS | cote);
  pas(c, 0);
}

describe('le concours de plongeon du pont des Tuves', () => {
  it('la note : 100 au milieu du trou d’eau, 70 à son bord ; l’eau peu profonde blesse, la berge vaut zéro', () => {
    expect(note(2, 2)).toEqual({ zone: ZONE.PROFOND, score: 100 });
    expect(note(2 + PROFOND, 2)).toEqual({ zone: ZONE.PROFOND, score: 70 });
    // deux mètres au-delà du trou : l'eau baisse vite (−24) et les galets coûtent 10 points
    expect(note(PROFOND + 2, 0)).toEqual({ zone: ZONE.BAS, score: 36 });
    expect(note(EAU + 0.5, 2)).toEqual({ zone: ZONE.BERGE, score: 0 });
    // chaque branche heurtée −5
    expect(note(2, 2, 3).score).toBe(85);
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

  it('un saut : le survol, la place sur le dos d’âne, la tension des jambes, la montée bras pliés, la descente bras tendus, l’eau, le podium', () => {
    const c = new ConcoursPlongeon([0], false);
    expect(c.etape).toBe('visee');
    saute(c, 3, 1);
    expect(c.etape).toBe('chute');
    expect(c.y).toBeCloseTo(pente(3), 1); // le tablier descend de part et d'autre de la clé
    expect(c.vy).toBeLessThan(-6); // pleine tension : il part vers le haut
    expect(Math.abs(c.vx)).toBeLessThan(2);
    expect(c.vue().bras).toBe(false); // il monte, bras pliés
    while (c.vy < 0) pas(c);
    pas(c);
    expect(c.vue().bras).toBe(true); // il redescend, bras tendus, jusqu'en bas
    while (c.etape === 'chute') pas(c);
    expect(c.etape).toBe('impact');
    expect(c.scores[0]).toBe(c.score);
    while (c.etape === 'impact' || c.etape === 'resultat') pas(c);
    expect(c.etape).toBe('podium');
    for (let t = 0; t < 70; t++) pas(c);
    appuie(c);
    expect(c.fini).toBe(true);
  });

  it('les jambes comme un élastique : plus on tend, plus il monte ; tenues trop longtemps, elles flanchent ; on vise à l’opposé', () => {
    const sommet = (tension: number, vise = 0) => {
      const c = new ConcoursPlongeon([0], false);
      saute(c, 0, tension, vise);
      const vx = c.vx;
      let haut = c.y;
      while (c.vy < 0) {
        pas(c);
        haut = Math.min(haut, c.y);
      }
      return { haut, vx };
    };
    expect(sommet(1).haut).toBeLessThan(sommet(0.4).haut - 1);
    expect(sommet(1, 1).vx).toBeGreaterThan(1); // tiré vers la gauche : il part à droite
    expect(sommet(1, -1).vx).toBeLessThan(-1);
    const c2 = new ConcoursPlongeon([0], false);
    while (c2.vise < DUREE_SURVOL) pas(c2);
    let max = 0;
    pas(c2, C.BAS);
    for (let t = 0; t < 80; t++) {
      pas(c2, C.BAS);
      max = Math.max(max, c2.tension);
    }
    expect(max).toBeGreaterThan(0.95);
    expect(c2.tension).toBeLessThan(0.7); // trop tenu : les jambes ont flanché
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

  it('en l’air, on se dirige', () => {
    const tombe = (bits: number) => {
      const c = new ConcoursPlongeon([0], false);
      saute(c, 0);
      while (c.etape === 'chute') pas(c, bits);
      return c;
    };
    // sans rien toucher, le vent et les branches emportent Tom : il faut piloter pour revenir
    const rien = tombe(0).x;
    expect(tombe(C.DROITE).x - rien).toBeGreaterThan(2);
    expect(tombe(C.GAUCHE).x).toBeLessThan(rien);
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
