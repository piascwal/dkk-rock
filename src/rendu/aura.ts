import { anneau, disque } from './formes-pixels';

/**
 * L'aura d'un héros invincible (le cœur d'or WOG) : un halo doré qui bat, des rayons qui tournent, un anneau qui se
 * dilate et des étincelles en orbite. Dessinée derrière le héros, pieds en (0, 0), sans lissage ; assez forte pour qu'on
 * comprenne d'un coup d'œil qu'il ne risque plus rien.
 */
const OR = '255,210,60';
const BLANC = '255,250,200';
/** le centre du halo : à hauteur de torse */
const CENTRE_Y = -11;

export function dessineAura(ctx: CanvasRenderingContext2D, temps: number): void {
  const t = temps / 1000;
  const bat = 1 + 0.12 * Math.sin(t * 9);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // le halo : des disques concentriques, de plus en plus clairs vers le cœur
  for (const [r, a, couleur] of [
    [26, 0.14, OR],
    [21, 0.2, OR],
    [16, 0.26, OR],
    [11, 0.3, BLANC],
  ] as const) {
    ctx.fillStyle = `rgba(${couleur},${a})`;
    disque(ctx, 0, CENTRE_Y, r * bat);
  }

  // des rayons qui tournent, un sur deux plus long
  ctx.fillStyle = `rgba(${BLANC},0.55)`;
  const base = t * 1.6;
  for (let i = 0; i < 12; i++) {
    const angle = base + (i * Math.PI) / 6;
    const long = i % 2 ? 22 : 30;
    for (let k = 14; k < long * bat; k += 1) {
      ctx.fillRect(Math.round(Math.cos(angle) * k), Math.round(CENTRE_Y + Math.sin(angle) * k * 0.9), 1, 1);
    }
  }

  // un anneau qui se dilate puis s'efface, deux fois par seconde
  const p = (t * 1.4) % 1;
  ctx.fillStyle = `rgba(${OR},${0.7 * (1 - p)})`;
  anneau(ctx, 0, CENTRE_Y, 10 + p * 22);

  // des étincelles en orbite
  ctx.fillStyle = '#fffbe0';
  for (let i = 0; i < 8; i++) {
    const angle = t * (2 + (i % 3) * 0.7) + i * 0.8;
    const rayon = 15 + ((i * 5) % 9) + Math.sin(t * 5 + i) * 2;
    const x = Math.round(Math.cos(angle) * rayon);
    const y = Math.round(CENTRE_Y + Math.sin(angle) * rayon * 0.9);
    if (Math.sin(t * 12 + i * 2) > -0.4) {
      ctx.fillRect(x, y, 1, 1);
      if (i % 2) {
        ctx.fillRect(x - 1, y, 3, 1);
        ctx.fillRect(x, y - 1, 1, 3);
      }
    }
  }
  ctx.restore();
}
