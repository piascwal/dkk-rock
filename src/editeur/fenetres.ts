import { NIVEAUX } from '../niveaux';
import { THEMES, type NomTheme } from '../rendu/themes';
import { DocumentNiveau, TAILLE_MAX, TAILLE_MIN } from './document';
import type { Editeur } from './editeur';
import { bouton, demandeFichier, element, fenetre, nomDeFichier, offreFichier } from './fenetre';
import { mesModules } from './fenetres-modules';
import { conseilArene, enregistre, mesNiveauxEditeur } from './fenetres-niveaux';

/**
 * Les fenêtres du menu de l'éditeur : un nouveau niveau, partir d'un niveau du jeu, le nom, le thème et la taille, vérifier le
 * parcours, exporter (partager, télécharger, copier) et importer ; les modules à soi sont dans fenetres-modules.ts.
 */

const NOMS_THEMES: Record<NomTheme, string> = {
  garage: 'Le garage',
  montagne: 'Les alpages',
  neige: 'Les cimes enneigées',
  plage: 'La plage',
  ville: 'La ville la nuit',
  club: 'Le club',
  foret: 'La forêt bretonne',
  port: 'Le port',
  groix: 'Groix',
  mer: 'En mer',
  fise: 'Le FISE',
  stc: 'Saint-Cézaire',
  tuves: 'Les Tuves',
  beauvais: 'Beauvais',
  limerick: 'Limerick',
  lund: 'Lund',
  newyork: 'New York',
  marseille: 'Marseille',
  ottawa: 'Ottawa',
};

const remplacer = () => confirm('Le niveau en cours sera remplacé (pensez à l’exporter avant). Continuer ?');

export function menuPrincipal(ed: Editeur): void {
  const ferme = fenetre(
    ed,
    'Éditeur de niveau',
    bouton('nouveau', 'Nouveau niveau (page blanche)', () => {
      if (!remplacer()) return;
      ferme();
      ed.remplace(DocumentNiveau.vierge(160, 40, ed.doc.theme));
    }),
    bouton('ouvrir', 'Partir d’un niveau du jeu', () => (ferme(), choisitNiveau(ed))),
    bouton('reglages', 'Nom, thème et taille', () => (ferme(), reglages(ed))),
    bouton('verifier', 'Vérifier le parcours', () => {
      ferme();
      const v = ed.doc.verifie();
      ed.dit([v.message, conseilArene(ed)].filter(Boolean).join(' '), !v.ok);
    }),
    bouton('enregistrer', 'Enregistrer dans Mes niveaux', () => (ferme(), enregistre(ed))),
    bouton('bibliotheque', 'Mes niveaux', () => (ferme(), mesNiveauxEditeur(ed))),
    bouton('exporter', 'Exporter le niveau', () => (ferme(), exporte(ed))),
    bouton('importer', 'Importer un niveau', () => (ferme(), importe(ed))),
    bouton('modules', 'Mes modules', () => (ferme(), mesModules(ed))),
    element(
      'p',
      'Un doigt peint, deux doigts déplacent et zooment. À la souris : clic droit ou barre d’espace pour déplacer, molette pour zoomer. L’outil sélection (le carré en pointillés) fait un module réutilisable d’un morceau de carte.',
      'ed-aide',
    ),
    bouton('quitter', 'Quitter l’éditeur', () => {
      ferme();
      ed.ferme();
      ed.actions.quitte();
    }),
  );
}

function choisitNiveau(ed: Editeur): void {
  const liste = element('div', '', 'ed-liste');
  const ferme = fenetre(ed, 'Partir d’un niveau du jeu', liste);
  for (const def of NIVEAUX) {
    if (def.miniJeu || def.id.startsWith('essai-')) continue;
    liste.append(
      bouton(null, def.titre, () => {
        if (!remplacer()) return;
        ferme();
        ed.remplace(DocumentNiveau.depuisNiveau(def));
        ed.dit(`« ${def.titre} » : modifiez-le, puis exportez-le.`);
      }),
    );
  }
}

function reglages(ed: Editeur): void {
  const d = ed.doc;
  const nom = element('input');
  nom.value = d.nom;
  nom.maxLength = 40;
  const theme = element('select');
  for (const t of Object.keys(THEMES) as NomTheme[]) {
    const o = element('option', NOMS_THEMES[t]);
    o.value = t;
    o.selected = t === d.theme;
    theme.append(o);
  }
  const nombre = (v: number, min: number, max: number) => {
    const i = element('input');
    Object.assign(i, { type: 'number', min: String(min), max: String(max), value: String(v) });
    return i;
  };
  const largeur = nombre(d.largeur, TAILLE_MIN[0], TAILLE_MAX[0]);
  const hauteur = nombre(d.hauteur, TAILLE_MIN[1], TAILLE_MAX[1]);
  const champ = (texte: string, e: HTMLElement) => {
    const l = element('label', texte, 'ed-champ');
    l.append(e);
    return l;
  };
  const ferme = fenetre(
    ed,
    'Nom, thème et taille',
    champ('Nom', nom),
    champ('Thème (le ciel, les textures, les gens du coin)', theme),
    champ('Largeur (en tuiles)', largeur),
    champ('Hauteur (en tuiles : les rangées s’ajoutent en haut)', hauteur),
    bouton(
      'verifier',
      'Appliquer',
      () => {
        d.nom = nom.value.trim() || d.nom;
        d.theme = theme.value as NomTheme;
        d.commence();
        d.redimensionne(Number(largeur.value), Number(hauteur.value));
        d.termine();
        ferme();
        ed.choisit(ed.choix);
        d.onChange();
      },
      'ed-large ed-principal',
    ),
  );
}

function exporte(ed: Editeur): void {
  const j = ed.doc.versJSON();
  const depart = j.depart ? NIVEAUX.find((n) => n.id === j.depart)?.titre : null;
  offreFichier(
    ed,
    'Exporter le niveau',
    depart
      ? `Ce niveau part de « ${depart} ». Envoyez ce fichier à Claude en disant s’il remplace « ${depart} » ou s’il devient un nouveau niveau (et où le mettre).`
      : 'Envoyez ce fichier à Claude pour l’ajouter au jeu : comme nouveau niveau (dites où le mettre), ou à la place d’un niveau existant.',
    j,
    nomDeFichier(j.nom, 'niveau'),
  );
}

function importe(ed: Editeur): void {
  demandeFichier(ed, 'Importer un niveau', 'Ou collez ici le texte d’un niveau exporté', (texte) => {
    const doc = DocumentNiveau.depuisJSON(texte);
    if (!remplacer()) return false;
    ed.remplace(doc);
    ed.dit(`« ${doc.nom} » importé.`);
    return true;
  });
}
