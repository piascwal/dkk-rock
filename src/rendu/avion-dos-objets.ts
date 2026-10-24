import { HAUT_TAPIS, RAMPE, type Objet } from '../jeu/avion-parcours';
import { iconeBonus } from './avion-objets';
import { METRES, METRES_HAUT, boite, disque, ech, ombre, pave, px, py, quad } from './avion-perspective';

/**
 * Ce qui encombre le tarmac, vu de derrière JBG : chaque objet a sa face arrière (vers nous) en z0, son bout en z1 (les longs :
 * trains de chariots, camions). Les cônes, les valises, les flaques de kérosène, les agents de piste et leurs bâtons, les
 * chariots à bagages et leur tracteur, les camions-escaliers, les camions à tapis (leur rampe, qu'on prend par l'arrière), les
 * portiques de hauteur (on glisse dessous), les cartes d'embarquement qui tournent, les bonus dans leur bulle.
 */

type Ctx = CanvasRenderingContext2D;

const VALISES = ['#2a6fdb', '#c81e2a', '#ffd23f', '#2a2a30', '#3f9a5a', '#9b5de5'];

function cone(c: Ctx, x: number, z: number): void {
  ombre(c, x, z, 0.35);
  boite(c, x, 0, z, 0.55, 0.12, '#e05a10');
  boite(c, x, 0.1, z, 0.36, 0.3, '#ff7a2a');
  boite(c, x, 0.4, z, 0.26, 0.16, '#f2f2f2');
  boite(c, x, 0.56, z, 0.16, 0.26, '#ff7a2a');
}

function valise(c: Ctx, x: number, z: number, couleur: string): void {
  ombre(c, x, z, 0.45);
  pave(c, x, 0, z, z + 0.3, 0.75, 0.5, couleur, couleur, '#1a1a20');
  boite(c, x, 0.5, z, 0.3, 0.1, '#1a1a20'); // la poignée
  boite(c, x - 0.2, 0.15, z, 0.2, 0.12, '#f2f2f2'); // l'étiquette
}

function flaque(c: Ctx, x: number, z0: number, z1: number, tick: number): void {
  quad(
    c,
    [
      [x - 1.0, 0.01, z0],
      [x + 1.0, 0.01, z0],
      [x + 0.8, 0.01, z1],
      [x - 0.8, 0.01, z1],
    ],
    'rgba(20,20,30,0.6)',
  );
  // l'irisation du kérosène, qui bouge
  const reflets = ['#ff4fd8', '#4ff0ff', '#ffd23f'];
  for (let k = 0; k < 3; k++) {
    const z = z0 + ((z1 - z0) * (k + 1)) / 4;
    boite(c, x + Math.sin(tick / 9 + k) * 0.4, 0.01, z, 0.5, 0.02, reflets[(k + (tick >> 4)) % 3]!);
  }
}

/** Un agent de piste de dos, gilet orange, qui agite ses bâtons lumineux (et traverse les voies, pour certains). */
function agent(c: Ctx, x: number, z: number, tick: number): void {
  ombre(c, x, z, 0.4);
  boite(c, x - 0.15, 0, z, 0.2, 0.85, '#2a2a3a');
  boite(c, x + 0.15, 0, z, 0.2, 0.85, '#2a2a3a');
  boite(c, x, 0.8, z, 0.6, 0.7, '#ff7a1a');
  boite(c, x, 1.0, z, 0.6, 0.08, '#e8e8a0');
  boite(c, x, 1.25, z, 0.6, 0.08, '#e8e8a0');
  boite(c, x, 1.5, z, 0.36, 0.34, '#3a2a1a'); // la tête, de dos
  boite(c, x, 1.78, z, 0.4, 0.1, '#ffd23f'); // le casque antibruit
  const haut = tick % 24 < 12;
  for (const s of [-1, 1]) {
    const bx = x + s * 0.45;
    const h = haut === s > 0 ? 1.3 : 0.9;
    boite(c, bx, h, z, 0.14, 0.45, '#ff7a1a');
    boite(c, bx, h + 0.45, z, 0.1, 0.4, tick % 6 < 3 ? '#ff3a2a' : '#ffd23f');
  }
}

