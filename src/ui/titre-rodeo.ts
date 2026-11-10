import type { Batterie } from './titre-batterie';
import { saute, type Acteur, type Scene } from './titre-physique';

/**
 * Le numéro de JBM pendant le spectacle de la batterie (titre-concert.ts) : Fadatchi le rejoint à sa place, JBM monte en selle
 * (le kiwi quitte la scène : il est dans l'image de JBM, `jbm-kiwi`, outils/prepare-jbm-kiwi.py) et attend, les mains sur les
 * cuisses. Quand JBT s'emballe : rodéo ! Au sol, il tient la selle ; en l'air, un bras levé, ou carrément décollé du kiwi. En
 * selle, le logo ne l'arrête pas (il passe devant). À la fin, ou s'il est attrapé au doigt, le kiwi reprend sa place à côté.
 */

/** Les poses de `jbm-kiwi`. */
const [ATTEND, SELLE, BRAS, DECOLLE] = [0, 1, 2, 3];
const hasard = (a: number, b: number) => a + Math.random() * (b - a);

export interface Rodeo {
  /** l'image du saut en cours (un bras levé, puis décollé au saut suivant, et ainsi de suite), et le temps du dernier saut */
  enLair: number;
  temps: number;
}

export const nouveauRodeo = (): Rodeo => ({ enLair: DECOLLE, temps: -1 });

/** Il descend de Fadatchi : le kiwi revient sur la scène, à côté de lui. */
export function descend(jbm: Acteur, kiwi: Acteur | undefined, s: Scene): void {
  jbm.fantome = false;
  if (jbm.pose === 'jbm-kiwi') jbm.pose = null;
  if (kiwi?.etat !== 'monture') return;
  [kiwi.etat, kiwi.x, kiwi.y, kiwi.vx, kiwi.vy] = [
    'air',
    jbm.x + jbm.dir * s.hh * 0.45,
    Math.min(jbm.y, s.sol),
    0,
    0,
  ];
  [kiwi.tx, kiwi.objectif, kiwi.minuteur] = [null, null, 1];
}

/**
 * JBM à sa place (ou déjà en selle, en l'air compris) : il monte sur le kiwi s'il est là, puis fait son numéro. Faux s'il n'est pas
 * en selle (le kiwi n'est pas arrivé) : il fait comme avant.
 */
export function rodeo(r: Rodeo, b: Batterie, s: Scene, jbm: Acteur, kiwi: Acteur | undefined): boolean {
  if (!kiwi) return false;
  if (kiwi.etat !== 'monture') {
    const ensemble =
      jbm.etat === 'sol' &&
      kiwi.etat === 'sol' &&
      jbm.y > s.sol - 2 &&
      Math.abs(kiwi.y - jbm.y) < 2 &&
      Math.abs(kiwi.x - jbm.x) < s.hh * 0.45;
    if (!ensemble) return false;
    [kiwi.etat, kiwi.tx, kiwi.objectif] = ['monture', null, null];
  }
  if (jbm.etat !== 'sol' && jbm.etat !== 'air') {
    // attrapé au doigt : il lâche le kiwi
    descend(jbm, kiwi, s);
    return false;
  }
  [jbm.fantome, jbm.pose] = [true, 'jbm-kiwi'];
  if (jbm.etat === 'air') {
    jbm.poseLigne = r.enLair;
    return true;
  }
  // au sol : il attend assis, les pieds par terre et les mains sur les cuisses ; dès que JBT s'emballe (quand Mat et Tom montent
  // sur leur estrade), il retombe les deux mains sur la selle et rebondit, un saut tous les deux temps de la musique
  jbm.poseLigne = b.etape >= 1 ? SELLE : ATTEND;
  if (b.etape >= 1 && b.temps % 2 === 0 && b.temps !== r.temps) {
    r.temps = b.temps;
    // le logo ne l'arrête pas ; en l'air, tour à tour un bras levé et décollé du kiwi
    saute(s, jbm, hasard(0.9, 1.3), 0);
    r.enLair = r.enLair === BRAS ? DECOLLE : BRAS;
  }
  return true;
}
