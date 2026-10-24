import { G, ANIM, type Genre } from '../jeu/vue';
import { VERSION } from '../version';
import { dessineFeuille } from './feuilles-images';
import { disque } from './formes-pixels';
import { ecrit } from './police';

/**
 * L'avion des DKK, de profil, l'arrière tourné vers JBG : le fuselage blanc à bande rose et cyan (« AIR WOG »), la dérive, l'aile
 * et son réacteur, les trains d'atterrissage ; aux hublots de l'arrière, les têtes de JBT, de JBM et de Mat (leurs portraits) ;
 * à la porte arrière, ouverte, Tom qui fait de grands signes, et l'échelle qui pend jusqu'au tarmac. Plus il est loin, plus il
 * est petit, posé au bout de la piste ; au décollage, il cabre et monte.
 */

type Ctx = CanvasRenderingContext2D;

const PORTRAITS = ['jbt', 'jbm', 'mat'] as const;
/** Les portraits chargés : ceux des hublots, et Tom (à la trappe, dans la vue de derrière : voir avion-dos-decor.ts). */
export const portraits = new Map<string, HTMLImageElement>();

export function chargeAvion(base: string): void {
  for (const nom of [...PORTRAITS, 'tom']) {
    const img = new Image();
    img.onload = () => portraits.set(nom, img);
    img.src = `${base}portraits/${nom}.png?v=${VERSION}`;
  }
}

const rect = (c: Ctx, x: number, y: number, w: number, h: number, couleur: string) => {
  c.fillStyle = couleur;
  c.fillRect(x, y, w, h);
};

/** La longueur de l'échelle sous la porte, jusqu'au sol de la voie du haut (pixels de l'avion à pleine taille). */
const ECHELLE = 18;

function fuselage(c: Ctx): void {
  // le cône de queue, qui remonte vers l'arrière, puis le fuselage et le nez arrondi
  c.fillStyle = '#f4f4f6';
  c.beginPath();
  c.moveTo(-34, -40);
  c.lineTo(-8, -44);
  c.lineTo(290, -44);
  c.quadraticCurveTo(318, -40, 320, -22);
  c.quadraticCurveTo(316, -10, 296, -10);
  c.lineTo(20, -10);
  c.lineTo(-34, -32);
  c.closePath();
  c.fill();
  // le ventre dans l'ombre, la bande rose et cyan, le nom de la compagnie
  rect(c, 20, -16, 276, 6, '#d8d8de');
  rect(c, -20, -24, 316, 3, '#ff4fd8');
  rect(c, -16, -21, 312, 2, '#4ff0ff');
  ecrit(c, 'AIR WOG', 180, -40, '#d02a5a');
  // le cockpit
  rect(c, 300, -36, 6, 4, '#2a3a50');
  rect(c, 308, -35, 5, 3, '#2a3a50');
  // la dérive et son logo, le stabilisateur
  c.fillStyle = '#f4f4f6';
  c.beginPath();
  c.moveTo(-30, -40);
  c.lineTo(-44, -88);
  c.lineTo(-26, -88);
  c.lineTo(14, -44);
  c.closePath();
  c.fill();
  c.fillStyle = '#ff4fd8';
  c.beginPath();
  c.moveTo(-36, -76);
  c.lineTo(-30, -86);
  c.lineTo(-24, -86);
  c.lineTo(-14, -62);
  c.closePath();
  c.fill();
  ecrit(c, 'DKK', -34, -60, '#1a2440');
  rect(c, -40, -48, 34, 4, '#e0e0e6');
}

/** L'aile, son réacteur (et la chaleur qui en sort quand il pousse), les trains. */
function aileEtTrains(c: Ctx, tick: number, pousse: boolean): void {
  c.fillStyle = '#e4e4ea';
  c.beginPath();
  c.moveTo(110, -14);
  c.lineTo(190, -14);
  c.lineTo(150, -6);
  c.lineTo(104, -8);
  c.closePath();
  c.fill();
  rect(c, 118, -8, 34, 10, '#c8c8d0');
  rect(c, 118, -8, 34, 2, '#e8e8ee');
  rect(c, 116, -7, 3, 8, '#2a2a32');
  if (pousse)
    for (let k = 0; k < 6; k++) {
      c.fillStyle = `rgba(255,255,255,${(0.25 - k * 0.035).toFixed(2)})`;
      disque(c, 110 - k * 7, -3 + Math.round(Math.sin(tick / 2 + k) * 1.5), 3 + k);
    }
  // le train principal et le train avant, leurs roues
  for (const [x, n] of [
    [158, 2],
    [272, 1],
  ] as const) {
    rect(c, x, -10, 2, 6, '#5a5a62');
    for (let k = 0; k < n; k++) {
      c.fillStyle = '#1a1a20';
      disque(c, x + k * 7 - (n - 1) * 3, -2, 3);
      c.fillStyle = '#8a8a90';
      disque(c, x + k * 7 - (n - 1) * 3, -2, 1);
    }
  }
}

