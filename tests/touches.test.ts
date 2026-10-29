import { describe, expect, it } from 'vitest';
import { C } from '../src/jeu/commandes';
import { ACTIONS, DEFAUTS, MAX_TOUCHES, Touches, touchePermise } from '../src/entrees/touches';

/** Un stockage de navigateur, en mémoire. */
const memoire = (init: Record<string, string> = {}) => {
  const m = { ...init };
  return { getItem: (k: string) => m[k] ?? null, setItem: (k: string, v: string) => void (m[k] = v), m };
};

describe('les touches du clavier', () => {
  it('commencent par les touches de toujours : flèches, ZQSD/WASD, Espace, J, L, Échap', () => {
    const t = new Touches(memoire());
    expect(t.commande('ArrowLeft')).toBe(C.GAUCHE);
    expect(t.commande('KeyQ')).toBe(C.GAUCHE);
    expect(t.commande('KeyW')).toBe(C.HAUT);
    expect(t.commande('Space')).toBe(C.SAUT);
    expect(t.commande('ShiftLeft')).toBe(C.TIR);
    expect(t.commande('KeyL')).toBe(C.SPECIAL);
    expect(t.action('Escape')).toBe('pause');
    expect(t.estParDefaut()).toBe(true);
    // chaque touche ne sert qu'à une action
    const toutes = ACTIONS.flatMap((a) => DEFAUTS[a.id]);
    expect(new Set(toutes).size).toBe(toutes.length);
  });

  it('se réaffectent, et le changement est gardé', () => {
    const m = memoire();
    const t = new Touches(m);
    expect(t.affecte('saut', 0, 'KeyB')).toBeNull();
    expect(t.commande('KeyB')).toBe(C.SAUT);
    expect(t.commande('Space')).toBe(0);
    expect(t.estParDefaut()).toBe(false);
    // au prochain lancement
    expect(new Touches(m).commande('KeyB')).toBe(C.SAUT);
    expect(new Touches(m).liste('saut')).toEqual(['KeyB', 'KeyK']);
  });

  it('ajoutent une touche (trois au plus) et en retirent (jamais la dernière)', () => {
    const t = new Touches(memoire());
    expect(t.affecte('saut', 2, 'KeyN')).toBeNull();
    expect(t.liste('saut')).toEqual(['Space', 'KeyK', 'KeyN']);
    expect(t.affecte('saut', 3, 'KeyM')).toMatch(/trois|3/);
    expect(t.liste('saut')).toHaveLength(MAX_TOUCHES);
    t.retire('saut', 0);
    t.retire('saut', 0);
    t.retire('saut', 0);
    expect(t.liste('saut')).toEqual(['KeyN']);
  });

  it('retirent une touche à l’autre action qui l’avait, sauf si c’était sa dernière', () => {
    const t = new Touches(memoire());
    // KeyJ (tir) passe au saut : le tir garde KeyX et Maj
    expect(t.affecte('saut', 0, 'KeyJ')).toBeNull();
    expect(t.commande('KeyJ')).toBe(C.SAUT);
    expect(t.liste('tir')).toEqual(['KeyX', 'ShiftLeft']);
    // le tir n'a plus qu'une touche : on ne la lui prend pas
    t.retire('tir', 0);
    expect(t.affecte('saut', 0, 'ShiftLeft')).toMatch(/aucune touche/);
    expect(t.commande('ShiftLeft')).toBe(C.TIR);
  });

  it('refusent les touches réservées, et Échap sauf pour la pause', () => {
    expect(touchePermise('Enter', 'saut')).toBe(false);
    expect(touchePermise('F5', 'saut')).toBe(false);
    expect(touchePermise('Tab', 'saut')).toBe(false);
    expect(touchePermise('Escape', 'saut')).toBe(false);
    expect(touchePermise('Escape', 'pause')).toBe(true);
    expect(touchePermise('Numpad4', 'gauche')).toBe(true);
    const t = new Touches(memoire());
    expect(t.affecte('saut', 0, 'Enter')).toMatch(/réservée/);
    expect(t.liste('saut')).toEqual(['Space', 'KeyK']);
  });

  it('remettent les touches par défaut', () => {
    const t = new Touches(memoire());
    t.affecte('tir', 0, 'KeyV');
    t.reinitialise();
    expect(t.estParDefaut()).toBe(true);
    expect(t.commande('KeyJ')).toBe(C.TIR);
  });

  it('relisent une sauvegarde abîmée sans planter : le faux est ignoré', () => {
    const faux = [
      'pas du json',
      '42',
      JSON.stringify({ saut: 'KeyB', tir: [1, 'Enter', 'KeyV'], inconnue: ['KeyA'] }),
      // la même touche pour deux actions : la première l'emporte
      JSON.stringify({ saut: ['KeyB'], tir: ['KeyB'] }),
    ];
    for (const brut of faux) {
      const t = new Touches(memoire({ 'dkk-touches': brut }));
      for (const a of ACTIONS) expect(t.liste(a.id).length).toBeGreaterThan(0);
    }
    const t = new Touches(memoire({ 'dkk-touches': faux[2]! }));
    expect(t.liste('saut')).toEqual(['Space', 'KeyK']);
    expect(t.liste('tir')).toEqual(['KeyV']);
    const deux = new Touches(memoire({ 'dkk-touches': faux[3]! }));
    expect(deux.commande('KeyB')).toBe(C.SAUT);
    expect(deux.liste('tir').length).toBeGreaterThan(0);
  });

  it('marchent sans stockage (navigation privée)', () => {
    const t = new Touches(null);
    expect(t.affecte('saut', 0, 'KeyB')).toBeNull();
    expect(t.commande('KeyB')).toBe(C.SAUT);
  });
});
