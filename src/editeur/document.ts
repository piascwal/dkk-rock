import { type DefNiveau, type Replique } from '../niveaux/format';
import { lisDeparts, type Depart } from './departs';
import { lisTraces, type Trace } from './tyroliennes-tracees';
import { verifieNiveau } from './verification';
import { THEMES, type NomTheme } from '../rendu/themes';

/**
 * Le niveau en cours d'édition : une grille de caractères (la légende des cartes, voir niveaux/format.ts), le décor placé à la main
 * ([nom d'accessoire, colonne, rangée du sol], comme les cartes générées) et le thème. Chaque geste (un trait de pinceau, un
 * rectangle, un module) s'annule d'un coup : `commence` avant, `termine` après.
 */

export type { Decor, Gens, ModuleEditeur, NiveauExporte } from './export-niveau';
import type { Decor, Gens, ModuleEditeur, NiveauExporte } from './export-niveau';

/** une copie du décor (les cases de la liste sont à part : l'historique n'en partage aucune) */
const copieDecor = (l: readonly (readonly [string, number, number, number?])[]): Decor[] =>
  l.map((d) => [...d] as Decor);

interface Instantane {
  lignes: string[];
  decor: Decor[];
  gens: Gens[];
  departs: Depart[];
  tyroliennes: Trace[];
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
  /** les personnages choisis, par case (« x,y ») : une autre ville, une apparence */
  gens = new Map<string, string>();
  /** change à chaque modification : le rendu sait quand refaire sa carte */
  version = 0;
  /** battle royale : le départ de chaque joueur (voir DefNiveau.departs) */
  departs: Depart[] = lisDeparts();
  /** les tyroliennes tracées poteau par poteau (voir DefNiveau.tyroliennes) */
  tyroliennes: Trace[] = [];

  constructor(
    public nom: string,
    public theme: NomTheme,
    lignes: readonly string[],
    public decor: Decor[] = [],
    public depart: string | null = null,
    gens: readonly (readonly [number, number, string])[] = [],
  ) {
    const largeur = Math.max(TAILLE_MIN[0], ...lignes.map((l) => l.length));
    this.g = lignes.map((l) => l.padEnd(largeur).split(''));
    for (const [x, y, cle] of gens) this.gens.set(`${x},${y}`, cle);
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

  /**
   * Une arène de battle royale vierge : petite, close (du socle au fond et sur les bords, personne ne tombe dehors), un départ
   * et pas de van ; reste à y monter des étages, des échelles, des tyroliennes.
   */
  static arene(largeur = 72, hauteur = 36, theme: NomTheme = 'club'): DocumentNiveau {
    const sol = hauteur - 5;
    const lignes = Array.from({ length: hauteur }, (_, y) =>
      y === hauteur - 1 ? 'X'.repeat(largeur) : `X${(y < sol ? ' ' : '#').repeat(largeur - 2)}X`,
    );
    const d = new DocumentNiveau('Mon arène', theme, lignes);
    d.g[sol - 1]![3] = '@';
    return d;
  }

  /** Une carte de battle royale : ni van ni DJ Boucle (voir DefNiveau.arene). */
  get estArene(): boolean {
    return !this.g.some((r) => r.includes('F') || r.includes('Z'));
  }

  /** Une copie d'un niveau du jeu, pour le modifier. */
  static depuisNiveau(def: DefNiveau): DocumentNiveau {
    const decor = copieDecor(def.decor ?? []);
    const d = new DocumentNiveau(def.titre, def.theme, def.carte, decor, def.id, def.gens);
    d.dialogues = def.dialogues;
    d.departs = lisDeparts(def.departs);
    d.tyroliennes = lisTraces(def.tyroliennes);
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
        Array.isArray(d) &&
        typeof d[0] === 'string' &&
        Number.isInteger(d[1]) &&
        Number.isInteger(d[2]) &&
        (d[3] === undefined || Number.isInteger(d[3])),
    );
    const gens = (o.gens ?? []).filter(
      (g): g is Gens =>
        Array.isArray(g) && Number.isInteger(g[0]) && Number.isInteger(g[1]) && typeof g[2] === 'string',
    );
    const d = new DocumentNiveau(o.nom || 'Niveau importé', theme, o.carte, decor, o.depart ?? null, gens);
    d.departs = lisDeparts(Array.isArray(o.departs) ? o.departs : []);
    d.tyroliennes = lisTraces(o.tyroliennes);
    return d;
  }

