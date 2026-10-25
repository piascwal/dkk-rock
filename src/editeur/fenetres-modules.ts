import type { Editeur } from './editeur';
import { bouton, demandeFichier, element, fenetre, nomDeFichier, offreFichier } from './fenetre';
import {
  ajouteModules,
  exporteModules,
  extraisModule,
  lisModules,
  modulesPerso,
  retireModule,
} from './modules-perso';
import type { ModuleEditeur } from './document';

/**
 * Les fenêtres des modules à soi : en faire un d'une sélection, les lister, les exporter (pour les envoyer à Claude, qui en fait des
 * pièces du générateur et des modules du jeu), en importer, en supprimer.
 */

const ENVOI =
  'Envoyez ce fichier à Claude pour en faire des modules du jeu : dites à quoi ils servent (une cave, un fort, un passage…) et dans quelles villes les mettre.';

/** Après la sélection d'un rectangle : on le nomme, et il rejoint « Mes modules » dans la palette. */
export function creeModule(ed: Editeur, rect: [number, number, number, number]): void {
  const m = extraisModule(ed.doc, rect, '');
  const nom = element('input');
  nom.placeholder = 'Nom du module (ex. : cave à deux étages)';
  nom.maxLength = 40;
  const taille = element(
    'p',
    `${m.lignes[0]!.length} × ${m.lignes.length} tuiles, posé par sa rangée de sol.`,
  );
  const ferme = fenetre(
    ed,
    'Créer un module',
    taille,
    nom,
    bouton(
      'creer',
      'Créer le module',
      () => {
        m.nom = nom.value.trim() || `Module ${modulesPerso().length + 1}`;
        ajouteModules([m]);
        ferme();
        const cree = modulesPerso()[0]!;
        ed.choisit({ famille: 'modules', cle: cree.id, nom: cree.nom, groupe: cree.famille });
        ed.palette.oublie();
        ed.dit(`« ${cree.nom} » est dans la palette (Modules → Mes modules).`);
      },
      'ed-large ed-principal',
    ),
  );
  setTimeout(() => nom.focus(), 0);
}

export function mesModules(ed: Editeur): void {
  const liste = element('div', '', 'ed-modules');
  const ferme = fenetre(
    ed,
    'Mes modules',
    element(
      'p',
      'Faites un module avec l’outil sélection (le carré en pointillés) : tracez un rectangle sur la carte, puis nommez-le.',
      'ed-aide',
    ),
    liste,
    bouton('exporter', 'Exporter tous mes modules', () => exporte(ed, modulesPerso(), 'mes-modules.json')),
    bouton('importer', 'Importer des modules', () => (ferme(), importe(ed))),
  );
  const remplit = () => {
    liste.replaceChildren();
    if (!modulesPerso().length) liste.append(element('p', 'Aucun module pour l’instant.', 'ed-aide'));
    for (const m of modulesPerso()) {
      const ligne = element('div', '', 'ed-module');
      ligne.append(
        bouton(null, `${m.nom} (${m.lignes[0]!.length} × ${m.lignes.length})`, () => {
          ferme();
          ed.choisit({ famille: 'modules', cle: m.id, nom: m.nom, groupe: m.famille });
        }),
        bouton('exporter', '', () => exporte(ed, [m], nomDeFichier(m.nom, 'module')), 'ed-bouton'),
        bouton(
          'supprimer',
          '',
          () => {
            if (!confirm(`Supprimer « ${m.nom} » ?`)) return;
            retireModule(m.id);
            ed.palette.oublie();
            remplit();
          },
          'ed-bouton',
        ),
      );
      ligne.children[1]!.setAttribute('title', 'Exporter ce module');
      ligne.children[2]!.setAttribute('title', 'Supprimer ce module');
      liste.append(ligne);
    }
  };
  remplit();
}

function exporte(ed: Editeur, modules: ModuleEditeur[], nomFichier: string): void {
  if (!modules.length) return ed.dit('Aucun module à exporter.', true);
  offreFichier(
    ed,
    modules.length > 1 ? 'Exporter mes modules' : `Exporter « ${modules[0]!.nom} »`,
    ENVOI,
    exporteModules(modules),
    nomFichier,
  );
}

function importe(ed: Editeur): void {
  demandeFichier(ed, 'Importer des modules', 'Ou collez ici le texte de modules exportés', (texte) => {
    const l = lisModules(texte);
    ajouteModules(l);
    ed.palette.oublie();
    ed.dit(`${l.length} module(s) ajouté(s) à la palette (Modules → Mes modules).`);
    return true;
  });
}
