import { TUILE } from '../config';
import type { Carte } from '../monde/carte';

/**
 * Les tuiles peintes par grands blocs (voir chrono.ts : optimise) : chaque bloc de LARGEUR × HAUTEUR tuiles est peint
 * une fois dans sa propre toile, à la finesse de l'affichage, puis posé d'un seul coup à l'écran. La carte graphique reçoit
 * quelques grandes images par image au lieu de centaines de petites (Chrome sur Android s'en sortait mal). Une tuile qui change
 * (cassée, voir Carte.versions) fait repeindre son coin du bloc, pas tout le bloc. Ce qui bouge sur une tuile (l'eau, les
 * fissures, le reflet du tonneau d'or) reste dessiné à chaque image, par-dessus.
 */
const LARGEUR = 16;
const HAUTEUR = 10;
/** Au plus tant de blocs gardés (les plus anciens s'en vont) : la mémoire reste raisonnable. */
const MAX_BLOCS = 16;

/**
 * La zone à garder prête (pixels du monde, coin haut gauche) : autour du dernier drapeau passé, là où l'on réapparaît après une
 * mort ; ses blocs restent peints (voir prechauffage.ts, qui la tient à jour).
 */
export const zoneAGarder: { x: number; y: number } = { x: -1, y: -1 };

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
  /** combien de ses rangées sont peintes (il se peint petit à petit quand on le prépare d'avance) */
  rangees: number;
}

/** Quand un bloc se prépare d'avance (avant d'être à l'écran) : tant de rangées par image, pour ne pas faire d'à-coup. */
const RANGEES_PAR_IMAGE = 2;
/**
 * Une grosse explosion casse des tuiles dans plusieurs blocs à la fois : au plus tant de blocs à l'écran se repeignent par image,
 * les autres l'image suivante (une tuile cassée reste visible 1/60 s de plus, sous la fumée de l'explosion).
 */
const REPEINTS_PAR_IMAGE = 2;

export class BlocsTuiles {
  private blocs = new Map<number, Bloc>();
  private carte: Carte | null = null;
  private cle: unknown = null;
  private generation = -1;
  private finesse = 0;
  private image = 0;
  /** les blocs repeints (tuiles cassées) dans l'image en cours */
  private repeints = 0;

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
    this.repeints = 0;
    const [bx0, by0] = [Math.floor(camX / (LARGEUR * TUILE)), Math.floor(camY / (HAUTEUR * TUILE))];
    const [bx1, by1] = [
      Math.floor((camX + largeur) / (LARGEUR * TUILE)),
      Math.floor((camY + hauteur) / (HAUTEUR * TUILE)),
    ];
    for (let by = Math.max(0, by0); by <= by1 && by * HAUTEUR < carte.hauteur; by++)
      for (let bx = Math.max(0, bx0); bx <= bx1 && bx * LARGEUR < carte.largeur; bx++) {
        const bloc = this.bloc(bx, by, peins, HAUTEUR);
        bloc.vu = this.image;
        ctx.drawImage(
          bloc.toile,
          bx * LARGEUR * TUILE - camX,
          by * HAUTEUR * TUILE - camY,
          LARGEUR * TUILE,
          HAUTEUR * TUILE,
        );
      }
    // les blocs voisins (devant, derrière, dessus, dessous) se préparent d'avance, un à la fois, petit à petit
    const voisins: [number, number][] = [
      [bx1 + 1, by0],
      [bx0 - 1, by0],
      [bx1 + 1, by1],
      [bx0 - 1, by1],
      [bx0, by1 + 1],
      [bx0, by0 - 1],
    ];
    // puis la zone du dernier drapeau : tous ses blocs gardés, peints petit à petit s'il en manque
    if (zoneAGarder.x >= 0) {
      const [gx0, gy0] = [
        Math.floor((zoneAGarder.x - largeur / 2) / (LARGEUR * TUILE)),
        Math.floor((zoneAGarder.y - hauteur / 2) / (HAUTEUR * TUILE)),
      ];
      const [gx1, gy1] = [
        Math.floor((zoneAGarder.x + largeur / 2) / (LARGEUR * TUILE)),
        Math.floor((zoneAGarder.y + hauteur / 2) / (HAUTEUR * TUILE)),
      ];
      for (let by = Math.max(0, gy0); by <= gy1 && by * HAUTEUR < carte.hauteur; by++)
        for (let bx = Math.max(0, gx0); bx <= gx1 && bx * LARGEUR < carte.largeur; bx++) {
          const b = this.blocs.get(by * 65536 + bx);
          if (b) b.vu = this.image;
          else voisins.push([bx, by]);
        }
    }
    for (const [bx, by] of voisins) {
      if (bx < 0 || by < 0 || bx * LARGEUR >= carte.largeur || by * HAUTEUR >= carte.hauteur) continue;
      const deja = this.blocs.get(by * 65536 + bx);
      if (deja && deja.rangees >= HAUTEUR) continue;
      this.bloc(bx, by, peins, RANGEES_PAR_IMAGE).vu = this.image;
      break;
    }
    this.oublie();
  }

  /** Vrai si les blocs autour de (x, y) (pixels du monde) sont tous peints : le niveau peut se montrer sans à-coup. */
  prets(x: number, y: number, largeur: number, hauteur: number): boolean {
    const [bx0, by0] = [Math.floor(x / (LARGEUR * TUILE)), Math.floor(y / (HAUTEUR * TUILE))];
    const [bx1, by1] = [
      Math.floor((x + largeur) / (LARGEUR * TUILE)),
      Math.floor((y + hauteur) / (HAUTEUR * TUILE)),
    ];
    for (let by = Math.max(0, by0); by <= by1; by++)
      for (let bx = Math.max(0, bx0); bx <= bx1; bx++)
        if ((this.blocs.get(by * 65536 + bx)?.rangees ?? 0) < HAUTEUR) return false;
    return true;
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

  /** Le bloc (bx, by), avec au moins `rangees` rangées de plus de peintes (toutes, s'il est à l'écran). */
  private bloc(bx: number, by: number, peins: PeintreCase, rangees: number): Bloc {
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
      bloc = { toile, ctx: c, version, vu: this.image, rangees: 0 };
      this.blocs.set(cle, bloc);
    }
    if (bloc.rangees < HAUTEUR) {
      // les rangées qui restent à peindre (une rangée de plus déborde un peu sur celle d'au-dessus : on la peint avec)
      const fin = Math.min(HAUTEUR, bloc.rangees + rangees);
      this.peinsZone(bloc, tx0, ty0, tx0, ty0 + bloc.rangees, tx0 + LARGEUR - 1, ty0 + fin - 1, peins);
      bloc.rangees = fin;
    } else if (version !== bloc.version && this.repeints < REPEINTS_PAR_IMAGE) {
      this.repeints++;
      // seules les cases qui ont changé (et leurs voisines) sont repeintes, d'un seul coup : une explosion en casse des dizaines
      let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
      for (let ty = ty0 - 1; ty <= ty0 + HAUTEUR; ty++)
        for (let tx = tx0 - 1; tx <= tx0 + LARGEUR; tx++)
          if (this.version(tx, ty, tx, ty) > bloc.version)
            [x0, y0, x1, y1] = [Math.min(x0, tx), Math.min(y0, ty), Math.max(x1, tx), Math.max(y1, ty)];
      if (x1 >= x0) this.peinsZone(bloc, tx0, ty0, x0 - 1, y0 - 1, x1 + 1, y1 + 1, peins);
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
