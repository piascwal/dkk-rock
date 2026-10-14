import type { Annonce } from '@piascwal/lan-kit';
import { Musique } from './audio/musique';
import { Bruitages } from './audio/sons';
import { Synthe } from './audio/synthe';
import { MAX_JOUEURS, VIES_DEPART } from './config';
import { Clavier, commandesManette } from './entrees/clavier';
import { Tactile } from './entrees/tactile';
import { C } from './jeu/commandes';
import { Partie } from './jeu/partie';
import { charge, enregistre, type Progression, type Sauvegarde } from './jeu/sauvegarde';
import type { EtatVue, Evenement } from './jeu/vue';
import { NIVEAUX } from './niveaux';
import type { AnnonceDkk } from './reseau/annonce';
import { Client, type Recherche } from './reseau/client';
import { Hote } from './reseau/hote';
import type { Carte } from './monde/carte';
import { chargeFeuilles } from './rendu/feuilles-images';
import { Rendu } from './rendu/rendu';
import { Intro } from './ui/intro';
import { Recrue } from './ui/recrue';
import { prepareInstallation } from './ui/installation';
import { Bulles, Histoire } from './ui/dialogues';
import { Hud } from './ui/hud';
import { afficheNouvelleVersion } from './ui/maj';
import { Menus, type Actions } from './ui/menus';
import { verifieVersion } from './version';

const PAS_MS = 1000 / 60;
const $ = (id: string) => document.getElementById(id)!;

/**
 * L'application : elle relie les entrées, la partie (locale ou distante), le
 * rendu, le son et les menus. Trois situations :
 * - seul, ou hôte d'amis : la partie tourne ici (`partie`, et `hote` si ouverte) ;
 * - invité : la partie tourne chez un autre (`client`), on envoie nos commandes.
 */
export class App implements Actions {
  readonly sauvegarde: Sauvegarde = charge(NIVEAUX.length);
  private readonly synthe = new Synthe();
  private readonly bruitages = new Bruitages(this.synthe);
  private readonly musique = new Musique(this.synthe);
  private readonly rendu = new Rendu($('toile') as HTMLCanvasElement);
  private readonly hud = new Hud($('hud'));
  private readonly bulles = new Bulles($('bulle'));
  private readonly histoire = new Histoire($('histoire'), () => this.suivant());
  private readonly clavier = new Clavier();
  private readonly tactile = new Tactile($('jeu'));
  private readonly menus = new Menus($('ecran'), this);
  private partie: Partie | null = null;
  private hote: Hote | null = null;
  private client: Client | null = null;
  private enPause = false;
  private reste = 0;
  private avant = 0;
  private bitsAvant = 0;
  private derniereVue: EtatVue | null = null;
  private recrue!: Recrue;
  /** le membre que l'on jouait à la dernière image, et si on était à terre : pour savoir qu'une recrue arrive */
  private membreVu: number | null = null;
  private etaitMort = false;

  get estClient(): boolean {
    return !!this.client;
  }

