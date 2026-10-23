import { VERSION } from '../version';
import { ecrit, largeurTexte } from './police';

/**
 * Une carte Sibylle des fontaines cachée dans le niveau : l'image de la carte, nette (lissée en qualité haute : elle est fournie en
 * grand et réduite à l'écran, jamais agrandie), qui lévite un peu au-dessus du sol en flottant doucement, dans une aura verte qui
 * bat comme la carte elle-même ; un liseré lumineux la détache du décor, des étincelles vertes montent autour, et son ombre reste
 * au sol (plus petite et plus pâle quand elle monte). Pieds de l'objet en (x, y) : le sol de sa case.
 */

/** La carte à l'écran, en pixels du jeu (l'image fait 128 × 180), et sa hauteur au-dessus du sol (au repos, puis l'amplitude). */
const L = 14;
const H = 20;
const LEVITATION = 6;
const FLOTTE = 2;

let image: HTMLImageElement | null = null;

export function chargeSibylle(base: string): void {
  const img = new Image();
  img.onload = () => (image = img);
  img.src = `${base}sprites/carte-sibylle.png?v=${VERSION}`;
}

/** `numero` : la cachette (les cartes ne flottent pas toutes en même temps) ; `ms` : l'horloge. */
export function dessineSibylle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  numero: number,
  ms: number,
): void {
  const t = ms / 1000;
  const haut = LEVITATION + Math.sin(t * 2.2 + numero * 1.7) * FLOTTE;
  const cx = x;
  const cy = y - haut - H / 2;
  const pouls = 0.75 + 0.25 * Math.sin(t * 3.1 + numero);
  ctx.save();
  // l'ombre au sol
  ctx.fillStyle = `rgba(0,0,0,${(0.3 - haut * 0.02).toFixed(2)})`;
  ctx.beginPath();
  ctx.ellipse(x, y - 1, 7 - haut * 0.3, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // l'aura verte, qui bat
  const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 19);
  g.addColorStop(0, `rgba(150,255,160,${(0.6 * pouls).toFixed(2)})`);
  g.addColorStop(0.45, `rgba(50,210,100,${(0.32 * pouls).toFixed(2)})`);
  g.addColorStop(1, 'rgba(20,150,60,0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - 19, cy - 19, 38, 38);
  // le liseré lumineux autour de la carte
  ctx.fillStyle = `rgba(170,255,180,${(0.55 * pouls).toFixed(2)})`;
  ctx.fillRect(cx - L / 2 - 1, cy - H / 2 - 1, L + 2, H + 2);
  if (image) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, cx - L / 2, cy - H / 2, L, H);
  } else {
    // l'image pas encore chargée : une carte verte, son cartouche beige
    ctx.fillStyle = '#1f6a32';
    ctx.fillRect(cx - L / 2, cy - H / 2, L, H);
    ctx.fillStyle = '#d8b07a';
    ctx.fillRect(cx - L / 2 + 2, cy + 1, L - 4, 6);
  }
  // les étincelles qui montent autour
  for (let k = 0; k < 5; k++) {
    const p = (t * 0.55 + k / 5 + numero * 0.13) % 1;
    const sx = cx + Math.sin(k * 2.4 + t * 1.3) * 10;
    const sy = cy + H / 2 - p * 28;
    ctx.fillStyle = `rgba(200,255,210,${(1 - p).toFixed(2)})`;
    ctx.fillRect(Math.round(sx), Math.round(sy), 1, 1);
  }
  ctx.restore();
}

/**
 * Sur la carte du monde, quand le van est arrivé sur un niveau : en bas à droite, la carte en petit et « trouvées/total » (les
 * cartes Sibylle de ce niveau). Toutes trouvées : le compte passe au vert.
 */
export function dessineCompteSibylles(
  ctx: CanvasRenderingContext2D,
  largeur: number,
  hauteur: number,
  trouvees: number,
  total: number,
): void {
  const texte = `${trouvees}/${total}`;
  const w = 9 + 4 + largeurTexte(texte, 2) + 6;
  const h = 19;
  const x = largeur - w - 4;
  const y = hauteur - h - 4;
  ctx.save();
  ctx.fillStyle = 'rgba(10,5,12,0.75)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(120,255,150,0.45)';
  ctx.fillRect(x + 2, y + 2, 11, 15);
  if (image) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, x + 3, y + 3, 9, 13);
  }
  ctx.restore();
  ecrit(ctx, texte, x + 16, y + 5, trouvees >= total ? '#8dff9e' : '#ffffff', 2);
}
