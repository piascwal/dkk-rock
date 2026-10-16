import { G } from '../jeu/vue';

/** Les bonus à ramasser, enfermés dans une boîte de verre : taille (demi-largeur, hauteur) et teinte du verre. */
const BULLES: Partial<Record<number, { demi: number; haut: number; verre: string; bord: string }>> = {
  [G.ARME]: { demi: 13, haut: 26, verre: '160,230,255', bord: '210,245,255' },
  [G.SOIN]: { demi: 11, haut: 22, verre: '255,225,120', bord: '255,240,170' },
  [G.COEUR]: { demi: 11, haut: 22, verre: '255,150,170', bord: '255,205,215' },
  [G.COEUR_OR]: { demi: 11, haut: 22, verre: '255,225,120', bord: '255,240,170' },
};

/**
 * La boîte transparente qui entoure un bonus : un verre à peine teinté, un liseré qui respire, un reflet qui la
 * traverse en diagonale et deux étincelles aux coins. Elle ondule d'un pixel : on comprend d'un coup d'œil que
 * c'est quelque chose à prendre (pas du décor). Dessinée au pied du bonus (0, 0), par-dessus lui.
 */
export function dessineBulle(ctx: CanvasRenderingContext2D, genre: number, ms: number): void {
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
