import { NIVEAUX } from '../niveaux';
import { REFONTES, refonteEnEssai, versionDe } from '../niveaux/refontes';
import { bouton, el } from './elements';
import type { Actions, Menus } from './menus';

/**
 * Le mode essai (voir ui/essai.ts) : chaque niveau refait, pas encore publié, se joue dans sa version d'avant et dans sa version
 * refaite, sans rien sauvegarder (comme l'essai d'un niveau de l'éditeur) ; à la fin, on revient ici.
 */
export function ecranRefontes(m: Menus, a: Actions): void {
  const liste = el('div', '', 'boutons-menu');
  for (const def of NIVEAUX.filter((d) => d.id in REFONTES && refonteEnEssai(d.id))) {
    const retour = () => ecranRefontes(m, a);
    liste.append(
      bouton(`${def.titre} : avant`, () => a.teste(def, retour)),
      bouton(`${def.titre} : après`, () => a.teste(versionDe(def, true), retour), 'principal'),
    );
  }
  m.montre(
    el('h2', 'Niveaux refaits'),
    el(
      'p',
      'Chaque niveau dans sa version d’avant et dans sa version refaite. Rien n’est sauvegardé.',
      'aide',
    ),
    liste,
    bouton('Retour', () => m.titre()),
  );
}
