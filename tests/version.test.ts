import { describe, expect, it } from 'vitest';
import { texteVersion, verifieVersion } from '../src/version';

const reponse = (corps: unknown, ok = true) =>
  (async () => ({ ok, json: async () => corps })) as unknown as typeof fetch;

describe('la version', () => {
  it('s’affiche avec son commit, ou comme version de développement', () => {
    expect(texteVersion('0.1.12', 'a1b2c3d')).toBe('v0.1.12 · a1b2c3d');
    expect(texteVersion('0.1.local', '')).toBe('v0.1.local');
    expect(texteVersion('dev')).toBe('version de développement');
  });

  it('repère une version plus récente publiée', async () => {
    const r = await verifieVersion('/dkk-rock/', '0.1.11', reponse({ version: '0.1.12' }));
    expect(r).toEqual({ etat: 'nouvelle', derniere: '0.1.12' });
  });

  it('ne dit rien quand on est à jour', async () => {
    expect(await verifieVersion('/', '0.1.12', reponse({ version: '0.1.12' }))).toEqual({ etat: 'a-jour' });
  });

  it('reste muet quand on ne peut pas savoir : développement, fichier absent, hors ligne, contenu douteux', async () => {
    expect((await verifieVersion('/', 'dev', reponse({ version: '9' }))).etat).toBe('inconnu');
    expect((await verifieVersion('/', '0.1.1', reponse({}, false))).etat).toBe('inconnu');
    expect((await verifieVersion('/', '0.1.1', reponse({ version: '<script>' }))).etat).toBe('inconnu');
    expect((await verifieVersion('/', '0.1.1', reponse({ version: 12 }))).etat).toBe('inconnu');
    const horsLigne = (async () => {
      throw new Error('réseau');
    }) as unknown as typeof fetch;
    expect((await verifieVersion('/', '0.1.1', horsLigne)).etat).toBe('inconnu');
  });
});