/** Les hublots : les DKK à l'arrière, collés à de grands hublots (leurs portraits), puis des passagers anonymes, puis rien. */
function hublots(c: Ctx, tick: number): void {
  for (let i = 0; i < PORTRAITS.length; i++) {
    const x = 18 + i * 13;
    rect(c, x - 1, -36, 11, 12, '#8a96a8');
    rect(c, x, -35, 9, 10, '#2a3a50');
    const portrait = portraits.get(PORTRAITS[i]!);
    if (!portrait) continue;
    // la tête qui se colle au hublot, et qui bouge un peu (ils encouragent JBG)
    const dy = (tick + i * 9) % 30 < 15 ? 0 : -1;
    c.save();
    c.beginPath();
    c.rect(x, -35, 9, 10);
    c.clip();
    c.imageSmoothingEnabled = true;
    c.drawImage(portrait, x - 1, -35 + dy, 11, 11);
    c.restore();
    rect(c, x, -35, 2, 1, 'rgba(255,255,255,0.5)'); // le reflet sur la vitre
  }
  for (let i = 0; i < 24; i++) {
    const x = 60 + i * 9.5;
    rect(c, x - 1, -33, 6, 7, '#8a96a8');
    rect(c, x, -32, 4, 5, '#2a3a50');
    if (i % 3 !== 2 && i < 14) {
      c.fillStyle = ['#c08a6a', '#7a5040', '#e0b090'][i % 3]!;
      c.fillRect(x + 1, -30, 2, 3);
    }
  }
}

/** La porte arrière ouverte, Tom qui fait des signes dedans, et l'échelle qui pend jusqu'au tarmac. */
function porte(c: Ctx, tick: number, echelle: boolean): void {
  rect(c, -1, -38, 12, 28, '#1a1a24');
  rect(c, 0, -37, 10, 26, '#3a3040');
  c.save();
  c.translate(5, -11);
  c.scale(0.9, 0.9);
  // Tom dans l'encadrement : il saute sur place pour se faire voir
  c.translate(0, tick % 24 < 12 ? 0 : -1);
  dessineFeuille(c, G.TOM as Genre, ANIM.DEBOUT, tick, false);
  c.restore();
  if (!echelle) return;
  for (const x of [1, 8]) rect(c, x, -11, 1, ECHELLE + 11, '#c8c8d0');
  for (let y = -8; y < ECHELLE; y += 4) rect(c, 1, y, 8, 1, '#a8a8b0');
}

/**
 * L'avion, la porte arrière en (x, sol) à l'écran, à l'échelle `s` ; `echelle` : l'échelle pend (il est assez près pour qu'on la
 * voie) ; `decolle` : les secondes depuis le décollage (il cabre et monte), ou négatif s'il roule encore.
 */
export function dessineAvion(
  ctx: Ctx,
  x: number,
  sol: number,
  s: number,
  tick: number,
  echelle: boolean,
  decolle: number,
): void {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(sol));
  ctx.scale(s, s);
  // son ombre sur la piste, qui pâlit quand il monte
  const haut = decolle > 0 ? decolle * decolle * 22 + decolle * 18 : 0;
  ctx.fillStyle = `rgba(0,0,0,${Math.max(0, 0.18 - haut / 600).toFixed(3)})`;
  ctx.fillRect(-20, 0, 320, 3);
  if (decolle > 0) {
    // il cabre autour du train principal, puis monte
    ctx.translate(158, -decolle * decolle * 22 - decolle * 18);
    ctx.rotate(-Math.min(0.22, decolle * 0.18));
    ctx.translate(-158, 0);
  }
  aileEtTrains(ctx, tick, true);
  fuselage(ctx);
  hublots(ctx, tick);
  porte(ctx, tick, echelle && decolle <= 0);
  ctx.restore();
}

/** Le haut de l'échelle (pour y faire grimper JBG) : son décalage depuis la porte, à pleine taille. */
export const HAUT_ECHELLE = -11;
export const BAS_ECHELLE = ECHELLE;
