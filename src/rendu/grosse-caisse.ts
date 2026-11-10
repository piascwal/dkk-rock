import { VERSION } from '../version';

/**
 * La grosse caisse « DKK » que lance le nouveau JBT : elle roule en tournant sur elle-même (lentement : un tour à chaque
 * quatre périmètres parcourus, environ une seconde) et passe au blanc quand elle va exploser. Une image (grosse-caisse.png, 96 × 88, 3 Ko), d'après la
 * grosse caisse fournie (assets-sources/heros/jbt-source/).
 */

/** Sa taille en jeu (pixels du jeu) : un peu plus grosse que la boîte de collision du tir (12 pixels). */
const LARGEUR = 16;
const HAUTEUR = 14.7;

/** La rotation est quatre fois plus lente que le roulement réel : à vitesse réelle, le logo et la forme ne se lisaient pas (un tour en 0,25 s). */
const RAYON_APPARENT = (HAUTEUR / 2) * 4;

let image: HTMLImageElement | null = null;
let blanche: HTMLCanvasElement | null = null;

/** Lance le chargement (avec les autres planches). */
export function chargeGrosseCaisse(base: string): void {
  const img = new Image();
  img.onload = () => {
    image = img;
    const c = document.createElement('canvas');
    [c.width, c.height] = [img.width, img.height];
    const x = c.getContext('2d')!;
    x.drawImage(img, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, c.width, c.height);
    blanche = c;
  };
  img.src = `${base}sprites/grosse-caisse.png?v=${VERSION}`;
}

/**
 * Dessine la grosse caisse posée sur le point courant (le bas du tir, moins `demi` : voir DEMI_TAILLE), tournée selon `x` (sa
 * position dans le monde : elle roule sans glisser) ; `blanc` : sa silhouette blanche. Faux si l'image n'est pas encore chargée.
 */
export function dessineGrosseCaisse(
  ctx: CanvasRenderingContext2D,
  x: number,
  blanc: boolean,
  demi: number,
): boolean {
  const img = blanc ? blanche : image;
  if (!img) return false;
  ctx.translate(0, demi - HAUTEUR / 2);
  ctx.rotate(x / RAYON_APPARENT);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, -LARGEUR / 2, -HAUTEUR / 2, LARGEUR, HAUTEUR);
  ctx.imageSmoothingEnabled = false;
  return true;
}
