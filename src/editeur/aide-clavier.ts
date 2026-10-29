import type { Editeur } from './editeur';
import { element, fenetre } from './fenetre';

/**
 * L'aide de l'éditeur : toutes les touches du clavier et de la souris, et les gestes au doigt, pour qui hésite. Elle s'ouvre
 * depuis le menu de l'éditeur (« Aide : touches et gestes ») ou avec ? ou F1.
 */

const SECTIONS: readonly (readonly [string, readonly (readonly [string, string])[]])[] = [
  [
    'Les outils',
    [
      ['B', 'Pinceau : peint la case touchée avec ce qui est choisi'],
      ['R', 'Rectangle : remplit une zone, de coin à coin'],
      ['E', 'Gomme : efface (un poteau de tyrolienne, une case, un accessoire)'],
      ['I', 'Pipette : reprend ce qu’il y a sur la case touchée'],
      ['S', 'Sélection : encadre un morceau de carte pour le copier ou en faire un module'],
      ['H', 'Main : déplace la vue sans rien peindre'],
    ],
  ],
  [
    'Modifier',
    [
      ['Ctrl + Z', 'Annuler'],
      ['Ctrl + Maj + Z', 'Refaire'],
      ['Ctrl + Y', 'Refaire aussi'],
      ['Ctrl + C', 'Copier la sélection (elle reste dans Modules → Copie)'],
      ['Ctrl + V', 'Coller la copie : on touche la carte pour la poser'],
      ['Entrée', 'Appliquer le rognage de la carte (tirer les bords)'],
      ['Échap', 'Fermer la palette, le menu en rond, la sélection ou le rognage'],
    ],
  ],
  [
    'Se déplacer et zoomer',
    [
      ['← ↑ → ↓', 'Déplacer la vue'],
      ['+ et −', 'Zoomer et dézoomer'],
      ['Molette', 'Zoomer (sur un pavé tactile : faire défiler, ou pincer pour zoomer)'],
      ['Barre d’espace + glisser', 'Déplacer la vue (maintenir la barre d’espace)'],
      ['Clic droit + glisser', 'Déplacer la vue (le clic du milieu aussi)'],
    ],
  ],
  [
    'À la souris',
    [
      ['Clic gauche', 'Peindre avec l’outil choisi ; le survol montre ce qui sera posé'],
      ['Clic gauche + glisser', 'Tracer un trait (pinceau) ou une zone (rectangle, sélection)'],
      ['Appui long sur une vignette', 'Choisir l’apparence d’un accessoire (un appui court : au hasard)'],
    ],
  ],
  [
    'Au doigt',
    [
      ['Un doigt', 'Peindre avec l’outil choisi (ou déplacer la vue avec la main)'],
      ['Deux doigts', 'Déplacer et pincer pour zoomer'],
      ['Appui long sur la carte', 'Ouvrir le menu en rond : les outils autour du doigt'],
      ['Module ou accessoire', 'Il suit le doigt et se pose quand on le lève'],
    ],
  ],
  [
    'Ailleurs',
    [
      ['? ou F1', 'Ouvrir cette aide'],
      ['Menu (en haut)', 'Nouveau niveau, thème et taille, vérifier, exporter, importer, Mes modules…'],
    ],
  ],
];

export function aideClavier(ed: Editeur): void {
  const contenu = element('div', '', 'ed-aide-clavier');
  for (const [titre, lignes] of SECTIONS) {
    contenu.append(element('h4', titre));
    const grille = element('div', '', 'ed-touches');
    for (const [touche, explication] of lignes) {
      const t = element('span', '', 'ed-touche');
      for (const [i, partie] of touche.split(' + ').entries()) {
        if (i) t.append(' + ');
        t.append(element('kbd', partie));
      }
      grille.append(t, element('span', explication));
    }
    contenu.append(grille);
  }
  fenetre(ed, 'Aide : touches et gestes', contenu);
}
