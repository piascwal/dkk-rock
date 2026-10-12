/** La version du jeu ouvert, et la vérification qu'une plus récente n'a pas été publiée depuis. */

// les constantes sont injectées à la construction ; hors construction (tests), valeurs par défaut
export const VERSION: string = typeof __VERSION__ === 'string' ? __VERSION__ : 'test';
export const COMMIT: string = typeof __COMMIT__ === 'string' ? __COMMIT__ : '';

/** Le texte de version affiché : « v0.1.12 · a1b2c3d », ou « version de développement ». */
export function texteVersion(version = VERSION, commit = COMMIT): string {
  if (version === 'dev') return 'version de développement';
  return `v${version}${commit ? ` · ${commit}` : ''}`;
}

export type EtatVersion = 'a-jour' | 'nouvelle' | 'inconnu';

const VERSION_SURE = /^[0-9A-Za-z.-]{1,32}$/;

/**
 * Compare la version ouverte à celle qui est publiée (version.json, jamais mis en cache). `inconnu` si on
 * ne peut pas savoir : développement, hors ligne, fichier absent ou illisible.
 */
export async function verifieVersion(
  base: string,
  actuelle = VERSION,
  recupere: typeof fetch = fetch,
): Promise<{ etat: EtatVersion; derniere?: string }> {
  if (actuelle === 'dev' || actuelle === 'test') return { etat: 'inconnu' };
  try {
    const rep = await recupere(`${base}version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!rep.ok) return { etat: 'inconnu' };
    const o = (await rep.json()) as { version?: unknown };
    if (typeof o.version !== 'string' || !VERSION_SURE.test(o.version)) return { etat: 'inconnu' };
    return o.version === actuelle ? { etat: 'a-jour' } : { etat: 'nouvelle', derniere: o.version };
  } catch {
    return { etat: 'inconnu' };
  }
}

/** Recharge le jeu en contournant le cache de la page : un paramètre change à chaque version. */
export function rechargeVersion(derniere: string): void {
  location.replace(`${location.pathname}?v=${encodeURIComponent(derniere)}${location.hash}`);
}
