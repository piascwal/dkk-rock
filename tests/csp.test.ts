import { expect, it } from 'vitest';
import { COURTIERS } from '@piascwal/lan-kit';
import { SERVEURS_RENCONTRE } from '../vite.config';

it('la politique de sécurité autorise exactement les serveurs de rencontre de lan-kit', () => {
  expect([...SERVEURS_RENCONTRE].sort()).toEqual([...COURTIERS].sort());
});
