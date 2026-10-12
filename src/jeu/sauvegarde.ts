/**
 * La sauvegarde, dans le stockage du navigateur : le niveau atteint, le
 * dernier drapeau levé, les vies et le score, plus les réglages.
 */

export interface Progression {
  niveau: number;
  /** index du dernier drapeau levé dans ce niveau, -1 : départ */
  drapeau: number;
  vies: number;
  score: number;
}

export interface Sauvegarde {
  version: 1;
  /** la partie en cours, à reprendre avec « Continuer » */
  enCours: Progression | null;
  /** plus haut niveau débloqué */
  niveauMax: number;
  membre: number;
  pseudo: string;
  son: boolean;
  musique: boolean;
}

const CLE = 'dkk-rock.sauvegarde';

export const SAUVEGARDE_VIDE: Sauvegarde = {
  version: 1,
  enCours: null,
  niveauMax: 0,
  membre: 0,
  pseudo: '',
  son: true,
  musique: true,
};

const entier = (v: unknown, min: number, max: number, defaut: number): number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : defaut;

/** Relit une sauvegarde venue du stockage : tout champ abîmé reprend sa valeur par défaut. */
export function valideSauvegarde(brut: unknown, nbNiveaux: number): Sauvegarde {
  if (!brut || typeof brut !== 'object') return { ...SAUVEGARDE_VIDE };
  const o = brut as Record<string, unknown>;
  const p = o.enCours as Record<string, unknown> | null | undefined;
  const enCours: Progression | null =
    p && typeof p === 'object'
      ? {
          niveau: entier(p.niveau, 0, nbNiveaux - 1, 0),
          drapeau: entier(p.drapeau, -1, 99, -1),
          vies: entier(p.vies, 1, 99, 5),
          score: entier(p.score, 0, 1e9, 0),
        }
      : null;
  return {
    version: 1,
    enCours,
    niveauMax: entier(o.niveauMax, 0, nbNiveaux - 1, 0),
    membre: entier(o.membre, 0, 4, 0),
    pseudo: typeof o.pseudo === 'string' ? o.pseudo.slice(0, 14) : '',
    son: o.son !== false,
    musique: o.musique !== false,
  };
}

export function charge(nbNiveaux: number): Sauvegarde {
  try {
    const brut = localStorage.getItem(CLE);
    return valideSauvegarde(brut ? JSON.parse(brut) : null, nbNiveaux);
  } catch {
    return { ...SAUVEGARDE_VIDE };
  }
}

export function enregistre(s: Sauvegarde): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(s));
  } catch {
    /* navigation privée : tant pis, on joue sans sauvegarde */
  }
}
