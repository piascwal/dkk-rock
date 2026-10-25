import { accessibles } from '../niveaux/accessibilite';
import { litNiveau, type DefNiveau, type Replique } from '../niveaux/format';
import { THEMES, type NomTheme } from '../rendu/themes';

/**
 * Le niveau en cours d'édition : une grille de caractères (la légende des cartes, voir niveaux/format.ts), le décor placé à la main
 * ([nom d'accessoire, colonne, rangée du sol], comme les cartes générées) et le thème. Chaque geste (un trait de pinceau, un
 * rectangle, un module) s'annule d'un coup : `commence` avant, `termine` après.
 */

export type Decor = [string, number, number];

/** Un module préconstruit (voir outils/exporte-modules.py) : un rectangle de carte, sa rangée de sol, son décor. */
export interface ModuleEditeur {
  id: string;
  nom: string;
  famille: string;
  sol: number;
  lignes: string[];
  decor: Decor[];
}

/** Ce qu'on exporte (et réimporte) : de quoi refaire le niveau tel quel, ou en faire un niveau du jeu. */
export interface NiveauExporte {
  format: 'dkk-niveau';
  version: 1;
  nom: string;
  theme: NomTheme;
  /** le niveau du jeu dont on est parti, s'il y en a un (son identifiant) */
  depart: string | null;
  carte: string[];
  decor: Decor[];
}

interface Instantane {
  lignes: string[];
  decor: Decor[];
}

const HISTOIRE_MAX = 80;
export const TAILLE_MIN: [number, number] = [24, 16];
export const TAILLE_MAX: [number, number] = [1200, 120];

export class DocumentNiveau {
  private g: string[][];
  private passe: Instantane[] = [];
  private futur: Instantane[] = [];
  private modifie = false;
  /** les dialogues du niveau d'origine (les chiffres de la carte) ; un chiffre posé sans texte reçoit une réplique d'attente */
  dialogues: Partial<Record<string, Replique[]>> = {};
  /** à chaque changement (le rendu, la sauvegarde automatique) */
  onChange: () => void = () => {};

  constructor(
    public nom: string,
    public theme: NomTheme,
    lignes: readonly string[],
    public decor: Decor[] = [],
    public depart: string | null = null,
  ) {
    const largeur = Math.max(TAILLE_MIN[0], ...lignes.map((l) => l.length));
    this.g = lignes.map((l) => l.padEnd(largeur).split(''));
  }

  /** Une page blanche : du ciel, un sol plat de terre sur de la roche, le départ à gauche et le van à droite. */
  static vierge(largeur = 160, hauteur = 40, theme: NomTheme = 'garage'): DocumentNiveau {
    const sol = hauteur - 12;
    const lignes = Array.from({ length: hauteur }, (_, y) =>
      y < sol ? ' ' : y < sol + 4 ? '#' : y < hauteur - 6 ? 'R' : ' ',
    ).map((c) => c.repeat(largeur));
    const d = new DocumentNiveau('Mon niveau', theme, lignes);
    d.g[sol - 1]![3] = '@';
    d.g[sol - 1]![largeur - 5] = 'F';
    return d;
  }

  /** Une copie d'un niveau du jeu, pour le modifier. */
  static depuisNiveau(def: DefNiveau): DocumentNiveau {
    const decor = (def.decor ?? []).map(([n, x, y]) => [n, x, y] as Decor);
    const d = new DocumentNiveau(def.titre, def.theme, def.carte, decor, def.id);
    d.dialogues = def.dialogues;
    return d;
  }

