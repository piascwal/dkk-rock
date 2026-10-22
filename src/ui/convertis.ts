import { dessineFeuille } from '../rendu/feuilles-images';
import { DESSINS_BOSS } from '../rendu/dessins-boss';
import { DESSINS_ENNEMIS } from '../rendu/dessins-ennemis';
import { Particules } from '../rendu/particules';
import { pinceau } from '../rendu/pinceau';
import { ANIM, type Genre } from '../jeu/vue';
import { el } from './elements';
import {
  DUREE_PILE,
  ECART_MAX,
  ECART_MIN,
  HAUTEUR_SPRITE,
  LARGEUR_SPRITE,
  dispose,
  formateTemps,
  genresEmpiles,
  melange,
  type Disposition,
} from './pile-convertis';

/**
 * L'écran de fin de niveau, façon Broforce : tous les ennemis « convertis au rock » en une pile, les sprites mélangés et à peine
 * chevauchés, qui apparaissent l'un après l'autre en cinq ou six secondes, chacun avec un petit éclat comme quand on le met au tapis ; en
 * dessous, le temps de la run et le score. Selon les DKK, du moins : les intéressés n'ont pas été consultés. La liste vient de la
 * vue (`EtatVue.convertis`), donc chez tous les joueurs.
 */

/** Le portrait d'un ennemi à l'échelle `k` : sa planche s'il en a une, sinon son dessin en code. */
function portrait(genre: Genre, k: number): HTMLCanvasElement {
  const toile = el('canvas');
  toile.width = LARGEUR_SPRITE * k;
  toile.height = HAUTEUR_SPRITE * k;
  const ctx = toile.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.translate(LARGEUR_SPRITE / 2, HAUTEUR_SPRITE - 2);
  if (!dessineFeuille(ctx, genre, ANIM.DEBOUT, genre, false)) {
    const dessin = DESSINS_ENNEMIS[genre] ?? DESSINS_BOSS[genre];
    dessin?.(pinceau(ctx), ANIM.DEBOUT, 0);
  }
  return toile;
}

/** Le mot de la fin : les DKK sont convaincus, c'est l'essentiel. */
function commentaire(total: number): string {
  if (total === 0) return 'Personne n’a été converti. Les DKK jurent qu’ils n’y sont pour rien.';
  if (total < 10) return 'Ils ont l’air convaincus. Ils ne bougent plus.';
  if (total < 30) return 'Un public conquis. Il ne répond plus aux messages.';
  return 'Un vrai mouvement. Pardon : un public.';
}

export class Convertis {
  private minuteur: ReturnType<typeof setInterval> | null = null;
  private depart = 0;
  private fini = true;
  /** jusqu'à quand les éclats continuent de s'éteindre après la fin du comptage */
  private finEffets = 0;
  private genres: Genre[] = [];
  private disposition: Disposition = { echelle: 1, positions: [], hauteur: 0 };
  private posees = 0;
  private ecart = ECART_MAX;
  private score = 0;
  private particules = new Particules();
  private portraits = new Map<Genre, HTMLCanvasElement>();
  private pile!: HTMLCanvasElement;
  private fond!: HTMLCanvasElement;
  private valeurScore!: HTMLElement;
  private total!: HTMLElement;

  constructor(
    private readonly son: (nom: string) => void,
    private readonly maintenant: () => number = () => performance.now(),
  ) {}

  get enCours(): boolean {
    return !this.fini;
  }

