import { describe, expect, it } from 'vitest';
import { ARCS, arcDe, MONDE, niveauOuvert, suivantDansArc, suivantDansMonde } from '../src/niveaux/arcs';
import { NIVEAUX } from '../src/niveaux';

describe('les arcs de l’histoire', () => {
  it('chaque niveau appartient à un seul arc, et tous les niveaux sont dans un arc', () => {
    const tous = ARCS.flatMap((a) => a.niveaux);
    expect(new Set(tous).size).toBe(tous.length);
    expect([...tous].sort((a, b) => a - b)).toEqual(NIVEAUX.map((_, i) => i));
  });

  it('on passe d’un niveau au suivant de son arc, puis l’arc se termine', () => {
    const arc = ARCS[0]!;
    expect(suivantDansArc(arc.niveaux[0]!)).toBe(arc.niveaux[1]);
    expect(suivantDansArc(arc.niveaux.at(-1)!)).toBeNull();
    expect(arcDe(arc.niveaux[2]!)).toBe(arc);
  });

  it('un niveau s’ouvre quand le précédent de son arc est fait', () => {
    const tournee = ARCS[0]!;
    const [a, b, c] = tournee.niveaux.filter((n) => !tournee.facultatifs?.includes(n));
    expect(niveauOuvert(a!, [])).toBe(true);
    expect(niveauOuvert(b!, [])).toBe(false);
    expect(niveauOuvert(b!, [a!])).toBe(true);
    expect(niveauOuvert(c!, [a!])).toBe(false);
  });

  it('Saint-Cézaire, le pont des Tuves, puis le pré du Clos (un mini-jeu) qui ne bloque pas la route des Alpes', () => {
    const tuves = NIVEAUX.findIndex((n) => n.id === 'tuves');
    const clos = NIVEAUX.findIndex((n) => n.id === 'clos');
    const alpages = NIVEAUX.findIndex((n) => n.id === 'alpages');
    expect(NIVEAUX[0]!.id).toBe('stc');
    expect(NIVEAUX[clos]!.miniJeu).toBe('drift');
    expect(suivantDansMonde(0)).toBe(tuves);
    expect(suivantDansMonde(tuves)).toBe(clos);
    expect(MONDE.indexOf(tuves)).toBe(1);
    expect(MONDE.indexOf(clos)).toBe(2);
    expect(niveauOuvert(tuves, [0])).toBe(true);
    expect(niveauOuvert(clos, [0])).toBe(false);
    expect(niveauOuvert(clos, [0, tuves])).toBe(true);
    expect(niveauOuvert(alpages, [0, tuves])).toBe(true); // facultatif : on peut le laisser de côté
    expect(niveauOuvert(alpages, [0, tuves, clos])).toBe(true);
  });

  it('l’arc breton s’ouvre une fois la tournée finie', () => {
    const bretagne = ARCS.find((a) => a.id === 'bretagne')!;
    const tournee = ARCS[0]!.niveaux;
    const premier = bretagne.niveaux[0]!;
    expect(niveauOuvert(premier, tournee.slice(0, -1))).toBe(false);
    expect(niveauOuvert(premier, tournee)).toBe(true);
    expect(niveauOuvert(bretagne.niveaux[1]!, tournee)).toBe(false);
    expect(suivantDansArc(tournee.at(-1)!)).toBeNull();
  });

  it('l’arc breton : la forêt, le port, la traversée en ferry, puis Groix', () => {
    const ids = ARCS.find((a) => a.id === 'bretagne')!.niveaux.map((i) => NIVEAUX[i]!.id);
    expect(ids).toEqual(['foret', 'port', 'ferry', 'groix']);
  });

  it('une seule route : après le dernier niveau de la tournée, on continue vers la Bretagne', () => {
    const club = ARCS[0]!.niveaux.at(-1)!;
    const foret = ARCS.find((a) => a.id === 'bretagne')!.niveaux[0]!;
    expect(suivantDansMonde(club)).toBe(foret);
    expect(MONDE.indexOf(foret)).toBe(MONDE.indexOf(club) + 1);
    expect(suivantDansMonde(MONDE.at(-1)!)).toBeNull();
  });

  it('le FISE s’ouvre après Groix, et la route y mène', () => {
    const fise = ARCS.find((a) => a.id === 'fise')!.niveaux[0]!;
    const groix = NIVEAUX.findIndex((n) => n.id === 'groix');
    expect(NIVEAUX[fise]!.id).toBe('fise');
    expect(suivantDansMonde(groix)).toBe(fise);
    expect(niveauOuvert(fise, [])).toBe(false);
    expect(niveauOuvert(fise, [groix])).toBe(true);
  });
});
