import { MAX_JOUEURS } from '../config';
import { ETAPES_KART, FLAQUES_MAX, type VueKart } from '../jeu/vue-kart';

/** Le Grand Prix de la Sarré dans l'instantané réseau (voir protocole.ts), à la suite des entités pendant la phase `kart`. */
const VOITURES_MAX = 5;
const OCTETS_VOITURE = 17;
export const OCTETS_KART =
  16 + VOITURES_MAX * OCTETS_VOITURE + 1 + 3 * MAX_JOUEURS + 1 + 4 * FLAQUES_MAX + 1 + VOITURES_MAX;

const u8 = (x: number) => Math.max(0, Math.min(255, Math.round(x)));
const u16 = (x: number) => Math.max(0, Math.min(65535, Math.round(x)));
const TOUR = Math.PI * 2;

/** Les positions au huitième de pixel du monde, les caps sur 256 pas ; tout le reste sur un octet (ou deux pour le temps). */
export function encodeKart(d: DataView, o: number, v: VueKart): void {
  const b = (x: number) => d.setUint8(o++, u8(x));
  const w = (x: number) => {
    d.setUint16(o, u16(x));
    o += 2;
  };
  b(ETAPES_KART.indexOf(v.etape));
  w(v.minuteur);
  w(v.temps);
  b((v.miniJeu ? 1 : 0) | (v.multi ? 2 : 0));
  w(v.camX * 8);
  w(v.camY * 8);
  b(v.gagnant + 1);
  w(v.caisses);
  b(Math.min(VOITURES_MAX, v.voitures.length));
  for (let k = 0; k < VOITURES_MAX; k++) {
    const c = v.voitures[k];
    if (!c) {
      o += OCTETS_VOITURE;
      continue;
    }
    b(c.pilote);
    b(c.siege + 1);
    w(c.x * 8);
    w(c.y * 8);
    b(((((c.a / TOUR) % 1) + 1) % 1) * 256);
    b(c.bonus + 1);
    b(c.effets);
    b(c.tour);
    b(c.place);
    b(c.points);
    w((v.arrivees[k] ?? -1) + 1);
    b(c.saut);
    b(c.ecrase);
    b(c.cogne);
  }
  b(Math.min(MAX_JOUEURS, v.choix.length));
  for (let k = 0; k < MAX_JOUEURS; k++) {
    const c = v.choix[k];
    b(c ? c.siege : 0);
    b(c ? c.pilote : 0);
    b(c?.valide ? 1 : 0);
  }
  b(Math.min(FLAQUES_MAX, v.flaques.length));
  for (let k = 0; k < FLAQUES_MAX; k++) {
    const f = v.flaques[k];
    w(f ? f.x * 8 : 0);
    w(f ? f.y * 8 : 0);
  }
  b(Math.min(VOITURES_MAX, v.classement.length));
  for (let k = 0; k < VOITURES_MAX; k++) b(v.classement[k] ?? 0);
}

export function decodeKart(d: DataView, o: number): VueKart | null {
  const b = () => d.getUint8(o++);
  const w = () => {
    const x = d.getUint16(o);
    o += 2;
    return x;
  };
  const etape = ETAPES_KART[b()];
  if (!etape) return null;
  const minuteur = w();
  const temps = w();
  const drapeaux = b();
  const camX = w() / 8;
  const camY = w() / 8;
  const gagnant = b() - 1;
  const caisses = w();
  const nv = Math.min(VOITURES_MAX, b());
  const voitures: VueKart['voitures'] = [];
  const arrivees: number[] = [];
  for (let k = 0; k < VOITURES_MAX; k++) {
    const debut = o;
    if (k < nv) {
      const pilote = b() % 5;
      const siege = b() - 1;
      const x = w() / 8;
      const y = w() / 8;
      const a = (b() / 256) * TOUR;
      const bonus = b() - 1;
      const effets = b();
      const tour = b();
      const place = b();
      const points = b();
      arrivees.push(w() - 1);
      const [saut, ecrase, cogne] = [b(), b(), b()];
      voitures.push({ pilote, siege, x, y, a, bonus, effets, tour, place, points, saut, ecrase, cogne });
    }
    o = debut + OCTETS_VOITURE;
  }
  const nc = Math.min(MAX_JOUEURS, b());
  const choix: VueKart['choix'] = [];
  for (let k = 0; k < MAX_JOUEURS; k++) {
    const siege = b() % MAX_JOUEURS;
    const pilote = b() % 5;
    const valide = b() === 1;
    if (k < nc) choix.push({ siege, pilote, valide });
  }
  const nf = Math.min(FLAQUES_MAX, b());
  const flaques: VueKart['flaques'] = [];
  for (let k = 0; k < FLAQUES_MAX; k++) {
    const x = w() / 8;
    const y = w() / 8;
    if (k < nf) flaques.push({ x, y });
  }
  const ncl = Math.min(VOITURES_MAX, b());
  const classement: number[] = [];
  for (let k = 0; k < VOITURES_MAX; k++) {
    const c = b();
    if (k < ncl) classement.push(c % VOITURES_MAX);
  }
  return {
    etape,
    minuteur,
    temps,
    miniJeu: (drapeaux & 1) !== 0,
    multi: (drapeaux & 2) !== 0,
    camX,
    camY,
    voitures,
    choix,
    flaques,
    caisses,
    gagnant,
    arrivees,
    classement,
  };
}
