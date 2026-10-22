import { TICKS_PAR_SECONDE } from '../config';
import { DUREE_IMPACT, DUREE_RESULTAT, EAU, HAUTEUR, ZONE } from '../jeu/plongeon';
import type { VuePlongeon } from '../jeu/vue';
import { disque } from './formes-pixels';
import { profondeur } from './plongeon-gorge';
import { dessineTom } from './plongeon-tom';

/**
 * L'arrivée de Tom, qui reste à l'écran jusqu'au tour suivant. Dans le trou d'eau : une gerbe, Tom file vers le fond, se
 * retourne, remonte la tête en haut, puis nage la brasse jusqu'à la berge la plus proche. En eau peu profonde : planté la tête
 * dans les galets, les jambes hors de l'eau. Sur la berge : planté la tête la première dans un nuage de terre.
 */

type Ctx = CanvasRenderingContext2D;
type Repere = (v: number) => number;

/** Le temps (s) depuis que Tom a touché. */
const ecoule = (v: VuePlongeon): number =>
  (v.etape === 'impact' ? DUREE_IMPACT - v.minuteur : DUREE_IMPACT + DUREE_RESULTAT - v.minuteur) /
  TICKS_PAR_SECONDE;

/** La berge à `x` (m) : la hauteur du sol. */
export const sol = (x: number): number =>
  HAUTEUR - 0.25 - Math.min(1.2, Math.max(0, Math.abs(x) - EAU) * 0.35);

export function dessineArrivee(ctx: Ctx, v: VuePlongeon, ex: Repere, ey: Repere, fosse: number): void {
  const t = ecoule(v);
  if (v.zone === ZONE.BERGE) return plante(ctx, ex(v.x), ey(sol(v.x)), Math.min(1, t / 2));
  gerbe(ctx, ex(v.x), ey(HAUTEUR), t, v.zone === ZONE.BAS);
  if (v.zone === ZONE.BAS)
    return plante(ctx, ex(v.x), ey(HAUTEUR + profondeur(v.x, fosse)), Math.min(1, t / 2), ey(HAUTEUR));
  nage(ctx, v, ex, ey, t, fosse);
}

/** Dans le trou d'eau : la descente, le demi-tour, la remontée, puis la brasse vers la berge la plus proche. */
function nage(ctx: Ctx, v: VuePlongeon, ex: Repere, ey: Repere, t: number, fosse: number): void {
  const fond = Math.min(profondeur(v.x, fosse) - 0.4, 3.2);
  const x = ex(v.x);
  if (t < 0.7) return dessineTom(ctx, 'plonge', x, ey(HAUTEUR + Math.min(fond, t * 5) + 0.2), Math.PI / 2);
  if (t < 1.1) {
    // au fond, il se retourne
    const k = (t - 0.7) / 0.4;
    return dessineTom(ctx, 'chute', x, ey(HAUTEUR + fond + 0.2), Math.PI / 2 - k * Math.PI);
  }
  if (t < 2.1) {
    // il remonte, bras tendus vers la surface, dans ses bulles
    const y = HAUTEUR + fond + 0.2 - (fond + 0.5) * ((t - 1.1) / 1);
    ctx.fillStyle = 'rgba(220,250,255,0.8)';
    for (let k = 0; k < 4; k++) disque(ctx, x + ((k * 5) % 7) - 3, ey(y - 1 - ((t * 3 + k * 0.4) % 1.2)), 1);
    return dessineTom(ctx, 'plonge', x, ey(y), -Math.PI / 2);
  }
  // la brasse : bras pliés, bras tendus, à la surface, vers la berge
  const sens = v.x >= fosse ? 1 : -1;
  const bord = sens * (EAU - 0.7);
  const nx = v.x + sens * Math.min(Math.abs(bord - v.x), (t - 2.1) * 1.3);
  const arrive = Math.abs(nx - bord) < 0.05;
  const temps = arrive ? 'chute' : Math.floor(t * 3) % 2 ? 'chute' : 'plonge';
  dessineTom(ctx, temps, ex(nx), ey(HAUTEUR + 0.12), 0, sens < 0);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  if (!arrive) for (let k = 1; k <= 3; k++) ctx.fillRect(ex(nx) - sens * (8 + k * 6), ey(HAUTEUR), 3, 1);
}

/** La gerbe : une couronne de gouttes qui montent et retombent, des cercles qui s'écartent à la surface. */
function gerbe(ctx: Ctx, x: number, surface: number, t: number, petite: boolean): void {
  for (let k = 0; k < 3; k++) {
    const q = t * 0.8 - k * 0.25;
    if (q <= 0 || q >= 1) continue;
    ctx.fillStyle = `rgba(255,255,255,${(0.8 * (1 - q)).toFixed(2)})`;
    ctx.fillRect(x - Math.round(q * 40), surface - 1, 4, 1);
    ctx.fillRect(x + Math.round(q * 40) - 4, surface - 1, 4, 1);
  }
  const p = t / 1.4;
  if (p > 1) return;
  for (let i = 0; i < 26; i++) {
    const a = -Math.PI / 2 + (i / 25 - 0.5) * (petite ? 2 : 1.4);
    const vitesse = (petite ? 70 : 110) * (0.6 + ((i * 7) % 5) * 0.1);
    const gx = x + Math.cos(a) * vitesse * p;
    const gy = surface + Math.sin(a) * vitesse * p + 160 * p * p;
    if (gy > surface) continue;
    ctx.fillStyle = i % 3 ? 'rgba(235,250,255,0.95)' : 'rgba(170,225,240,0.9)';
    ctx.fillRect(Math.round(gx), Math.round(gy), 2, 3);
  }
}

/** Tom planté la tête la première (on voit ses jambes) : dans la terre, avec un nuage de poussière, ou dans les galets sous l'eau. */
function plante(ctx: Ctx, x: number, y: number, p: number, surface?: number): void {
  const sousLEau = surface !== undefined;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - 40, y - 60, 80, 60);
  ctx.clip();
  dessineTom(ctx, 'plonge', x, y - 6, Math.PI / 2);
  ctx.restore();
  if (sousLEau) {
    // la part de Tom sous l'eau, vue à travers elle
    ctx.fillStyle = 'rgba(50,190,180,0.45)';
    ctx.fillRect(x - 12, surface + 1, 24, y - surface - 1);
  }
  const nuage = sousLEau ? '120,110,80' : '140,110,76';
  for (let i = 0; i < 14; i++) {
    const a = Math.PI + (i / 13) * Math.PI;
    const d = 4 + p * (14 + (i % 3) * 5);
    const alpha = Math.max(0, (sousLEau ? 0.5 : 0.8) * (1 - p * 0.85));
    ctx.fillStyle = `rgba(${nuage},${alpha.toFixed(2)})`;
    disque(
      ctx,
      Math.round(x + Math.cos(a) * d),
      Math.round(y + Math.sin(a) * d * (sousLEau ? 0.3 : 0.7)),
      3 + (i % 3) + p * 3,
    );
  }
  if (sousLEau || p >= 0.6) return;
  ctx.fillStyle = '#d4b878';
  for (let i = 0; i < 6; i++)
    ctx.fillRect(
      Math.round(x + (i - 2.5) * 6 * p * 4),
      Math.round(y - 10 * p * ((i % 3) + 1) + 30 * p * p),
      2,
      2,
    );
}
