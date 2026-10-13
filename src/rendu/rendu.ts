import { DENSITE_MAX, DENSITE_MIN, HAUTEUR_VUE, TUILE } from '../config';
import { G, type EtatVue, type Evenement } from '../jeu/vue';
import { Carte } from '../monde/carte';
import { proprietes } from '../monde/tuiles';
import { NIVEAUX, niveauLu } from '../niveaux';
import { AtlasTuiles } from './atlas-tuiles';
import { Camera } from './camera';
import { dessineEntite } from './dessin-entites';
import { dessineDecor, semeDecor } from './decor';
import { dessineTuiles, dessineTyroliennes } from './dessin-tuiles';
import { Fond } from './fonds';
import { Particules } from './particules';
import { THEMES, type Theme } from './themes';

/**
 * Dessine une vue de la partie (EtatVue) : fond, tuiles, entités, particules.
 * Il ne connaît pas la simulation : l'hôte et les clients l'utilisent pareil.
 */
export class Rendu {
  readonly ctx: CanvasRenderingContext2D;
  readonly camera = new Camera();
  readonly particules = new Particules();
  /** largeur de la vue en pixels du jeu (la hauteur est fixe, la largeur suit la forme de l'écran) */
  largeur = 480;
  theme: Theme = THEMES.garage;
  private atlas = new AtlasTuiles(THEMES.garage);
  private fond = new Fond(THEMES.garage);
  private niveau = -1;
  private decor: ReturnType<typeof semeDecor> = [];
  private carteDecor: Carte | null = null;
  private tick = 0;
  /** pixels du canvas par pixel du jeu : limité par l'écran, puis abaissé si l'appareil n'arrive pas à tenir 60 images/s */
  private densite = DENSITE_MAX;
  private instant = 0;
  private duree = 0;
  private images = 0;

  constructor(private readonly toile: HTMLCanvasElement) {
    this.ctx = toile.getContext('2d', { alpha: false })!;
    this.redimensionne();
  }

  /** Adapte la largeur de la vue à l'écran, sans bandes noires sur les téléphones allongés. */
  redimensionne(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.largeur = Math.round(Math.min(520, Math.max(220, (HAUTEUR_VUE * w) / h)));
    const k = Math.min(w / this.largeur, h / HAUTEUR_VUE);
    // inutile de dessiner plus fin que les pixels de l'écran (ceux d'un téléphone sont 2 à 3 fois plus petits qu'un pixel CSS)
    const ecran = Math.floor((HAUTEUR_VUE * k * (window.devicePixelRatio || 1)) / HAUTEUR_VUE);
    this.densite = Math.min(this.densite, Math.max(DENSITE_MIN, ecran));
    this.toile.width = this.largeur * this.densite;
    this.toile.height = HAUTEUR_VUE * this.densite;
    this.toile.style.width = `${Math.floor(this.largeur * k)}px`;
    this.toile.style.height = `${Math.floor(HAUTEUR_VUE * k)}px`;
    this.ctx.imageSmoothingEnabled = false;
  }

  /** Mesure la durée moyenne des images ; si elle dépasse ~22 ms, baisse la densité (jamais l'inverse). */
  private adapteDensite(): void {
    const maintenant = performance.now();
    const ecart = maintenant - this.instant;
    this.instant = maintenant;
    if (ecart > 500) return; // pause, onglet caché : pas une mesure
    this.duree += ecart;
    if (++this.images < 40) return;
    const moyenne = this.duree / this.images;
    this.duree = this.images = 0;
    if (moyenne > 22 && this.densite > DENSITE_MIN) {
      // le coût suit à peu près le nombre de pixels du canvas, donc le carré de la densité
      this.densite = Math.max(
        DENSITE_MIN,
        Math.min(this.densite - 1, Math.floor(this.densite * Math.sqrt(17 / moyenne))),
      );
      this.redimensionne();
    }
  }

  prepareNiveau(niveau: number): void {
    if (niveau === this.niveau) return;
    this.niveau = niveau;
    this.theme = THEMES[NIVEAUX[niveau]?.theme ?? 'garage'];
    this.atlas = new AtlasTuiles(this.theme);
    this.fond = new Fond(this.theme);
    this.camera.recadre();
  }

  /** Les évènements de la partie deviennent des particules. */
  evenements(evts: readonly Evenement[]): void {
    const p = this.particules;
    for (const e of evts) {
      switch (e.k) {
        case 'tuile':
          if (e.t === 0) p.debris((e.x + 0.5) * TUILE, (e.y + 0.5) * TUILE, proprietes(e.avant).debris, 7);
          break;
        case 'explo':
          p.explosion(e.x, e.y, e.r);
          break;
        case 'impact':
          p.impact(e.x, e.y, e.c);
          break;
        case 'confettis':
          p.confettis(e.x, e.y);
          break;
        case 'texte':
          p.texte(e.x, e.y, e.s, e.c);
          break;
      }
    }
  }

  dessine(vue: EtatVue, carte: Carte, siegeLocal: number): void {
    this.tick++;
    const ctx = this.ctx;
    // tout se dessine en pixels du jeu ; la densité est appliquée ici, une fois
    this.adapteDensite();
    ctx.setTransform(this.densite, 0, 0, this.densite, 0, 0);
    ctx.imageSmoothingEnabled = false;
    this.prepareNiveau(vue.niveau);
    const moi = vue.joueurs[siegeLocal];
    const suivi = moi && moi.present && !moi.mort ? moi : vue.joueurs.find((j) => j.present && !j.mort);
    if (suivi) this.camera.suit(suivi.x, suivi.y, this.largeur, carte.largeur * TUILE, carte.hauteur * TUILE);
    const s = vue.secousse;
    const camX = this.camera.x + (s ? (Math.random() - 0.5) * s * 0.6 : 0);
    const camY = this.camera.y + (s ? (Math.random() - 0.5) * s * 0.6 : 0);

    this.fond.dessine(ctx, camX, camY, this.largeur, carte.hauteur * TUILE, this.tick);
    // le décor est semé à partir de la carte d'origine (avant destruction) : au chargement de chaque carte
    if (this.carteDecor !== carte) {
      this.carteDecor = carte;
      const lu = niveauLu(vue.niveau);
      this.decor = semeDecor(
        new Carte(lu.largeur, lu.hauteur, lu.tuiles, lu.fond),
        NIVEAUX[vue.niveau]!.theme,
        11 + vue.niveau,
      );
    }
    dessineDecor(ctx, this.decor, carte, camX, camY, this.largeur, false, this.theme.dessus);
    dessineTuiles(ctx, carte, this.atlas, camX, camY, this.largeur);
    dessineTyroliennes(ctx, niveauLu(vue.niveau).tyroliennes, carte, camX, camY);
    this.particules.meteo(this.theme.meteo, camX, camY, this.largeur);
    this.particules.maj(carte);

    // les objets derrière, puis les personnages, puis les tirs
    const tri = (g: number) => (g >= G.CAGE ? 0 : g >= G.P_BAGUETTE ? 2 : 1);
    for (const passe of [0, 1, 2])
      for (const v of vue.entites) if (tri(v.g) === passe) dessineEntite(ctx, v, camX, camY, this.atlas);
    for (const v of vue.entites) if (v.g === G.VAN && v.e === 2) this.particules.van(v.x, v.y, v.f / 20);
    dessineDecor(ctx, this.decor, carte, camX, camY, this.largeur, true, this.theme.dessus);
    this.particules.dessine(ctx, camX, camY);
  }
}
