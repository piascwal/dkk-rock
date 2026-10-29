import { ACTIONS, MAX_TOUCHES, libelle, touches, type ActionTouche } from '../entrees/touches';
import { bouton, el } from './elements';

/**
 * L'écran « Touches du clavier » (Options, version ordinateur) : chaque action avec ses touches ; on touche une touche pour la
 * changer (puis on appuie sur la nouvelle ; Échap annule), « × » la retire, « + » en ajoute (trois au plus). Les changements sont
 * gardés tout de suite (touches.ts). Une touche déjà prise passe à la nouvelle action, sauf si l'autre n'en aurait plus aucune.
 */

/** Les touches ne servent que sur ordinateur : pas de page de touches sur un écran tactile sans souris. */
export const aUnClavier = (): boolean => matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Ce qui ne change pas : les touches du reste du jeu. */
const FIXES: readonly [string, string][] = [
  ['Entrée', 'Passer un écran, valider'],
  ['Espace ou Entrée', 'Choisir un niveau sur la carte du monde'],
  ['← → ↑ ↓', 'Se déplacer sur la carte du monde'],
];

export function contenuTouches(retour: () => void): HTMLElement[] {
  const liste = el('div', '', 'touches-liste');
  const message = el('p', '', 'statut');
  /** l'action et la place de la touche qu'on est en train de changer */
  let attente: { a: ActionTouche; i: number } | null = null;

  const ecoute = (e: KeyboardEvent) => {
    if (!attente) return;
    // avant tout le reste : ni le jeu ni les menus ne doivent voir cette touche
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.code === 'Escape') {
      attente = null;
      message.textContent = '';
    } else {
      const { a, i } = attente;
      const erreur = touches.affecte(a, i, e.code);
      message.textContent = erreur ?? '';
      if (!erreur) attente = null;
    }
    dessine();
  };
  window.addEventListener('keydown', ecoute, true);
  const quitte = (suite: () => void) => () => {
    window.removeEventListener('keydown', ecoute, true);
    suite();
  };

  const puce = (a: ActionTouche, i: number, code: string) => {
    const choisie = attente?.a === a && attente.i === i;
    const b = bouton(
      choisie ? 'Appuyez sur une touche…' : libelle(code),
      () => {
        attente = choisie ? null : { a, i };
        message.textContent = attente ? 'Échap pour annuler.' : '';
        dessine();
      },
      choisie ? 'touche touche-attente' : 'touche',
    );
    b.title = 'Changer cette touche';
    return b;
  };

  const dessine = () => {
    liste.replaceChildren();
    for (const { id, nom, aide } of ACTIONS) {
      const l = touches.liste(id);
      const ligne = el('div', '', 'touche-ligne');
      const texte = el('div', '', 'touche-nom');
      texte.append(el('strong', nom), el('span', aide, 'aide'));
      const puces = el('div', '', 'touche-puces');
      l.forEach((code, i) => {
        const groupe = el('span', '', 'touche-groupe');
        groupe.append(puce(id, i, code));
        if (l.length > 1) {
          const x = bouton('×', () => (touches.retire(id, i), (attente = null), dessine()), 'touche-retire');
          x.title = 'Retirer cette touche';
          x.setAttribute('aria-label', `Retirer ${libelle(code)}`);
          groupe.append(x);
        }
        puces.append(groupe);
      });
      if (l.length < MAX_TOUCHES) {
        const ajout = attente?.a === id && attente.i === l.length;
        puces.append(
          bouton(
            ajout ? 'Appuyez sur une touche…' : '+',
            () => {
              attente = ajout ? null : { a: id, i: l.length };
              message.textContent = attente ? 'Échap pour annuler.' : '';
              dessine();
            },
            ajout ? 'touche touche-attente' : 'touche touche-ajout',
          ),
        );
      }
      ligne.append(texte, puces);
      liste.append(ligne);
    }
    reinit.disabled = touches.estParDefaut();
  };

  const reinit = bouton('Touches par défaut', () => {
    attente = null;
    touches.reinitialise();
    message.textContent = 'Touches remises par défaut.';
    dessine();
  });
  dessine();

  const fixes = el('div', '', 'touches-fixes');
  for (const [t, d] of FIXES) {
    const f = el('span', '', 'touche-fixe');
    f.append(el('span', t, 'touche'), ' ', el('span', d, 'aide'));
    fixes.append(f);
  }
  return [
    el('h2', 'Touches du clavier'),
    el(
      'p',
      'Touchez une touche pour la changer. Chaque action peut en avoir jusqu’à trois. Les changements sont gardés.',
      'aide',
    ),
    liste,
    message,
    fixes,
    reinit,
    bouton('Retour', quitte(retour), 'principal'),
  ];
}
