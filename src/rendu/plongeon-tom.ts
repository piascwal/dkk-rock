import { VERSION } from '../version';

/**
 * Tom en slip de bain, d'après les planches de outils/fixe-plongeon.py : bras pliés (`chute` : l'impulsion, la remontée, un
 * temps de brasse) et bras tendus (`plonge` : la descente, l'entrée dans l'eau, l'autre temps de brasse). La tête est à droite
 * sur les planches.
 */

const DENSITE = 6;
/** Tom en slip est dessiné à cette échelle de sa planche (il fait alors la taille des héros sur le parapet). */
const TAILLE_TOM = 0.5;
const POSES = ['chute', 'plonge'] as const;
export type PoseTom = (typeof POSES)[number];
const images = new Map<string, HTMLImageElement>();

/** Charge Tom en slip de bain, bras pliés et bras tendus. */
export function chargePlongeon(base: string): void {
  for (const pose of POSES) {
    const img = new Image();
    img.onload = () => images.set(pose, img);
    img.src = `${base}sprites/plongeon-tom-${pose}.png?v=${VERSION}`;
  }
}

/**
 * Tom en slip de bain, centré en (x, y), tourné de `angle` (0 : la tête à droite ; π/2 : la tête en bas ; -π/2 : en haut),
 * retourné de gauche à droite avec `miroir` (la tête à gauche, le dos toujours en haut).
 */
export function dessineTom(
  ctx: CanvasRenderingContext2D,
  pose: PoseTom,
  x: number,
  y: number,
  angle: number,
  miroir = false,
): void {
  const img = images.get(pose);
  if (!img) return;
  const w = (img.width / DENSITE) * TAILLE_TOM;
  const h = (img.height / DENSITE) * TAILLE_TOM;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (miroir) ctx.scale(-1, 1);
  ctx.rotate(angle);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}
