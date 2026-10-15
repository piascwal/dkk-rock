import { DENSITE_MAX, DENSITE_MIN, HAUTEUR_CARTE, HAUTEUR_VUE, TUILE } from '../config';
import type { Qualite } from '../jeu/sauvegarde';
import { ANIM, G, type EntiteVue, type EtatVue, type Evenement } from '../jeu/vue';
import { Carte } from '../monde/carte';
import { proprietes } from '../monde/tuiles';
import { NIVEAUX, niveauLu } from '../niveaux';
import { AtlasTuiles } from './atlas-tuiles';
import { Camera } from './camera';
import { dessineCarteMonde } from './carte-monde';
import { dessineEntite } from './dessin-entites';
import { dessineDecor, semeDecor, type CoucheDecor } from './decor';
import { dessineTuiles, dessineTyroliennes } from './dessin-tuiles';
import { Emojis } from './emojis';
import { Fond } from './fonds';
import { Braises } from './flammes';
import { dessineIndicateurs } from './indicateurs';
import { Particules } from './particules';
import { THEMES, type Theme } from './themes';
import { TraitsPersos } from './traits-persos';

/**
 * Dessine une vue de la partie (EtatVue) : fond, tuiles, entités, particules.
 * Il ne connaît pas la simulation : l'hôte et les clients l'utilisent pareil.
 */
export class Rendu {
  readonly ctx: CanvasRenderingContext2D;
  readonly camera = new Camera();
  readonly particules = new Particules();
  private readonly emojis = new Emojis();
  private readonly braises = new Braises();
  private readonly traits = new TraitsPersos();
  /** largeur de la vue en pixels du jeu (la hauteur est fixe, la largeur suit la forme de l'écran) */
  largeur = 480;
  theme: Theme = THEMES.garage;
  private atlas = new AtlasTuiles(THEMES.garage);
  private fond = new Fond(THEMES.garage);
  private niveau = -1;
  private decor: ReturnType<typeof semeDecor> = [];
  private carteDecor: Carte | null = null;
  private tick = 0;
  /** pixels du canvas par pixel du jeu : 6 (pleine définition) ou 3 (appareil lent) */
  private densite: number = DENSITE_MAX;
  private qualite: Qualite = 'auto';
  private instant = 0;
  private duree = 0;
  private images = 0;
  private fps = 60;
  private echauffement = 240;
  /** la taille d'écran lue au dernier calibrage : si elle change sans évènement (iPad), on recalibre */
  private tailleVue = '';

  constructor(private readonly toile: HTMLCanvasElement) {
    this.ctx = toile.getContext('2d', { alpha: false })!;
    this.redimensionne();
  }

  /** Règle la qualité : « auto » descend à 3 si l'appareil ne tient pas, « max » reste à 6, « eco » reste à 3. */
  regle(q: Qualite): void {
    this.qualite = q;
    this.echauffement = 240;
    this.densite = DENSITE_MAX;
    this.redimensionne();
  }

  /** Les braises des flammes ne valent pas une image perdue : coupées en mode éco et sous 45 images par seconde. */
  private braisesPermises(): boolean {
    return this.qualite !== 'eco' && this.fps >= 45;
  }

  /** Ce qu'on affiche : « 6× · 60 i/s ». */
  diagnostic(): string {
    return `${this.densite}× · ${Math.round(this.fps)} i/s`;
  }

  private densiteVoulue(ecran: number): number {
    if (this.qualite === 'max') return DENSITE_MAX;
    if (this.qualite === 'eco') return DENSITE_MIN;
    // inutile de dessiner plus fin que l'écran ; et seulement 6 ou 3 : un entre-deux flouterait les sprites
    return Math.min(this.densite, ecran >= DENSITE_MAX ? DENSITE_MAX : DENSITE_MIN);
  }

  /** Adapte la largeur de la vue à l'écran, sans bandes noires sur les téléphones allongés. */
  redimensionne(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.tailleVue = `${w}x${h}@${window.devicePixelRatio || 1}`;
    this.largeur = Math.round(Math.min(520, Math.max(220, (HAUTEUR_VUE * w) / h)));
    const k = Math.min(w / this.largeur, h / HAUTEUR_VUE);
    // inutile de dessiner plus fin que les pixels de l'écran (ceux d'un téléphone sont 2 à 3 fois plus petits qu'un pixel CSS)
    const ecran = Math.floor((HAUTEUR_VUE * k * (window.devicePixelRatio || 1)) / HAUTEUR_VUE);
    this.densite = this.densiteVoulue(ecran);
    this.toile.width = this.largeur * this.densite;
    this.toile.height = HAUTEUR_VUE * this.densite;
    this.ctx.imageSmoothingEnabled = false;
  }

