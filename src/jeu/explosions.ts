import { TUILE } from '../config';
import type { Camp, Cible, Contexte } from './contexte';

/**
 * Une explosion : elle abîme les tuiles dans son rayon (de plus en plus fort
 * vers le centre) et blesse les cibles du camp adverse. Les caissons de basses
 * détruits explosent à leur tour : la partie s'en charge en relevant les
 * modifications de la carte.
 */
export function explose(
  ctx: Contexte,
  x: number,
  y: number,
  rayon: number,
  degats: number,
  camp: Camp,
): void {
  ctx.evenement({ k: 'explo', x, y, r: rayon });
  ctx.son(rayon > 45 ? 'grosse-explosion' : 'explosion', x, y);
  ctx.secoue(Math.min(16, rayon / 5));

  if (degats > 0) {
    const r = Math.ceil(rayon / TUILE);
    const tx0 = Math.floor(x / TUILE);
    const ty0 = Math.floor(y / TUILE);
    for (let ty = ty0 - r; ty <= ty0 + r; ty++) {
      for (let tx = tx0 - r; tx <= tx0 + r; tx++) {
        const d = Math.hypot((tx + 0.5) * TUILE - x, (ty + 0.5) * TUILE - y);
        if (d > rayon) continue;
        ctx.carte.endommage(tx, ty, degats * (1.5 - d / rayon));
      }
    }
  }

  const visees: Camp = camp === 'heros' ? 'ennemis' : camp === 'ennemis' ? 'heros' : 'tous';
  for (const c of ctx.cibles(visees)) {
    const cx = c.x + c.w / 2;
    const cy = c.y + c.h / 2;
    const d = Math.hypot(cx - x, cy - y) - Math.max(c.w, c.h) / 2;
    if (d > rayon) continue;
    const force = degats > 0 ? Math.max(1, degats * (1 - Math.max(0, d) / rayon)) : 0;
    if (force > 0) c.blesse(force, ctx, Math.sign(cx - x) || 1, true);
    pousse(c, cx - x, cy - y);
  }
}

/** Le souffle projette ce qui a une vitesse. */
function pousse(c: Cible, dx: number, dy: number): void {
  const corps = (c as Partial<{ corps: { vx: number; vy: number } }>).corps;
  if (!corps) return;
  const n = Math.hypot(dx, dy) || 1;
  corps.vx += (dx / n) * 2.5;
  corps.vy = Math.min(corps.vy, -2.5 + (dy / n) * 1.5);
}
