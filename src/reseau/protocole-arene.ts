import { MAX_JOUEURS } from '../config';
import { ETAPES_ARENE, type VueArene } from '../jeu/arene';

/** Le battle royale dans l'instantané réseau (voir protocole.ts), à la suite des entités quand la partie en est un. */
export const OCTETS_ARENE = 4 + 3 * MAX_JOUEURS;

export function encodeArene(d: DataView, o: number, v: VueArene): void {
  d.setUint8(o++, ETAPES_ARENE.indexOf(v.etape));
  d.setUint8(o++, v.ennemis ? 1 : 0);
  d.setUint16(o, Math.max(0, Math.min(65535, Math.round(v.minuteur))));
  o += 2;
  for (const l of [v.vies, v.eliminations, v.rangs])
    for (let s = 0; s < MAX_JOUEURS; s++) d.setUint8(o++, Math.max(0, Math.min(255, l[s] ?? 0)));
}

export function decodeArene(d: DataView, o: number): VueArene | null {
  const etape = ETAPES_ARENE[d.getUint8(o++)];
  if (!etape) return null;
  const ennemis = d.getUint8(o++) === 1;
  const minuteur = d.getUint16(o);
  o += 2;
  const liste = () => Array.from({ length: MAX_JOUEURS }, () => d.getUint8(o++));
  return { etape, ennemis, minuteur, vies: liste(), eliminations: liste(), rangs: liste() };
}
