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
import { Bulles, Histoire } from './ui/dialogues';
import { Hud } from './ui/hud';
import { Menus, type Actions } from './ui/menus';

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

  get estClient(): boolean {
    return !!this.client;
  }

  demarre(): void {
    chargeFeuilles(import.meta.env.BASE_URL);
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
    });
    this.clavier.onPause = () => (this.enPause ? this.reprend() : this.mettreEnPause());
    $('bouton-pause').addEventListener('click', () => this.mettreEnPause());
    this.tactile.montre(false);
    if (location.hash.startsWith('#salon=')) this.menus.rejoindre();
    else this.menus.titre();
    requestAnimationFrame((t) => this.boucle(t));
  }

  private get multijoueur(): boolean {
    return !!this.client || (this.hote?.distants.size ?? 0) > 0;
  }

  // ——— Actions des menus ———
  enregistre(): void {
    enregistre(this.sauvegarde);
  }

  appliqueOptions(): void {
    this.synthe.volumes(this.sauvegarde.son, this.sauvegarde.musique);
  }

  lance(niveau: number, membre: number, reprise: Progression | null): void {
    this.arreteTout();
    const p = new Partie(reprise ?? { niveau, drapeau: -1, vies: VIES_DEPART, score: 0 });
    p.ajouteJoueur(0, membre);
    p.onProgression = (prog, fini) => {
      this.sauvegarde.enCours = prog;
      if (fini) this.sauvegarde.niveauMax = Math.max(this.sauvegarde.niveauMax, prog.niveau);
      this.enregistre();
    };
    this.partie = p;
    this.entreEnJeu();
  }

  async rejoins(r: Recherche, a: Annonce<AnnonceDkk>, pseudo: string, membre: number): Promise<void> {
    const c = await Client.rejoins(r, a, pseudo, membre);
    this.arreteTout();
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
    if (this.enPause || this.menus.ouvert) return 0;
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
      if (!(this.enPause && solo)) {
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
      this.sauvegarde.niveauMax = NIVEAUX.length - 1;
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

  private affiche(v: EtatVue, carte: Carte, siege: number): void {
    this.derniereVue = v;
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
