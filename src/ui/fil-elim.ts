import { COULEURS_SIEGES } from '../rendu/indicateurs';
import type { Evenement } from '../jeu/vue';
import { el } from './elements';
import { nomArene } from './noms-arene';

/**
 * Le fil des éliminations du battle royale, en haut à droite, façon jeu de tir : « A a éliminé B », ou « B s'est éliminé tout
 * seul ». Chaque nom a la couleur de son siège ; les plus anciennes lignes s'effacent, et nous-même ressortons en jaune.
 */

const DUREE_MS = 6000;
const LIGNES_MAX = 5;

export class FilElimination {
  private readonly element = el('div', '', 'fil-elim');

  constructor(parent: HTMLElement) {
    this.element.setAttribute('aria-live', 'polite');
    parent.append(this.element);
  }

  /** Une élimination reçue de la partie ; `noms` : les pseudos du salon, par siège. */
  ajoute(e: Extract<Evenement, { k: 'elim' }>, noms: readonly string[], siegeLocal: number): void {
    const entier = (n: unknown) =>
      Number.isInteger(n) && (n as number) >= 0 && (n as number) < 8 ? (n as number) : -1;
    const victime = entier(e.victime);
    if (victime < 0) return;
    const tueur = entier(e.tueur);
    const nom = (s: number) => {
      const b = el('b', nomArene(noms, s));
      b.style.color = COULEURS_SIEGES[s % COULEURS_SIEGES.length]!;
      if (s === siegeLocal) b.classList.add('moi');
      return b;
    };
    const ligne = el('div', '', 'fil-ligne');
    if (tueur < 0 || tueur === victime) ligne.append(nom(victime), ' s’est éliminé tout seul');
    else ligne.append(nom(tueur), ' a éliminé ', nom(victime));
    this.element.append(ligne);
    while (this.element.childElementCount > LIGNES_MAX) this.element.firstElementChild?.remove();
    setTimeout(() => ligne.remove(), DUREE_MS);
  }

  /** On change de partie : le fil se vide. */
  vide(): void {
    this.element.replaceChildren();
  }
}
