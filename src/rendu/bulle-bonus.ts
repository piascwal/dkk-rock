import { G } from '../jeu/vue';
import { disque } from './formes-pixels';

/** Les cœurs (tonneaux de vie) n'ont pas de boîte : une aura qui bat, rose ou dorée. */
const AURAS: Partial<Record<number, { halo: string; coeur: string }>> = {
  [G.COEUR]: { halo: '255,90,120', coeur: '255,200,210' },
  [G.COEUR_OR]: { halo: '255,210,60', coeur: '255,250,200' },
};

function dessineAuraCoeur(
  ctx: CanvasRenderingContext2D,
  a: { halo: string; coeur: string },
  ms: number,
): void {
  const t = ms / 1000;
  const bat = 1 + 0.12 * Math.sin(t * 6);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const [r, al, c] of [
    [15, 0.12, a.halo],
    [11, 0.18, a.halo],
    [7, 0.24, a.coeur],
  ] as const) {
    ctx.fillStyle = `rgba(${c},${al})`;
    disque(ctx, 0, -8, r * bat);
  }
  // quelques étincelles qui montent en tournant autour
  ctx.fillStyle = `rgba(${a.coeur},0.9)`;
  for (let i = 0; i < 4; i++) {
    const ang = t * 2.2 + i * 1.57;
    if (Math.sin(t * 9 + i * 2) > -0.3)
      ctx.fillRect(Math.round(Math.cos(ang) * 11), Math.round(-8 + Math.sin(ang) * 10), 1, 1);
  }
  ctx.restore();
}

/** Les bonus à ramasser, enfermés dans une boîte de verre : taille (demi-largeur, hauteur) et teinte du verre. */
const BULLES: Partial<Record<number, { demi: number; haut: number; verre: string; bord: string }>> = {
  [G.ARME]: { demi: 13, haut: 26, verre: '160,230,255', bord: '210,245,255' },
  [G.SOIN]: { demi: 11, haut: 22, verre: '255,225,120', bord: '255,240,170' },
};

/** La hauteur de la boîte de verre d'un bonus (0 s'il n'en a pas) : de quoi centrer ce qu'elle contient. */
export const hauteurBulle = (genre: number): number => BULLES[genre]?.haut ?? 0;

/**
 * La boîte transparente qui entoure un bonus : un verre à peine teinté, un liseré qui respire, un reflet qui la
 * traverse en diagonale et deux étincelles aux coins. Elle ondule d'un pixel : on comprend d'un coup d'œil que
 * c'est quelque chose à prendre (pas du décor). Dessinée au pied du bonus (0, 0), par-dessus lui.
 */
export function dessineBulle(ctx: CanvasRenderingContext2D, genre: number, ms: number): void {
  const aura = AURAS[genre];
  if (aura) return dessineAuraCoeur(ctx, aura, ms);
  const b = BULLES[genre];
  if (!b) return;
  const t = ms / 1000;
  const dy = Math.round(Math.sin(t * 3) * 1);
  const x0 = -b.demi;
  const y0 = -b.haut + dy;
  const w = b.demi * 2;
  const h = b.haut;
  const respire = 0.55 + 0.25 * Math.sin(t * 4);
  // le verre, coins coupés
  ctx.fillStyle = `rgba(${b.verre},0.16)`;
  ctx.fillRect(x0 + 1, y0, w - 2, h);
  ctx.fillRect(x0, y0 + 1, w, h - 2);
  // le liseré d'un pixel
  ctx.fillStyle = `rgba(${b.bord},${respire})`;
  ctx.fillRect(x0 + 2, y0, w - 4, 1);
  ctx.fillRect(x0 + 2, y0 + h - 1, w - 4, 1);
  ctx.fillRect(x0, y0 + 2, 1, h - 4);
  ctx.fillRect(x0 + w - 1, y0 + 2, 1, h - 4);
  ctx.fillRect(x0 + 1, y0 + 1, 1, 1);
  ctx.fillRect(x0 + w - 2, y0 + 1, 1, 1);
  ctx.fillRect(x0 + 1, y0 + h - 2, 1, 1);
  ctx.fillRect(x0 + w - 2, y0 + h - 2, 1, 1);
  // le reflet : une barre oblique qui traverse la boîte, puis un temps de pause
  const phase = (t * 0.7) % 1.6;
  if (phase < 1) {
    const gx = Math.round(x0 + 2 + phase * (w - 4));
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let k = 0; k < h - 6; k += 2) {
      const x = gx - Math.floor(k / 2);
      if (x > x0 && x < x0 + w - 2) ctx.fillRect(x, y0 + 3 + k, 2, 2);
    }
  }
  // deux étincelles qui clignotent, à tour de rôle
  ctx.fillStyle = '#ffffff';
  if (Math.floor(t * 3) % 2 === 0) ctx.fillRect(x0 + 3, y0 + 3, 1, 1);
  else ctx.fillRect(x0 + w - 4, y0 + h - 4, 1, 1);
}
