import { MAX_JOUEURS } from '../config';
import { ETAPES_ARENE, type VueArene } from '../jeu/arene';

/** Le battle royale dans l'instantané réseau (voir protocole.ts), à la suite des entités quand la partie en est un. */
export const OCTETS_ARENE = 8 + 3 * MAX_JOUEURS;

const u16 = (x: number) => Math.max(0, Math.min(65535, Math.round(x)));

export function encodeArene(d: DataView, o: number, v: VueArene): void {
  d.setUint8(o++, ETAPES_ARENE.indexOf(v.etape));
  d.setUint8(o++, v.ennemis ? 1 : 0);
  for (const n of [v.minuteur, v.zone[0], v.zone[1]]) {
    d.setUint16(o, u16(n));
    o += 2;
  }
  for (const l of [v.vies, v.eliminations, v.rangs])
    for (let s = 0; s < MAX_JOUEURS; s++) d.setUint8(o++, Math.max(0, Math.min(255, l[s] ?? 0)));
}

export function decodeArene(d: DataView, o: number): VueArene | null {
  const etape = ETAPES_ARENE[d.getUint8(o++)];
  if (!etape) return null;
  const ennemis = d.getUint8(o++) === 1;
  const u = () => {
    const x = d.getUint16(o);
    o += 2;
    return x;
  };
  const minuteur = u();
  const zone: [number, number] = [u(), u()];
  const liste = () => Array.from({ length: MAX_JOUEURS }, () => d.getUint8(o++));
  return { etape, ennemis, minuteur, zone, vies: liste(), eliminations: liste(), rangs: liste() };
}
