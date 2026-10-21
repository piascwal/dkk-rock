import { TUILE } from '../config';
import { T, TUILES_LEGERES, tuileDuCaractere } from '../monde/tuiles';
import type { NomTheme } from '../rendu/themes';

/**
 * Format des niveaux : une carte ASCII, une ligne par rangée de tuiles.
 *
 * Tuiles (voir monde/tuiles.ts) :
 *   ' ' vide   # terre   R roche   B brique   M métal   X socle (indestructible)
 *   N neige    G glace   W bois    - plateforme   H échelle   C caisse
 *   T caisson de basses (explose)   I caisson violet (explose, en plus gros)   S sable   V vitre   D béton
 *   | barrière du boss (s'ouvre à sa mort)
 *   E échelon scellé (échelle incassable)   = piton (plateforme incassable)
 *   O tonneau WOG (un cœur : +1 vie)   Q tonneau d'or WOG (cœur d'or : tout revient, 10 s d'invincibilité)
 *   . mur de fond (décor d'intérieur, on passe devant)
 *
 * Repères (la case est vide une fois lue) :
 *   @ départ   F le van (fin du niveau)   ! drapeau (point de sauvegarde)
 *   & embarquement (le ferry : le pont se ferme, des vagues montent à l'abordage, voir jeu/traversee.ts)
 *   K cage (un membre du groupe à libérer)   * arme au hasard   + médiator d'or (soin + spécial)
 *   % baril explosif (s'allume au premier tir, explose deux secondes après)
 *   ( et ) : extrémités d'une tyrolienne ; chaque ( est reliée à la ) la plus proche à sa droite
 *   1 à 9 : déclencheurs de dialogue (quand un joueur franchit la colonne)
 *   a..z : ennemis, voir ENNEMIS_PAR_LETTRE dans entites/ennemis/definitions.ts
 *   Y : le Yéti Alpha   P : le Champion du FISE   Z : DJ Boucle (boss final)
 */

export type Qui = 'JBT' | 'JBM' | 'JBG' | 'MAT' | 'TOM' | 'FADATCHI' | 'NARRATEUR' | 'YETI' | 'DJ' | 'RADIO';

export interface Replique {
  qui: Qui;
  texte: string;
  /**
   * une illustration en grand sur la carte d'histoire (nom d'un fichier de public/sprites/), au-dessus du texte ; elle reste
   * pour les répliques suivantes, jusqu'à une réplique à `image: ''` (ou une autre image) ;
   * avec un `texte` vide, l'image seule occupe tout l'écran
   */
  image?: string;
  /** avec un `texte` vide : une pile de photos (fichiers de public/sprites/) qui tombent l'une sur l'autre, en plein écran */
  photos?: string[];
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
  /** le van décolle à la fin du niveau, à la force de son réacteur, au lieu de partir sur la route (un sommet) */
  envol?: boolean;
  /** un mini-jeu à la place du niveau de plateforme (l'intro lue, il commence ; voir jeu/drift.ts) */
  miniJeu?: 'drift' | 'plongeon';
  /** le décor placé à la main (nom d'accessoire, colonne, rangée du sol) : il remplace le décor semé au hasard */
  decor?: readonly (readonly [string, number, number])[];
  /** le décor placé à la main s'ajoute au semis au hasard au lieu de le remplacer (Saint-Cézaire, les gorges de la Siagne) */
  semis?: boolean;
  /** les colonnes où un assaut de riders tombe du ciel dès qu'un héros les franchit (voir jeu/assauts.ts) */
  assauts?: readonly number[];
  /** les modules du niveau (colonnes de début et de fin) : les riders au repos y restent (voir jeu/chargement.ts) */
  zones?: readonly (readonly [number, number])[];
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
  /** l'embarquement du ferry (`&`) : le pont s'étend à droite de ce repère ; null hors du port */
  embarquement: Repere | null;
  drapeaux: Repere[];
  cages: Repere[];
  /** les barils explosifs (`%`) */
  barils: Repere[];
  armes: Repere[];
  soins: Repere[];
  ennemis: (Repere & { lettre: string })[];
  boss: (Repere & { lettre: 'Y' | 'Z' | 'P' })[];
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
    embarquement: null,
    drapeaux: [],
    cages: [],
    barils: [],
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
      else if (c === '&') lu.embarquement = r;
      else if (c === '!') lu.drapeaux.push(r);
      else if (c === 'K') lu.cages.push(r);
      else if (c === '%') lu.barils.push(r);
      else if (c === '*') lu.armes.push(r);
      else if (c === '+') lu.soins.push(r);
      else if (c === '(') debuts.push(r);
      else if (c === ')') bouts.push(r);
      else if (c === 'Y' || c === 'Z' || c === 'P') lu.boss.push({ ...r, lettre: c });
      else if (/[1-9]/.test(c)) lu.declencheurs.push({ ...r, cle: c });
      else if (/[a-z]/.test(c)) lu.ennemis.push({ ...r, lettre: c });
      else throw new ErreurNiveau(`${def.id} : caractère inconnu « ${c} » en ${tx},${ty}`);
    }
  }

  donneFondAuxTuilesLegeres(lignes, tuiles, fond, largeur, hauteur);
  lu.drapeaux.sort((a, b) => a.x - b.x); // l'ordre des drapeaux est celui du niveau, pas celui des rangées
  scelleLesEchelles(tuiles, largeur, hauteur);
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

