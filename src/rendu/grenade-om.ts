import { VERSION } from '../version';
import type { Particules } from './particules';

/**
 * La grenade de l'OM que lance Tom (essai : voir entites/options-essai.ts) et le logo dont elle explose en morceaux. Deux petites
 * images en pleine définition (grenade-om.png : 60 × 84, logo-om.png : 32 × 40, une cinquantaine de couleurs, 3 Ko en tout).
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

/** La grenade explose : des logos s'envolent dans tous les sens (une dizaine, et moins quand l'écran est déjà plein). */
export function logosDeGrenade(p: Particules, x: number, y: number): void {
  const n = p.liste.length < 400 ? 12 : 4;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
    const v = 1.5 + Math.random() * 2.2;
    p.ajoute({
      sorte: 'logo',
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 1.5,
      vie: 40 + Math.random() * 30,
      taille: 5 + Math.floor(Math.random() * 3),
      couleur: '#1f5fd0',
      gravite: 0.18,
    });
  }
}

/** Un morceau de l'écusson : l'image du logo (un carré bleu tant qu'elle n'est pas chargée), qui rétrécit à la fin (`t` : sa vie restante, de 1 à 0). */
export function dessineLogoOM(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  taille: number,
  t: number,
): void {
  const k = Math.round(taille * Math.min(1, t * 3));
  if (k < 1) return;
  if (logo) {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(logo, x - k / 2, y - k / 2, k * 0.8, k);
    ctx.imageSmoothingEnabled = false;
  } else {
    ctx.fillStyle = '#1f5fd0';
    ctx.fillRect(x, y, k / 2, k / 2);
  }
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
