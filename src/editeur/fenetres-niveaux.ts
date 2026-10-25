import { joueursConseilles } from '../jeu/arene';
import { litNiveau } from '../niveaux/format';
import { enregistreNiveau, mesNiveaux, retireNiveau } from '../niveaux/mes-niveaux';
import { DocumentNiveau } from './document';
import type { Editeur } from './editeur';
import { bouton, element, fenetre } from './fenetre';

/**
 * « Mes niveaux » depuis l'éditeur : enregistrer le niveau en cours dans le navigateur (pour le jouer ensuite en battle royale,
 * seul contre l'ordinateur ou en ligne), rouvrir un niveau enregistré, en supprimer.
 */

/** Pour combien de joueurs, en battle royale (null si le niveau ne se lit pas encore). */
export function conseilArene(ed: Editeur): string | null {
  try {
    const [min, max] = joueursConseilles(litNiveau(ed.doc.versDef('conseil')));
    return `Battle royale : carte pour ${min === max ? min : `${min} à ${max}`} joueurs.`;
  } catch {
    return null;
  }
}

export function enregistre(ed: Editeur): void {
  const def = ed.doc.versDef('enregistre');
  try {
    litNiveau(def);
  } catch (e) {
    return ed.dit(`Pas encore jouable : ${(e as Error).message.replace(/^enregistre : /, '')}`, true);
  }
  const nom = ed.doc.nom;
  if (mesNiveaux().some((n) => n.nom === nom) && !confirm(`Remplacer « ${nom} » dans Mes niveaux ?`)) return;
  enregistreNiveau(nom, def, ed.doc.versJSON());
  ed.dit(`« ${nom} » est dans Mes niveaux : jouez-le en battle royale (menu principal).`);
}

export function mesNiveauxEditeur(ed: Editeur): void {
  const liste = element('div', '', 'ed-modules');
  const ferme = fenetre(
    ed,
    'Mes niveaux',
    element(
      'p',
      'Les niveaux enregistrés dans ce navigateur : ils se jouent en battle royale (menu principal), seul contre l’ordinateur ou en ligne.',
      'ed-aide',
    ),
    liste,
    bouton('enregistrer', 'Enregistrer le niveau en cours', () => {
      enregistre(ed);
      remplit();
    }),
  );
  const remplit = () => {
    liste.replaceChildren();
    if (!mesNiveaux().length)
      liste.append(element('p', 'Aucun niveau enregistré pour l’instant.', 'ed-aide'));
    for (const n of mesNiveaux()) {
      const ligne = element('div', '', 'ed-module');
      const ouvre = bouton('ouvrir', n.nom, () => {
        if (!confirm('Le niveau en cours sera remplacé (pensez à l’enregistrer avant). Continuer ?')) return;
        try {
          ed.remplace(DocumentNiveau.depuisJSON(JSON.stringify(n.source)));
          ferme();
          ed.dit(`« ${n.nom} » ouvert.`);
        } catch (e) {
          ed.dit((e as Error).message, true);
        }
      });
      const supprime = bouton(
        'supprimer',
        '',
        () => {
          if (!confirm(`Supprimer « ${n.nom} » de Mes niveaux ?`)) return;
          retireNiveau(n.id);
          remplit();
        },
        'ed-bouton',
      );
      supprime.title = 'Supprimer ce niveau';
      ligne.append(ouvre, supprime);
      liste.append(ligne);
    }
  };
  remplit();
}
