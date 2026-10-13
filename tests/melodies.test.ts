import { describe, expect, it } from 'vitest';
import { MELODIES, freq, noteDe } from '../src/audio/melodies';

describe('les mélodies des tirs', () => {
  it('chaque tir numéroté donne la note suivante, en boucle', () => {
    const m = MELODIES.basse!;
    expect(noteDe('basse:0')!.pas).toBe(m.pas[0]);
    expect(noteDe('basse:3')!.pas).toBe(m.pas[3]);
    expect(noteDe(`basse:${m.pas.length}`)!.pas).toBe(m.pas[0]);
  });

  it('un son sans mélodie, ou sans numéro, reste un bruitage', () => {
    expect(noteDe('solo:2')).toBeNull();
    expect(noteDe('basse')).toBeNull();
  });

  it('lit les noms de notes', () => {
    expect(freq('la4')).toBeCloseTo(440);
    expect(freq('mi2')).toBeCloseTo(82.41, 1);
    expect(freq('do#5')).toBeCloseTo(554.37, 1);
    expect(freq('sib3')).toBeCloseTo(233.08, 1);
  });

  it('chaque héros a son morceau', () => {
    for (const son of ['basse', 'accord', 'riff', 'cri', 'baguette'])
      expect(MELODIES[son]!.pas.length).toBeGreaterThan(8);
  });
});
