import { describe, expect, it } from 'vitest';
import { DocumentNiveau, type ModuleEditeur } from '../src/editeur/document';
import MODULES from '../src/editeur/modules.json';
import { NIVEAUX } from '../src/niveaux';
import { litNiveau } from '../src/niveaux/format';
import { tuileDuCaractere } from '../src/monde/tuiles';

const modules = MODULES as ModuleEditeur[];
/** les caractères qui ne sont pas des tuiles : le vide, le mur de fond, les ennemis, les repères */
const AUTRES = /^[ .a-z@F!K*+%()&1-9YPZ]$/;

describe('l’éditeur de niveau', () => {
  it('une page blanche se joue : un départ, un van atteignable', () => {
    const d = DocumentNiveau.vierge();
    expect(d.verifie().ok).toBe(true);
    expect(d.largeur).toBe(160);
  });

  it('part d’un niveau du jeu tel quel (Ottawa : son décor, son thème, le van atteignable)', () => {
    const def = NIVEAUX.find((n) => n.id === 'ottawa')!;
    const d = DocumentNiveau.depuisNiveau(def);
    expect(d.theme).toBe('ottawa');
    expect(d.decor.length).toBe(def.decor!.length);
    expect(d.verifie().ok).toBe(true);
  });

  it('s’exporte et se réimporte à l’identique', () => {
    const d = DocumentNiveau.vierge(60, 30, 'lund');
    d.commence();
    d.rect(10, 10, 20, 12, 'B');
    d.ajouteDecor('sapinNeige', 30, 18);
    d.termine();
    const j = JSON.stringify(d.versJSON());
    const e = DocumentNiveau.depuisJSON(j);
    expect(e.lignes().map((l) => l.trimEnd())).toEqual(d.lignes().map((l) => l.trimEnd()));
    expect(e.decor).toEqual(d.decor);
    expect(e.theme).toBe('lund');
    expect(() => DocumentNiveau.depuisJSON('{"format":"autre"}')).toThrow();
  });

  it('annule et refait un geste entier ; un geste qui ne change rien ne compte pas', () => {
    const d = DocumentNiveau.vierge(60, 30);
    const avant = d.lignes();
    d.commence();
    for (let x = 5; x < 15; x++) d.pose(x, 10, 'R');
    d.termine();
    d.commence();
    d.pose(5, 10, 'R');
    d.termine();
    d.annule();
    expect(d.lignes()).toEqual(avant);
    expect(d.peutAnnuler).toBe(false);
    d.refait();
    expect(d.get(14, 10)).toBe('R');
  });

  it('change de taille sans déplacer le sol (les rangées s’ajoutent en haut)', () => {
    const d = DocumentNiveau.vierge(60, 30);
    d.ajouteDecor('arbre', 10, 18);
    d.redimensionne(80, 40);
    expect([d.largeur, d.hauteur]).toEqual([80, 40]);
    expect(d.get(3, 27)).toBe('@');
    expect(d.decor[0]).toEqual(['arbre', 10, 28]);
  });

  it('chaque module est un rectangle de caractères connus, et se pose sans rendre le niveau illisible', () => {
    expect(modules.length).toBeGreaterThanOrEqual(40);
    for (const m of modules) {
      const w = m.lignes[0]!.length;
      expect(
        m.lignes.every((l) => l.length === w),
        m.id,
      ).toBe(true);
      for (const c of m.lignes.join(''))
        expect(tuileDuCaractere(c) !== null || AUTRES.test(c), `${m.id} « ${c} »`).toBe(true);
      const d = DocumentNiveau.vierge(w + 40, 60);
      d.tampon(m, 12, 48);
      expect(() => litNiveau(d.versDef(m.id)), m.id).not.toThrow();
    }
  });
});
