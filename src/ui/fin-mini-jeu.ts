import { C } from '../jeu/commandes';
import type { EtatVue } from '../jeu/vue';
import { el } from './elements';

/**
 * Le podium d'un mini-jeu joué dans l'histoire : deux boutons, « Réessayer » (rejoue la manche, comme BAS) et « Continuer »
 * (le niveau suivant, comme SAUT). Un clic envoie le bouton correspondant au lieu d'une touche : même chemin que le clavier et
 * le tactile, donc aussi chez un invité. Affichés d'après la seule vue (le podium, hors mini-jeu du menu).
 */
export class FinMiniJeu {
  readonly element: HTMLElement;
  /** le bouton cliqué, envoyé pendant trois images comme une touche tenue */
  private clic = { bits: 0, images: 0 };

  constructor(parent: HTMLElement) {
    this.element = el('div', '', 'fin-mini');
    this.element.hidden = true;
    this.element.append(this.bouton('Réessayer', C.BAS), this.bouton('Continuer', C.SAUT));
    parent.appendChild(this.element);
  }

  /** les commandes du bouton cliqué, s'il y en a un */
  get commandes(): number {
    if (this.clic.images === 0) return 0;
    this.clic.images--;
    return this.clic.bits;
  }

  maj(v: EtatVue): void {
    const c = v.drift ?? v.plongeon ?? v.reve ?? v.avion ?? v.kart;
    this.element.hidden = !(c && !c.miniJeu && c.etape === 'podium' && c.minuteur === 0);
  }

  private bouton(texte: string, bits: number): HTMLButtonElement {
    const b = el('button', texte, 'fin-bouton');
    b.addEventListener('click', () => (this.clic = { bits, images: 3 }));
    return b;
  }
}