  /** Un niveau exporté (le texte d'un fichier .json), ou une erreur lisible. */
  static depuisJSON(texte: string): DocumentNiveau {
    const o = JSON.parse(texte) as Partial<NiveauExporte>;
    if (o.format !== 'dkk-niveau' || !Array.isArray(o.carte) || !o.carte.every((l) => typeof l === 'string'))
      throw new Error('Ce fichier n’est pas un niveau exporté par l’éditeur.');
    const theme = o.theme && o.theme in THEMES ? o.theme : 'garage';
    const decor = (o.decor ?? []).filter(
      (d): d is Decor =>
        Array.isArray(d) && typeof d[0] === 'string' && Number.isInteger(d[1]) && Number.isInteger(d[2]),
    );
    return new DocumentNiveau(o.nom || 'Niveau importé', theme, o.carte, decor, o.depart ?? null);
  }

  get largeur(): number {
    return this.g[0]?.length ?? 0;
  }

  get hauteur(): number {
    return this.g.length;
  }

  get peutAnnuler(): boolean {
    return this.passe.length > 0;
  }

  get peutRefaire(): boolean {
    return this.futur.length > 0;
  }

  get(x: number, y: number): string {
    return this.g[y]?.[x] ?? ' ';
  }

  lignes(): string[] {
    return this.g.map((r) => r.join(''));
  }

  /** Avant un geste : de quoi l'annuler d'un coup. */
  commence(): void {
    this.passe.push(this.instantane());
    if (this.passe.length > HISTOIRE_MAX) this.passe.shift();
    this.futur = [];
    this.modifie = false;
  }

  /** Après un geste : un geste qui n'a rien changé ne compte pas dans l'historique. */
  termine(): void {
    if (!this.modifie) this.passe.pop();
    this.modifie = false;
  }

  /** Un geste interrompu (un second doigt qui vient pincer l'écran) : il n'a jamais eu lieu, ni dans l'historique. */
  abandonne(): void {
    const i = this.passe.pop();
    if (i && this.modifie) this.restaure(i);
    this.modifie = false;
  }

  pose(x: number, y: number, c: string): void {
    const r = this.g[y];
    if (!r || x < 0 || x >= r.length || r[x] === c) return;
    r[x] = c;
    this.change();
  }

  rect(x0: number, y0: number, x1: number, y1: number, c: string): void {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.pose(x, y, c);
  }

  /** Pose un module, sa rangée de sol sur la rangée `ySol` (celle du sol qu'on a touché), sa première colonne en `x`. */
  tampon(m: ModuleEditeur, x: number, ySol: number): void {
    const y0 = ySol - m.sol;
    m.lignes.forEach((l, dy) => [...l].forEach((c, dx) => this.pose(x + dx, y0 + dy, c)));
    for (const [n, dx, dy] of m.decor) this.ajouteDecor(n, x + dx, y0 + dy);
  }

  /** Un accessoire de décor posé sur la rangée de sol `ySol` (il se dessine au-dessus) ; un seul par case. */
  ajouteDecor(nom: string, x: number, ySol: number): void {
    if (x < 0 || x >= this.largeur || ySol < 1 || ySol >= this.hauteur) return;
    this.decor = this.decor.filter(([, dx, dy]) => dx !== x || dy !== ySol);
    this.decor.push([nom, x, ySol]);
    this.change();
  }

  /** L'accessoire posé sous la case (x, y), à une case près, ou null. */
  decorEn(x: number, y: number): Decor | null {
    return this.decor.find(([, dx, dy]) => Math.abs(dx - x) <= 1 && (dy === y + 1 || dy === y)) ?? null;
  }

  retireDecor(x: number, y: number): void {
    const d = this.decorEn(x, y);
    if (!d) return;
    this.decor = this.decor.filter((o) => o !== d);
    this.change();
  }

