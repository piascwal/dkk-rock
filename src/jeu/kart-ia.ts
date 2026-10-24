import type { Aleatoire } from '../moteur/maths';
import { surTrace, virage } from './kart-piste';
import { BONUS_KART, type CommandesKart, type VoitureKart } from './kart-voiture';

/**
 * Les pilotes de l'ordinateur : chacun vise un point devant lui sur la piste (sur sa trajectoire, un peu à droite ou à gauche du
 * milieu), lève le pied avant les virages serrés, et lance ses bonus à bon escient. Chacun a son caractère : JBM roule propre,
 * Tom freine tard, JBG change de trajectoire sans arrêt, Mat colle à la corde, JBT est régulier.
 */

/** Par pilote : la vitesse à laquelle il aborde un virage serré (px/s), et l'écart de trajectoire qu'il se permet. */
const CARACTERES: readonly { virage: number; ecart: number }[] = [
  { virage: 150, ecart: 10 },
  { virage: 140, ecart: 6 },
  { virage: 155, ecart: 18 },
  { virage: 150, ecart: 4 },
  { virage: 175, ecart: 12 },
];

export interface EtatIA {
  /** l'écart au milieu de la piste qu'il vise, et dans combien de pas il en change */
  couloir: number;
  change: number;
}

export const nouvelleIA = (): EtatIA => ({ couloir: 0, change: 0 });

/** Les commandes d'un pilote de l'ordinateur pour ce pas, et le bonus qu'il lance (vrai : il le lance). */
export function piloteIA(
  v: VoitureKart,
  ia: EtatIA,
  autres: readonly VoitureKart[],
  rng: Aleatoire,
): { k: CommandesKart; lance: boolean } {
  const c = CARACTERES[v.pilote]!;
  if (--ia.change <= 0) {
    ia.couloir = rng.entre(-c.ecart, c.ecart);
    ia.change = rng.entier(60, 180);
  }
  const vise = surTrace(v.i + 22 + v.vitesse / 12, ia.couloir);
  const cible = Math.atan2(vise.y - v.y, vise.x - v.x);
  const ecart = Math.atan2(Math.sin(cible - v.a), Math.cos(cible - v.a));
  const serre = Math.abs(virage(v.i + 10, 70));
  const vitesseVirage = serre > 0.9 ? c.virage : serre > 0.5 ? c.virage + 40 : Infinity;
  const k: CommandesKart = {
    gauche: ecart < -0.06,
    droite: ecart > 0.06,
    gaz: v.vitesse < vitesseVirage,
    frein: v.vitesse > vitesseVirage + 30,
  };
  return { k, lance: v.bonus >= 0 && veutLancer(v, autres, serre, rng) };
}

function veutLancer(v: VoitureKart, autres: readonly VoitureKart[], serre: number, rng: Aleatoire): boolean {
  const devant = autres.some((o) => o !== v && !o.elimine && o.avance > v.avance && o.avance - v.avance < 70);
  const derriere = autres.some(
    (o) => o !== v && !o.elimine && o.avance < v.avance && v.avance - o.avance < 60,
  );
  switch (BONUS_KART[v.bonus]) {
    case 'turbo':
      return serre < 0.3;
    case 'marteau':
      return devant;
    case 'huile':
      return derriere;
    case 'bouclier':
      return true;
    default:
      return rng.suivant() < 0.01;
  }
}
