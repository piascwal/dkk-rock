import { describe, expect, it } from 'vitest';
import { casesAccessibles } from './accessibilite';
import { niveauLu } from '../src/niveaux';

/** Le Yéti Alpha (Cimes) et le Champion (finale du FISE) gardent le van : sans les battre, on ne le rejoint pas. */
describe.each([
  ['les Cimes (Yéti Alpha)', 2],
  ['la finale du FISE (Champion)', 10],
])('%s', (_, indice) => {
  const lu = niveauLu(indice);

  it('le van ne se rejoint qu’après la barrière : pas de passage autour du boss', () => {
    const van = `${lu.fin!.tx},${lu.fin!.ty}`;
    expect(casesAccessibles(lu, false).has(van)).toBe(false);
    expect(casesAccessibles(lu, true).has(van)).toBe(true);
  });
});
