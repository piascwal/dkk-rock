import { NIVEAUX } from '../niveaux';
import { NOUVEAUTES, NOUVEAUTE_DU_NIVEAU } from '../niveaux/nouveautes';
import { refonteEnEssai, versionDe } from '../niveaux/refontes';
import { bouton, el } from './elements';
import type { Actions, Menus } from './menus';

/**
 * Le mode essai (voir ui/essai.ts) : chaque niveau refait, pas encore publié, se joue dans sa version d'avant et dans sa version
 * refaite, sans rien sauvegarder (comme l'essai d'un niveau de l'éditeur) ; à la fin, on revient ici.
 */
export function ecranRefontes(m: Menus, a: Actions): void {
  const liste = el('div', '', 'boutons-menu');
  for (const def of NIVEAUX.filter((d) => refonteEnEssai(d.id))) {
    // la nouveauté du niveau (voir niveaux/nouveautes.ts)
    const quoi = NOUVEAUTES.find((n) => n.genre === NOUVEAUTE_DU_NIVEAU[def.id])?.nom;
    const retour = () => ecranRefontes(m, a);
    liste.append(
      bouton(`${def.titre} : avant`, () => a.teste(def, retour)),
      bouton(
        `${def.titre} : ${quoi ? `avec ${quoi.toLowerCase()}` : 'après'}`,
        () => a.teste(versionDe(def, true), retour),
        'principal',
      ),
    );
  }
  m.montre(
    el('h2', 'Niveaux refaits'),
    el(
      'p',
      'Chaque niveau dans sa version publiée (« avant ») et dans sa version à l’essai, avec sa nouveauté. Rien n’est sauvegardé.',
      'aide',
    ),
    liste.childElementCount
      ? liste
      : el('p', 'Aucun niveau en essai pour l’instant : tous sont publiés.', 'aide'),
    bouton('Retour', () => m.titre()),
  );
}
