import { anneau, disque } from './formes-pixels';

/**
 * L'aura d'un héros invincible (le cœur d'or WOG) : un halo doré qui bat, des rayons qui tournent, un anneau qui se
 * dilate et des étincelles en orbite. Dessinée derrière le héros, pieds en (0, 0), sans lissage ; assez forte pour qu'on
 * comprenne d'un coup d'œil qu'il ne risque plus rien.
 *
 * Elle coûte cher à tracer (près de 400 petits rectangles) : le halo et les rayons sont dessinés une fois par état (la
 * pulsation et la rotation sont découpées en quelques pas) dans une petite image qu'on réutilise ; et l'ombre portée des mondes
 * sombres (la « lueur » des personnages, voir dessin-entites.ts) est coupée pendant l'aura : sinon chaque rectangle aurait son
 * propre flou, à chaque image, et le jeu tombait à une image par seconde.
 */
const OR = '255,210,60';
const BLANC = '255,250,200';
/** le centre du halo : à hauteur de torse */
const CENTRE_Y = -11;
/** la taille de l'image du halo et des rayons (pixels du jeu), et son centre */
const TAILLE = 76;
const C = TAILLE / 2;
/** les pas de la pulsation (le halo grossit et rétrécit de 12 %) et de la rotation (les rayons se répètent tous les 60°) */
const PAS_BAT = 6;
const PAS_ROT = 20;
const PERIODE_ROT = Math.PI / 3;
const BAT_MIN = 0.88;
const BAT_MAX = 1.12;

const images = new Map<number, HTMLCanvasElement>();

/** Le halo et les rayons à la pulsation `bat` et à la rotation `angle`, dans une image centrée sur le cœur de l'aura. */
function halo(pasBat: number, pasRot: number): HTMLCanvasElement {
  const cle = pasBat * PAS_ROT + pasRot;
  const deja = images.get(cle);
  if (deja) return deja;
  const toile = document.createElement('canvas');
  toile.width = TAILLE;
  toile.height = TAILLE;
  const ctx = toile.getContext('2d')!;
  const bat = BAT_MIN + (pasBat * (BAT_MAX - BAT_MIN)) / (PAS_BAT - 1);
  const base = (pasRot * PERIODE_ROT) / PAS_ROT;
  ctx.globalCompositeOperation = 'lighter';

  // le halo : des disques concentriques, de plus en plus clairs vers le cœur
  for (const [r, a, couleur] of [
    [26, 0.14, OR],
    [21, 0.2, OR],
    [16, 0.26, OR],
    [11, 0.3, BLANC],
  ] as const) {
    ctx.fillStyle = `rgba(${couleur},${a})`;
    disque(ctx, C, C, r * bat);
  }

  // des rayons qui tournent, un sur deux plus long
  ctx.fillStyle = `rgba(${BLANC},0.55)`;
  for (let i = 0; i < 12; i++) {
    const angle = base + (i * Math.PI) / 6;
    const long = i % 2 ? 22 : 30;
    for (let k = 14; k < long * bat; k += 1)
      ctx.fillRect(C + Math.round(Math.cos(angle) * k), C + Math.round(Math.sin(angle) * k * 0.9), 1, 1);
  }
  images.set(cle, toile);
  return toile;
}

export function dessineAura(ctx: CanvasRenderingContext2D, temps: number): void {
  const t = temps / 1000;
  const bat = 1 + 0.12 * Math.sin(t * 9);
  ctx.save();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'lighter';

  const pasBat = Math.round(((bat - BAT_MIN) / (BAT_MAX - BAT_MIN)) * (PAS_BAT - 1));
  const tour = (((t * 1.6) % PERIODE_ROT) + PERIODE_ROT) % PERIODE_ROT;
  const pasRot = Math.floor((tour / PERIODE_ROT) * PAS_ROT) % PAS_ROT;
  ctx.drawImage(halo(pasBat, pasRot), -C, CENTRE_Y - C);

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
