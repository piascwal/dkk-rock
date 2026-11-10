import { ANIM, type Genre } from '../jeu/vue';
import { FEUILLES } from '../rendu/feuilles';
import { dessineDecorFeuille, dessineFeuille } from '../rendu/feuilles-images';
import { FEUILLES_DECOR } from '../rendu/feuilles-objets';
import { dessineMurPlie } from '../rendu/mur-anime';

/**
 * Les pièces du décor de l'écran titre en scène (titre-scene.ts) : trois projecteurs (les couleurs du logo) qui balaient la scène,
 * une rampe de LED au bord de la scène qui bat la mesure, et le dessin d'un sprite en silhouette (assombri hors des faisceaux).
 */

/** les couleurs du logo : cyan, rose, jaune */
const FAISCEAUX = ['0, 194, 209', '255, 46, 147', '255, 210, 63'] as const;

/** Les trois faisceaux, qui balancent lentement ; renvoie où chacun touche le sol (pour éclairer les héros). */
export function projecteurs(ctx: CanvasRenderingContext2D, W: number, H: number, t: number): number[] {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const touches = FAISCEAUX.map((couleur, i) => {
    const x0 = W * (0.2 + 0.3 * i);
    const angle = Math.sin(t * 0.35 + i * 2.1) * 0.55;
    const xSol = x0 + Math.tan(angle) * H;
    const demi = H * 0.16;
    const g = ctx.createLinearGradient(x0, -10, xSol, H);
    g.addColorStop(0, `rgba(${couleur}, 0.22)`);
    g.addColorStop(1, `rgba(${couleur}, 0.04)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x0 - 6, -10);
    ctx.lineTo(x0 + 6, -10);
    ctx.lineTo(xSol + demi, H);
    ctx.lineTo(xSol - demi, H);
    ctx.closePath();
    ctx.fill();
    return xSol;
  });
  ctx.restore();
  return touches;
}

/** Le bord de la scène : une rampe de LED aux couleurs de la bande du logo, qui s'allume sur chaque temps. */
export function rampe(ctx: CanvasRenderingContext2D, W: number, sol: number, temps: number): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, sol, W, 400);
  const couleurs = ['#c4172c', '#0b6e4f', '#1b3a8a', '#ffd23f'];
  const pas = 22;
  const coup = 1 - (temps % 1);
  for (let x = 6, n = 0; x < W; x += pas, n++) {
    ctx.globalAlpha = 0.4 + 0.6 * coup * ((n + Math.floor(temps)) % 2);
    ctx.fillStyle = couleurs[n % couleurs.length]!;
    ctx.fillRect(x, sol + 3, 10, 4);
  }
  ctx.globalAlpha = 1;
}

/** Un sprite pieds en (x, y), à l'échelle `k`, assombri de `ombre` (0 : en pleine lumière ; 1 : une silhouette noire). */
export function silhouette(
  ctx: CanvasRenderingContext2D,
  tampon: CanvasRenderingContext2D | null,
  genre: Genre,
  x: number,
  y: number,
  k: number,
  versLaGauche: boolean,
  compteur: number,
  ombre: number,
  alpha = 1,
  e: number = ANIM.DEBOUT,
  /** une image à part à dessiner à la place de la planche (le saut d'un héros : `<nom>-saut`), si elle existe */
  image?: string,
  /** la ligne de cette image (ses temps : la tyrolienne en a deux, qui se balancent) */
  ligneImage = 0,
  /** contre une paroi : le pli de l'escalade animée (rendu/mur-anime.ts) */
  pli = 0,
): boolean {
  const aPart = image ? FEUILLES_DECOR[image] : undefined;
  const f = aPart ?? FEUILLES[genre];
  if (!f || !tampon) return false;
  // le sprite sur un tampon à sa taille, assombri là où il est opaque, puis posé sur la scène
  const echelle = (k * (f.echelle ?? 1)) / (f.densite ?? 1);
  const [w, h] = [Math.ceil(f.w * echelle) + 4, Math.ceil(f.h * echelle) + 4];
  const c = tampon.canvas;
  if (c.width < w || c.height < h) [c.width, c.height] = [Math.max(c.width, w), Math.max(c.height, h)];
  tampon.setTransform(1, 0, 0, 1, 0, 0);
  tampon.globalCompositeOperation = 'source-over';
  tampon.clearRect(0, 0, c.width, c.height);
  // l'origine du tampon : les pieds de l'image (pas forcément son milieu : contre une paroi, ils sont près du bord côté mur),
  // sinon l'image déborderait du tampon et serait rognée (le dos d'un héros qui grimpe)
  const pied = (f.pied ?? f.w / 2) * echelle;
  const ox = (versLaGauche ? f.w * echelle - pied : pied) + 2;
  tampon.translate(ox, h - 2);
  if (versLaGauche) tampon.scale(-1, 1);
  tampon.scale(k, k);
  const dessine = aPart
    ? (pli ? dessineMurPlie(tampon, image!, pli) : dessineDecorFeuille(tampon, image!, ligneImage)) ||
      dessineFeuille(tampon, genre, e, compteur, false)
    : dessineFeuille(tampon, genre, e, compteur, false);
  if (!dessine) return false;
  if (ombre > 0) {
    tampon.setTransform(1, 0, 0, 1, 0, 0);
    tampon.globalCompositeOperation = 'source-atop';
    tampon.fillStyle = `rgba(14, 6, 18, ${ombre})`;
    tampon.fillRect(0, 0, w, h);
  }
  ctx.globalAlpha = alpha;
  ctx.drawImage(c, 0, 0, w, h, Math.round(x - ox), Math.round(y - h + 2), w, h);
  ctx.globalAlpha = 1;
  return true;
}
