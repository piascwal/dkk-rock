import { HAUTEUR_VUE } from '../config';

/**
 * La perspective de l'avion de JBG vu de derrière : un point du tarmac (x latéral, h hauteur, z profondeur, en mètres devant la
 * caméra) à l'écran. La caméra est derrière JBG, un peu au-dessus de lui ; elle suit sa voie, sans tout à fait la rattraper.
 */

type Ctx = CanvasRenderingContext2D;

/** La ligne d'horizon, la focale (pixels par mètre à un mètre), la hauteur de la caméra (mètres). */
export const HORIZON = 60;
const FOCALE = 115;
const CAMERA = 3.6;
/** JBG court à cette profondeur devant la caméra (mètres). */
export const Z_JBG = 5.2;
/** Les pixels du tarmac (la simulation) en mètres, le long des voies et en hauteur ; l'écart entre deux voies. */
export const METRES = 0.12;
export const METRES_HAUT = 0.075;
export const ECART_VOIES = 2.6;

/** Le milieu de l'écran, et le décalage latéral de la caméra (mètres) : fixés à chaque image par `cadre`. */
const cam = { vx: 142, x: 0 };

export function cadre(largeur: number, cameraX: number): void {
  cam.vx = largeur / 2;
  cam.x = cameraX;
}

export const px = (x: number, z: number): number => cam.vx + ((x - cam.x) * FOCALE) / z;
export const py = (h: number, z: number): number => HORIZON + ((CAMERA - h) * FOCALE) / z;
export const ech = (z: number): number => FOCALE / z;
/** La profondeur d'une rangée de l'écran sous l'horizon (le sol). */
export const zDeRangee = (y: number): number => (CAMERA * FOCALE) / (y - HORIZON);
export const BAS_ECRAN = HAUTEUR_VUE;

/**
 * Une distance le long du tarmac (mètres devant JBG) en profondeur à l'écran : vraie de près, tassée au loin, pour que l'avion,
 * à deux cents mètres, reste assez grand pour qu'on le voie s'approcher. Les objets et l'avion suivent la même règle : rien ne
 * passe devant l'avion qui serait derrière lui.
 */
export const profondeur = (m: number): number => Z_JBG + m / (1 + Math.max(0, m) / 60);

/** La voie (0 à 2, éventuellement entre deux) en mètres, de gauche à droite. */
export const xVoie = (voie: number): number => (voie - 1) * ECART_VOIES;

/** Un rectangle debout, face à la caméra : centré en x, posé à la hauteur h, large de l, haut de hh. */
export function boite(c: Ctx, x: number, h: number, z: number, l: number, hh: number, couleur: string): void {
  const x0 = Math.round(px(x - l / 2, z));
  const x1 = Math.round(px(x + l / 2, z));
  const y0 = Math.round(py(h + hh, z));
  const y1 = Math.round(py(h, z));
  c.fillStyle = couleur;
  c.fillRect(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0));
}

export function disque(c: Ctx, x: number, h: number, z: number, r: number, couleur: string): void {
  c.fillStyle = couleur;
  c.beginPath();
  c.arc(px(x, z), py(h, z), Math.max(0.6, r * ech(z)), 0, Math.PI * 2);
  c.fill();
}

/** Un quadrilatère du monde, ses quatre coins donnés en [x, h, z]. */
export function quad(c: Ctx, coins: readonly (readonly [number, number, number])[], couleur: string): void {
  c.fillStyle = couleur;
  c.beginPath();
  coins.forEach(([x, h, z], i) => (i ? c.lineTo(px(x, z), py(h, z)) : c.moveTo(px(x, z), py(h, z))));
  c.closePath();
  c.fill();
}

/**
 * Un pavé posé sur le tarmac, de z0 (près) à z1 (loin) : le dessus et les côtés d'abord, la face arrière (vers nous) par-dessus.
 * `dessus` et `cote` : les couleurs des faces (null : pas de dessus visible, comme sous un plateau).
 */
export function pave(
  c: Ctx,
  x: number,
  h: number,
  z0: number,
  z1: number,
  l: number,
  hh: number,
  face: string,
  dessus: string | null,
  cote: string,
): void {
  const g = x - l / 2;
  const d = x + l / 2;
  const haut = h + hh;
  // le côté qu'on voit : celui qui fait face à la caméra
  const cx = g > cam.x ? g : d < cam.x ? d : null;
  if (cx !== null)
    quad(
      c,
      [
        [cx, h, z0],
        [cx, h, z1],
        [cx, haut, z1],
        [cx, haut, z0],
      ],
      cote,
    );
  if (dessus && haut < 3.6)
    quad(
      c,
      [
        [g, haut, z0],
        [d, haut, z0],
        [d, haut, z1],
        [g, haut, z1],
      ],
      dessus,
    );
  boite(c, x, h, z0, l, hh, face);
}

/** L'ombre d'un objet au sol, écrasée par la perspective. */
export function ombre(c: Ctx, x: number, z: number, l: number, opacite = 0.3): void {
  c.fillStyle = `rgba(0,0,0,${opacite})`;
  c.beginPath();
  c.ellipse(px(x, z), py(0, z), Math.max(1, l * ech(z)), Math.max(0.5, 0.18 * ech(z)), 0, 0, Math.PI * 2);
  c.fill();
}
