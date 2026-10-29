import { cadence } from './cadence';
import { particulesDesEvenements } from './evenements-particules';
import { DENSITE_MAX, DENSITE_MIN, HAUTEUR_CARTE, HAUTEUR_VUE, TUILE } from '../config';
import type { Qualite } from '../jeu/sauvegarde';
import { ANIM, G, estPersonnage, estUnTir, type EntiteVue, type EtatVue, type Evenement } from '../jeu/vue';
import { Carte } from '../monde/carte';
import { NIVEAUX, niveauLu } from '../niveaux';
import { AtlasTuiles } from './atlas-tuiles';
import { Camera } from './camera';
import { dessineCarteMonde } from './carte-monde';
import { dessineEntite } from './dessin-entites';
import { dessineDecor, semeDecor, type CoucheDecor } from './decor';
import { dessineTuiles, dessineTyroliennes } from './dessin-tuiles';
import { Emojis } from './emojis';
import { Fond } from './fonds';
import { PremierPlan } from './premier-plan';
import { Braises } from './flammes';
import { dessineArene } from './arene-rendu';
import { dessineBullesCages } from './bulle-cage';
import { dessineIndicateurs } from './indicateurs';
import { Particules } from './particules';
import { RockersRestes } from './rockers-convertis';
import { THEMES, type Theme } from './themes';
import { TraitsPersos } from './traits-persos';
import { RenduNavire } from './navire';
import { RenduDrift } from './drift';
import { RenduPlongeon } from './plongeon';
import { RenduReve } from './reve';
import { RenduAvion } from './avion';
import { RenduKart } from './kart';
import { CABRE, flammeReacteur, TUYERE } from './reacteur';
import { geometrieNavire } from '../niveaux/navire';

/** De combien le fond défile par image pendant la traversée en ferry (pixels du monde par image de traversée). */
const VITESSE_FERRY = 1.6;

/**
 * Dessine une vue de la partie (EtatVue) : fond, tuiles, entités, particules.
 * Il ne connaît pas la simulation : l'hôte et les clients l'utilisent pareil.
 */
export class Rendu {
  readonly ctx: CanvasRenderingContext2D;
  readonly camera = new Camera();
  readonly particules = new Particules();
  private readonly emojis = new Emojis();
  private readonly restes = new RockersRestes();
  private readonly braises = new Braises();
  private readonly traits = new TraitsPersos();
  /** le concours de drift du pré du Clos (phase `drift`) */
  private readonly drift = new RenduDrift();
  /** le concours de plongeon du pont des Tuves (phase `plongeon`) */
  private readonly plongeon = new RenduPlongeon();
  /** le rêve de JBT (phase `reve`) */
  private readonly reve = new RenduReve();
  /** l'avion de JBG (phase `avion`) */
  private readonly avion = new RenduAvion();
  /** le Grand Prix de la Sarré (phase `kart`) */
  private readonly kart = new RenduKart();
  /** largeur de la vue en pixels du jeu (la hauteur est fixe, la largeur suit la forme de l'écran) */
  largeur = 480;
  theme: Theme = THEMES.garage;
  private atlas = new AtlasTuiles(THEMES.garage);
  private fond = new Fond(THEMES.garage);
  /** les éléments posés devant le jeu (arbres, roches...) ; vide tant qu'un niveau n'est pas préparé */
  private premierPlan = new PremierPlan('pavillons', niveauLu(0));
  /** le ferry, dans le niveau de la traversée */
  private navire: RenduNavire | null = null;
  private niveau = -1;
  private decor: ReturnType<typeof semeDecor> = [];
  /** les accessoires posés sur chaque tuile (clé : rangée × 100000 + colonne), pour les briser avec elle */
  private decorParTuile = new Map<number, ReturnType<typeof semeDecor>>();
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
  /** chez un client (vue lissée) : au plus 60 images par seconde, même sur un écran à 120 Hz (voir cadence.ts) */
  private readonly aDessiner = cadence(1000 / 60);
  /** le pas de la partie déjà dessiné */
  private tickDessine = -1;

