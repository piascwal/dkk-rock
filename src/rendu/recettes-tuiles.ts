import type { Carte } from '../monde/carte';
import { etatImagesTuiles, type AtlasTuiles } from './atlas-tuiles';

/**
 * La mémoire du dessin des tuiles : à sa première apparition, le dessin d'une case (sa paroi de fond, sa tuile, son habillage)
 * est relevé, ordre de dessin par ordre de dessin ; ensuite il est rejoué tel quel, sans refaire les calculs (voisines, coins,
 * habillage) ni fabriquer d'objets à jeter. Il se refait quand la case ou une de ses huit voisines change (une tuile cassée,
 * voir Carte.versions), quand le niveau, la finesse d'affichage ou les images des tuiles changent.
 */

/** Un ordre de dessin relevé : l'image, ses arguments (la position relative à la case), le lissage. */
interface Ordre {
  img: CanvasImageSource;
  args: number[];
  lisse: boolean;
}

interface Recette {
  version: number;
  ordres: Ordre[];
}

/** Un faux contexte de dessin qui relève les drawImage au lieu de dessiner (le dessin des cases n'utilise que cela). */
class Releve {
  ordres: Ordre[] = [];
  /** faux si une image n'était pas encore chargée : la recette ne se garde pas */
  complete = true;
  imageSmoothingEnabled = false;

  drawImage(img: CanvasImageSource, ...args: number[]): void {
    if (typeof HTMLImageElement !== 'undefined' && img instanceof HTMLImageElement && !img.complete)
      this.complete = false;
    this.ordres.push({ img, args, lisse: this.imageSmoothingEnabled });
  }
}

export type PeintreCase = (
  ctx: CanvasRenderingContext2D,
  carte: Carte,
  atlas: AtlasTuiles,
  tx: number,
  ty: number,
  x: number,
  y: number,
  finesse: number,
) => void;

export class RecettesTuiles {
  private liste: (Recette | undefined)[] = [];
  private carte: Carte | null = null;
  private atlas: AtlasTuiles | null = null;
  private finesse = 0;
  private generation = -1;

  constructor(private readonly peintre: PeintreCase) {}

  /** Prête pour cette carte, cet atlas et cette finesse : la mémoire repart de zéro si l'un d'eux a changé. */
  prepare(carte: Carte, atlas: AtlasTuiles, finesse: number): this {
    if (
      carte !== this.carte ||
      atlas !== this.atlas ||
      finesse !== this.finesse ||
      etatImagesTuiles.generation !== this.generation
    ) {
      this.carte = carte;
      this.atlas = atlas;
      this.finesse = finesse;
      this.generation = etatImagesTuiles.generation;
      this.liste = [];
    }
    return this;
  }

  /** Le dernier changement de la case et de ses huit voisines. */
  private version(carte: Carte, tx: number, ty: number): number {
    let v = 0;
    for (let y = Math.max(0, ty - 1); y <= Math.min(carte.hauteur - 1, ty + 1); y++)
      for (let x = Math.max(0, tx - 1); x <= Math.min(carte.largeur - 1, tx + 1); x++)
        v = Math.max(v, carte.versions[y * carte.largeur + x]!);
    return v;
  }

  /** Dessine la case (tx, ty) en (x, y), depuis sa recette (refaite si besoin). */
  joue(ctx: CanvasRenderingContext2D, tx: number, ty: number, x: number, y: number): void {
    const carte = this.carte!;
    const i = ty * carte.largeur + tx;
    const version = this.version(carte, tx, ty);
    let recette = this.liste[i];
    if (!recette || recette.version !== version) {
      const releve = new Releve();
      this.peintre(
        releve as unknown as CanvasRenderingContext2D,
        carte,
        this.atlas!,
        tx,
        ty,
        0,
        0,
        this.finesse,
      );
      recette = { version, ordres: releve.ordres };
      this.liste[i] = releve.complete ? recette : undefined;
    }
    let lisse = false;
    for (const o of recette.ordres) {
      if (o.lisse !== lisse) ctx.imageSmoothingEnabled = lisse = o.lisse;
      const a = o.args;
      if (a.length === 8)
        ctx.drawImage(o.img, a[0]!, a[1]!, a[2]!, a[3]!, a[4]! + x, a[5]! + y, a[6]!, a[7]!);
      else if (a.length === 4) ctx.drawImage(o.img, a[0]! + x, a[1]! + y, a[2]!, a[3]!);
      else ctx.drawImage(o.img, a[0]! + x, a[1]! + y);
    }
    if (lisse) ctx.imageSmoothingEnabled = false;
  }
}
