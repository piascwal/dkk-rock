import { pagesDe } from '../histoire/pages';
import { PHASES_MINI_JEUX } from '../jeu/mini-jeux';
import type { EtatVue } from '../jeu/vue';
import { NIVEAUX } from '../niveaux';
import type { Qui } from '../niveaux/format';
import { VERSION } from '../version';
import { Convertis } from './convertis';
import { PileDePhotos } from './pile-photos';
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

/**
 * Les répliques pendant le jeu : une à la fois, en bas de l'écran, sans arrêter l'action. Chacune reste assez longtemps pour
 * être lue : au moins 4 secondes, et environ 80 ms par caractère (une lecture posée, pas au pas de course).
 */
const DUREE_MIN_MS = 4000;
const MS_PAR_CARACTERE = 80;
const FILE_MAX = 10;

export class Bulles {
  private file: { qui: Qui; texte: string }[] = [];
  private finA = 0;

  constructor(private readonly element: HTMLElement) {}

  ajoute(qui: string, texte: string): void {
    if (!estQui(qui) || typeof texte !== 'string') return;
    // une file trop longue (beaucoup de morts d'affilée) : on garde les plus récentes
    if (this.file.length >= FILE_MAX) this.file.shift();
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
    this.finA = maintenant + Math.max(DUREE_MIN_MS, r.texte.length * MS_PAR_CARACTERE);
  }
}

/** Les cartes d'histoire (intro, fin de niveau, épilogue, défaite) : la page vient de la vue, identique chez tous. */
export class Histoire {
  private cle = '';

  /** La pile de photos de la page en cours, s'il y en a une : chaque toucher en pose une avant de passer à la suite. */
  private pile: PileDePhotos | null = null;

  private readonly convertis: Convertis;

  /** Le bouton « passer » de l'intro : il saute toutes les pages restantes d'un coup. */
  private readonly passer = document.createElement('button');

  constructor(
    private readonly element: HTMLElement,
    private readonly suivant: () => void,
    son: (nom: string) => void = () => {},
  ) {
    this.convertis = new Convertis(son);
    this.passer.type = 'button';
    this.passer.className = 'passer-histoire';
    this.passer.textContent = 'Passer ▸▸';
    element.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      // l'écran des convertis : un premier toucher finit le comptage, le suivant passe à la suite
      if (this.convertis.enCours) this.convertis.termine();
      else this.suivant();
    });
  }

  /** Saute les pages restantes de l'intro : autant de « suivant » qu'il en reste, la dernière lance le jeu. */
  private passeTout(v: EtatVue): void {
    this.pile = null; // on passe tout : plus de photo à attendre
    const restantes = pagesDe(v.phase, v.niveau).length - v.page;
    for (let i = 0; i < restantes; i++) this.suivant();
  }

  /** Un toucher qui sert à poser la photo suivante de la pile (true) plutôt qu'à passer la page. */
  retient(): boolean {
    return this.pile?.enAttente === true && this.pile.pose();
  }

  maj(v: EtatVue): void {
    if (v.phase === 'jeu' || PHASES_MINI_JEUX.has(v.phase)) {
      this.element.hidden = true;
      this.cle = '';
      this.convertis.arrete();
      return;
    }
    if (v.phase === 'convertis') {
      if (this.cle === `convertis-${v.niveau}`) return;
      this.cle = `convertis-${v.niveau}`;
      this.element.classList.remove('carte');
      this.convertis.affiche(this.element, v.convertis, v.temps, v.score, v.sibylles);
      this.element.hidden = false;
      return;
    }
    this.convertis.arrete();
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
    const cle = `${v.phase}-${v.niveau}-${v.page}`;
    if (cle === this.cle) return;
    this.cle = cle;
    this.element.classList.remove('carte', 'avec-image', 'plein', 'pile');
    this.pile = null;
    const pages = pagesDe(v.phase, v.niveau);
    const r = pages[v.page];
    const def = NIVEAUX[v.niveau];
    this.element.replaceChildren();
    // l'illustration en cours : la dernière image donnée par une page jusqu'ici (une image vide l'efface)
    const image = pages
      .slice(0, v.page + 1)
      .reduce<string>((courante, page) => (page.image !== undefined ? page.image : courante), '');
    if (r?.photos?.length && r.texte === '') {
      // une pile de photos : elles tombent l'une après l'autre, en plein écran
      this.element.classList.add('pile');
      const suite = document.createElement('p');
      suite.className = 'suite';
      suite.textContent = `${v.page + 1}/${pages.length} — touchez l’écran ou appuyez sur Entrée`;
      this.pile = new PileDePhotos(r.photos);
      this.element.append(this.pile.element, suite);
      this.ajoutePasser(v);
      this.element.hidden = false;
      return;
    }
    if (r && image) {
      // une page illustrée : l'image en grand, puis le dialogue, sans le titre du niveau
      this.element.classList.add('avec-image');
      const scene = document.createElement('img');
      scene.className = 'scene';
      scene.alt = '';
      // une petite image en pixels reste nette ; une grande, réduite à l'écran, est lissée (sinon elle crépite)
      scene.onload = () => scene.classList.toggle('nette', scene.naturalWidth <= 600);
      scene.src = `${import.meta.env.BASE_URL}sprites/${image}?v=${VERSION}`;
      const suite = document.createElement('p');
      suite.className = 'suite';
      suite.textContent = `${v.page + 1}/${pages.length} — touchez l’écran ou appuyez sur Entrée`;
      if (r.texte === '') {
        // une page sans texte : l'illustration seule, en plein écran
        this.element.classList.add('plein');
        this.element.append(scene, suite);
      } else {
        const bloc = document.createElement('div');
        bloc.className = 'replique';
        replique(bloc, r.qui, r.texte);
        this.element.append(scene, bloc, suite);
      }
      this.ajoutePasser(v);
      this.element.hidden = false;
      return;
    }
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
    this.ajoutePasser(v);
    this.element.hidden = false;
  }

  private ajoutePasser(v: EtatVue): void {
    if (v.phase !== 'histoire') return;
    this.passer.onpointerdown = (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.passeTout(v);
    };
    this.element.append(this.passer);
  }
}
