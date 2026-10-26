import { describe, expect, it } from 'vitest';
import { HEROS_HAUTEUR, TUILE } from '../src/config';
import { departEn, placeDepart, retireDepart } from '../src/editeur/departs';
import { DocumentNiveau } from '../src/editeur/document';
import { joueursConseilles, VIES_ARENE } from '../src/jeu/arene';
import { C } from '../src/jeu/commandes';
import { Partie } from '../src/jeu/partie';
import { T } from '../src/monde/tuiles';
import { NIVEAUX, installeNiveau, niveauLu, NOMBRE_NIVEAUX_JEU } from '../src/niveaux';
import { litNiveau } from '../src/niveaux/format';
import { accessibles } from '../src/niveaux/accessibilite';
import { Carte } from '../src/monde/carte';
import { valideDef } from '../src/niveaux/mes-niveaux';
import { decodeEtat, encodeEtat } from '../src/reseau/protocole';

const TOUR = NIVEAUX.findIndex((d) => d.id === 'arene-tour-de-mixage');
const ARENES_DU_JEU = NIVEAUX.flatMap((d, i) => (d.arene ? [[d.id, i] as const] : []));

/** Un battle royale à `n` joueurs ; `enLigne` : il commence au salon. */
function arene(n: number, enLigne = false, ia: number[] = []): Partie {
  const p = new Partie({ niveau: TOUR, drapeau: -1, vies: 0, score: 0 });
  for (let s = 0; s < n; s++) p.ajouteJoueur(s, s);
  p.ouvreArene({ ennemis: false }, enLigne, ia);
  return p;
}

const pas = (p: Partie, n: number, bits: number[] = []) => {
  for (let i = 0; i < n; i++) {
    bits.forEach((b, s) => p.commande(s, b));
    p.avance();
    p.releveEvenements();
  }
};

/** Un couloir dégagé, un sol de béton : le joueur 0 à gauche (il regarde à droite), le joueur 1 un peu plus loin. */
function faceAFace(p: Partie): void {
  for (let ty = 0; ty < 16; ty++)
    for (let tx = 38; tx < 64; tx++) p.carte.pose(tx, ty, ty === 12 ? T.BETON : T.VIDE);
  const [a, b] = [p.joueurs[0]!, p.joueurs[1]!];
  Object.assign(a.corps, { x: 44 * TUILE, y: 12 * TUILE - HEROS_HAUTEUR, vx: 0, vy: 0 });
  Object.assign(b.corps, { x: 46 * TUILE, y: 12 * TUILE - HEROS_HAUTEUR, vx: 0, vy: 0 });
  a.dir = 1;
  a.invulnerable = b.invulnerable = 0;
}

