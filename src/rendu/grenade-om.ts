import { VERSION } from '../version';
import type { Particules } from './particules';

/**
 * La grenade de l'OM que lance Tom et le logo dont elle explose en morceaux. Deux petites
 * images en pleine définition (grenade-om.png : 60 × 84, logo-om.png : 64 × 80, une cinquantaine de couleurs, 3 Ko en tout).
 */

/** Sa taille en jeu (pixels du jeu) : la planche est à la densité 8. */
const LARGEUR = 7.5;
const HAUTEUR = 10.5;

let grenade: HTMLImageElement | null = null;
let blanche: HTMLCanvasElement | null = null;
let logo: HTMLImageElement | null = null;

/** Lance le chargement (avec les autres planches). */
export function chargeGrenadeOM(base: string): void {
  const img = new Image();
  img.onload = () => {
    grenade = img;
    // sa silhouette blanche, faite une fois : elle sert au clignotement
    const c = document.createElement('canvas');
    [c.width, c.height] = [img.width, img.height];
    const x = c.getContext('2d')!;
    x.drawImage(img, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, c.width, c.height);
    blanche = c;
  };
  img.src = `${base}sprites/grenade-om.png?v=${VERSION}`;
  const l = new Image();
  l.onload = () => {
    logo = l;
  };
  l.src = `${base}sprites/logo-om.png?v=${VERSION}`;
}

/** La grenade explose : des logos s'envolent dans tous les sens, de tailles et de vitesses variées (une dizaine, et moins quand l'écran est déjà plein). */
export function logosDeGrenade(p: Particules, x: number, y: number): void {
  const n = p.liste.length < 400 ? 12 : 4;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = 0.6 + Math.random() * 3.4;
    p.ajoute({
      sorte: 'logo',
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 1 - Math.random() * 2,
      vie: 35 + Math.random() * 45,
      taille: 6 + Math.random() * 5,
      couleur: '#1f5fd0',
      gravite: 0.12 + Math.random() * 0.1,
    });
  }
}

/**
 * Un morceau de l'écusson : le logo, tourné selon son sens de vol, dessiné à la finesse de l'écran (et non sur le calque des
 * particules, trop grossier pour son détail) ; il rétrécit à la fin (`t` : sa vie restante, de 1 à 0). Un carré bleu sert de repli.
 */
export function dessineLogoOM(
  ctx: CanvasRenderingContext2D,
  p: { x: number; y: number; vx: number; vie: number; taille: number },
  camX: number,
  camY: number,
  t: number,
): void {
  const k = p.taille * Math.min(1, t * 3);
  if (k < 1) return;
  ctx.save();
  ctx.translate(p.x - camX, p.y - camY);
  if (logo) {
    ctx.rotate(p.vie * 0.18 * (p.vx < 0 ? -1 : 1));
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(logo, (-k * 0.8) / 2, -k / 2, k * 0.8, k);
  } else {
    ctx.fillStyle = '#1f5fd0';
    ctx.fillRect(-k / 4, -k / 4, k / 2, k / 2);
  }
  ctx.restore();
}

/**
 * Dessine la grenade au milieu de l'origine du repère courant, inclinée de `angle` (un tour = 256) ; `blanc` : sa silhouette blanche
 * (le clignotement). Faux si l'image n'est pas encore chargée.
 */
export function dessineGrenadeOM(ctx: CanvasRenderingContext2D, angle: number, blanc: boolean): boolean {
  const img = blanc ? blanche : grenade;
  if (!img) return false;
  ctx.rotate((angle / 256) * 2 * Math.PI);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, -LARGEUR / 2, -HAUTEUR / 2, LARGEUR, HAUTEUR);
  ctx.imageSmoothingEnabled = false;
  return true;
}
