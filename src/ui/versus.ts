import { HEROS } from '../entites/heros';
import type { EtatVue } from '../jeu/vue';
import { couleurDuSiege } from '../rendu/couleurs-arene';
import type { VueArene } from '../jeu/arene';
import { el } from './elements';
import { nomArene } from './noms-arene';
import { portrait } from './portraits';

/**
 * L'écran « VERSUS » du battle royale, pendant le compte à rebours d'une manche : la carte de chaque joueur (le portrait du
 * personnage tiré au sort, son pseudo, la couleur de son siège) tombe d'en haut ou monte d'en bas, l'une après l'autre ; le « VS »
 * claque au milieu, puis le compte à rebours. D'après la seule vue : pareil chez l'hôte et chez les invités.
 */
export class EcranVersus {
  private readonly element = el('div', '', 'versus');
  private readonly bande = el('div', '', 'versus-bande');
  private readonly compte = el('div', '', 'versus-compte');
  /** les cartes affichées (qui, quel personnage, quels noms) : on ne les refait (et ne les rejoue) que si elles changent */
  private cle = '';

  constructor(parent: HTMLElement) {
    this.element.hidden = true;
    this.element.append(this.bande, el('div', 'VS', 'versus-vs'), this.compte);
    parent.append(this.element);
  }

  maj(v: EtatVue | null, siegeLocal: number, noms: readonly string[]): void {
    const ar = v?.phase === 'jeu' ? v.arene : undefined;
    const actif = ar?.etape === 'compte';
    this.element.hidden = !actif;
    if (!actif) {
      this.cle = '';
      return;
    }
    // dans l'ordre des cases du salon : en équipes, les rouges puis les bleus
    const presents = v!.joueurs
      .flatMap((j, s) => (j.present ? [[s, j.membre] as const] : []))
      .sort(([a], [b]) => (ar.places[a] ?? a) - (ar.places[b] ?? b));
    const cle = JSON.stringify([presents, noms, siegeLocal, ar.equipes, ar.places]);
    if (cle !== this.cle) {
      this.cle = cle;
      this.bande.replaceChildren(
        ...presents.map(([s, membre], i) => this.carte(ar, s, membre, i, noms, siegeLocal)),
      );
    }
    const n = String(Math.max(1, 3 - Math.floor(ar.minuteur / 60)));
    if (this.compte.textContent !== n) {
      this.compte.textContent = n;
      // chaque chiffre rebondit à son tour
      this.compte.classList.remove('pop');
      void this.compte.offsetWidth;
      this.compte.classList.add('pop');
    }
  }

  private carte(
    ar: VueArene,
    s: number,
    membre: number,
    i: number,
    noms: readonly string[],
    siegeLocal: number,
  ): HTMLElement {
    const carte = el('div', '', `versus-carte ${i % 2 ? 'bas' : 'haut'}${s === siegeLocal ? ' moi' : ''}`);
    carte.style.setProperty('--couleur', couleurDuSiege(ar, s));
    carte.style.animationDelay = `${i * 90}ms`;
    const img = el('img');
    img.src = portrait(HEROS[membre]?.qui ?? 'JBT');
    img.alt = '';
    carte.append(img, el('span', nomArene(noms, s)));
    return carte;
  }
}
