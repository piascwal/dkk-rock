import { COTE } from './bords-tuiles';
import { CONTOUR, D, N, type Pinceau, teinte } from './tuiles-hd-outils';

/**
 * L'échelle, la plateforme et le piton en haute définition (voir tuiles-hd.ts). Du bois un peu usé, pas trop parfait : peu de
 * relief (trois tons), un grain irrégulier ; de temps en temps une échelle a un barreau cassé, une planche est plus vieille. Le
 * piton (le pont incassable) a deux habits : une poutrelle d'acier rivetée en ville, un madrier cerclé de fer ailleurs.
 */

export interface Bois {
  clair: string;
  moyen: string;
  sombre: string;
}
export const BOIS: Bois = { clair: '#c99558', moyen: '#a06c35', sombre: '#6b4420' };
export const BOIS_SCELLE: Bois = { clair: '#ad7b42', moyen: '#87582a', sombre: '#573617' };
/** une échelle ou une planche plus vieille : le bois grisé */
export const BOIS_VIEUX: Bois = { clair: '#a99272', moyen: '#85704f', sombre: '#57472f' };

/** Une barre de bois horizontale : arête claire en haut, face, arête sombre en bas, contour. */
function barre(pi: Pinceau, x: number, y: number, w: number, h: number, b: Bois): void {
  pi.p(x, y, w, h, CONTOUR);
  pi.p(x + 1, y + 1, w - 2, h - 2, b.moyen);
  pi.p(x + 1, y + 1, w - 2, 1, b.clair);
  pi.p(x + 1, y + h - 2, w - 2, 1, b.sombre);
}

/** Un montant vertical : un côté clair, un côté sombre. */
function montant(pi: Pinceau, x: number, b: Bois): void {
  const w = 2 * D;
  pi.p(x, 0, w, N, CONTOUR);
  pi.p(x + 1, 0, w - 2, N, b.moyen);
  pi.p(x + 1, 0, 1, N, b.clair);
  pi.p(x + w - 2, 0, 1, N, b.sombre);
}

/**
 * L'échelle : deux montants, trois barreaux (pas tous exactement à la même hauteur) ; `casse` : un barreau rompu, il n'en reste
 * que deux moignons.
 */
export function echelle(pi: Pinceau, b: Bois, casse: number, graine: number): void {
  const hauts = [2, 7, 12].map((y, i) => y * D + ((graine >> i) & 1));
  hauts.forEach((y, i) => {
    if (i === casse) {
      // le barreau cassé : un moignon à chaque montant, l'un plus long que l'autre, bout déchiqueté
      barre(pi, 3 * D, y, 2 * D, 2 * D, b);
      barre(pi, 12 * D - 5, y, 5, 2 * D, b);
      pi.p(5 * D, y + 2, 2, 3, b.sombre);
      pi.p(5 * D + 2, y + 4, 2, 2, CONTOUR);
      return;
    }
    barre(pi, 3 * D, y, 10 * D, 2 * D, b);
  });
  montant(pi, 2 * D - 2, b);
  montant(pi, 12 * D, b);
  // le grain du bois sur les montants
  for (let i = 0; i < 6; i++) {
    const x = (i % 2 ? 12 * D : 2 * D - 2) + 3;
    const y = (graine * 7 + i * 11) % (N - 6);
    pi.p(x, y, 1, 4, b.sombre);
  }
}

