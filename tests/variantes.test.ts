import { describe, expect, it } from 'vitest';
import { DocumentNiveau } from '../src/editeur/document';
import { nombreVariantes } from '../src/editeur/variantes';
import { Carte } from '../src/monde/carte';
import { valideDef } from '../src/niveaux/mes-niveaux';
import { semeDecor } from '../src/rendu/decor';

describe('les apparences choisies du décor', () => {
  it('compte les apparences d’un accessoire en image, ou dessiné en code', () => {
    expect(nombreVariantes('figuier')).toBe(3);
    expect(nombreVariantes('rocheInconnue')).toBe(1);
  });

  it('l’apparence choisie s’enregistre, s’annule, s’exporte, se relit et se joue ; sans elle, rien n’est écrit', () => {
    const d = DocumentNiveau.vierge();
    d.commence();
    d.ajouteDecor('figuier', 10, 20, 2);
    d.ajouteDecor('figuier', 14, 20);
    d.termine();
    expect(d.decor).toEqual([
      ['figuier', 10, 20, 2],
      ['figuier', 14, 20],
    ]);
    const relu = DocumentNiveau.depuisJSON(JSON.stringify(d.versJSON()));
    expect(relu.decor).toEqual(d.decor);
    expect(valideDef(d.versDef('x'), 'y')!.decor).toEqual(d.decor);
    d.annule();
    expect(d.decor).toEqual([]);
    d.refait();
    expect(d.decor[0]).toEqual(['figuier', 10, 20, 2]);
  });

  it('en jeu, l’apparence choisie est celle qui se dessine ; les autres restent tirées au hasard', () => {
    const carte = new Carte(40, 30, new Uint8Array(40 * 30), new Uint8Array(40 * 30));
    const poses = semeDecor(carte, 'garage', 7, [
      ['figuier', 10, 20, 2],
      ['figuier', 14, 20],
    ]);
    expect(poses[0]!.v).toBe(2);
    expect(poses[1]!.v).toBeGreaterThanOrEqual(0);
  });
});
