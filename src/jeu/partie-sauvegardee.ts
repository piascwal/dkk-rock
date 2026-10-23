import { Partie } from './partie';
import type { Progression, Sauvegarde } from './sauvegarde';
import { carnetDe } from './sibylles';

/**
 * Une partie (l'histoire, sur l'appareil hôte) qui tient la sauvegarde à jour : la partie en cours à chaque drapeau, les niveaux
 * terminés, et les cartes Sibylle des fontaines trouvées (celles-là, dès qu'elles sont prises).
 */
export function partieSauvegardee(prog: Progression, s: Sauvegarde, enregistre: () => void): Partie {
  const p = new Partie(prog, carnetDe(s, enregistre));
  p.onProgression = (suite, fini, niveauFini) => {
    s.enCours = suite;
    if (fini && niveauFini !== undefined && !s.faits.includes(niveauFini)) s.faits.push(niveauFini);
    enregistre();
  };
  return p;
}
