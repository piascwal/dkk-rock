import { TUILE } from '../config';
import {
  NB_TUILES,
  PROPRIETES,
  T,
  TUILES_LEGERES,
  proprietes,
  type ProprietesTuile,
  type Tuile,
} from './tuiles';

export interface Modification {
  x: number;
  y: number;
  t: Tuile;
  /** la tuile d'avant (couleur des débris) */
  avant: Tuile;
}

/** La matière du terrain laisse une paroi quand on la détruit ; pas les objets (caisses, caissons, plateformes). */
const estMatiere = (t: number) =>
  proprietes(t).solide && !TUILES_LEGERES.has(t) && t !== T.CAISSE && t !== T.CAISSON;

/**
 * La grille de tuiles d'un niveau. Hors de la carte : murs de socle à gauche
 * et à droite, ciel au-dessus, vide mortel en dessous.
 *
 * Chaque changement de tuile est noté dans `modifications` : la partie les
 * relève à chaque pas pour les débris, le son et le réseau.
 */
export class Carte {
  readonly tuiles: Uint8Array;
  readonly pv: Float32Array;
  /** 1 là où le niveau d'origine avait de la matière : on y dessine une paroi de fond une fois détruite */
  readonly fond: Uint8Array;
  modifications: Modification[] = [];

  constructor(
    readonly largeur: number,
    readonly hauteur: number,
    tuiles?: ArrayLike<number>,
    /** murs de fond dessinés à la main dans la carte (le « . » des intérieurs) */
    fondDessine?: ArrayLike<number>,
  ) {
    this.tuiles = new Uint8Array(largeur * hauteur);
    this.pv = new Float32Array(largeur * hauteur);
    this.fond = new Uint8Array(largeur * hauteur);
    if (tuiles) {
      for (let i = 0; i < this.tuiles.length; i++) {
        const t = tuiles[i] ?? 0;
        this.tuiles[i] = t < NB_TUILES ? t : 0;
        this.pv[i] = PROPRIETES[this.tuiles[i] as Tuile].pv;
        this.fond[i] = estMatiere(t) || fondDessine?.[i] ? 1 : 0;
      }
    }
  }

  dedans(tx: number, ty: number): boolean {
    return tx >= 0 && ty >= 0 && tx < this.largeur && ty < this.hauteur;
  }

  get(tx: number, ty: number): Tuile {
    if (tx < 0 || tx >= this.largeur) return T.SOCLE;
    if (ty < 0 || ty >= this.hauteur) return T.VIDE;
    return this.tuiles[ty * this.largeur + tx] as Tuile;
  }

  props(tx: number, ty: number): ProprietesTuile {
    return PROPRIETES[this.get(tx, ty)];
  }

  /** Tuile pleine (les plateformes traversables ne comptent pas). */
  solide(tx: number, ty: number): boolean {
    const p = this.props(tx, ty);
    return p.solide && !p.traversable;
  }

  solideEnPixel(px: number, py: number): boolean {
    return this.solide(Math.floor(px / TUILE), Math.floor(py / TUILE));
  }

  aFond(tx: number, ty: number): boolean {
    return this.dedans(tx, ty) && this.fond[ty * this.largeur + tx] === 1;
  }

  pose(tx: number, ty: number, t: Tuile): void {
    if (!this.dedans(tx, ty)) return;
    const i = ty * this.largeur + tx;
    const avant = this.tuiles[i] as Tuile;
    if (avant === t) return;
    this.tuiles[i] = t;
    this.pv[i] = PROPRIETES[t].pv;
    this.modifications.push({ x: tx, y: ty, t, avant });
  }

  /**
   * Inflige des dégâts à une tuile. Renvoie la tuile détruite (son ancien
   * type), ou null si elle tient encore ou n'était rien.
   */
  endommage(tx: number, ty: number, degats: number): Tuile | null {
    if (!this.dedans(tx, ty) || degats <= 0) return null;
    const i = ty * this.largeur + tx;
    const t = this.tuiles[i] as Tuile;
    if (t === T.VIDE || PROPRIETES[t].pv === Infinity) return null;
    this.pv[i]! -= degats;
    if (this.pv[i]! > 0) return null;
    this.pose(tx, ty, T.VIDE);
    return t;
  }

  /** Part de vie restante d'une tuile (pour dessiner les fissures). */
  usure(tx: number, ty: number): number {
    const t = this.get(tx, ty);
    const max = PROPRIETES[t].pv;
    if (!this.dedans(tx, ty) || !Number.isFinite(max) || max <= 0) return 1;
    return this.pv[ty * this.largeur + tx]! / max;
  }

  /** Relève et vide la liste des changements depuis le dernier appel. */
  releveModifications(): Modification[] {
    const m = this.modifications;
    this.modifications = [];
    return m;
  }

  /** La grille en texte compact (une lettre par tuile) : pour un joueur qui rejoint en cours de route. */
  versTexte(): string {
    let s = '';
    for (const t of this.tuiles) s += String.fromCharCode(97 + t);
    return s;
  }

  appliqueTexte(s: string): void {
    if (s.length !== this.tuiles.length) return;
    for (let i = 0; i < s.length; i++) {
      const t = s.charCodeAt(i) - 97;
      if (t >= 0 && t < NB_TUILES) this.pose(i % this.largeur, Math.floor(i / this.largeur), t as Tuile);
    }
    this.modifications = [];
  }
}