/** Un train de chariots à bagages (des valises de toutes les couleurs), le tracteur jaune devant. */
function chariots(c: Ctx, x: number, z0: number, z1: number, i: number): void {
  ombre(c, x, z0, 1.2);
  const n = 3;
  const long = (z1 - z0) / (n + 0.6);
  // du plus loin au plus près : le tracteur, puis les chariots
  pave(c, x, 0.2, z1 - long * 0.6, z1, 1.6, 1.1, '#ffd23f', '#e8c02a', '#c8a020');
  boite(c, x, 1.3, z1 - long * 0.6, 1.0, 0.7, '#2a3a50');
  for (let k = n - 1; k >= 0; k--) {
    const za = z0 + k * long;
    pave(c, x, 0.3, za, za + long * 0.85, 2.2, 0.2, '#4a4a52', '#5a5a62', '#3a3a42');
    for (let j = 0; j < 4; j++)
      pave(
        c,
        x - 0.8 + j * 0.53,
        0.5,
        za + 0.1,
        za + long * 0.7,
        0.46,
        0.6 + ((i + j + k) % 2) * 0.35,
        VALISES[(i + j + k) % VALISES.length]!,
        '#e8e8ec',
        '#1a1a20',
      );
    boite(c, x - 0.9, 0, za, 0.3, 0.32, '#1a1a1e');
    boite(c, x + 0.9, 0, za, 0.3, 0.32, '#1a1a1e');
  }
}

/** Le camion-escalier : son plateau, et l'escalier qui monte vers l'avant, jusqu'à hauteur de porte. */
function escalier(c: Ctx, x: number, z0: number, z1: number): void {
  ombre(c, x, z0, 1.2);
  pave(c, x, 0.3, z0, z1, 2.2, 0.8, '#e8e8ec', '#d8d8de', '#b8b8c0');
  const n = 7;
  for (let k = n - 1; k >= 0; k--) {
    const z = z0 + ((z1 - z0) * k) / n;
    boite(c, x, 1.1 + k * 0.32, z, 1.4, 0.32, k % 2 ? '#8a8a92' : '#a0a0a8');
  }
  boite(c, x - 0.75, 1.1, z0, 0.08, 2.6, '#ffd23f'); // les rampes
  boite(c, x + 0.75, 1.1, z0, 0.08, 2.6, '#ffd23f');
  boite(c, x - 0.9, 0, z0, 0.35, 0.4, '#1a1a1e');
  boite(c, x + 0.9, 0, z0, 0.35, 0.4, '#1a1a1e');
}

/** Le camion à tapis : par l'arrière, la rampe monte jusqu'au tapis qui défile, des valises dessus ; la cabine au bout. */
function convoyeur(c: Ctx, x: number, z0: number, z1: number, tick: number, i: number): void {
  const ht = HAUT_TAPIS * METRES_HAUT;
  const zr = z0 + RAMPE * METRES;
  ombre(c, x, z0, 1.3);
  pave(c, x, 1.2, z1 - 1.8, z1, 2.2, 1.4, '#ffd23f', '#e8c02a', '#c8a020'); // la cabine
  boite(c, x, 1.9, z1 - 1.8, 1.4, 0.55, '#2a3a50');
  pave(c, x, 0, zr, z1 - 1.8, 2.2, ht - 0.1, '#3a3a42', null, '#2a2a32'); // le châssis
  // le tapis : une bande sombre et ses rayures qui défilent vers nous
  quad(
    c,
    [
      [x - 0.9, ht, zr],
      [x + 0.9, ht, zr],
      [x + 0.9, ht, z1 - 1.8],
      [x - 0.9, ht, z1 - 1.8],
    ],
    '#2a2a2e',
  );
  for (let z = zr + ((tick * 0.08) % 1); z < z1 - 1.8; z += 1) boite(c, x, ht, z, 1.8, 0.03, '#4a4a52');
  for (let k = 0; k < 3; k++) {
    const z = zr + 1 + k * 2.2;
    if (z < z1 - 2.2)
      pave(
        c,
        x + (k % 2 ? 0.3 : -0.3),
        ht,
        z,
        z + 0.6,
        0.7,
        0.45,
        VALISES[(i + k) % 6]!,
        '#e8e8ec',
        '#1a1a20',
      );
  }
  // la rampe, par où l'on monte
  quad(
    c,
    [
      [x - 0.9, 0, z0],
      [x + 0.9, 0, z0],
      [x + 0.9, ht, zr],
      [x - 0.9, ht, zr],
    ],
    '#6a6a72',
  );
  for (let k = 1; k < 5; k++) {
    const z = z0 + ((zr - z0) * k) / 5;
    boite(c, x, (ht * k) / 5, z, 1.8, 0.03, '#ffd23f');
  }
}

