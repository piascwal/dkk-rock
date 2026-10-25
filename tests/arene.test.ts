import { describe, expect, it } from 'vitest';
import { HEROS_HAUTEUR, TUILE } from '../src/config';
import { DocumentNiveau } from '../src/editeur/document';
import { joueursConseilles, VIES_ARENE } from '../src/jeu/arene';
import { C } from '../src/jeu/commandes';
import { Partie } from '../src/jeu/partie';
import { T } from '../src/monde/tuiles';
import { NIVEAUX, installeNiveau, niveauLu, NOMBRE_NIVEAUX_JEU } from '../src/niveaux';
import { litNiveau } from '../src/niveaux/format';
import { valideDef } from '../src/niveaux/mes-niveaux';
import { decodeEtat, encodeEtat } from '../src/reseau/protocole';

const STC = NIVEAUX.findIndex((d) => d.id === 'stc');

/** Un battle royale à `n` joueurs ; `enLigne` : il commence au salon. */
function arene(n: number, enLigne = false, ia: number[] = []): Partie {
  const p = new Partie({ niveau: STC, drapeau: -1, vies: 0, score: 0 });
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

  it('dehors, la zone fait perdre de la vie', () => {
    const p = arene(2);
    pas(p, 190);
    const a = p.joueurs[0]!;
    // hors de la zone (elle couvre une partie de la carte seulement, à deux)
    const [g, d] = p.arene!.zone;
    a.corps.x = g > 4 * TUILE ? TUILE : d + 4 * TUILE;
    a.invulnerable = 0;
    const pv = a.pv;
    pas(p, 61);
    expect(a.pv).toBeLessThan(pv);
  });

  it('estime pour combien de joueurs est faite une carte', () => {
    const [min, max] = joueursConseilles(niveauLu(STC));
    expect(max).toBe(8);
    expect(min).toBeGreaterThanOrEqual(3);
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
});