  /** Change la taille : les colonnes s'ajoutent ou se retirent à droite, les rangées en haut (le sol ne bouge pas). */
  redimensionne(largeur: number, hauteur: number): void {
    largeur = Math.max(TAILLE_MIN[0], Math.min(TAILLE_MAX[0], Math.round(largeur)));
    hauteur = Math.max(TAILLE_MIN[1], Math.min(TAILLE_MAX[1], Math.round(hauteur)));
    if (largeur === this.largeur && hauteur === this.hauteur) return;
    const dh = hauteur - this.hauteur;
    const lignes = this.lignes().map((l) => l.padEnd(largeur).slice(0, largeur));
    const neuves = dh > 0 ? [...Array<string>(dh).fill(' '.repeat(largeur)), ...lignes] : lignes.slice(-dh);
    this.g = neuves.map((l) => l.split(''));
    this.decor = this.decor
      .map(([n, x, y]): Decor => [n, x, y + dh])
      .filter(([, x, y]) => x < largeur && y >= 1 && y < hauteur);
    this.change();
  }

  annule(): void {
    const i = this.passe.pop();
    if (!i) return;
    this.futur.push(this.instantane());
    this.restaure(i);
  }

  refait(): void {
    const i = this.futur.pop();
    if (!i) return;
    this.passe.push(this.instantane());
    this.restaure(i);
  }

  versJSON(): NiveauExporte {
    return {
      format: 'dkk-niveau',
      version: 1,
      nom: this.nom,
      theme: this.theme,
      depart: this.depart,
      carte: this.lignes().map((l) => l.replace(/\s+$/, '')),
      decor: this.decor.map(([n, x, y]): Decor => [n, x, y]),
    };
  }

  /** Le niveau jouable (pour l'essayer) : pas d'histoire, le décor placé s'ajoute au décor semé. */
  versDef(id: string): DefNiveau {
    const j = this.versJSON();
    return {
      id,
      titre: this.nom,
      sousTitre: 'Essai de l’éditeur',
      theme: this.theme,
      intro: [],
      dialogues: this.dialoguesDeLaCarte(j.carte),
      outro: [],
      decor: j.decor,
      semis: true,
      carte: j.carte,
    };
  }

  /** Le niveau se lit-il, et va-t-on du départ au van sans rien casser ? (le même test que les niveaux du jeu) */
  verifie(): { ok: boolean; message: string } {
    let lu;
    try {
      lu = litNiveau(this.versDef('verification'));
    } catch (e) {
      return { ok: false, message: (e as Error).message.replace(/^verification : /, '') };
    }
    // la fin : le van, ou DJ Boucle (le club finit sur lui)
    const cible = lu.boss.find((b) => b.lettre === 'Z') ?? lu.fin;
    if (!cible) return { ok: false, message: 'Il manque le van (F) : le niveau ne finit jamais.' };
    const a = accessibles(lu);
    const L = lu.largeur;
    const { tx, ty } = cible;
    const atteint = a.some(
      (v, k) => v === 1 && Math.abs((k % L) - tx) <= 2 && Math.abs(Math.floor(k / L) - ty) <= 1,
    );
    if (!atteint)
      return { ok: false, message: 'La fin n’est pas atteignable sans rien casser depuis le départ.' };
    const perdus = lu.drapeaux.filter((d) => !a[d.ty * L + d.tx]).length;
    return {
      ok: true,
      message: perdus
        ? `La fin est atteignable, mais ${perdus} drapeau(x) ne le sont pas.`
        : 'Parfait : on va du départ à la fin sans rien casser.',
    };
  }

  private dialoguesDeLaCarte(carte: readonly string[]): Partial<Record<string, Replique[]>> {
    const chiffres = new Set(carte.join('').match(/[1-9]/g) ?? []);
    return Object.fromEntries(
      [...chiffres].map((c) => [
        c,
        this.dialogues[c] ?? [{ qui: 'NARRATEUR' as const, texte: `Dialogue ${c} : à écrire.` }],
      ]),
    );
  }

  private change(): void {
    this.modifie = true;
    this.onChange();
  }

  private instantane(): Instantane {
    return { lignes: this.lignes(), decor: this.decor.map(([n, x, y]): Decor => [n, x, y]) };
  }

  private restaure(i: Instantane): void {
    this.g = i.lignes.map((l) => l.split(''));
    this.decor = i.decor;
    this.onChange();
  }
}