  /** Mesure la durée moyenne des images ; en mode auto, descend à 3 si elle reste lente après le chargement. */
  private adapteDensite(): void {
    const maintenant = performance.now();
    const ecart = maintenant - this.instant;
    this.instant = maintenant;
    if (ecart > 500) return; // pause, onglet caché : pas une mesure
    if (this.echauffement > 0) {
      this.echauffement--; // les premières secondes (chargement des images, du niveau) ne comptent pas
      return;
    }
    this.duree += ecart;
    if (++this.images < 90) return;
    const moyenne = this.duree / this.images;
    this.fps = 1000 / moyenne;
    this.duree = this.images = 0;
    if (this.qualite === 'auto' && moyenne > 30 && this.densite > DENSITE_MIN) {
      this.densite = DENSITE_MIN;
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
    this.traits.reinitialise();
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
    if (this.tailleVue !== `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio || 1}`)
      this.redimensionne();
    this.adapteDensite();
    ctx.setTransform(this.densite, 0, 0, this.densite, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (vue.phase === 'carte') {
      // la carte garde sa propre hauteur de vue : on l'agrandit pour remplir l'écran (un entier de pixels par pixel de la carte)
      const k = HAUTEUR_VUE / HAUTEUR_CARTE;
      ctx.save();
      ctx.scale(k, k);
      dessineCarteMonde(ctx, Math.round(this.largeur / k), vue.niveau, vue.page, this.tick);
      ctx.restore();
      return;
    }
    this.prepareNiveau(vue.niveau);
    const moi = vue.joueurs[siegeLocal];
    const suivi = moi && moi.present && !moi.mort ? moi : vue.joueurs.find((j) => j.present && !j.mort);
    if (suivi) this.camera.suit(suivi.x, suivi.y, this.largeur, carte.largeur * TUILE, carte.hauteur * TUILE);
    const s = vue.secousse;
    const camX = this.camera.x + (s ? (Math.random() - 0.5) * s * 0.6 : 0);
    const camY = this.camera.y + (s ? (Math.random() - 0.5) * s * 0.6 : 0);

    this.fond.dessine(ctx, camX, camY, this.largeur, (niveauLu(vue.niveau).depart.ty + 1) * TUILE, this.tick);
    // le décor est semé à partir de la carte d'origine (avant destruction) : au chargement de chaque carte
    if (this.carteDecor !== carte) {
      this.carteDecor = carte;
      const lu = niveauLu(vue.niveau);
      this.decor = semeDecor(
        new Carte(lu.largeur, lu.hauteur, lu.tuiles, lu.fond),
        NIVEAUX[vue.niveau]!.theme,
        11 + vue.niveau,
      );
      this.braises.regle(this.decor);
    }
    const decore = (couche: CoucheDecor) =>
      dessineDecor(
        ctx,
        this.decor,
        carte,
        camX,
        camY,
        this.largeur,
        couche,
        this.theme.dessus,
        this.theme.lointain,
      );
    decore('fond');
    dessineTuiles(ctx, carte, this.atlas, camX, camY, this.largeur, this.tick);
    decore('interieur');
    dessineTyroliennes(ctx, niveauLu(vue.niveau).tyroliennes, carte, camX, camY);
    this.particules.meteo(this.theme.meteo, camX, camY, this.largeur);
    this.particules.maj(carte);

    // les objets derrière, puis les personnages, puis les tirs
    const tri = (v: EntiteVue) =>
      v.g >= G.CAGE || (v.g < G.P_BAGUETTE && v.e === ANIM.TERRASSE) ? 0 : v.g >= G.P_BAGUETTE ? 2 : 1;
    for (const passe of [0, 1, 2])
      for (const v of vue.entites) if (tri(v) === passe) dessineEntite(ctx, v, camX, camY, this.atlas);
    for (const v of vue.entites) if (v.g === G.VAN && v.e === 2) this.particules.van(v.x, v.y, v.f / 20);
    decore('devant');
    this.particules.dessine(ctx, camX, camY);
    // les braises sont un petit plus : on les coupe dès que l'appareil peine (mode éco, ou trop peu d'images par seconde)
    if (this.braisesPermises()) {
      this.braises.emetDepuis(carte, camX, this.largeur);
      this.braises.maj();
      this.braises.dessine(ctx, camX, camY);
    }
    this.traits.maj(vue, this.decor, carte, { emojis: this.emojis });
    this.emojis.accompagne(vue.entites);
    this.emojis.maj();
    this.emojis.dessine(ctx, camX, camY);
    dessineIndicateurs(ctx, vue, siegeLocal, camX, camY, this.largeur, this.tick);
  }
}
