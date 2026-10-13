import { describe, expect, it } from 'vitest';
import { MELODIES, noteDe } from '../src/audio/melodies';

describe('les mélodies des tirs', () => {
  it('chaque tir numéroté donne la note suivante, en boucle', () => {
    const m = MELODIES.basse!;
    expect(noteDe('basse:0')!.f).toBe(m.notes[0]);
    expect(noteDe('basse:3')!.f).toBe(m.notes[3]);
    expect(noteDe(`basse:${m.notes.length}`)!.f).toBe(m.notes[0]);
  });

  it('un son sans mélodie, ou sans numéro, reste un bruitage', () => {
    expect(noteDe('riff:2')).toBeNull();
    expect(noteDe('basse')).toBeNull();
  });
});
