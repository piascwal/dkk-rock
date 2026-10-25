import { ACCESSOIRES } from '../rendu/decor-objets';
import { THEMES, type NomTheme } from '../rendu/themes';
import { litNiveau, type DefNiveau, type Qui, type Replique } from './format';

/**
 * « Mes niveaux » : les niveaux faits dans l'éditeur et enregistrés dans le navigateur, pour y rejouer (seul, contre l'ordinateur
 * ou en ligne en battle royale : l'hôte envoie alors le niveau aux autres joueurs). Chacun garde de quoi se jouer (`def`) et de
 * quoi se rouvrir dans l'éditeur (`source`, l'export de l'éditeur).
 *
 * Tout ce qui vient d'ailleurs (le stockage, un autre joueur) repasse par `valideDef` : une carte lisible, un thème connu, du
 * décor connu, des dialogues bornés.
 */

export interface NiveauSauve {
  id: string;
  nom: string;
  /** enregistré le (ms depuis 1970) */
  date: number;
  def: DefNiveau;
  /** l'export de l'éditeur (NiveauExporte), pour rouvrir le niveau tel qu'on l'a laissé */
  source: unknown;
}

const CLE = 'dkk-mes-niveaux';
const QUI: ReadonlySet<string> = new Set<Qui>([
  'JBT',
  'JBM',
  'JBG',
  'MAT',
  'TOM',
  'FADATCHI',
  'NARRATEUR',
  'YETI',
  'DJ',
  'RADIO',
]);
const LIGNES_MAX = 200;
const COLONNES_MAX = 1300;

let cache: NiveauSauve[] | null = null;

export function mesNiveaux(): NiveauSauve[] {
  if (!cache) {
    try {
      const brut = JSON.parse(localStorage.getItem(CLE) ?? '[]') as Partial<NiveauSauve>[];
      cache = brut.flatMap((n) => {
        const def = valideDef(n.def, String(n.id));
        return def && typeof n.id === 'string' && typeof n.nom === 'string'
          ? [{ id: n.id, nom: n.nom, date: Number(n.date) || 0, def, source: n.source ?? null }]
          : [];
      });
    } catch {
      cache = [];
    }
  }
  return cache;
}

function garde(): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(mesNiveaux()));
  } catch {
    // stockage plein ou interdit : le niveau reste le temps de la session, l'export reste possible
  }
}

/** Enregistre un niveau (un niveau du même nom est remplacé) ; renvoie ce qui est gardé. */
export function enregistreNiveau(nom: string, def: DefNiveau, source: unknown): NiveauSauve {
  const l = mesNiveaux();
  const ancien = l.find((n) => n.nom === nom);
  const id = ancien?.id ?? `perso-${Date.now().toString(36)}`;
  const n: NiveauSauve = { id, nom, date: Date.now(), def: { ...def, id, titre: nom }, source };
  cache = [n, ...l.filter((o) => o.id !== id)];
  garde();
  return n;
}

export function retireNiveau(id: string): void {
  cache = mesNiveaux().filter((n) => n.id !== id);
  garde();
}

const chaine = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max;
const entier = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 5000;

/**
 * Un niveau venu d'ailleurs, refait proprement (ou null) : seulement ce qu'un niveau de l'éditeur contient, et il doit se lire
 * (un départ, une fin, des tyroliennes reliées...).
 */
export function valideDef(o: unknown, id: string): DefNiveau | null {
  if (!o || typeof o !== 'object') return null;
  const d = o as Record<string, unknown>;
  const carte = d.carte;
  if (!Array.isArray(carte) || !carte.length || carte.length > LIGNES_MAX) return null;
  if (!carte.every((l) => chaine(l, COLONNES_MAX))) return null;
  if (typeof d.theme !== 'string' || !(d.theme in THEMES)) return null;
  const decor = (Array.isArray(d.decor) ? d.decor : []).filter(
    (x): x is [string, number, number] =>
      Array.isArray(x) && typeof x[0] === 'string' && x[0] in ACCESSOIRES && entier(x[1]) && entier(x[2]),
  );
  const gens = (Array.isArray(d.gens) ? d.gens : []).filter(
    (x): x is [number, number, string] =>
      Array.isArray(x) && entier(x[0]) && entier(x[1]) && chaine(x[2], 16),
  );
  const dialogues: Partial<Record<string, Replique[]>> = {};
  const brut = d.dialogues && typeof d.dialogues === 'object' ? (d.dialogues as Record<string, unknown>) : {};
  for (const c of '123456789') {
    const l = brut[c];
    if (!Array.isArray(l)) continue;
    dialogues[c] = l
      .filter((r: { qui?: unknown; texte?: unknown }) => QUI.has(String(r?.qui)) && chaine(r?.texte, 300))
      .slice(0, 12)
      .map((r: { qui: Qui; texte: string }) => ({ qui: r.qui, texte: r.texte }));
  }
  const def: DefNiveau = {
    id,
    titre: chaine(d.titre, 40) && d.titre.trim() ? d.titre : 'Niveau sans nom',
    sousTitre: 'Mes niveaux',
    theme: d.theme as NomTheme,
    intro: [],
    dialogues,
    outro: [],
    decor,
    gens,
    semis: true,
    carte: carte as string[],
  };
  try {
    litNiveau(def);
  } catch {
    return null;
  }
  return def;
}
