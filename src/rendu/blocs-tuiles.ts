import { TUILE } from '../config';
import type { Carte } from '../monde/carte';

/**
 * Les tuiles peintes par grands blocs (à l'essai, voir chrono.ts : optimise) : chaque bloc de LARGEUR × HAUTEUR tuiles est peint
 * une fois dans sa propre toile, à la finesse de l'affichage, puis posé d'un seul coup à l'écran. La carte graphique reçoit
 * quelques grandes images par image au lieu de centaines de petites (Chrome sur Android s'en sortait mal). Une tuile qui change
 * (cassée, voir Carte.versions) fait repeindre son coin du bloc, pas tout le bloc. Ce qui bouge sur une tuile (l'eau, les
 * fissures, le reflet du tonneau d'or) reste dessiné à chaque image, par-dessus.
 */
const LARGEUR = 16;
const HAUTEUR = 10;
/** Au plus tant de blocs gardés (les plus anciens s'en vont) : la mémoire reste raisonnable. */
const MAX_BLOCS = 10;

/** Dessine la partie fixe d'une case dans `ctx`, en (x, y) (pixels du jeu). */
export type PeintreCase = (
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  x: number,
  y: number,
) => void;

interface Bloc {
  toile: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  /** le dernier changement de la carte pris en compte (autour du bloc) */
  version: number;
  /** la dernière image où il a servi */
  vu: number;
}

export class BlocsTuiles {
  private blocs = new Map<number, Bloc>();
  private carte: Carte | null = null;
  private cle: unknown = null;
  private generation = -1;
  private finesse = 0;
  private image = 0;

  /** Repart de zéro si la carte, ce qui fait l'apparence des tuiles (`cle` : l'atlas, `generation` : les images chargées) ou la finesse change. */
  prepare(carte: Carte, cle: unknown, generation: number, finesse: number): this {
    if (
      carte !== this.carte ||
      cle !== this.cle ||
      generation !== this.generation ||
      finesse !== this.finesse
    ) {
      this.blocs.clear();
      [this.carte, this.cle, this.generation, this.finesse] = [carte, cle, generation, finesse];
    }
    return this;
  }

  /** Pose les blocs visibles (peints ou repeints au besoin) ; `peins` dessine la partie fixe d'une case. */
  dessine(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    largeur: number,
    hauteur: number,
    peins: PeintreCase,
  ): void {
    const carte = this.carte!;
    this.image++;
    const [bx0, by0] = [Math.floor(camX / (LARGEUR * TUILE)), Math.floor(camY / (HAUTEUR * TUILE))];
    const [bx1, by1] = [
      Math.floor((camX + largeur) / (LARGEUR * TUILE)),
      Math.floor((camY + hauteur) / (HAUTEUR * TUILE)),
    ];
    for (let by = Math.max(0, by0); by <= by1 && by * HAUTEUR < carte.hauteur; by++)
      for (let bx = Math.max(0, bx0); bx <= bx1 && bx * LARGEUR < carte.largeur; bx++) {
        const bloc = this.bloc(bx, by, peins);
        bloc.vu = this.image;
        ctx.drawImage(
          bloc.toile,
          bx * LARGEUR * TUILE - camX,
          by * HAUTEUR * TUILE - camY,
          LARGEUR * TUILE,
          HAUTEUR * TUILE,
        );
      }
    this.oublie();
  }

  /** Le dernier changement de la carte sur les cases de [x0, x1] × [y0, y1]. */
  private version(x0: number, y0: number, x1: number, y1: number): number {
    const carte = this.carte!;
    let v = 0;
    for (let y = Math.max(0, y0); y <= Math.min(carte.hauteur - 1, y1); y++)
      for (let x = Math.max(0, x0); x <= Math.min(carte.largeur - 1, x1); x++)
        v = Math.max(v, carte.versions[y * carte.largeur + x]!);
    return v;
  }

  private bloc(bx: number, by: number, peins: PeintreCase): Bloc {
    const cle = by * 65536 + bx;
    const [tx0, ty0] = [bx * LARGEUR, by * HAUTEUR];
    // une case dépend de ses voisines (ses bords), et déborde un peu sur elles : deux tuiles de marge
    const version = this.version(tx0 - 2, ty0 - 2, tx0 + LARGEUR + 1, ty0 + HAUTEUR + 1);
    let bloc = this.blocs.get(cle);
    if (!bloc) {
      const toile = document.createElement('canvas');
      toile.width = LARGEUR * TUILE * this.finesse;
      toile.height = HAUTEUR * TUILE * this.finesse;
      const c = toile.getContext('2d')!;
      bloc = { toile, ctx: c, version, vu: this.image };
      this.peinsZone(bloc, tx0, ty0, tx0, ty0, tx0 + LARGEUR - 1, ty0 + HAUTEUR - 1, peins);
      this.blocs.set(cle, bloc);
    } else if (version !== bloc.version) {
      // seules les cases qui ont changé (et leurs voisines) sont repeintes
      for (let ty = ty0 - 1; ty <= ty0 + HAUTEUR; ty++)
        for (let tx = tx0 - 1; tx <= tx0 + LARGEUR; tx++)
          if (this.version(tx, ty, tx, ty) > bloc.version)
            this.peinsZone(bloc, tx0, ty0, tx - 1, ty - 1, tx + 1, ty + 1, peins);
      bloc.version = version;
    }
    return bloc;
  }

  /**
   * Repeint les cases [x0, x1] × [y0, y1] du bloc qui commence en (tx0, ty0) : la zone est effacée, puis chaque case qui peut
   * y déborder (une de plus tout autour) est redessinée, dans l'ordre de l'écran (rangée par rangée), sans sortir de la zone.
   */
  private peinsZone(
    bloc: Bloc,
    tx0: number,
    ty0: number,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    peins: PeintreCase,
  ): void {
    const [zx0, zy0] = [Math.max(x0, tx0), Math.max(y0, ty0)];
    const [zx1, zy1] = [Math.min(x1, tx0 + LARGEUR - 1), Math.min(y1, ty0 + HAUTEUR - 1)];
    if (zx1 < zx0 || zy1 < zy0) return;
    const c = bloc.ctx;
    c.save();
    c.setTransform(this.finesse, 0, 0, this.finesse, 0, 0);
    c.imageSmoothingEnabled = false;
    const [px, py] = [(zx0 - tx0) * TUILE, (zy0 - ty0) * TUILE];
    const [pw, ph] = [(zx1 - zx0 + 1) * TUILE, (zy1 - zy0 + 1) * TUILE];
    c.beginPath();
    c.rect(px, py, pw, ph);
    c.clip();
    c.clearRect(px, py, pw, ph);
    for (let ty = zy0 - 1; ty <= zy1 + 1; ty++)
      for (let tx = zx0 - 1; tx <= zx1 + 1; tx++) {
        if (tx < 0 || ty < 0 || tx >= this.carte!.largeur || ty >= this.carte!.hauteur) continue;
        peins(c, tx, ty, (tx - tx0) * TUILE, (ty - ty0) * TUILE);
      }
    c.restore();
  }

  /** Les blocs qui n'ont pas servi depuis longtemps s'en vont, au-delà de MAX_BLOCS. */
  private oublie(): void {
    if (this.blocs.size <= MAX_BLOCS) return;
    const vieux = [...this.blocs.entries()].sort((a, b) => a[1].vu - b[1].vu);
    for (const [cle] of vieux.slice(0, this.blocs.size - MAX_BLOCS)) this.blocs.delete(cle);
  }
}
