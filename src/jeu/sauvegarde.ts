/**
 * La sauvegarde, dans le stockage du navigateur : le niveau atteint, le
 * dernier drapeau levé, les vies et le score, plus les réglages.
 */
import { VIES_MAX_RESEAU } from '../config';

export interface Progression {
  niveau: number;
  /** index du dernier drapeau levé dans ce niveau, -1 : départ */
  drapeau: number;
  vies: number;
  score: number;
}

/** Qualité de l'affichage : automatique, toujours au maximum, ou économe (appareil lent). */
export type Qualite = 'auto' | 'max' | 'eco';

export interface Sauvegarde {
  version: 1;
  /** la partie en cours, à reprendre avec « Continuer » */
  enCours: Progression | null;
  /** les niveaux terminés (indices dans NIVEAUX) : ils ouvrent le suivant de leur arc */
  faits: number[];
  membre: number;
  pseudo: string;
  son: boolean;
  musique: boolean;
  qualite: Qualite;
  /** le record du concours de drift du pré du Clos : la plus grande part de pelouse saccagée (0 à 100) */
  recordDrift: number;
  /** le record du plongeon du pont des Tuves : la meilleure note (0 à 100) */
  recordPlongeon: number;
  /** le record du rêve de JBT : le meilleur score (les piles, et la lune) */
  recordReve: number;
  /** le record de l'avion de JBG : le meilleur score */
  recordAvion: number;
  /** les cartes Sibylle des fontaines acquises, par niveau (son `id`) : les numéros de leurs cachettes */
  sibylles: Record<string, number[]>;
}

const CLE = 'dkk-rock.sauvegarde';

export const SAUVEGARDE_VIDE: Sauvegarde = {
  version: 1,
  enCours: null,
  faits: [],
  membre: 0,
  pseudo: '',
  son: true,
  musique: true,
  qualite: 'auto',
  recordDrift: 0,
  recordPlongeon: 0,
  recordReve: 0,
  recordAvion: 0,
  sibylles: {},
};

const entier = (v: unknown, min: number, max: number, defaut: number): number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : defaut;

/** Les niveaux terminés ; une ancienne sauvegarde (`niveauMax`) disait seulement jusqu'où on était arrivé. */
function niveauxFaits(o: Record<string, unknown>, nbNiveaux: number): number[] {
  if (Array.isArray(o.faits))
    return [
      ...new Set(o.faits.filter((n): n is number => Number.isInteger(n) && n >= 0 && n < nbNiveaux)),
    ].sort((a, b) => a - b);
  const max = entier(o.niveauMax, 0, nbNiveaux - 1, 0);
  return Array.from({ length: max }, (_, i) => i);
}

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
          vies: entier(p.vies, 1, VIES_MAX_RESEAU, 5),
          score: entier(p.score, 0, 1e9, 0),
        }
      : null;
  return {
    version: 1,
    enCours,
    faits: niveauxFaits(o, nbNiveaux),
    membre: entier(o.membre, 0, 4, 0),
    pseudo: typeof o.pseudo === 'string' ? o.pseudo.slice(0, 14) : '',
    son: o.son !== false,
    musique: o.musique !== false,
    qualite: o.qualite === 'max' || o.qualite === 'eco' ? o.qualite : 'auto',
    recordDrift: pourcent(o.recordDrift),
    recordPlongeon: pourcent(o.recordPlongeon),
    recordReve: entier(o.recordReve, 0, 65534, 0),
    recordAvion: entier(o.recordAvion, 0, 65534, 0),
    sibylles: sibyllesLues(o.sibylles),
  };
}

/** Les cartes Sibylle relues : par niveau, des numéros de cachette entiers, sans doublon ; le reste est ignoré. */
function sibyllesLues(v: unknown): Record<string, number[]> {
  const lues: Record<string, number[]> = {};
  if (!v || typeof v !== 'object') return lues;
  for (const [id, cartes] of Object.entries(v as Record<string, unknown>))
    if (Array.isArray(cartes))
      lues[id] = [...new Set(cartes.filter((n): n is number => Number.isInteger(n) && n >= 0 && n < 64))];
  return lues;
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

/** Un record de mini-jeu relu : un nombre de 0 à 100, sinon 0. */
const pourcent = (v: unknown): number => (typeof v === 'number' && v >= 0 && v <= 100 ? v : 0);

/** Garde le meilleur score du concours de drift comme record du pré du Clos. Vrai s'il est battu (à enregistrer). */
export function retiensRecordDrift(s: Sauvegarde, scores: readonly ({ pourcent: number } | null)[]): boolean {
  const meilleur = Math.max(0, ...scores.map((x) => x?.pourcent ?? 0));
  if (meilleur <= s.recordDrift + 0.01) return false;
  s.recordDrift = meilleur;
  return true;
}

/** Garde la meilleure note du plongeon comme record du pont des Tuves. Vrai s'il est battu (à enregistrer). */
export function retiensRecordPlongeon(s: Sauvegarde, scores: readonly (number | null)[]): boolean {
  const meilleur = Math.max(0, ...scores.map((x) => x ?? 0));
  if (meilleur <= s.recordPlongeon) return false;
  s.recordPlongeon = meilleur;
  return true;
}

/** Garde le meilleur score d'un mini-jeu à points (le rêve de JBT, l'avion de JBG). Vrai s'il est battu (à enregistrer). */
function retiensMeilleur(
  s: Sauvegarde,
  cle: 'recordReve' | 'recordAvion',
  scores: readonly (number | null)[],
): boolean {
  const meilleur = Math.max(0, ...scores.map((x) => x ?? 0));
  if (meilleur <= s[cle]) return false;
  s[cle] = meilleur;
  return true;
}

/** Les records des mini-jeux, d'après la vue (le drift, le plongeon ou le rêve en cours). Vrai si l'un est battu (à enregistrer). */
export function retiensRecords(
  s: Sauvegarde,
  v: {
    drift?: { scores: ({ pourcent: number } | null)[] };
    plongeon?: { scores: (number | null)[] };
    reve?: { scores: (number | null)[] };
    avion?: { scores: (number | null)[] };
  },
): boolean {
  return (
    (!!v.drift && retiensRecordDrift(s, v.drift.scores)) ||
    (!!v.plongeon && retiensRecordPlongeon(s, v.plongeon.scores)) ||
    (!!v.reve && retiensMeilleur(s, 'recordReve', v.reve.scores)) ||
    (!!v.avion && retiensMeilleur(s, 'recordAvion', v.avion.scores))
  );
}