  /** Un changement fait ailleurs (les départs, les tyroliennes tracées) : il compte dans le geste en cours. */
  applique(f: () => void): void {
    f();
    this.change();
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
    this.gens.delete(`${x},${y}`); // une autre lettre : le personnage choisi s'en va avec l'ancienne
    this.change();
  }

  /** Le personnage choisi sur une case (null : celui de sa lettre). */
  choisitGens(x: number, y: number, cle: string | null): void {
    const k = `${x},${y}`;
    if ((this.gens.get(k) ?? null) === cle) return;
    if (cle) this.gens.set(k, cle);
    else this.gens.delete(k);
    this.change();
  }

  gensEn(x: number, y: number): string | undefined {
    return this.gens.get(`${x},${y}`);
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
    for (const [dx, dy, cle] of m.gens ?? []) this.choisitGens(x + dx, y0 + dy, cle);
  }

  /** Un accessoire de décor posé sur la rangée de sol `ySol` (il se dessine au-dessus) ; un seul par case. */
  ajouteDecor(nom: string, x: number, ySol: number, variante?: number): void {
    if (x < 0 || x >= this.largeur || ySol < 1 || ySol >= this.hauteur) return;
    this.decor = this.decor.filter(([, dx, dy]) => dx !== x || dy !== ySol);
    this.decor.push(variante === undefined ? [nom, x, ySol] : [nom, x, ySol, variante]);
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
      .map((d): Decor => (d[3] === undefined ? [d[0], d[1], d[2] + dh] : [d[0], d[1], d[2] + dh, d[3]]))
      .filter(([, x, y]) => x < largeur && y >= 1 && y < hauteur);
    this.gens = new Map(
      this.listeGens()
        .map(([x, y, cle]): Gens => [x, y + dh, cle])
        .filter(([x, y]) => x < largeur && y >= 0 && y < hauteur)
        .map(([x, y, cle]) => [`${x},${y}`, cle]),
    );
    this.departs = this.departs.map((d) =>
      d && d[0] < largeur && d[1] + dh >= 1 ? [d[0], d[1] + dh] : null,
    );
    this.tyroliennes = this.tyroliennes
      .map((t) => t.map(([x, y]): [number, number] => [x, y + dh]).filter(([x, y]) => x < largeur && y >= 0))
      .filter((t) => t.length > 1);
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
      decor: copieDecor(this.decor),
      gens: this.listeGens(),
      ...(this.departs.some(Boolean) ? { departs: this.departs } : {}),
      ...(this.tyroliennes.length ? { tyroliennes: lisTraces(this.tyroliennes) } : {}),
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
      gens: j.gens,
      ...(j.departs ? { departs: j.departs } : {}),
      // une tyrolienne d'un seul poteau (celle qu'on trace) ne compte pas encore
      ...(j.tyroliennes ? { tyroliennes: j.tyroliennes.filter((t) => t.length > 1) } : {}),
      semis: true,
      ...(this.estArene ? { arene: true } : {}),
      carte: j.carte,
    };
  }

  /** Le niveau se lit-il, et va-t-on du départ au van sans rien casser ? (voir verification.ts) */
  verifie(): { ok: boolean; message: string } {
    return verifieNiveau(this.versDef('verification'));
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
    this.version++;
    this.onChange();
  }

  /** Les personnages choisis, en liste ([colonne, rangée, clé]). */
  listeGens(): Gens[] {
    return [...this.gens].map(([k, cle]): Gens => {
      const [x, y] = k.split(',').map(Number) as [number, number];
      return [x, y, cle];
    });
  }

  private instantane(): Instantane {
    return {
      lignes: this.lignes(),
      decor: copieDecor(this.decor),
      gens: this.listeGens(),
      departs: [...this.departs],
      tyroliennes: lisTraces(this.tyroliennes), // une copie : le tracé change les poteaux sur place
    };
  }

  private restaure(i: Instantane): void {
    this.g = i.lignes.map((l) => l.split(''));
    this.decor = i.decor;
    this.gens = new Map(i.gens.map(([x, y, cle]) => [`${x},${y}`, cle]));
    this.departs = i.departs;
    this.tyroliennes = i.tyroliennes;
    this.version++;
    this.onChange();
  }
}
