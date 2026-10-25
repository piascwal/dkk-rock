import { NIVEAUX } from '../niveaux';
import { THEMES, type NomTheme } from '../rendu/themes';
import { DocumentNiveau, TAILLE_MAX, TAILLE_MIN } from './document';
import type { Editeur } from './editeur';

/**
 * Les fenêtres du menu de l'éditeur : un nouveau niveau, partir d'un niveau du jeu, le nom, le thème et la taille, vérifier le
 * parcours, exporter (partager, télécharger, copier) et importer.
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

const element = <K extends keyof HTMLElementTagNameMap>(tag: K, texte = '', classe = '') => {
  const e = document.createElement(tag);
  if (texte) e.textContent = texte;
  if (classe) e.className = classe;
  return e;
};

const bouton = (texte: string, action: () => void, classe = 'ed-large') => {
  const b = element('button', texte, classe);
  b.addEventListener('click', action);
  return b;
};

/** Une fenêtre par-dessus l'éditeur ; renvoie de quoi la fermer. */
function fenetre(ed: Editeur, titre: string, ...enfants: HTMLElement[]): () => void {
  const fond = element('div', '', 'ed-fenetre-fond');
  const f = element('div', '', 'ed-fenetre');
  const ferme = () => fond.remove();
  f.append(element('h3', titre), ...enfants, bouton('Fermer', ferme, 'ed-large ed-discret'));
  fond.append(f);
  fond.addEventListener('pointerdown', (e) => e.target === fond && ferme());
  ed.racine.append(fond);
  return ferme;
}

const remplacer = () => confirm('Le niveau en cours sera remplacé (pensez à l’exporter avant). Continuer ?');

export function menuPrincipal(ed: Editeur): void {
  const ferme = fenetre(
    ed,
    'Éditeur de niveau',
    bouton('Nouveau niveau (page blanche)', () => {
      if (!remplacer()) return;
      ferme();
      ed.remplace(DocumentNiveau.vierge(160, 40, ed.doc.theme));
    }),
    bouton('Partir d’un niveau du jeu', () => (ferme(), choisitNiveau(ed))),
    bouton('Nom, thème et taille', () => (ferme(), reglages(ed))),
    bouton('Vérifier le parcours', () => {
      ferme();
      const v = ed.doc.verifie();
      ed.dit(v.message, !v.ok);
    }),
    bouton('Exporter', () => (ferme(), exporte(ed))),
    bouton('Importer un fichier', () => (ferme(), importe(ed))),
    element(
      'p',
      'Un doigt peint, deux doigts déplacent et zooment. À la souris : clic droit ou barre d’espace pour déplacer, molette pour zoomer.',
      'ed-aide',
    ),
    bouton('Quitter l’éditeur', () => {
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
      bouton(def.titre, () => {
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
  const texte = JSON.stringify(j, null, 2);
  const nomFichier = `${
    j.nom
      .normalize('NFD')
      .replace(/[^\w]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'niveau'
  }.json`;
  const fichier = new File([texte], nomFichier, { type: 'application/json' });
  const depart = j.depart ? NIVEAUX.find((n) => n.id === j.depart)?.titre : null;
  const zone = element('textarea', '', 'ed-texte');
  zone.value = texte;
  zone.readOnly = true;
  const actions: HTMLElement[] = [];
  if (navigator.canShare?.({ files: [fichier] }))
    actions.push(
      bouton(
        'Partager…',
        () => void navigator.share({ files: [fichier], title: j.nom }).catch(() => {}),
        'ed-large ed-principal',
      ),
    );
  actions.push(
    bouton('Télécharger le fichier', () => {
      const a = element('a');
      a.href = URL.createObjectURL(fichier);
      a.download = nomFichier;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    }),
    bouton('Copier le texte', () => {
      navigator.clipboard
        .writeText(texte)
        .then(() => ed.dit('Copié : collez-le dans la conversation.'))
        .catch(() => {
          zone.select();
          ed.dit('Sélectionné : copiez-le à la main.', true);
        });
    }),
  );
  fenetre(
    ed,
    'Exporter',
    element(
      'p',
      depart
        ? `Ce niveau part de « ${depart} ». Envoyez ce fichier à Claude en disant s’il remplace « ${depart} » ou s’il devient un nouveau niveau (et où le mettre).`
        : 'Envoyez ce fichier à Claude pour l’ajouter au jeu : comme nouveau niveau (dites où le mettre), ou à la place d’un niveau existant.',
    ),
    ...actions,
    zone,
  );
}

function importe(ed: Editeur): void {
  const choix = element('input');
  choix.type = 'file';
  choix.accept = '.json,application/json';
  const zone = element('textarea', '', 'ed-texte');
  zone.placeholder = 'Ou collez ici le texte d’un niveau exporté';
  const charge = (texte: string) => {
    try {
      const doc = DocumentNiveau.depuisJSON(texte);
      if (!remplacer()) return;
      ferme();
      ed.remplace(doc);
      ed.dit(`« ${doc.nom} » importé.`);
    } catch (e) {
      ed.dit(e instanceof SyntaxError ? 'Ce texte n’est pas un niveau exporté.' : (e as Error).message, true);
    }
  };
  choix.addEventListener('change', () => void choix.files?.[0]?.text().then(charge));
  const ferme = fenetre(
    ed,
    'Importer',
    choix,
    zone,
    bouton('Importer le texte collé', () => charge(zone.value), 'ed-large ed-principal'),
  );
}