/** Le portique de hauteur : deux montants rayés jaune et noir, la barre rouge et blanche à hauteur de poitrine. */
function portique(c: Ctx, x: number, z: number, tick: number): void {
  const bas = 1.05;
  for (const s of [-1.15, 1.15]) {
    ombre(c, x + s, z, 0.2);
    for (let k = 0; k < 5; k++) boite(c, x + s, k * 0.3, z, 0.14, 0.3, k % 2 ? '#1a1a1e' : '#ffd23f');
  }
  for (let k = 0; k < 6; k++)
    boite(c, x - 1.15 + k * 0.4 + 0.2, bas + 0.4, z, 0.4, 0.3, k % 2 ? '#f2f2f2' : '#d02a2a');
  boite(c, x, bas + 0.7, z, 0.9, 0.22, '#1a2440'); // le panneau « hauteur max »
  if (tick % 30 < 20) boite(c, x, bas + 0.76, z, 0.6, 0.08, '#ffd23f');
}

function carte(c: Ctx, x: number, h: number, z: number, tick: number, i: number): void {
  const lueur = 0.35 + 0.2 * Math.sin(tick / 5 + i);
  c.fillStyle = `rgba(255,214,63,${lueur.toFixed(2)})`;
  c.beginPath();
  c.arc(px(x, z), py(h + 0.6, z), 0.55 * ech(z), 0, Math.PI * 2);
  c.fill();
  const l = 0.8 * Math.max(0.15, Math.abs(Math.cos(tick / 10 + i)));
  boite(c, x, h + 0.4, z, l, 0.42, '#f4f4f6');
  if (l > 0.4) {
    boite(c, x - l * 0.25, h + 0.48, z, l * 0.35, 0.26, '#2a6fdb');
    boite(c, x + l * 0.2, h + 0.7, z, l * 0.35, 0.06, '#c81e2a');
  }
}

function bonus(c: Ctx, x: number, z: number, sorte: Parameters<typeof iconeBonus>[1], tick: number): void {
  const h = 0.9 + Math.sin(tick / 8) * 0.08;
  disque(c, x, h, z, 0.55, 'rgba(140,220,255,0.35)');
  c.strokeStyle = 'rgba(255,255,255,0.75)';
  c.lineWidth = 1;
  c.beginPath();
  c.arc(px(x, z), py(h, z), 0.55 * ech(z), 0, Math.PI * 2);
  c.stroke();
  // l'icône du bonus (dessinée à la taille du jeu de profil), mise à l'échelle de sa profondeur
  const k = Math.max(0.3, ech(z) / 16);
  c.save();
  c.translate(px(x, z), py(h, z));
  c.scale(k, k);
  iconeBonus(c, sorte, 0, 0);
  c.restore();
}

/** Un objet du tarmac vu de derrière, sur sa voie (x, en mètres), de z0 (près) à z1 (loin). */
export function objetDeDos(
  c: Ctx,
  o: Objet,
  i: number,
  x: number,
  z0: number,
  z1: number,
  tick: number,
): void {
  switch (o.sorte) {
    case 'cone':
      return cone(c, x, z0);
    case 'valise':
      return valise(c, x, z0, VALISES[i % VALISES.length]!);
    case 'flaque':
      return flaque(c, x, z0, z1, tick);
    case 'agent':
      return agent(c, x, z0, tick);
    case 'chariots':
      return chariots(c, x, z0, z1, i);
    case 'escalier':
      return escalier(c, x, z0, z1);
    case 'convoyeur':
      return convoyeur(c, x, z0, z1, tick, i);
    case 'portique':
      return portique(c, x, z0, tick);
    case 'carte':
      return carte(c, x, o.hauteur * METRES_HAUT, z0, tick, i);
    default:
      return bonus(c, x, z0, o.sorte, tick);
  }
}
