import { MAX_JOUEURS } from '../config';
import { ETAPES_AVION, OBJETS_RECENTS, type VueAvion } from '../jeu/vue-avion';

/** L'avion de JBG dans l'instantané réseau (voir protocole.ts), à la suite des entités pendant la phase `avion`. */
export const OCTETS_AVION = 26 + 2 * OBJETS_RECENTS + 2 * MAX_JOUEURS;

const u8 = (x: number) => Math.max(0, Math.min(255, Math.round(x)));
const u16 = (x: number) => Math.max(0, Math.min(65535, Math.round(x)));

/** La distance au quart de pixel, la voie au cinquantième, la hauteur du saut au quart, les derniers objets pris, les scores. */
export function encodeAvion(d: DataView, o: number, v: VueAvion): void {
  for (const n of [ETAPES_AVION.indexOf(v.etape), v.siege, v.manche & 255, v.miniJeu ? 1 : 0])
    d.setUint8(o++, n);
  for (const n of [v.minuteur, v.temps, v.x * 4, v.bonusReste, v.cartes, v.score]) {
    d.setUint16(o, u16(n));
    o += 2;
  }
  for (const n of [v.voie, v.voieVue * 50, v.z * 4, v.trebuche, v.invulnerable, v.bonus + 1, v.chutes])
    d.setUint8(o++, u8(n));
  d.setUint8(o++, (v.surTapis ? 1 : 0) | (v.embarque ? 2 : 0));
  const n = Math.min(OBJETS_RECENTS, v.consommes.length);
  d.setUint8(o++, n);
  for (let i = 0; i < OBJETS_RECENTS; i++) {
    d.setUint16(o, i < n ? u16(v.consommes[v.consommes.length - n + i]!) : 0);
    o += 2;
  }
  for (let s = 0; s < MAX_JOUEURS; s++) {
    const sc = v.scores[s];
    d.setUint16(o, sc === null || sc === undefined ? 65535 : u16(Math.min(65534, sc)));
    o += 2;
  }
}

export function decodeAvion(d: DataView, o: number): VueAvion | null {
  const etape = ETAPES_AVION[d.getUint8(o)];
  if (!etape) return null;
  const siege = d.getUint8(o + 1) % MAX_JOUEURS;
  const manche = d.getUint8(o + 2);
  const miniJeu = d.getUint8(o + 3) === 1;
  o += 4;
  const [minuteur, temps, x4, bonusReste, cartes, score] = [0, 1, 2, 3, 4, 5].map((k) =>
    d.getUint16(o + 2 * k),
  ) as [number, number, number, number, number, number];
  o += 12;
  const [voie, voie50, z4, trebuche, invulnerable, bonus1, chutes, drapeaux] = [0, 1, 2, 3, 4, 5, 6, 7].map(
    (k) => d.getUint8(o + k),
  ) as [number, number, number, number, number, number, number, number];
  o += 8;
  const n = Math.min(OBJETS_RECENTS, d.getUint8(o++));
  const consommes: number[] = [];
  for (let i = 0; i < OBJETS_RECENTS; i++) {
    if (i < n) consommes.push(d.getUint16(o));
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
    temps,
    x: x4 / 4,
    voie: Math.min(2, voie),
    voieVue: voie50 / 50,
    z: z4 / 4,
    surTapis: (drapeaux & 1) !== 0,
    trebuche,
    invulnerable,
    bonus: bonus1 - 1,
    bonusReste,
    cartes,
    chutes,
    embarque: (drapeaux & 2) !== 0,
    score,
    consommes,
    scores,
  };
}
