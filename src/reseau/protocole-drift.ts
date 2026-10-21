import { MAX_JOUEURS } from '../config';
import { ETAPES_DRIFT, type VueDrift } from '../jeu/vue';

/** Le concours de drift dans l'instantané réseau (voir protocole.ts), à la suite des entités pendant la phase `drift`. */
export const OCTETS_DRIFT = 17 + MAX_JOUEURS * 3;

const u16 = (x: number) => Math.max(0, Math.min(65535, Math.round(x)));
const TOUR = 2 * Math.PI;

/** Le concours de drift : positions au centimètre, cap sur deux octets, pourcentages au centième. */
export function encodeDrift(d: DataView, o: number, v: VueDrift): void {
  d.setUint8(o++, ETAPES_DRIFT.indexOf(v.etape));
  d.setUint8(o++, v.siege);
  d.setUint8(o++, v.pilote);
  d.setUint8(o++, v.manche & 255);
  d.setUint8(o++, v.miniJeu ? 1 : 0);
  for (const x of [v.minuteur, v.x * 100, v.y * 100, (((v.cap % TOUR) + TOUR) % TOUR) * (65536 / TOUR)]) {
    d.setUint16(o, u16(x) & 0xffff);
    o += 2;
  }
  d.setUint8(o++, Math.min(255, Math.round(v.vitesse * 10)));
  d.setUint8(o++, v.griffe);
  d.setUint16(o, u16(v.pourcent * 100));
  o += 2;
  for (let s = 0; s < MAX_JOUEURS; s++) {
    const sc = v.scores[s];
    d.setUint8(o++, sc ? sc.pilote : 255);
    d.setUint16(o, sc ? u16(sc.pourcent * 100) : 0);
    o += 2;
  }
}

export function decodeDrift(d: DataView, o: number): VueDrift | null {
  const etape = ETAPES_DRIFT[d.getUint8(o++)];
  if (!etape) return null;
  const siege = d.getUint8(o++) % MAX_JOUEURS;
  const pilote = d.getUint8(o++) % 2;
  const manche = d.getUint8(o++);
  const miniJeu = d.getUint8(o++) === 1;
  const lus: number[] = [];
  for (let k = 0; k < 4; k++) {
    lus.push(d.getUint16(o));
    o += 2;
  }
  const vitesse = d.getUint8(o++) / 10;
  const griffe = d.getUint8(o++) % 4;
  const pourcent = d.getUint16(o) / 100;
  o += 2;
  const scores: VueDrift['scores'] = [];
  for (let s = 0; s < MAX_JOUEURS; s++) {
    const p = d.getUint8(o++);
    const pc = d.getUint16(o) / 100;
    o += 2;
    scores.push(p === 255 ? null : { pilote: p % 2, pourcent: pc });
  }
  const [minuteur, x, y, cap] = lus as [number, number, number, number];
  return {
    etape,
    siege,
    pilote,
    manche,
    miniJeu,
    minuteur,
    x: x / 100,
    y: y / 100,
    cap: (cap / 65536) * TOUR,
    vitesse,
    griffe,
    pourcent,
    scores,
  };
}
