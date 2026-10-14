import { disque } from './formes-pixels';

/** Les paliers de couleur d'un nuage d'explosion, [cœur, liseré] : feu vif, braise, cendre. */
const FEU_VIF = ['#fff3b0', '#ffb347'];
const BRAISE = ['#c0502a', '#7a2a14'];
const CENDRE = ['#4a4a4a', '#2a2a2a'];

interface Nuage {
  sorte: string;
  x: number;
  y: number;
  vie: number;
  vieMax: number;
  taille: number;
  couleur: string;
}

/**
 * Les nuages d'explosion : tous les liserés d'abord, puis tous les cœurs, pour que les boules qui se chevauchent
 * forment une seule masse (et non des bulles qui montrent chacune leur contour), puis les reflets.
 */
export function dessineNuages(
  ctx: CanvasRenderingContext2D,
  liste: readonly Nuage[],
  camX: number,
  camY: number,
): void {
  const nuages = liste
    .filter((p) => p.sorte === 'fumee')
    .map((p) => {
      const t = p.vie / p.vieMax;
      const r = p.taille * (1.4 - t * 0.6) * (t < 0.25 ? t * 4 : 1);
      const [coeur, bord] = t > 0.8 ? FEU_VIF : t > 0.6 ? [p.couleur, '#c0502a'] : t > 0.35 ? BRAISE : CENDRE;
      return { x: Math.round(p.x - camX), y: Math.round(p.y - camY), r, t, coeur, bord };
    })
    .filter((n) => n.r >= 1);
  for (const n of nuages) {
    ctx.fillStyle = n.bord;
    disque(ctx, n.x, n.y, n.r + 1);
  }
  for (const n of nuages) {
    ctx.fillStyle = n.coeur;
    disque(ctx, n.x, n.y, n.r);
  }
  for (const n of nuages) {
    if (n.t <= 0.35) continue;
    // un reflet plus clair en haut à gauche
    ctx.fillStyle = n.t > 0.6 ? '#fff3b0' : '#ff9b2f';
    disque(ctx, n.x - Math.round(n.r * 0.3), n.y - Math.round(n.r * 0.3), n.r * 0.4);
  }
}
