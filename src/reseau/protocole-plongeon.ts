import { MAX_JOUEURS } from '../config';
import { ETAPES_PLONGEON, type VuePlongeon } from '../jeu/vue';

/** Le concours de plongeon dans l'instantané réseau (voir protocole.ts), à la suite des entités pendant la phase `plongeon`. */
export const OCTETS_PLONGEON = 15 + MAX_JOUEURS;

const i16 = (x: number) => Math.max(-32768, Math.min(32767, Math.round(x)));

/** Positions au centimètre, vent au centième, notes sur un octet (255 : pas encore sauté). */
export function encodePlongeon(d: DataView, o: number, v: VuePlongeon): void {
  d.setUint8(o++, ETAPES_PLONGEON.indexOf(v.etape));
  d.setUint8(o++, v.siege);
  d.setUint8(o++, v.manche & 255);
  d.setUint8(o++, v.miniJeu ? 1 : 0);
  d.setUint16(o, Math.max(0, Math.min(65535, v.minuteur)));
  o += 2;
  d.setInt16(o, i16(v.x * 100));
  o += 2;
  d.setInt16(o, i16(v.visee * 100));
  o += 2;
  d.setInt8(o++, Math.max(-100, Math.min(100, Math.round(v.vent * 100))));
  d.setUint8(o++, v.bras ? 1 : 0);
  d.setUint8(o++, v.zone);
  d.setUint8(o++, v.entree);
  d.setUint8(o++, Math.max(0, Math.min(100, v.score)));
  for (let s = 0; s < MAX_JOUEURS; s++) {
    const sc = v.scores[s];
    d.setUint8(o++, sc === null || sc === undefined ? 255 : Math.max(0, Math.min(100, sc)));
  }
}

export function decodePlongeon(d: DataView, o: number): VuePlongeon | null {
  const etape = ETAPES_PLONGEON[d.getUint8(o++)];
  if (!etape) return null;
  const siege = d.getUint8(o++) % MAX_JOUEURS;
  const manche = d.getUint8(o++);
  const miniJeu = d.getUint8(o++) === 1;
  const minuteur = d.getUint16(o);
  o += 2;
  const x = d.getInt16(o) / 100;
  o += 2;
  const visee = d.getInt16(o) / 100;
  o += 2;
  const vent = d.getInt8(o++) / 100;
  const bras = d.getUint8(o++) === 1;
  const zone = d.getUint8(o++) % 4;
  const entree = d.getUint8(o++) % 4;
  const score = Math.min(100, d.getUint8(o++));
  const scores: (number | null)[] = [];
  for (let s = 0; s < MAX_JOUEURS; s++) {
    const n = d.getUint8(o++);
    scores.push(n === 255 ? null : Math.min(100, n));
  }
  return { etape, siege, manche, miniJeu, minuteur, x, visee, vent, bras, zone, entree, score, scores };
}
