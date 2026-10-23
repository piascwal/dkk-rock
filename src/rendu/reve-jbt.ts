import { VERSION } from '../version';

/**
 * Les images du rêve de JBT : JBT en super-héros (allongé, les poings devant, la cape au vent : le vol ; de dos, les bras levés :
 * le décollage), d'après les planches de outils/fixe-reve.py, et la pile alcaline (la même que celle qu'on lance en jeu). Les
 * planches sont à 6 pixels par pixel du jeu.
 */

const DENSITE = 6;
/** JBT est dessiné à cette échelle de sa planche : assez petit pour avoir de la marge dans le ciel. */
export const ECHELLE_JBT = 0.68;
const FICHIERS = { vol: 'reve-jbt-vol.png', dos: 'reve-jbt-dos.png', pile: 'tir-pile.png' } as const;
export type ImageReve = keyof typeof FICHIERS;
const images = new Map<ImageReve, HTMLImageElement>();
let pileOr: HTMLCanvasElement | null = null;

export function chargeReve(base: string): void {
  for (const [nom, fichier] of Object.entries(FICHIERS) as [ImageReve, string][]) {
    const img = new Image();
    img.onload = () => images.set(nom, img);
    img.src = `${base}sprites/${fichier}?v=${VERSION}`;
  }
}

/** Dessine une image du rêve centrée en (x, y), tournée de `angle`, à `echelle` de sa taille en jeu. */
export function dessineImage(
  ctx: CanvasRenderingContext2D,
  nom: ImageReve,
  x: number,
  y: number,
  angle = 0,
  echelle = 1,
): void {
  const img = images.get(nom);
  if (!img) return;
  const w = (img.width / DENSITE) * echelle;
  const h = (img.height / DENSITE) * echelle;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (angle) ctx.rotate(angle);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

/** La pile en or : la pile, dorée (peinte une fois). */
export function dessinePileOr(ctx: CanvasRenderingContext2D, x: number, y: number, echelle: number): void {
  const img = images.get('pile');
  if (!img) return;
  if (!pileOr) {
    pileOr = document.createElement('canvas');
    pileOr.width = img.width;
    pileOr.height = img.height;
    const c = pileOr.getContext('2d')!;
    c.drawImage(img, 0, 0);
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = 'rgba(255,205,40,0.62)';
    c.fillRect(0, 0, img.width, img.height);
  }
  const w = (img.width / DENSITE) * echelle;
  const h = (img.height / DENSITE) * echelle;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(pileOr, Math.round(x - w / 2), Math.round(y - h / 2), w, h);
}

/** JBT en vol, centré en (x, y), le nez relevé ou baissé de `angle`, la cape qui claque au vent. */
export function dessineJbt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  tick: number,
): void {
  dessineImage(ctx, 'vol', x, y, angle, ECHELLE_JBT);
  // le bout de la cape claque au vent, derrière lui
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.rotate(angle);
  ctx.scale(ECHELLE_JBT, ECHELLE_JBT);
  for (let k = 0; k < 4; k++) {
    const dy = Math.round(Math.sin(tick / 2.5 + k * 0.9) * 1.5);
    ctx.fillStyle = k % 2 ? '#8e0c0c' : '#b01414';
    ctx.fillRect(-21 - k * 2, -8 + dy + k, 3, 2);
  }
  ctx.restore();
}
