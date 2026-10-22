import { MAX_JOUEURS } from '../config';
import { ETAPES_REVE, PILES_RECENTES, type VueReve } from '../jeu/vue-reve';

/** Le rêve de JBT dans l'instantané réseau (voir protocole.ts), à la suite des entités pendant la phase `reve`. */
export const OCTETS_REVE = 20 + 2 * PILES_RECENTES + 2 * MAX_JOUEURS;

const i16 = (x: number) => Math.max(-32768, Math.min(32767, Math.round(x)));
const u16 = (x: number) => Math.max(0, Math.min(65535, Math.round(x)));
const u8 = (x: number) => Math.max(0, Math.min(255, Math.round(x)));

/** La distance au quart de pixel, la hauteur et la vitesse au dixième, les dernières piles ramassées, les scores (65535 : pas encore volé). */
export function encodeReve(d: DataView, o: number, v: VueReve): void {
  d.setUint8(o++, ETAPES_REVE.indexOf(v.etape));
  d.setUint8(o++, v.siege);
  d.setUint8(o++, v.manche & 255);
  d.setUint8(o++, v.miniJeu ? 1 : 0);
  for (const n of [v.minuteur, v.distance * 4]) {
    d.setUint16(o, u16(n));
    o += 2;
  }
  for (const n of [v.y * 10, v.vy * 10]) {
    d.setInt16(o, i16(n));
    o += 2;
  }
  d.setUint8(o++, (v.pousse ? 1 : 0) | (v.plante ? 2 : 0));
  d.setUint8(o++, u8(v.vies));
  d.setUint8(o++, u8(v.invulnerable));
  for (const n of [v.piles, v.score]) {
    d.setUint16(o, u16(n));
    o += 2;
  }
  const n = Math.min(PILES_RECENTES, v.collectees.length);
  d.setUint8(o++, n);
  for (let i = 0; i < PILES_RECENTES; i++) {
    d.setUint16(o, i < n ? u16(v.collectees[v.collectees.length - n + i]!) : 0);
    o += 2;
  }
  for (let s = 0; s < MAX_JOUEURS; s++) {
    const sc = v.scores[s];
    d.setUint16(o, sc === null || sc === undefined ? 65535 : u16(Math.min(65534, sc)));
    o += 2;
  }
}

export function decodeReve(d: DataView, o: number): VueReve | null {
  const etape = ETAPES_REVE[d.getUint8(o++)];
  if (!etape) return null;
  const siege = d.getUint8(o++) % MAX_JOUEURS;
  const manche = d.getUint8(o++);
  const miniJeu = d.getUint8(o++) === 1;
  const minuteur = d.getUint16(o);
  const distance = d.getUint16(o + 2) / 4;
  const y = d.getInt16(o + 4) / 10;
  const vy = d.getInt16(o + 6) / 10;
  o += 8;
  const drapeaux = d.getUint8(o++);
  const vies = d.getUint8(o++);
  const invulnerable = d.getUint8(o++);
  const piles = d.getUint16(o);
  const score = d.getUint16(o + 2);
  o += 4;
  const n = Math.min(PILES_RECENTES, d.getUint8(o++));
  const collectees: number[] = [];
  for (let i = 0; i < PILES_RECENTES; i++) {
    if (i < n) collectees.push(d.getUint16(o));
    o += 2;
  }
  const scores: (number | null)[] = [];
  for (let s = 0; s < MAX_JOUEURS; s++) {
    const sc = d.getUint16(o);
    o += 2;
    scores.push(sc === 65535 ? null : sc);
  }
  return {
    etape,
    siege,
    manche,
    miniJeu,
    minuteur,
    distance,
    y,
    vy,
    pousse: (drapeaux & 1) !== 0,
    plante: (drapeaux & 2) !== 0,
    vies,
    invulnerable,
    piles,
    collectees,
    score,
    scores,
  };
}