  /** `faits` : les niveaux déjà terminés un jour (la sauvegarde) : la carte du monde n'y remet pas le brouillard */
  constructor(
    private readonly toile: HTMLCanvasElement,
    private readonly faits: () => readonly number[] = () => [],
  ) {
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

  /** Un niveau reçu d'un hôte peut prendre l'indice d'un autre : on oublie ce qu'on avait préparé. */
  oublieNiveau(): void {
    this.niveau = -1;
    this.carteDecor = null;
  }

  prepareNiveau(niveau: number): void {
    if (niveau === this.niveau) return;
    this.niveau = niveau;
    this.theme = THEMES[NIVEAUX[niveau]?.theme ?? 'garage'];
    this.atlas = new AtlasTuiles(this.theme);
    this.fond = new Fond(this.theme);
    this.premierPlan = new PremierPlan(this.theme.decor, niveauLu(niveau));
    const emb = niveauLu(niveau).embarquement;
    this.navire = emb ? new RenduNavire(geometrieNavire(emb)) : null;
    this.camera.recadre();
    this.traits.reinitialise();
  }

  /** Les évènements de la partie deviennent des particules. */
  evenements(evts: readonly Evenement[]): void {
    particulesDesEvenements(this.particules, this.decorParTuile, evts);
  }

  dessine(vue: EtatVue, carte: Carte, siegeLocal: number): void {
    // une image par pas de la partie, pas une de plus : sur un écran à 120 Hz, sans cela, une image sur deux redessinait la même
    // scène, et le dessin dérivait par rapport à la partie (deux pas d'un coup, puis aucun : de petits à-coups). Chez un client,
    // la vue est lissée à chaque image : le limiteur. Sinon la toile garde l'image précédente.
    if (vue.lissee ? !this.aDessiner(performance.now()) : vue.tick === this.tickDessine) return;
    this.tickDessine = vue.tick;
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
      dessineCarteMonde(ctx, Math.round(this.largeur / k), vue.niveau, vue.page, this.tick, this.faits());
      ctx.restore();
      return;
    }
    if (vue.phase === 'drift' && vue.drift) {
      this.drift.dessine(ctx, vue.drift, this.largeur, this.tick);
      return;
    }
    if (vue.phase === 'plongeon' && vue.plongeon) {
      this.plongeon.dessine(ctx, vue.plongeon, this.largeur, this.tick);
      return;
    }
    if (vue.phase === 'reve' && vue.reve) {
      this.reve.dessine(ctx, vue.reve, this.largeur, this.tick);
      return;
    }
    if (vue.phase === 'avion' && vue.avion) {
      this.avion.dessine(ctx, vue.avion, this.largeur, this.tick);
      return;
    }
    if (vue.phase === 'kart' && vue.kart) {
      this.kart.dessine(ctx, vue.kart, this.largeur, this.tick);
      return;
    }
    this.prepareNiveau(vue.niveau);
    const moi = vue.joueurs[siegeLocal];
    const suivi = moi && moi.present && !moi.mort ? moi : vue.joueurs.find((j) => j.present && !j.mort);
    if (suivi) this.camera.suit(suivi.x, suivi.y, this.largeur, carte.largeur * TUILE, carte.hauteur * TUILE);
    const s = vue.secousse;
    // la caméra se cale sur les pixels de la toile (1/densité de pixel du jeu), pas sur les pixels du jeu entiers : le héros
    // court à 2,5 pixels du jeu par pas, et un décor arrondi au pixel entier avancerait de 2, 3, 2, 3... (le défilement
    // tremblait) ; tout ce qui se dessine à une position entière du monde moins la caméra tombe ainsi sur un pixel de l'écran
    const grille = (v: number) => Math.round(v * this.densite) / this.densite;
    const camX = grille(this.camera.x + (s ? (Math.random() - 0.5) * s * 0.6 : 0));
    const camY = grille(this.camera.y + (s ? (Math.random() - 0.5) * s * 0.6 : 0));

    // en traversée, le ferry avance : le fond défile en plus de la caméra
    const decalage = Math.max(0, vue.traversee) * VITESSE_FERRY;
    this.fond.largeurNiveau = niveauLu(vue.niveau).largeur * TUILE;
    this.fond.dessine(
      ctx,
      camX,
      camY,
      this.largeur,
      (niveauLu(vue.niveau).depart.ty + 1) * TUILE,
      this.tick,
      decalage,
    );
    // le décor est semé à partir de la carte d'origine (avant destruction) : au chargement de chaque carte
    if (this.carteDecor !== carte) {
      this.carteDecor = carte;
      const lu = niveauLu(vue.niveau);
      this.decor = semeDecor(
        new Carte(lu.largeur, lu.hauteur, lu.tuiles, lu.fond),
        NIVEAUX[vue.niveau]!.theme,
        11 + vue.niveau,
        NIVEAUX[vue.niveau]!.decor,
        NIVEAUX[vue.niveau]!.semis,
      );
      this.braises.regle(this.decor);
      this.decorParTuile = new Map();
      for (const o of this.decor) {
        const cle = o.ty * 100000 + o.tx;
        this.decorParTuile.set(cle, [...(this.decorParTuile.get(cle) ?? []), o]);
      }
    }
    // sur le ferry : les quais d'abord ; puis tout ce qui est à bord tangue, et la mer passe devant (voir navire.ts)
    const navire = this.navire;
    navire?.quais(ctx, camX, camY, vue.navire);
    ctx.save();
    if (navire) ctx.translate(0, navire.tangage(vue.navire, this.tick));
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
    navire?.navire(ctx, camX, camY, vue.navire, this.tick);
    decore('interieur');
    // les projecteurs du club éclairent les murs, sous les personnages (et la nuit tombe sur la plage)
    this.fond.lumieres(ctx, camX, this.largeur, this.tick);
    dessineTyroliennes(ctx, niveauLu(vue.niveau).tyroliennes, carte, camX, camY);
    this.particules.meteo(this.theme.meteo, camX, camY, this.largeur);
    this.particules.maj(carte);

    // les objets derrière, puis les personnages, puis les tirs
    const tri = (v: EntiteVue) => (estUnTir(v.g) ? 2 : !estPersonnage(v.g) || v.e === ANIM.TERRASSE ? 0 : 1);
    this.restes.dessine(ctx, this.restes.maj(vue), camX, camY, this.largeur);
    // les barils empilés : du plus bas au plus haut, le pied de celui du dessus recouvre le dessus de celui qu'il porte
    const barils = vue.entites.filter((v) => v.g === G.BARIL).sort((a, b) => b.y - a.y);
    for (const v of barils) dessineEntite(ctx, v, camX, camY, this.atlas, this.theme.lueur);
    for (const passe of [0, 1, 2])
      for (const v of vue.entites)
        if (v.g !== G.BARIL && tri(v) === passe)
          dessineEntite(ctx, v, camX, camY, this.atlas, this.theme.lueur);
    for (const v of vue.entites) {
      // le van démarre sur la route (e = 2) : graviers et fumée
      if (v.g === G.VAN && v.e === 2) this.particules.van(v.x, v.y, v.f / 20);
      if (v.g !== G.VAN_REACTEUR || v.e !== 4) continue;
      // le van à réacteur décolle : la flamme suit le van qui se cabre, plein gaz
      ctx.save();
      ctx.translate(Math.round(v.x) - camX, Math.round(v.y) - camY);
      ctx.rotate(CABRE);
      flammeReacteur(ctx, TUYERE.x, TUYERE.y, 1, this.tick);
      ctx.restore();
    }
    decore('devant');
    this.particules.dessine(ctx, camX, camY);
    ctx.restore();
    navire?.mer(ctx, camX, camY, this.largeur, vue.navire, this.tick);
    // les braises sont un petit plus : on les coupe dès que l'appareil peine (mode éco, ou trop peu d'images par seconde)
    if (this.braisesPermises()) {
      this.braises.emetDepuis(carte, camX, this.largeur);
      this.braises.maj();
      this.braises.dessine(ctx, camX, camY);
    }
    this.premierPlan.dessine(ctx, camX, camY, this.largeur, this.tick);
    dessineBullesCages(ctx, vue, siegeLocal, camX, camY, this.largeur, this.tick);
    this.traits.maj(vue, this.decor, carte, { emojis: this.emojis });
    this.emojis.accompagne(vue.entites);
    this.emojis.maj();
    this.emojis.dessine(ctx, camX, camY);
    dessineArene(ctx, vue, siegeLocal, camX, camY, this.largeur);
    dessineIndicateurs(ctx, vue, siegeLocal, camX, camY, this.largeur, this.tick);
  }
}
