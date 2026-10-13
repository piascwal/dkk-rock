import { pagesDe } from '../histoire/pages';
import type { EtatVue } from '../jeu/vue';
import { NIVEAUX } from '../niveaux';
import type { Qui } from '../niveaux/format';
import { COULEURS, NOMS, portrait } from './portraits';

const QUIS = new Set(Object.keys(NOMS));
const estQui = (q: string): q is Qui => QUIS.has(q);

/** Remplit un élément « portrait + nom + réplique », sans jamais interpréter le texte comme du HTML. */
function replique(el: HTMLElement, qui: Qui, texte: string): void {
  el.replaceChildren();
  el.style.setProperty('--couleur', COULEURS[qui]);
  const img = document.createElement('img');
  img.className = 'portrait';
  img.src = portrait(qui);
  img.alt = '';
  const p = document.createElement('div');
  const nom = document.createElement('strong');
  nom.textContent = NOMS[qui];
  p.append(nom, texte);
  el.append(img, p);
}

/** Les répliques pendant le jeu : une à la fois, en bas de l'écran, sans arrêter l'action. */
export class Bulles {
  private file: { qui: Qui; texte: string }[] = [];
  private finA = 0;

  constructor(private readonly element: HTMLElement) {}

  ajoute(qui: string, texte: string): void {
    if (!estQui(qui) || typeof texte !== 'string') return;
    // une file trop longue (beaucoup de morts d'affilée) : on garde les plus récentes
    if (this.file.length > 6) this.file.shift();
    this.file.push({ qui, texte: texte.slice(0, 300) });
  }

  vide(): void {
    this.file = [];
    this.finA = 0;
    this.element.hidden = true;
  }

  maj(maintenant: number): void {
    if (maintenant < this.finA) return;
    const r = this.file.shift();
    if (!r) {
      this.element.hidden = true;
      return;
    }
    replique(this.element, r.qui, r.texte);
    this.element.hidden = false;
    this.finA = maintenant + Math.max(2200, r.texte.length * 48);
  }
}

/** Les cartes d'histoire (intro, fin de niveau, épilogue, défaite) : la page vient de la vue, identique chez tous. */
export class Histoire {
  private cle = '';

  constructor(
    private readonly element: HTMLElement,
    private readonly suivant: () => void,
  ) {
    element.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.suivant();
    });
  }

  maj(v: EtatVue): void {
    if (v.phase === 'jeu') {
      this.element.hidden = true;
      this.cle = '';
      return;
    }
    if (v.phase === 'carte') {
      // la carte du monde se dessine dans le canvas : juste de quoi passer le trajet
      if (this.cle === `carte-${v.niveau}`) return;
      this.cle = `carte-${v.niveau}`;
      const suite = document.createElement('p');
      suite.className = 'suite';
      suite.textContent = 'Touchez l’écran ou appuyez sur Entrée pour passer';
      this.element.replaceChildren(suite);
      this.element.classList.add('carte');
      this.element.hidden = false;
      return;
    }
    this.element.classList.remove('carte');
    const cle = `${v.phase}-${v.niveau}-${v.page}`;
    if (cle === this.cle) return;
    this.cle = cle;
    const pages = pagesDe(v.phase, v.niveau);
    const r = pages[v.page];
    const def = NIVEAUX[v.niveau];
    this.element.replaceChildren();
    const titre = document.createElement('h1');
    titre.className = 'titre-niveau';
    titre.textContent =
      v.phase === 'histoire'
        ? (def?.titre ?? '')
        : v.phase === 'bilan'
          ? 'Niveau terminé !'
          : v.phase === 'fin'
            ? 'Rock never dies'
            : 'Séparation';
    const sous = document.createElement('p');
    sous.textContent =
      v.phase === 'histoire'
        ? (def?.sousTitre ?? '')
        : v.phase === 'bilan'
          ? `Score : ${v.score.toLocaleString('fr-FR')}`
          : '';
    this.element.append(titre, sous);
    if (r) {
      const bloc = document.createElement('div');
      bloc.className = 'replique';
      replique(bloc, r.qui, r.texte);
      this.element.append(bloc);
    }
    const suite = document.createElement('p');
    suite.className = 'suite';
    suite.textContent = `${v.page + 1}/${pages.length} — touchez l’écran ou appuyez sur Entrée`;
    this.element.append(suite);
    this.element.hidden = false;
  }
}