  demarre(): void {
    this.recrue = new Recrue($('intro') as HTMLCanvasElement, this.synthe);
    chargeFeuilles(import.meta.env.BASE_URL);
    // l'application installable : quand le navigateur propose de l'installer, le menu titre affiche le bouton
    prepareInstallation(import.meta.env.BASE_URL, () => {
      if (!this.partie && !this.client) this.menus.rafraichitTitre();
    });
    const geste = () => {
      this.synthe.demarre();
      this.appliqueOptions();
    };
    window.addEventListener('pointerdown', geste);
    window.addEventListener('keydown', geste);
    window.addEventListener('resize', () => this.rendu.redimensionne());
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Enter' && this.derniereVue && this.derniereVue.phase !== 'jeu') this.suivant();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.partie && !this.multijoueur) this.mettreEnPause();
      if (!document.hidden) void this.controleVersion();
    });
    this.clavier.onPause = () => (this.enPause ? this.reprend() : this.mettreEnPause());
    $('bouton-pause').addEventListener('click', () => this.mettreEnPause());
    this.tactile.montre(false);
    // après un rechargement de mise à jour, on retire le paramètre ?v= de l'adresse
    if (location.search.includes('v=')) history.replaceState(null, '', location.pathname + location.hash);
    void this.controleVersion();
    if (location.hash.startsWith('#salon=')) this.menus.rejoindre();
    else {
      this.menus.titre();
      new Intro($('intro') as HTMLCanvasElement, this.synthe, () => this.appliqueOptions()).lance();
    }
    requestAnimationFrame((t) => this.boucle(t));
  }

  private derniereVerification = 0;

  /** À l'ouverture et au retour sur l'onglet (au plus une fois par minute) : une version plus récente est-elle publiée ? */
  private async controleVersion(): Promise<void> {
    if (Date.now() - this.derniereVerification < 60_000) return;
    this.derniereVerification = Date.now();
    const r = await verifieVersion(import.meta.env.BASE_URL);
    if (r.etat === 'nouvelle' && r.derniere) afficheNouvelleVersion($('maj'), r.derniere);
  }

  private get multijoueur(): boolean {
    return !!this.client || (this.hote?.distants.size ?? 0) > 0;
  }

  // ——— Actions des menus ———
  enregistre(): void {
    enregistre(this.sauvegarde);
  }

  /** « 6× · 60 i/s » : la finesse d'affichage et la fluidité mesurée */
  diagnostic(): string {
    return this.rendu.diagnostic();
  }

  appliqueOptions(): void {
    this.synthe.volumes(this.sauvegarde.son, this.sauvegarde.musique);
    this.rendu.regle(this.sauvegarde.qualite);
  }

  lance(niveau: number, membre: number, reprise: Progression | null): void {
    this.arreteTout();
    this.membreVu = null;
    const p = new Partie(reprise ?? { niveau, drapeau: -1, vies: VIES_DEPART, score: 0 });
    p.ajouteJoueur(0, membre);
    p.onProgression = (prog, fini, niveauFini) => {
      this.sauvegarde.enCours = prog;
      if (fini && niveauFini !== undefined && !this.sauvegarde.faits.includes(niveauFini))
        this.sauvegarde.faits.push(niveauFini);
      this.enregistre();
    };
    this.partie = p;
    this.entreEnJeu();
  }

  async rejoins(r: Recherche, a: Annonce<AnnonceDkk>, pseudo: string, membre: number): Promise<void> {
    const c = await Client.rejoins(r, a, pseudo, membre);
    this.arreteTout();
    this.membreVu = null;
    this.client = c;
    c.onEvenements = (l) => this.evenements(l);
    c.onFerme = () => {
      if (this.client !== c) return;
      this.quitte();
      this.bulles.ajoute('NARRATEUR', 'La connexion avec l’hôte est perdue. Le concert est fini.');
    };
    history.replaceState(null, '', location.pathname + location.search);
    this.entreEnJeu();
  }

  ouvreHote(): Hote | null {
    if (!this.partie) return null;
    if (!this.hote) this.hote = new Hote(() => this.partie!, this.sauvegarde.pseudo || 'DKK');
    return this.hote;
  }

  reprend(): void {
    this.enPause = false;
    this.menus.ferme();
    $('bouton-pause').hidden = false;
  }

  quitte(): void {
    this.arreteTout();
    this.musique.joue(null);
    this.tactile.montre(false);
    for (const id of ['hud', 'bouton-pause', 'histoire', 'bulle']) $(id).hidden = true;
    this.menus.titre();
  }

  private mettreEnPause(): void {
    if (!this.partie && !this.client) return;
    this.enPause = true;
    $('bouton-pause').hidden = true;
    this.menus.pause();
  }

  private entreEnJeu(): void {
    this.menus.ferme();
    this.enPause = false;
    this.bulles.vide();
    this.rendu.camera.recadre();
    $('hud').hidden = false;
    $('bouton-pause').hidden = false;
    this.tactile.montre(matchMedia('(pointer: coarse)').matches);
    // en plein écran et en paysage sur téléphone, si le navigateur le permet
    if (matchMedia('(pointer: coarse)').matches && !document.fullscreenElement) {
      void document.documentElement
        .requestFullscreen?.()
        .then(() =>
          (screen.orientation as unknown as { lock?: (o: string) => Promise<void> }).lock?.('landscape'),
        )
        .catch(() => {});
    }
  }

  private arreteTout(): void {
    this.hote?.ferme();
    this.hote = null;
    this.client?.ferme();
    this.client = null;
    this.partie = null;
    this.derniereVue = null;
  }

  private suivant(): void {
    if (this.client) this.client.envoie({ t: 'suivant' });
    else this.partie?.suivant();
  }

  // ——— la boucle ———
  private commandes(): number {
    if (this.enPause || this.menus.ouvert || this.recrue.enCours) return 0;
    return this.clavier.commandes | this.tactile.commandes | commandesManette();
  }

  private boucle(t: number): void {
    requestAnimationFrame((x) => this.boucle(x));
    const dt = Math.min(250, t - (this.avant || t));
    this.avant = t;
    const bits = this.commandes();
    const appui = bits & ~this.bitsAvant;
    this.bitsAvant = bits;
    if (this.derniereVue && this.derniereVue.phase !== 'jeu' && appui & (C.SAUT | C.TIR)) this.suivant();

    if (this.partie) {
      const solo = !this.multijoueur;
      if (!((this.enPause || this.recrue.enCours) && solo)) {
        this.reste += dt;
        while (this.reste >= PAS_MS) {
          this.reste -= PAS_MS;
          this.pas(this.partie, bits);
        }
      }
      this.affiche(this.partie.vue(), this.partie.carte, 0);
    } else if (this.client) {
      this.reste += dt;
      while (this.reste >= PAS_MS) {
        this.reste -= PAS_MS;
        this.client.envoieCommandes(bits);
      }
      const v = this.client.vue();
      if (v && this.client.carte) this.affiche(v, this.client.carte, this.client.siege);
    }
    this.bulles.maj(t);
  }

  private pas(p: Partie, bits: number): void {
    p.commande(0, bits);
    const phaseAvant = p.phase;
    p.avance();
    const evts = p.releveEvenements();
    this.evenements(evts);
    this.hote?.diffuse(evts);
    if (p.phase === 'fin' && phaseAvant !== 'fin') {
      this.sauvegarde.enCours = null;
      this.enregistre();
    }
  }

  private evenements(l: readonly Evenement[]): void {
    this.rendu.evenements(l);
    const v = this.derniereVue;
    const siege = this.client?.siege ?? 0;
    const moi = v?.joueurs[siege];
    for (const e of l) {
      if (e.k === 'son') {
        const d = moi && (e.x || e.y) ? Math.hypot(e.x - moi.x, e.y - moi.y) : 0;
        this.bruitages.joue(e.n, d);
      } else if (e.k === 'bulle') this.bulles.ajoute(e.qui, e.texte);
    }
  }

  /**
   * Une recrue : le membre que l'on joue vient de changer. Au début de la partie (premier tour de jeu) et quand une cage
   * s'ouvre, on coupe la scène pour le présenter ; le remplaçant d'un héros tombé arrive sans cérémonie.
   */
  private annonceRecrue(v: EtatVue, siege: number): void {
    const moi = v.joueurs[siege];
    if (v.phase !== 'jeu' || !moi?.present) return;
    const avant = this.membreVu;
    const mort = this.etaitMort;
    this.membreVu = moi.membre;
    this.etaitMort = moi.mort;
    if (this.sauvegarde.membre !== moi.membre) {
      this.sauvegarde.membre = moi.membre;
      this.enregistre();
    }
    if (avant === null) this.recrue.joue(moi.membre, 'depart', () => this.appliqueOptions());
    else if (avant !== moi.membre && !mort && !moi.mort) this.recrue.joue(moi.membre, 'cage', () => {});
  }

  private affiche(v: EtatVue, carte: Carte, siege: number): void {
    this.derniereVue = v;
    this.annonceRecrue(v, siege);
    this.rendu.dessine(v, carte, siege);
    const noms: string[] = Array<string>(MAX_JOUEURS).fill('');
    if (this.client) for (const j of this.client.joueurs) noms[j.siege] = j.nom;
    else if (this.hote) {
      noms[0] = this.sauvegarde.pseudo || 'DKK';
      for (const d of this.hote.distants.values()) noms[d.siege] = d.nom;
    }
    this.hud.maj(v, siege, noms);
    this.histoire.maj(v);
    const theme = this.rendu.theme.musique;
    this.musique.joue(v.boss >= 0 ? 'boss' : theme);
  }
}
