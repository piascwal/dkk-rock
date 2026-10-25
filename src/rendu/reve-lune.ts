import { HAUTEUR_VUE } from '../config';
import { LUNE_R } from '../jeu/reve-parcours';
import { Aleatoire } from '../moteur/maths';
import { disque } from './formes-pixels';
import { dessineJbt } from './reve-jbt';

/**
 * Le bout du rêve : la pleine lune, énorme, ses mers et ses cratères ; JBT y plante sa tête (on ne voit plus que son
 * survêtement, ses baskets et sa cape qui dépassent), la lune tremble, se fend, de la poussière de lune, des étoiles qui lui
 * tournent autour. Ou bien le réveil qui sonne, et le rêve qui s'efface dans le blanc.
 */

type Ctx = CanvasRenderingContext2D;

let surface: HTMLCanvasElement | null = null;

/** La lune, peinte une fois : un disque crème éclairé d'en haut à gauche, ses mers grises, ses cratères bordés de lumière. */
function laLune(): HTMLCanvasElement {
  if (surface) return surface;
  const n = LUNE_R * 2 + 2;
  surface = document.createElement('canvas');
  surface.width = surface.height = n;
  const c = surface.getContext('2d')!;
  const r = new Aleatoire(1969);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const dx = x - n / 2 + 0.5;
      const dy = y - n / 2 + 0.5;
      const d = Math.hypot(dx, dy);
      if (d > LUNE_R) continue;
      const l = 0.82 + 0.22 * ((-dx - dy) / (LUNE_R * 1.5)) - (d > LUNE_R - 2 ? 0.08 : 0);
      c.fillStyle = `rgb(${Math.round(242 * l)},${Math.round(236 * l)},${Math.round(208 * l)})`;
      c.fillRect(x, y, 1, 1);
    }
  // les mers : de grandes taches grises
  c.fillStyle = 'rgba(150,145,130,0.35)';
  for (const [dx, dy, rr] of [
    [-22, -18, 22],
    [10, -30, 14],
    [18, 10, 18],
    [-14, 26, 12],
    [-38, 8, 10],
  ] as const)
    disque(c, n / 2 + dx, n / 2 + dy, rr);
  // les cratères
  for (let i = 0; i < 26; i++) {
    const a = r.entre(0, Math.PI * 2);
    const d = Math.sqrt(r.suivant()) * (LUNE_R - 8);
    const x = Math.round(n / 2 + Math.cos(a) * d);
    const y = Math.round(n / 2 + Math.sin(a) * d);
    const rr = r.entre(1.5, 7);
    c.fillStyle = 'rgba(120,112,96,0.55)';
    disque(c, x, y, rr);
    c.fillStyle = 'rgba(255,252,236,0.6)';
    c.fillRect(Math.round(x - rr * 0.6), Math.round(y + rr * 0.7), Math.max(1, Math.round(rr)), 1);
  }
  return surface;
}