describe('le battle royale', () => {
  it('hors ligne : compte à rebours, combat, puis l’IA se bat jusqu’au dernier', () => {
    const p = arene(4, false, [0, 1, 2, 3]);
    expect(p.arene!.etape).toBe('compte');
    expect(p.places).toBe(8);
    pas(p, 200);
    expect(p.arene!.etape).toBe('combat');
    for (let i = 0; i < 60 * 300 && p.arene!.etape !== 'fin'; i++) pas(p, 1);
    const a = p.arene!;
    expect(a.etape).toBe('fin');
    expect(a.rangs.slice(0, 4).sort()).toEqual([1, 2, 3, 4]);
    // les vies perdues sous les tirs comptent pour le tireur (les cages et les cœurs en redonnent : pas de compte exact)
    expect(a.eliminations.reduce((s, v) => s + v, 0)).toBeGreaterThan(0);
  }, 60_000);

  it('les tirs d’un joueur blessent les autres en combat, pas au salon, et jamais lui-même', () => {
    const p = arene(2, true);
    expect(p.arene!.etape).toBe('salon');
    faceAFace(p);
    pas(p, 40, [C.TIR, 0]);
    expect(p.joueurs[1]!.pv).toBe(3);
    p.suivant(); // l'hôte lance : chacun est placé ailleurs, puis le compte à rebours
    pas(p, 190);
    expect(p.arene!.etape).toBe('combat');
    faceAFace(p);
    const [a, b] = [p.joueurs[0]!, p.joueurs[1]!];
    pas(p, 40, [C.TIR, 0]);
    expect(b.pv).toBeLessThan(3);
    expect(b.dernierTireur).toBe(a.id);
    expect(a.pv).toBe(3);
  });

  it('une vie perdue : on revient loin des autres ; plus de vie : éliminé, et le dernier gagne', () => {
    const p = arene(2);
    pas(p, 190);
    const [a, b] = [p.joueurs[0]!, p.joueurs[1]!];
    for (let v = VIES_ARENE; v > 0; v--) {
      b.dernierTireur = a.id;
      b.meurt(p);
      pas(p, 100);
      expect(p.arene!.vies[1]).toBe(v - 1);
    }
    expect(p.arene!.eliminations[0]).toBe(VIES_ARENE);
    expect(p.arene!.rangs[1]).toBe(2);
    expect(p.arene!.rangs[0]).toBe(1);
    expect(p.arene!.etape).toBe('fin');
    expect(b.mort).toBe(true);
  });

  it.each(ARENES_DU_JEU)('%s : petite, close, en hauteur, et tout se rejoint depuis le départ', (_id, i) => {
    const lu = niveauLu(i);
    expect(lu.largeur * lu.hauteur).toBeLessThan(4000);
    expect(lu.fin).toBeNull();
    expect(lu.tyroliennes.length).toBeGreaterThanOrEqual(2);
    // là où l'on peut se tenir (une case libre, sa voisine du dessus aussi, un appui dessous), presque tout est accessible
    const c = new Carte(lu.largeur, lu.hauteur, lu.tuiles, lu.fond);
    const acces = accessibles(lu);
    let debout = 0;
    let atteint = 0;
    for (let y = 1; y < lu.hauteur - 1; y++)
      for (let x = 1; x < lu.largeur - 1; x++) {
        if (c.solide(x, y) || c.solide(x, y - 1) || c.props(x, y).echelle || c.props(x, y).traversable)
          continue;
        const dessous = c.props(x, y + 1);
        if (!dessous.solide && !dessous.echelle) continue;
        debout++;
        if (acces[y * lu.largeur + x]) atteint++;
      }
    expect(atteint / debout).toBeGreaterThan(0.9);
    // huit départs, chacun sur une case accessible, tous différents
    const departs = lu.def.departs!;
    expect(new Set(departs.map((d) => `${d![0]},${d![1]}`)).size).toBe(8);
    for (const d of departs) expect(acces[d![1] * lu.largeur + d![0]], `départ ${d}`).toBe(1);
    // et des étages : on se tient sur au moins cinq hauteurs différentes
    const hauteurs = new Set<number>();
    acces.forEach((v, k) => v && hauteurs.add(Math.floor(k / lu.largeur)));
    expect(hauteurs.size).toBeGreaterThanOrEqual(5);
  });

  it('les joueurs de l’ordinateur finissent une manche sur chaque arène', () => {
    for (const [, i] of ARENES_DU_JEU) {
      const p = new Partie({ niveau: i, drapeau: -1, vies: 0, score: 0 });
      for (let s = 0; s < 4; s++) p.ajouteJoueur(s, s);
      p.ouvreArene({ ennemis: false }, false, [0, 1, 2, 3]);
      for (let t = 0; t < 60 * 240 && p.arene!.etape !== 'fin'; t++) pas(p, 1);
      expect(p.arene!.etape, NIVEAUX[i]!.id).toBe('fin');
    }
  }, 120_000);

  it('estime pour combien de joueurs est faite une carte', () => {
    for (const [id, i] of ARENES_DU_JEU) {
      const [min, max] = joueursConseilles(niveauLu(i));
      expect(max, id).toBeGreaterThanOrEqual(6);
      expect(min, id).toBeGreaterThanOrEqual(2);
      expect(min, id).toBeLessThanOrEqual(4);
    }
    expect(joueursConseilles(litNiveau(DocumentNiveau.vierge(60, 30).versDef('petit')))).toEqual([2, 2]);
  });

  it('l’état du battle royale passe dans l’instantané réseau', () => {
    const p = arene(5, false, [1, 2, 3, 4]);
    pas(p, 300);
    const v = p.vue();
    const lu = decodeEtat(encodeEtat(v))!;
    expect(lu.arene).toEqual(v.arene);
    expect(lu.joueurs.filter((j) => j.present).length).toBe(5);
    expect(encodeEtat(v).byteLength).toBeLessThan(4096);
  });

  it('un niveau de l’éditeur envoyé par l’hôte : relu, refusé s’il est mal formé, installé à son indice', () => {
    const def = DocumentNiveau.vierge(60, 30, 'lund').versDef('envoi');
    const relu = valideDef(JSON.parse(JSON.stringify(def)), 'recu')!;
    expect(relu.carte).toEqual(def.carte);
    expect(relu.theme).toBe('lund');
    expect(valideDef({ ...def, theme: 'inconnu' }, 'x')).toBeNull();
    expect(valideDef({ ...def, carte: ['    '] }, 'x')).toBeNull(); // ni départ ni fin
    const i = NOMBRE_NIVEAUX_JEU + 40;
    installeNiveau(i, relu);
    expect(niveauLu(i).largeur).toBe(60);
  });

  it('une arène de l’éditeur : sans van, elle se lit, se vérifie et s’importe comme carte de battle royale', () => {
    const d = DocumentNiveau.arene();
    expect(d.estArene).toBe(true);
    expect(d.verifie().ok).toBe(true);
    const def = d.versDef('perso');
    expect(def.arene).toBe(true);
    expect(litNiveau(def).fin).toBeNull();
    // un export de l'éditeur, relu : la même carte, marquée arène
    const relu = valideDef({ titre: 'X', theme: def.theme, carte: d.versJSON().carte }, 'import')!;
    expect(relu.arene).toBe(true);
    expect(
      valideDef({ titre: 'X', theme: 'club', carte: DocumentNiveau.vierge().versJSON().carte }, 'v')!.arene,
    ).toBeUndefined();
  });

  it('chacun commence sur son départ (placé dans la carte), et réapparaît sur un départ', () => {
    const p = arene(4);
    const departs = NIVEAUX[TOUR]!.departs!;
    expect(departs.length).toBe(8);
    p.joueurs.slice(0, 4).forEach((j, s) => {
      expect(Math.floor(j!.cx / TUILE)).toBe(departs[s]![0]);
      expect(Math.floor((j!.corps.y + j!.corps.h - 1) / TUILE)).toBe(departs[s]![1]);
    });
    const [x, y] = p.arene!.pointLibre(p, 0);
    expect(
      departs.some((d) => d![0] === Math.floor((x + 4) / TUILE) && d![1] === Math.floor((y + 14) / TUILE)),
    ).toBe(true);
  });

  it('les départs de l’éditeur : posés, déplacés, effacés, annulés, exportés, relus', () => {
    const d = DocumentNiveau.arene();
    d.commence();
    placeDepart(d, 2, 10, 30);
    placeDepart(d, 5, 10, 30); // la même case : le départ 3 laisse la place au 6
    d.termine();
    expect(d.departs[2]).toBeNull();
    expect(departEn(d, 10, 30)).toBe(5);
    d.commence();
    retireDepart(d, 10, 30);
    d.termine();
    expect(departEn(d, 10, 30)).toBe(-1);
    d.annule();
    expect(departEn(d, 10, 30)).toBe(5);
    const e = DocumentNiveau.depuisJSON(JSON.stringify(d.versJSON()));
    expect(e.departs[5]).toEqual([10, 30]);
    expect(valideDef(d.versDef('x'), 'y')!.departs![5]).toEqual([10, 30]);
  });

  it('le niveau de l’ordinateur : un joueur facile tire bien moins qu’un difficile', () => {
    const tirs = (niveau: 'facile' | 'difficile') => {
      const p = new Partie({ niveau: TOUR, drapeau: -1, vies: 0, score: 0 });
      for (let s = 0; s < 2; s++) p.ajouteJoueur(s, s);
      p.ouvreArene({ ennemis: false, niveauIA: niveau }, false, [1]);
      pas(p, 190);
      faceAFace(p);
      let n = 0;
      for (let t = 0; t < 300; t++) {
        p.joueurs[0]!.pv = 3; // la cible tient le coup
        pas(p, 1);
        if (p.commandes[1]! & C.TIR) n++;
      }
      return n;
    };
    expect(tirs('facile')).toBeLessThan(tirs('difficile') / 2);
  });

  it('en ligne, l’hôte comble le salon avec des joueurs de l’ordinateur, et peut en retirer', () => {
    const p = arene(1, true);
    expect(p.ajouteIA(2)).toBe(1);
    expect(p.ajouteIA(3)).toBe(2);
    expect(p.joueurs.filter(Boolean).length).toBe(3);
    p.retireIA();
    expect(p.joueurs[2]).toBeNull();
    p.suivant();
    pas(p, 400);
    expect(p.arene!.etape).toBe('combat');
    expect(p.joueurs[1]!.mort || p.commandes[1] !== undefined).toBe(true);
  });
});
