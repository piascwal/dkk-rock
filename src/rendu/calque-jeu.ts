import { optimise } from './chrono';

/** Ce qu'on dessine des particules : tout, tout sauf les textes, ou les textes seuls. */
export type Couche = 'tout' | 'sansTexte' | 'texte';

/** Ce que le calque a besoin de savoir d'une particule : où elle est, sa taille, si c'est un texte. */
interface Point {
  sorte: string;
  x: number;
  y: number;
  taille: number;
}

/**
 * Le calque des particules à la taille du jeu (un pixel de toile par pixel du jeu) (voir chrono.ts : optimise) : les
 * particules s'y dessinent, puis la boîte qui les contient est posée d'un coup à l'écran, agrandie sans lissage. Même image (tout
 * ce qu'elles dessinent tombe sur des pixels entiers du jeu), mais la carte graphique peint jusqu'à 36 fois moins de pixels : les
 * nuages d'explosion se recouvrent beaucoup. Les textes (+1 VIE...) se dessinent ensuite, directement.
 */
export class CalqueJeu {
  private toile: HTMLCanvasElement | null = null;

  /** Faux si le calque ne sert pas (optimisations coupées, affichage à un pixel par pixel du jeu) : on dessine alors comme avant. */
  dessine(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    liste: readonly Point[],
    trace: (c: CanvasRenderingContext2D, camX: number, camY: number, quoi: Couche) => void,
  ): boolean {
    const d = Math.round(ctx.getTransform().a) || 1;
    if (!optimise() || d <= 1 || !liste.length) return false;
    const [l, h] = [Math.ceil(ctx.canvas.width / d) + 2, Math.ceil(ctx.canvas.height / d) + 2];
    const toile = (this.toile ??= document.createElement('canvas'));
    if (toile.width !== l || toile.height !== h) [toile.width, toile.height] = [l, h];
    const c = toile.getContext('2d')!;
    c.clearRect(0, 0, l, h);
    const [ox, oy] = [Math.floor(camX), Math.floor(camY)];
    // la boîte qui contient les particules (une marge pour les nuages qui enflent) : seule elle est posée à l'écran
    let [x0, y0, x1, y1] = [l, h, 0, 0];
    for (const p of liste) {
      if (p.sorte === 'texte' || p.sorte === 'logo') continue; // dessinés à part, à la finesse de l'écran
      const e = p.taille * 1.6 + 8;
      const [x, y] = [Math.round(p.x) - ox, Math.round(p.y) - oy];
      [x0, y0, x1, y1] = [Math.min(x0, x - e), Math.min(y0, y - e), Math.max(x1, x + e), Math.max(y1, y + e)];
    }
    [x0, y0] = [Math.max(0, Math.floor(x0)), Math.max(0, Math.floor(y0))];
    [x1, y1] = [Math.min(l, Math.ceil(x1)), Math.min(h, Math.ceil(y1))];
    if (x1 > x0 && y1 > y0) {
      trace(c, ox, oy, 'sansTexte');
      ctx.drawImage(toile, x0, y0, x1 - x0, y1 - y0, x0 - (camX - ox), y0 - (camY - oy), x1 - x0, y1 - y0);
    }
    trace(ctx, camX, camY, 'texte');
    return true;
  }
}
