import { proprietes, tuileDuCaractere } from '../monde/tuiles';
import type { Decor, DocumentNiveau, Gens, ModuleEditeur } from './document';
import MODULES_JSON from './modules.json';

/**
 * Les modules : ceux du jeu (les pièces du générateur, voir outils/exporte-modules.py) et « mes modules », faits dans l'éditeur à
 * partir d'une sélection, gardés dans le navigateur ; ceux-là s'exportent (un fichier .json à envoyer, pour les ajouter au jeu) et
 * se réimportent.
 */

export const MODULES = MODULES_JSON as ModuleEditeur[];
export const FAMILLE_PERSO = 'Mes modules';
const CLE = 'dkk-editeur-modules';

export interface ModulesExportes {
  format: 'dkk-modules';
  version: 1;
  modules: ModuleEditeur[];
}

let perso: ModuleEditeur[] | null = null;

/** Un module valide : un rectangle de lignes, une rangée de sol, du décor et des gens bien formés. */
function valide(m: Partial<ModuleEditeur>): m is ModuleEditeur {
  return (
    typeof m.nom === 'string' &&
    Array.isArray(m.lignes) &&
    m.lignes.length > 0 &&
    m.lignes.every((l) => typeof l === 'string' && l.length === m.lignes![0]!.length) &&
    Number.isInteger(m.sol) &&
    Array.isArray(m.decor ?? [])
  );
}

export function modulesPerso(): ModuleEditeur[] {
  if (!perso) {
    try {
      const l = JSON.parse(localStorage.getItem(CLE) ?? '[]') as Partial<ModuleEditeur>[];
      perso = l.filter(valide);
    } catch {
      perso = [];
    }
  }
  return perso;
}

function garde(): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(modulesPerso()));
  } catch {
    // stockage plein ou interdit : les modules restent le temps de la session, l'export reste possible
  }
}

export function ajouteModules(nouveaux: ModuleEditeur[]): void {
  const l = modulesPerso();
  for (const m of nouveaux) {
    const id = l.some((o) => o.id === m.id) || !m.id ? `perso-${Date.now()}-${l.length}` : m.id;
    l.unshift({ ...m, id, famille: FAMILLE_PERSO });
  }
  garde();
}

export function retireModule(id: string): void {
  perso = modulesPerso().filter((m) => m.id !== id);
  garde();
}

/**
 * Le presse-papier : le morceau de carte copié (outil sélection → Copier), un module comme les autres pour le poser (le bas du
 * rectangle sur la rangée touchée), mais jamais gardé : il ne vit que le temps de la session.
 */
export const ID_PRESSE_PAPIER = 'presse-papier';
let presse: ModuleEditeur | null = null;
export const pressePapier = (): ModuleEditeur | null => presse;
export const copieDansLePressePapier = (m: ModuleEditeur): void => {
  presse = {
    ...m,
    id: ID_PRESSE_PAPIER,
    nom: `Copie ${m.lignes[0]!.length} × ${m.lignes.length}`,
    famille: 'Presse-papier',
    sol: m.lignes.length,
  };
};

/** Un module, du jeu ou à soi, par son identifiant. */
export const trouveModule = (id: string): ModuleEditeur | undefined =>
  id === ID_PRESSE_PAPIER
    ? (presse ?? undefined)
    : (modulesPerso().find((m) => m.id === id) ?? MODULES.find((m) => m.id === id));

export const exporteModules = (modules: ModuleEditeur[]): ModulesExportes => ({
  format: 'dkk-modules',
  version: 1,
  modules,
});

/** Les modules d'un fichier exporté (ou une erreur lisible). */
export function lisModules(texte: string): ModuleEditeur[] {
  const o = JSON.parse(texte) as Partial<ModulesExportes>;
  if (o.format !== 'dkk-modules' || !Array.isArray(o.modules))
    throw new Error('Ce fichier n’est pas un export de modules de l’éditeur.');
  const l = o.modules.filter(valide);
  if (!l.length) throw new Error('Aucun module lisible dans ce fichier.');
  return l;
}

/**
 * Un module fait d'un rectangle de la carte (bornes comprises), avec son décor et ses gens. Sa rangée de sol : la surface de sa
 * première colonne (la première tuile pleine en partant du haut), sinon sa dernière rangée.
 */
export function extraisModule(
  doc: DocumentNiveau,
  [x0, y0, x1, y1]: [number, number, number, number],
  nom: string,
): ModuleEditeur {
  [x0, x1] = [Math.max(0, Math.min(x0, x1)), Math.min(doc.largeur - 1, Math.max(x0, x1))];
  [y0, y1] = [Math.max(0, Math.min(y0, y1)), Math.min(doc.hauteur - 1, Math.max(y0, y1))];
  // le départ et le van sont uniques : ils restent dans le niveau, pas dans le module
  const lignes = doc
    .lignes()
    .slice(y0, y1 + 1)
    .map((l) => l.slice(x0, x1 + 1).replace(/[@F]/g, ' '));
  const plein = (c: string) => {
    const t = tuileDuCaractere(c);
    return t !== null && proprietes(t).solide;
  };
  const sol = lignes.findIndex((l) => plein(l[0]!));
  const dedans = (x: number, y: number) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
  return {
    id: '',
    nom,
    famille: FAMILLE_PERSO,
    sol: sol >= 0 ? sol : lignes.length - 1,
    lignes,
    decor: doc.decor
      .filter(([, x, y]) => dedans(x, y))
      .map((d): Decor =>
        d[3] === undefined ? [d[0], d[1] - x0, d[2] - y0] : [d[0], d[1] - x0, d[2] - y0, d[3]],
      ),
    gens: doc
      .listeGens()
      .filter(([x, y]) => dedans(x, y))
      .map(([x, y, cle]): Gens => [x - x0, y - y0, cle]),
  };
}