  /** Construit l'écran dans `element` et lance la pile. `temps` : la run, en secondes ; `score` : celui de la partie. */
  affiche(element: HTMLElement, convertis: readonly number[], temps = 0, score = 0): void {
    this.arrete();
    this.genres = melange(genresEmpiles(convertis));
    this.score = score;
    this.particules = new Particules();
    this.portraits.clear();
    this.posees = 0;
    const titre = el('h1', 'Convertis au rock !', 'titre-niveau');
    const sous = el('p', 'selon les DKK');
    this.pile = el('canvas', '', 'pile-convertis');
    this.pile.width = Math.round(Math.min(innerWidth * 0.94, 960));
    // la hauteur que le titre et les chiffres laissent, ramenée à ce dont la pile a besoin : pas de vide autour
    const place = Math.round(Math.max(110, Math.min(innerHeight - 380, 420)));
    this.pile.height = Math.max(8, dispose(this.genres.length, this.pile.width, place).hauteur);
    this.fond = el('canvas');
    this.fond.width = this.pile.width;
    this.fond.height = this.pile.height;
    this.disposition = dispose(this.genres.length, this.pile.width, this.pile.height);
    this.ecart = Math.min(ECART_MAX, Math.max(ECART_MIN, DUREE_PILE / Math.max(1, this.genres.length)));
    this.valeurScore = el('strong', '0');
    const stats = el('div', '', 'stats-run');
    stats.append(this.stat('Temps', el('strong', formateTemps(temps))), this.stat('Score', this.valeurScore));
    this.total = el('p', '', 'total-convertis');
    this.total.hidden = true;
    const n = this.genres.length;
    this.total.append(el('strong', `${n} converti${n > 1 ? 's' : ''}`), el('br'), commentaire(n));
    const suite = el('p', 'Touchez l’écran ou appuyez sur Entrée', 'suite');
    element.replaceChildren(titre, sous, this.pile, stats, this.total, suite);
    this.depart = this.maintenant();
    this.fini = false;
    this.finEffets = 0;
    this.minuteur = setInterval(() => this.maj(), 16);
    this.maj();
  }

  private stat(libelle: string, valeur: HTMLElement): HTMLElement {
    const bloc = el('div', '', 'stat-run');
    bloc.append(el('span', libelle), valeur);
    return bloc;
  }

  /** Pose le sprite suivant sur la pile, avec son éclat (`eclat` : sans lui, quand tout vient d'un coup). */
  private pose(eclat: boolean): void {
    const i = this.posees++;
    const genre = this.genres[i]!;
    const { echelle: k, positions } = this.disposition;
    let img = this.portraits.get(genre);
    if (!img) this.portraits.set(genre, (img = portrait(genre, k)));
    const [x, y] = positions[i]!;
    this.fond.getContext('2d')!.drawImage(img, x, y);
    if (!eclat) return;
    // l'éclat, au milieu du sprite : une petite explosion et des confettis, comme quand on met un ennemi au tapis
    const cx = (x + img.width / 2) / k;
    const cy = (y + img.height * 0.55) / k;
    this.particules.explosion(cx, cy, 9);
    this.particules.confettis(cx, cy);
    if (i % Math.max(1, Math.round(this.genres.length / 12)) === 0) this.son('ramasse');
  }

  /** Un pas d'animation : les sprites apparaissent l'un après l'autre, le score monte, les éclats s'éteignent. */
  private maj(): void {
    const t = this.maintenant() - this.depart;
    if (!this.fini) {
      const visibles = Math.min(this.genres.length, Math.floor(t / this.ecart) + 1);
      while (this.posees < visibles) this.pose(true);
      const duree = this.genres.length * this.ecart;
      this.valeurScore.textContent = Math.round(
        this.score * Math.min(1, t / Math.max(1, duree)),
      ).toLocaleString('fr-FR');
      if (this.posees >= this.genres.length && t >= duree + 400) this.termine();
    }
    this.dessine();
    if (this.fini && this.maintenant() >= this.finEffets) this.arrete();
  }

  private dessine(): void {
    const ctx = this.pile.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.pile.width, this.pile.height);
    ctx.drawImage(this.fond, 0, 0);
    const k = this.disposition.echelle;
    this.particules.maj(null);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    this.particules.dessine(ctx, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /** Montre tout, tout de suite : un premier toucher passe l'animation, le suivant passe l'écran. */
  termine(): void {
    if (this.fini) return;
    while (this.posees < this.genres.length) this.pose(false);
    this.valeurScore.textContent = this.score.toLocaleString('fr-FR');
    this.total.hidden = false;
    this.son('liberation');
    this.fini = true;
    this.finEffets = this.maintenant() + 900;
  }

  arrete(): void {
    if (this.minuteur) clearInterval(this.minuteur);
    this.minuteur = null;
  }
}
