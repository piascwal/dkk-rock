import type { Editeur } from './editeur';
import { icone, type NomIcone } from './icones';

/** De quoi faire les fenêtres de l'éditeur : un élément, un bouton (à icône), une fenêtre, et l'envoi d'un fichier exporté. */

export const element = <K extends keyof HTMLElementTagNameMap>(tag: K, texte = '', classe = '') => {
  const e = document.createElement(tag);
  if (texte) e.textContent = texte;
  if (classe) e.className = classe;
  return e;
};

export const bouton = (nom: NomIcone | null, texte: string, action: () => void, classe = 'ed-large') => {
  const b = element('button', '', classe);
  if (nom) b.append(icone(nom));
  b.append(texte);
  b.addEventListener('click', action);
  return b;
};

/** Une fenêtre par-dessus l'éditeur ; renvoie de quoi la fermer. */
export function fenetre(ed: Editeur, titre: string, ...enfants: HTMLElement[]): () => void {
  const fond = element('div', '', 'ed-fenetre-fond');
  const f = element('div', '', 'ed-fenetre');
  const ferme = () => fond.remove();
  f.append(element('h3', titre), ...enfants, bouton('fermer', 'Fermer', ferme, 'ed-large ed-discret'));
  fond.append(f);
  fond.addEventListener('pointerdown', (e) => e.target === fond && ferme());
  ed.racine.append(fond);
  return ferme;
}

/** Un nom de fichier tiré d'un nom (sans accents ni espaces). */
export const nomDeFichier = (nom: string, defaut: string): string =>
  `${
    nom
      .normalize('NFD')
      .replace(/[^\w]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || defaut
  }.json`;

/** La fenêtre d'un export : partager (sur mobile), télécharger, copier, et le texte lui-même. */
export function offreFichier(
  ed: Editeur,
  titre: string,
  explication: string,
  objet: unknown,
  nomFichier: string,
): void {
  const texte = JSON.stringify(objet, null, 2);
  const fichier = new File([texte], nomFichier, { type: 'application/json' });
  const zone = element('textarea', '', 'ed-texte');
  zone.value = texte;
  zone.readOnly = true;
  const actions: HTMLElement[] = [];
  if (navigator.canShare?.({ files: [fichier] }))
    actions.push(
      bouton(
        'exporter',
        'Partager…',
        () => void navigator.share({ files: [fichier], title: titre }).catch(() => {}),
        'ed-large ed-principal',
      ),
    );
  actions.push(
    bouton('telecharger', 'Télécharger le fichier', () => {
      const a = element('a');
      a.href = URL.createObjectURL(fichier);
      a.download = nomFichier;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    }),
    bouton('copier', 'Copier le texte', () => {
      navigator.clipboard
        .writeText(texte)
        .then(() => ed.dit('Copié : collez-le dans la conversation.'))
        .catch(() => {
          zone.select();
          ed.dit('Sélectionné : copiez-le à la main.', true);
        });
    }),
  );
  fenetre(ed, titre, element('p', explication), ...actions, zone);
}

/** La fenêtre d'un import : un fichier à choisir, ou un texte à coller ; `charge` lève une erreur lisible si ça ne va pas. */
export function demandeFichier(
  ed: Editeur,
  titre: string,
  aide: string,
  charge: (texte: string) => boolean,
): void {
  const choix = element('input');
  choix.type = 'file';
  choix.accept = '.json,application/json';
  const zone = element('textarea', '', 'ed-texte');
  zone.placeholder = aide;
  const essaie = (texte: string) => {
    try {
      if (charge(texte)) ferme();
    } catch (e) {
      ed.dit(
        e instanceof SyntaxError ? 'Ce texte n’est pas un export de l’éditeur.' : (e as Error).message,
        true,
      );
    }
  };
  choix.addEventListener('change', () => void choix.files?.[0]?.text().then(essaie));
  const ferme = fenetre(
    ed,
    titre,
    choix,
    zone,
    bouton('importer', 'Importer le texte collé', () => essaie(zone.value), 'ed-large ed-principal'),
  );
}