/** La lune, centrée en (cx, cy), qui tremble de `choc` (0 à 1). */
export function dessineLune(ctx: Ctx, cx: number, cy: number, tick: number, choc: number): void {
  if (cx - LUNE_R * 2 > 1000) return;
  const g = ctx.createRadialGradient(cx, cy, LUNE_R * 0.8, cx, cy, LUNE_R * 1.9);
  g.addColorStop(0, 'rgba(255,248,215,0.45)');
  g.addColorStop(1, 'rgba(255,248,215,0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - LUNE_R * 2, cy - LUNE_R * 2, LUNE_R * 4, LUNE_R * 4);
  const t = laLune();
  const s = choc > 0 ? Math.round(Math.sin(tick * 1.7) * 2 * choc) : 0;
  ctx.drawImage(t, Math.round(cx - t.width / 2 + s), Math.round(cy - t.height / 2));
}

/** Combien JBT s'enfonce dans la lune (pixels du jeu, vers son centre) : la tête et les épaules disparaissent sous le bord. */
const ENFONCE = 22;

/**
 * JBT planté dans la lune : la tête et les épaules dedans (on ne dessine que ce qui dépasse), les jambes qui gigotent ; autour,
 * les fissures, la poussière de lune, des étoiles qui tournent. `p` : de 0 (le choc) à 1.
 */
export function jbtPlante(
  ctx: Ctx,
  x: number,
  y: number,
  cx: number,
  cy: number,
  tick: number,
  p: number,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(-50, -50, 2000, HAUTEUR_VUE + 100);
  ctx.arc(cx, cy, LUNE_R - 1, 0, Math.PI * 2);
  ctx.clip('evenodd');
  dessineJbt(ctx, x + ENFONCE, y, Math.sin(tick / 4) * 0.05 * (1 - p * 0.6), tick);
  ctx.restore();
  const ix = cx - Math.sqrt(Math.max(0, LUNE_R * LUNE_R - (y - cy) * (y - cy)));
  // les fissures, en étoile depuis le point d'impact
  ctx.strokeStyle = 'rgba(90,82,70,0.8)';
  ctx.lineWidth = 1;
  const r = new Aleatoire(7);
  for (let i = 0; i < 7; i++) {
    const a = -1.1 + (i / 6) * 2.2;
    let [fx, fy] = [ix + 2, y];
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    for (let k = 0; k < 4; k++) {
      fx += Math.cos(a) * r.entre(4, 8);
      fy += Math.sin(a) * r.entre(4, 8) + r.entre(-2, 2);
      ctx.lineTo(fx, fy);
    }
    ctx.stroke();
  }
  // la poussière de lune, qui retombe
  if (p < 0.7) {
    for (let i = 0; i < 16; i++) {
      const a = Math.PI / 2 + (i / 15 - 0.5) * 3;
      const dd = 4 + p * (26 + (i % 4) * 6);
      ctx.fillStyle = `rgba(240,234,210,${(0.8 * (1 - p / 0.7)).toFixed(2)})`;
      disque(
        ctx,
        Math.round(ix + Math.cos(a) * dd * 0.8),
        Math.round(y + Math.sin(a) * dd * 0.9 + p * p * 20),
        2 + (i % 3),
      );
    }
  }
  // des étoiles qui lui tournent autour des pieds
  for (let i = 0; i < 3; i++) {
    const a = tick / 9 + (i * Math.PI * 2) / 3;
    const sx = x - 14 + Math.cos(a) * 9;
    const sy = y - 8 + Math.sin(a) * 3;
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(Math.round(sx) - 1, Math.round(sy), 3, 1);
    ctx.fillRect(Math.round(sx), Math.round(sy) - 1, 1, 3);
  }
}

/** Le réveil qui sonne : il saute sur place au milieu de l'écran, le rêve s'efface dans le blanc. `p` : de 0 à 1. */
export function reveil(ctx: Ctx, largeur: number, tick: number, p: number): void {
  ctx.fillStyle = `rgba(255,250,240,${Math.min(0.92, p * 1.3).toFixed(2)})`;
  ctx.fillRect(0, 0, largeur, HAUTEUR_VUE);
  if (p < 0.2) return;
  const x = largeur / 2 + (tick % 4 < 2 ? -2 : 2);
  const y = 74 + (tick % 6 < 3 ? -1 : 1);
  ctx.fillStyle = '#1a1424';
  for (const s of [-1, 1]) {
    disque(ctx, x + s * 12, y - 18, 6); // les cloches
    ctx.fillRect(x + s * 10, y + 14, 3, 6); // les pieds
  }
  ctx.fillStyle = '#d02a2a';
  disque(ctx, x, y, 18);
  ctx.fillStyle = '#ffffff';
  disque(ctx, x, y, 14);
  ctx.fillStyle = '#1a1424';
  ctx.fillRect(x, y - 10, 2, 11); // les aiguilles : sept heures du matin
  ctx.fillRect(x - 6, y, 8, 2);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.fillRect(Math.round(x + Math.cos(a) * 12), Math.round(y + Math.sin(a) * 12), 1, 1);
  }
  ctx.fillStyle = '#ffd23f';
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.45;
    const r0 = 24 + (tick % 8);
    ctx.fillRect(Math.round(x + Math.cos(a) * r0), Math.round(y - 6 + Math.sin(a) * r0), 3, 2);
  }
}