/**
 * Dans chaque colonne d'échelle, le haut et un barreau sur deux deviennent des échelons scellés : même si le reste de
 * l'échelle saute, on peut remonter de barreau en barreau (deux tuiles d'écart, moins qu'un saut) et sortir en haut.
 */
function scelleLesEchelles(tuiles: Uint8Array, largeur: number, hauteur: number): void {
  for (let tx = 0; tx < largeur; tx++) {
    let rang = -1; // rang depuis le haut de l'échelle en cours
    for (let ty = 0; ty < hauteur; ty++) {
      const i = ty * largeur + tx;
      if (tuiles[i] === T.ECHELLE) {
        rang++;
        if (rang % 2 === 0) tuiles[i] = T.ECHELON;
      } else if (tuiles[i] !== T.ECHELON) rang = -1;
      else rang++;
    }
  }
}

/**
 * Les tuiles qui ne remplissent pas leur case (échelles, planches, pitons, tonneaux, caisses) gardent le mur de fond de
 * la pièce où elles sont : une case voisine de mur de fond ('.'), ou serrée entre deux murs pleins (un puits). Sans cela, on
 * voit le ciel à travers un plancher à pitons ou derrière une échelle.
 */
/** Celles qui laissent voir le fond, et les caisses : une fois cassées, elles laissent le mur de la pièce. */
const LEGERES = new Set<number>([...TUILES_LEGERES, T.CAISSE, T.CAISSON, T.CAISSON_ROSE, T.BIDON]);
const PLEINES = new Set<number>([
  T.TERRE,
  T.ROCHE,
  T.BRIQUE,
  T.METAL,
  T.SOCLE,
  T.NEIGE,
  T.GLACE,
  T.BOIS,
  T.BETON,
]);

function donneFondAuxTuilesLegeres(
  lignes: string[],
  tuiles: Uint8Array,
  fond: Uint8Array,
  largeur: number,
  hauteur: number,
): void {
  const mur = (x: number, y: number) => lignes[y]?.[x] === '.';
  const pleine = (x: number, y: number) =>
    x >= 0 && x < largeur && y >= 0 && y < hauteur && PLEINES.has(tuiles[y * largeur + x]!);
  for (let y = 0; y < hauteur; y++)
    for (let x = 0; x < largeur; x++) {
      if (!LEGERES.has(tuiles[y * largeur + x]!)) continue;
      if (
        mur(x - 1, y) ||
        mur(x + 1, y) ||
        mur(x, y - 1) ||
        mur(x, y + 1) ||
        (pleine(x - 1, y) && pleine(x + 1, y))
      )
        fond[y * largeur + x] = 1;
    }
}
