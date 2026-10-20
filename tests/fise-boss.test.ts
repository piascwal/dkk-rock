import { describe, expect, it } from 'vitest';
import { casesAccessibles } from './accessibilite';
import { niveauLu } from '../src/niveaux';

describe('la finale du FISE', () => {
  const lu = niveauLu(10);

  it('le van ne se rejoint qu’après la barrière : pas de passage autour du Champion', () => {
    const van = `${lu.fin!.tx},${lu.fin!.ty}`;
    expect(casesAccessibles(lu, false).has(van)).toBe(false);
    expect(casesAccessibles(lu, true).has(van)).toBe(true);
  });
});
