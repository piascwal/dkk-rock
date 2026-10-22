import { S } from './plongeon-monde';
import { CASCADE, faceRive } from './plongeon-rives';

/**
 * La cascade de droite, animée : l'eau y coule en filets de toute largeur, blancs et bleutés, qui tombent à des vitesses
 * différentes, des gouttes qui jaillissent sur les côtés, et au pied la vasque qui bouillonne dans sa brume. Dessinée à chaque
 * image par-dessus le décor peint (voir plongeon-rives.ts), à la place de la cascade.
 */

type Ctx = CanvasRenderingContext2D;
type Repere = (v: number) => number;

const LARGEUR = Math.round(2.6 * S);
const FILETS = [
  ['rgba(255,255,255,0.85)', 3.4, 14],
  ['rgba(205,238,248,0.7)', 2.4, 9],
  ['rgba(150,205,225,0.55)', 1.7, 18],
] as const;

export function dessineCascade(ctx: Ctx, ex: Repere, ey: Repere, tick: number): void {
  const [haut, bas] = CASCADE;
  const x0 = ex(faceRive(haut, 1) + 0.3);
  const y0 = ey(haut);
  const hauteur = ey(bas) - y0;
  if (y0 > 400 || y0 + hauteur < -40) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0 - 8, y0, LARGEUR + 16, hauteur);
  ctx.clip();
  // les filets : chaque colonne en a trois, qui tombent sans jamais se synchroniser
  for (let col = 0; col < LARGEUR; col++) {
    FILETS.forEach(([couleur, vitesse, long], k) => {
      const graine = (col * 73 + k * 191) % 97;
      const longueur = long + (graine % 7);
      const periode = hauteur + longueur;
      const pos = ((tick * (vitesse + (graine % 3) * 0.4) + graine * 11) % periode) - longueur;
      ctx.fillStyle = couleur;
      ctx.fillRect(x0 + col, y0 + pos, 1, longueur);
    });
  }
  // des gouttes qui sautent de la nappe, sur les côtés
  ctx.fillStyle = 'rgba(235,250,255,0.85)';
  for (let i = 0; i < 12; i++) {
    const p = (tick * 0.04 + i * 0.37) % 1;
    const cote = i % 2 ? 1 : -1;
    const gx = x0 + (cote > 0 ? LARGEUR + 1 : -1) + cote * Math.round(p * 7);
    const gy = y0 + ((i * 53) % hauteur) + Math.round(p * p * 14);
    ctx.fillRect(gx, gy, 1, 2);
  }
  ctx.restore();
  // la vasque : de l'écume qui bouillonne, une brume qui monte
  const pied = ey(bas);
  for (let i = 0; i < 16; i++) {
    const r = 2 + ((i + Math.floor(tick / 6)) % 3);
    const dx = (i * 11) % (LARGEUR + 10);
    const bond = Math.abs(Math.sin((tick + i * 7) / 9)) * 5;
    ctx.fillStyle = i % 3 ? 'rgba(255,255,255,0.9)' : 'rgba(200,235,245,0.8)';
    ctx.beginPath();
    ctx.arc(x0 - 5 + dx, pied - 2 - bond, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(235,248,250,0.22)';
  for (let i = 0; i < 4; i++) {
    const m = (tick * 0.35 + i * 17) % 40;
    ctx.beginPath();
    ctx.arc(x0 + LARGEUR / 2 + Math.sin(i * 2 + tick / 40) * 9, pied - 6 - m, 7 + m / 6, 0, Math.PI * 2);
    ctx.fill();
  }
}
