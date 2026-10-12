import { TUILE } from '../config';
import { T, tuileDuCaractere } from '../monde/tuiles';
import type { NomTheme } from '../rendu/themes';

/**
 * Format des niveaux : une carte ASCII, une ligne par rangée de tuiles.
 *
 * Tuiles (voir monde/tuiles.ts) :
 *   ' ' vide   # terre   R roche   B brique   M métal   X socle (indestructible)
 *   N neige    G glace   W bois    - plateforme   H échelle   C caisse
 *   T caisson de basses (explose)   S sable   V vitre   D béton
 *   . mur de fond (décor d'intérieur, on passe devant)
 *
 * Repères (la case est vide une fois lue) :
 *   @ départ   F le van (fin du niveau)   ! drapeau (point de sauvegarde)
 *   K cage (un membre du groupe à libérer)   * arme au hasard   + médiator d'or (soin + spécial)
 *   ( et ) : extrémités d'une tyrolienne ; chaque ( est reliée à la ) la plus proche à sa droite
 *   1 à 9 : déclencheurs de dialogue (quand un joueur franchit la colonne)
 *   a..z : ennemis, voir ENNEMIS_PAR_LETTRE dans entites/ennemis/definitions.ts
 *   Y : le Yéti Alpha   Z : DJ Boucle (boss final)
 */

export type Qui = 'JBT' | 'JBM' | 'JBG' | 'MAT' | 'TOM' | 'FADATCHI' | 'NARRATEUR' | 'YETI' | 'DJ' | 'RADIO';

export interface Replique {
  qui: Qui;
  texte: string;
}

export interface DefNiveau {
  id: string;
  titre: string;
  sousTitre: string;
  theme: NomTheme;
  /** les cartes d'histoire montrées avant le niveau */
  intro: Replique[];
  /** dialogues déclenchés par les chiffres de la carte */
  dialogues: Partial<Record<string, Replique[]>>;
  /** répliques à la fin du niveau */
  outro: Replique[];
  carte: string[];
}

export interface Repere {
  tx: number;
  ty: number;
  /** position en pixels du coin haut gauche de la case */
  x: number;
  y: number;
}

export interface NiveauLu {
  def: DefNiveau;
  largeur: number;
  hauteur: number;
  tuiles: Uint8Array;
  /** 1 là où la carte dessine un mur de fond (« . ») */
  fond: Uint8Array;
  depart: Repere;
  /** le van ; null dans le niveau du boss final, qui se termine par sa chute */
  fin: Repere | null;
  drapeaux: Repere[];
  cages: Repere[];
  armes: Repere[];
  soins: Repere[];
  ennemis: (Repere & { lettre: string })[];
  boss: (Repere & { lettre: 'Y' | 'Z' })[];
  tyroliennes: { x1: number; y1: number; x2: number; y2: number }[];
  declencheurs: (Repere & { cle: string })[];
}

export class ErreurNiveau extends Error {}

const repere = (tx: number, ty: number): Repere => ({ tx, ty, x: tx * TUILE, y: ty * TUILE });

/** Lit une carte ASCII. Lève une ErreurNiveau si elle est incohérente. */
export function litNiveau(def: DefNiveau): NiveauLu {
  const lignes = def.carte;
  const hauteur = lignes.length;
  const largeur = Math.max(...lignes.map((l) => l.length));
  const tuiles = new Uint8Array(largeur * hauteur);
  const fond = new Uint8Array(largeur * hauteur);
  const lu: Omit<NiveauLu, 'depart' | 'fin'> & { depart?: Repere; fin?: Repere | null } = {
    def,
    largeur,
    hauteur,
    tuiles,
    fond,
    drapeaux: [],
    cages: [],
    armes: [],
    soins: [],
    ennemis: [],
    boss: [],
    tyroliennes: [],
    declencheurs: [],
  };
  const debuts: Repere[] = [];
  const bouts: Repere[] = [];

  for (let ty = 0; ty < hauteur; ty++) {
    const ligne = lignes[ty]!.padEnd(largeur, ' ');
    for (let tx = 0; tx < largeur; tx++) {
      const c = ligne[tx]!;
      const t = tuileDuCaractere(c);
      if (t !== null) {
        tuiles[ty * largeur + tx] = t;
        continue;
      }
      tuiles[ty * largeur + tx] = T.VIDE;
      const r = repere(tx, ty);
      if (c === '.') {
        fond[ty * largeur + tx] = 1;
        continue;
      }
      // un repère posé dans un intérieur garde le mur de fond de ses voisins
      if (ligne[tx - 1] === '.' || ligne[tx + 1] === '.') fond[ty * largeur + tx] = 1;
      if (c === '@') lu.depart = r;
      else if (c === 'F') lu.fin = r;
      else if (c === '!') lu.drapeaux.push(r);
      else if (c === 'K') lu.cages.push(r);
      else if (c === '*') lu.armes.push(r);
      else if (c === '+') lu.soins.push(r);
      else if (c === '(') debuts.push(r);
      else if (c === ')') bouts.push(r);
      else if (c === 'Y' || c === 'Z') lu.boss.push({ ...r, lettre: c });
      else if (/[1-9]/.test(c)) lu.declencheurs.push({ ...r, cle: c });
      else if (/[a-z]/.test(c)) lu.ennemis.push({ ...r, lettre: c });
      else throw new ErreurNiveau(`${def.id} : caractère inconnu « ${c} » en ${tx},${ty}`);
    }
  }

  if (!lu.depart) throw new ErreurNiveau(`${def.id} : pas de départ (@)`);
  if (!lu.fin && !lu.boss.some((b) => b.lettre === 'Z'))
    throw new ErreurNiveau(`${def.id} : ni van (F) ni boss final (Z)`);
  for (const d of debuts) {
    const candidats = bouts.filter((b) => b.tx > d.tx);
    if (!candidats.length) throw new ErreurNiveau(`${def.id} : tyrolienne sans arrivée en ${d.tx},${d.ty}`);
    const b = candidats.reduce((m, b) =>
      Math.hypot(b.tx - d.tx, b.ty - d.ty) < Math.hypot(m.tx - d.tx, m.ty - d.ty) ? b : m,
    );
    lu.tyroliennes.push({ x1: d.x + TUILE / 2, y1: d.y + 4, x2: b.x + TUILE / 2, y2: b.y + 4 });
  }
  for (const d of lu.declencheurs)
    if (!def.dialogues[d.cle]) throw new ErreurNiveau(`${def.id} : dialogue ${d.cle} non écrit`);
  return { ...lu, depart: lu.depart, fin: lu.fin ?? null } as NiveauLu;
}
