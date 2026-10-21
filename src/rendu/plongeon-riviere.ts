import { EAU, PROFOND } from '../jeu/plongeon';
import { bruit } from '../moteur/maths';
import { disque } from './formes-pixels';

/**
 * La Siagne vue du haut du pont des Tuves : la rivière coule de haut en bas de l'écran, entre deux berges de galets, d'herbe et
 * d'arbres. Le trou d'eau (plus foncé) est là où il faut tomber ; ailleurs, l'eau s'éclaircit en allant vers les berges (moins
 * profonde, des galets au fond). `echelle` : les pixels par mètre au niveau de l'eau (elle grandit pendant la chute) ; le point
 * (camX, 0) de la rivière est au milieu de l'écran, à la hauteur `centreY`.
 */
export interface Regard {
  camX: number;
  echelle: number;
  centreY: number;
}

const HERBES = ['#3f7a32', '#4a8a3a'];
const GALETS = '#cbbd98';
/** les profondeurs du trou d'eau (du milieu au bord), puis de l'eau qui remonte vers la berge */
const FOSSE = ['#123c62', '#164a72', '#1c5a82', '#226a90'];
const BAS = ['#2c86a4', '#3f9fb4', '#5ab6be', '#7ccbc6', '#9ddbc8'];

/** La couleur du fond de la rivière en travers, à `x` mètres de son milieu. */
export function couleurRiviere(x: number, fosse: number): string {
  const ax = Math.abs(x);
  if (ax > EAU + 1.6) return HERBES[Math.floor(x / 3) & 1]!;
  if (ax > EAU) return GALETS;
  const d = Math.abs(x - fosse);
  if (d <= PROFOND) return FOSSE[Math.min(FOSSE.length - 1, Math.floor((d / PROFOND) * FOSSE.length))]!;
  const reste = Math.max(1, EAU - PROFOND - Math.abs(fosse) * 0.5);
  return BAS[Math.min(BAS.length - 1, Math.floor(((d - PROFOND) / reste) * BAS.length))]!;
}

export function dessineRiviere(
  ctx: CanvasRenderingContext2D,
  largeur: number,
  hauteur: number,
  r: Regard,
  fosse: number,
  tick: number,
): void {
  const s = r.echelle;
  const mondeX = (sx: number) => r.camX + (sx - largeur / 2) / s;
  // le fond, en bandes verticales : une bande par couleur
  let debut = 0;
  let couleur = couleurRiviere(mondeX(0.5), fosse);
  for (let sx = 1; sx <= largeur; sx++) {
    const c = sx < largeur ? couleurRiviere(mondeX(sx + 0.5), fosse) : '';
    if (c === couleur) continue;
    ctx.fillStyle = couleur;
    ctx.fillRect(debut, 0, sx - debut, hauteur);
    debut = sx;
    couleur = c;
  }
  // les détails, case par case (des cases plus grandes quand on est haut) : le courant, les galets, les rochers, les arbres
  const c = s < 4 ? 4 : s < 10 ? 2 : 1;
  const x0 = Math.floor(mondeX(0) / c) - 3;
  const x1 = Math.ceil(mondeX(largeur) / c) + 3;
  const y0 = Math.floor(-r.centreY / s / c) - 3;
  const y1 = Math.ceil((hauteur - r.centreY) / s / c) + 3;
  const ecran = (x: number, y: number): [number, number] => [
    Math.round(largeur / 2 + (x - r.camX) * s),
    Math.round(r.centreY + y * s),
  ];
  for (let i = x0; i <= x1; i++)
    for (let j = y0; j <= y1; j++) {
      const h = bruit(i, j, c * 17);
      const x = (i + bruit(i, j, 3)) * c;
      const ax = Math.abs(x);
      if (ax <= EAU) {
        const profond = Math.abs(x - fosse) <= PROFOND;
        if (h < 0.2) {
          // le courant : un trait clair qui descend la rivière
          const y = (j + ((h * 5 + tick * 0.012 * (profond ? 0.6 : 1)) % 1)) * c;
          const [sx, sy] = ecran(x, y);
          ctx.fillStyle = 'rgba(225,250,255,0.4)';
          ctx.fillRect(sx, sy, 1, Math.max(1, Math.round(s * 0.7)));
        } else if (!profond && h < 0.42) {
          const [sx, sy] = ecran(x, (j + bruit(j, i, 5)) * c);
          ctx.fillStyle = h < 0.3 ? 'rgba(230,220,190,0.6)' : 'rgba(150,150,140,0.5)';
          const t = Math.max(1, Math.min(3, Math.round(s * 0.12)));
          ctx.fillRect(sx, sy, t, t);
        } else if (!profond && h > 0.985) {
          // un rocher blanc qui sort de l'eau : l'écume autour, son ombre, la lumière sur le dessus
          const [sx, sy] = ecran(x, (j + 0.5) * c);
          const r = Math.max(1, s * 0.35);
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          disque(ctx, sx, sy, r + Math.max(1, s * 0.08));
          ctx.fillStyle = '#a89e88';
          disque(ctx, sx, sy, r);
          ctx.fillStyle = '#d8d2c0';
          disque(ctx, sx - Math.round(r * 0.2), sy - Math.round(r * 0.2), Math.max(1, r * 0.7));
        }
      } else if (ax > EAU + 5 && h < 0.24) {
        // un arbre de la berge, vu d'en haut (pas au bord de l'eau, où l'on peut atterrir) : son ombre, sa couronne, la lumière
        const [sx, sy] = ecran(x, (j + 0.5) * c);
        const rayon = Math.max(1, (1.2 + h * 8) * s);
        ctx.fillStyle = 'rgba(10,30,10,0.35)';
        disque(ctx, sx + Math.round(rayon * 0.25), sy + Math.round(rayon * 0.25), rayon);
        ctx.fillStyle = h < 0.08 ? '#2a5a26' : '#33682c';
        disque(ctx, sx, sy, rayon);
        ctx.fillStyle = '#4f8a3a';
        disque(ctx, sx - Math.round(rayon * 0.3), sy - Math.round(rayon * 0.3), Math.max(1, rayon * 0.45));
      } else if (ax > EAU + 1.6 && h > 0.9) {
        const [sx, sy] = ecran(x, (j + 0.5) * c);
        ctx.fillStyle = '#9a9488';
        disque(ctx, sx, sy, Math.max(1, s * 0.5));
      }
    }
}
