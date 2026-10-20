import { VIES_DEPART } from '../config';
import { arcOuvertPar, suivantDansArc } from '../niveaux/arcs';
import { DRIFT_APRES } from './drift';
import { lanceDrift } from './drift-partie';
import type { Partie } from './partie';

/**
 * La page d'histoire est lue jusqu'au bout : on passe à la phase suivante (l'intro mène au jeu, les convertis au bilan, le bilan
 * à la carte du monde ou à l'épilogue, l'épilogue à la carte de l'arc suivant ; après une défaite, on reprend au drapeau).
 */
export function changePhase(p: Partie): void {
  if (p.phase === 'histoire') p.phase = 'jeu';
  else if (p.phase === 'convertis')
    p.phase = 'bilan'; // l'écran des convertis passé, place au récit
  else if (p.phase === 'bilan' && p.niveau === DRIFT_APRES) {
    // avant de partir pour de bon : un dernier petit kiff, le concours de drift dans le pré du Clos
    lanceDrift(p, false);
  } else if (p.phase === 'bilan') {
    if (suivantDansArc(p.niveau) !== null) {
      // le van roule vers le niveau suivant sur la carte du monde
      p.phase = 'carte';
      p.page = 0;
    } else p.phase = 'fin';
  } else if (p.phase === 'perdu') {
    p.vies = VIES_DEPART;
    p.charge(p.niveau, p.drapeau);
    p.phase = 'jeu';
  } else if (p.phase === 'fin' && arcOuvertPar(p.niveau) !== null) {
    // l'épilogue lu, la route continue vers l'arc suivant
    p.phase = 'carte';
    p.page = 0;
  }
}