/** La plateforme : une planche épaisse ; ses bouts arrondis là où elle s'arrête ; une console dessous, une tuile sur deux. */
export function planche(pi: Pinceau, cotes: number, b: Bois, console: boolean, graine: number): void {
  const g = (cotes & COTE.GAUCHE) !== 0;
  const d = (cotes & COTE.DROITE) !== 0;
  if (console) {
    // la console : un montant et sa jambe de force, en escalier
    pi.p(7 * D, 5 * D, 2 * D, 4 * D, CONTOUR);
    pi.p(7 * D + 1, 5 * D, 2 * D - 2, 4 * D - 1, b.sombre);
    for (let i = 0; i < 2 * D; i++) pi.p(9 * D, 5 * D + i, 2 * D - i, 1, i % 3 ? b.sombre : CONTOUR);
  }
  // l'ombre sous la planche
  pi.p(g ? 2 : 0, 5 * D, N - (g ? 2 : 0) - (d ? 2 : 0), 2, 'rgba(0,0,0,0.25)');
  barre(pi, -1, 0, N + 2, 5 * D, b);
  // le veinage, deux lignes qui ondulent, et un nœud
  for (const y of [2 * D, 3 * D + 1])
    for (let x = 2; x < N - 2; x += 6) pi.p(x + ((graine + y) % 4), y, 4, 1, b.sombre);
  pi.p(30 + (graine % 20), 2 * D - 1, 3, 2, b.sombre);
  // les clous
  for (const x of [5, N - 7]) {
    pi.p(x, 2 * D, 2, 2, CONTOUR);
    pi.p(x, 2 * D, 1, 1, '#c8b090');
  }
  // les bouts arrondis : deux paliers retirés aux quatre coins
  for (const [cote, x0] of [
    [g, 0],
    [d, N - 3],
  ] as const) {
    if (!cote) continue;
    const gauche = x0 === 0;
    pi.efface(gauche ? 0 : N - 3, 0, 3, 1);
    pi.efface(gauche ? 0 : N - 1, 1, 1, 2);
    pi.efface(gauche ? 0 : N - 3, 5 * D - 1, 3, 1);
    pi.efface(gauche ? 0 : N - 1, 5 * D - 3, 1, 2);
    pi.p(gauche ? 1 : N - 2, 2, 1, 5 * D - 5, CONTOUR);
  }
}

/** Le piton en ville : une poutrelle d'acier en I, rivetée ; ses bouts coupés droit, avec une plaque. */
export function poutrelle(pi: Pinceau, cotes: number): void {
  const g = (cotes & COTE.GAUCHE) !== 0;
  const d = (cotes & COTE.DROITE) !== 0;
  const x0 = g ? 1 : -1;
  const w = N + 2 - (g ? 2 : 0) - (d ? 2 : 0);
  pi.p(x0, 5 * D, w, 2, 'rgba(0,0,0,0.3)');
  // l'âme
  pi.p(x0, 2 * D, w, 2 * D, CONTOUR);
  pi.p(x0 + 1, 2 * D, w - 2, 2 * D, '#5b636c');
  // les deux ailes
  for (const y of [0, 4 * D]) {
    pi.p(x0, y, w, D + 1, CONTOUR);
    pi.p(x0 + 1, y + 1, w - 2, D - 1, '#8a949e');
    pi.p(x0 + 1, y + 1, w - 2, 1, '#bcc6cf');
  }
  // les rivets
  for (const x of [8, 32, 56]) {
    pi.p(x, 3 * D - 1, 3, 3, CONTOUR);
    pi.p(x, 3 * D - 1, 1, 1, '#c4ccd4');
  }
  // les bouts : une plaque soudée
  if (g) pi.p(0, 0, 3, 5 * D + 1, '#4a5058');
  if (d) pi.p(N - 3, 0, 3, 5 * D + 1, '#4a5058');
}

/** Le piton hors des villes : un madrier sombre, épais, cerclé de deux feuillards de fer boulonnés. */
export function madrier(pi: Pinceau, cotes: number, graine: number): void {
  const g = (cotes & COTE.GAUCHE) !== 0;
  const d = (cotes & COTE.DROITE) !== 0;
  const b: Bois = { clair: '#8a5f36', moyen: '#6a4524', sombre: '#432a14' };
  pi.p(g ? 2 : 0, 5 * D, N - (g ? 2 : 0) - (d ? 2 : 0), 2, 'rgba(0,0,0,0.3)');
  barre(pi, -1, 0, N + 2, 5 * D + 1, b);
  for (let x = 3; x < N - 3; x += 7) pi.p(x + (graine % 3), 2 * D + ((x >> 3) % 2), 5, 1, b.sombre);
  // les feuillards de fer et leurs boulons
  for (const x of [12, 44]) {
    pi.p(x, 0, 5, 5 * D + 1, CONTOUR);
    pi.p(x + 1, 1, 3, 5 * D - 1, teinte('#6b737b', 0));
    pi.p(x + 1, 1, 1, 5 * D - 1, '#9aa3ab');
    pi.p(x + 2, 2 * D, 2, 2, CONTOUR);
  }
  if (g) {
    pi.efface(0, 0, 2, 1);
    pi.efface(0, 5 * D, 2, 1);
  }
  if (d) {
    pi.efface(N - 2, 0, 2, 1);
    pi.efface(N - 2, 5 * D, 2, 1);
  }
}
