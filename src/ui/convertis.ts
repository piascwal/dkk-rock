import { ENNEMIS_PAR_LETTRE } from '../entites/ennemis/definitions';
import { dessineFeuille } from '../rendu/feuilles-images';
import { DESSINS_BOSS } from '../rendu/dessins-boss';
import { DESSINS_ENNEMIS } from '../rendu/dessins-ennemis';
import { pinceau } from '../rendu/pinceau';
import { ANIM, G, GENRES_CONVERTIS, type Genre } from '../jeu/vue';
import { el } from './elements';

/**
 * L'écran de fin de niveau, façon Broforce : la liste des ennemis « convertis au rock », avec leur compteur. Selon les DKK, du
 * moins : les intéressés n'ont pas été consultés. Il vient de la vue (`EtatVue.convertis`), donc chez tous les joueurs.
 */
const NOMS_BOSS: Record<number, string> = {
  [G.YETI_ALPHA]: 'Yéti Alpha',
  [G.CHAMPION]: 'Le Champion',
  [G.DJ]: 'DJ Boucle',
};
const nomDe = (genre: number): string =>
  NOMS_BOSS[genre] ?? Object.values(ENNEMIS_PAR_LETTRE).find((d) => d.genre === genre)?.nom ?? '?';

/** Le temps entre deux lignes, et le temps de comptage d'un compteur (millisecondes). */
const PAUSE = 520;
const COMPTAGE = 700;

/** Un petit portrait de l'ennemi : sa planche s'il en a une, sinon son dessin en code. */
function icone(genre: number): HTMLCanvasElement {
  const k = 3;
  const toile = el('canvas', '', 'icone-converti');
  toile.width = 40 * k;
  toile.height = 44 * k;
  const ctx = toile.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.translate(20, 42);
  if (!dessineFeuille(ctx, genre as Genre, ANIM.DEBOUT, genre, false)) {
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
  private lignes: { ligne: HTMLElement; compteur: HTMLElement; n: number }[] = [];
  private total!: HTMLElement;
  private fini = true;

  constructor(
    private readonly son: (nom: string) => void,
    private readonly maintenant: () => number = () => performance.now(),
  ) {}

  get enCours(): boolean {
    return !this.fini;
  }

  /** Construit l'écran dans `element` et lance le comptage. */
  affiche(element: HTMLElement, convertis: readonly number[]): void {
    this.arrete();
    const titre = el('h1', 'Convertis au rock !', 'titre-niveau');
    const sous = el('p', 'selon les DKK');
    const liste = el('div', '', 'convertis');
    this.lignes = [];
    GENRES_CONVERTIS.forEach((genre, i) => {
      const n = convertis[i] ?? 0;
      if (n <= 0) return;
      const ligne = el('div', '', 'converti');
      const compteur = el('span', '× 0', 'compteur');
      ligne.append(icone(genre), el('span', nomDe(genre), 'nom'), compteur);
      ligne.hidden = true;
      liste.append(ligne);
      this.lignes.push({ ligne, compteur, n });
    });
    const somme = this.lignes.reduce((t, l) => t + l.n, 0);
    this.total = el('p', '', 'total-convertis');
    this.total.hidden = true;
    this.total.append(el('strong', `${somme} converti${somme > 1 ? 's' : ''}`), el('br'), commentaire(somme));
    const suite = el('p', 'Touchez l’écran ou appuyez sur Entrée', 'suite');
    element.replaceChildren(titre, sous, liste, this.total, suite);
    this.depart = this.maintenant();
    this.fini = false;
    this.minuteur = setInterval(() => this.maj(), 40);
    this.maj();
  }

  /** Un pas d'animation : les lignes apparaissent l'une après l'autre, leur compteur monte. */
  private maj(): void {
    const t = this.maintenant() - this.depart;
    this.lignes.forEach((l, i) => {
      const debut = i * PAUSE;
      if (t < debut) return;
      if (l.ligne.hidden) {
        l.ligne.hidden = false;
        this.son('ramasse');
      }
      const duree = Math.min(COMPTAGE, 60 + l.n * 45);
      const k = Math.min(1, (t - debut) / duree);
      l.compteur.textContent = `× ${Math.round(l.n * k)}`;
    });
    const fin = this.lignes.length * PAUSE + 300;
    if (t >= fin) this.termine();
  }

  /** Montre tout, tout de suite : un premier toucher passe l'animation, le suivant passe l'écran. */
  termine(): void {
    if (this.fini) return;
    for (const l of this.lignes) {
      l.ligne.hidden = false;
      l.compteur.textContent = `× ${l.n}`;
    }
    this.total.hidden = false;
    this.son('liberation');
    this.arrete();
    this.fini = true;
  }

  arrete(): void {
    if (this.minuteur) clearInterval(this.minuteur);
    this.minuteur = null;
  }
}
