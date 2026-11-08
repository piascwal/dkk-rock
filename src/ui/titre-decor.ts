import { G } from '../jeu/vue';
import { dessineDecorFeuille, dessineFeuille } from '../rendu/feuilles-images';
import type { Bloc } from './titre-physique';

/**
 * Le décor de concert de l'écran titre en scène (voir titre-scene.ts) : deux piles d'enceintes aux deux bords de la scène (les
 * enceintes du jeu, qui battent la mesure ; les héros y grimpent et montent dessus), et le public en ombres chinoises au premier
 * plan, rétroéclairé, qui lève le poing ou fait les cornes du rock.
 */

/** La taille des enceintes par rapport à un héros (une enceinte du jeu fait 34 pixels du jeu de haut, un héros 20). */
const ECHELLE = 0.5;
/** Une enceinte (planche G.ENCEINTE, 132 × 205 à la densité 6) et le caisson du dessus (`enceinte-34`, 156 × 216). */
const [L1, H1] = [132 / 6, 205 / 6];
const [L2, H2] = [156 / 6, 216 / 6];

/** Où sont les deux piles (de bas en haut : l'enceinte, puis le caisson), en pixels : x du milieu, largeur, hauteur totale. */
function piles(W: number, hh: number): { x: number; l: number; h: number }[] {
  const k = (hh / 20) * ECHELLE;
  const l = Math.max(L1, L2) * k;
  const h = (H1 + H2) * k;
  return [
    { x: l / 2 + 2, l, h },
    { x: W - l / 2 - 2, l, h },
  ];
}

/** Les piles d'enceintes, obstacles de la scène (on y grimpe, on monte dessus). */
export function blocsDesEnceintes(W: number, sol: number, hh: number): Bloc[] {
  return piles(W, hh).map((p) => ({ x0: p.x - p.l / 2, y0: sol - p.h, x1: p.x + p.l / 2, y1: sol }));
}

/** Les deux piles, qui battent la mesure (les images du jeu : la membrane qui pulse). */
export function dessineEnceintes(
  ctx: CanvasRenderingContext2D,
  W: number,
  sol: number,
  hh: number,
  temps: number,
): void {
  const k = (hh / 20) * ECHELLE;
  const coup = Math.floor(temps * 4);
  for (const [i, p] of piles(W, hh).entries()) {
    ctx.save();
    ctx.translate(p.x, sol);
    ctx.scale(k * (i ? -1 : 1), k);
    dessineFeuille(ctx, G.ENCEINTE, 0, coup, false);
    ctx.translate(0, -H1);
    dessineDecorFeuille(ctx, 'enceinte-34', coup % 2);
    ctx.restore();
  }
}

export interface Spectateur {
  phase: number;
  taille: number;
  geste: 'rien' | 'poing' | 'cornes';
}

/**
 * Le public, en bas de l'écran : une lueur de scène derrière lui, et des silhouettes bien noires qui se balancent, la main levée
 * au rythme (le poing, ou les cornes : l'index et l'auriculaire levés), avec des flashs d'appareils photo.
 */
export function lePublic(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  temps: number,
  gens: Spectateur[],
  flashs: { x: number; y: number; t0: number }[],
  horloge: number,
): void {
  const r0 = Math.max(8, H * 0.042);
  const haut = H - r0 * 3.6;
  const lueur = ctx.createLinearGradient(0, haut - r0, 0, H);
  lueur.addColorStop(0, 'rgba(255, 90, 170, 0)');
  lueur.addColorStop(0.45, 'rgba(255, 120, 190, 0.32)');
  lueur.addColorStop(1, 'rgba(255, 210, 63, 0.18)');
  ctx.fillStyle = lueur;
  ctx.fillRect(0, haut - r0, W, H - haut + r0);
  const pas = W / gens.length;
  ctx.fillStyle = '#05030a';
  gens.forEach((g, i) => {
    const r = r0 * g.taille;
    const x = pas * (i + 0.5) + Math.sin(g.phase * 3) * pas * 0.25;
    const saut = Math.max(0, Math.sin(temps * Math.PI * 2 + g.phase)) * r * 0.35;
    const tete = H - r * 1.9 - saut;
    ctx.beginPath();
    ctx.arc(x, tete, r, 0, Math.PI * 2);
    ctx.fill();
    // les épaules
    ctx.fillRect(x - r * 1.5, tete + r * 0.8, r * 3, H - tete);
    if (g.geste === 'rien') return;
    // le bras levé, plus ou moins haut au rythme, et la main au bout
    const leve = Math.sin(temps * Math.PI + g.phase * 2) > -0.2;
    const h = leve ? r * 2.6 : r * 1.6;
    const [bx, by] = [x + r * 1.05, tete + r * 0.9 - h];
    ctx.fillRect(bx, by, r * 0.5, h);
    // le poing : un carré ; les cornes : le poing, et l'index et l'auriculaire dressés
    ctx.fillRect(bx - r * 0.12, by - r * 0.45, r * 0.75, r * 0.55);
    if (g.geste === 'cornes') {
      ctx.fillRect(bx - r * 0.12, by - r * 1.15, r * 0.2, r * 0.75);
      ctx.fillRect(bx + r * 0.43, by - r * 1.05, r * 0.2, r * 0.65);
    }
  });
  for (const f of flashs) {
    ctx.globalAlpha = Math.max(0, 1 - (horloge - f.t0) / 0.25);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(f.x - 3, f.y - 3, 6, 6);
  }
  ctx.globalAlpha = 1;
}
