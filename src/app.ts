import type { Annonce } from '@piascwal/lan-kit';
import { Musique } from './audio/musique';
import { Bruitages } from './audio/sons';
import { Synthe } from './audio/synthe';
import { VIES_DEPART } from './config';
import { Clavier, commandesManette } from './entrees/clavier';
import { Tactile } from './entrees/tactile';
import { iconeDeLArme } from './ui/icones-hud';
import { C } from './jeu/commandes';
import { nouveauMiniJeu, PHASES_MINI_JEUX, type MiniJeu } from './jeu/mini-jeux';
import { Partie } from './jeu/partie';
import { charge, enregistre, retiensRecords, type Progression, type Sauvegarde } from './jeu/sauvegarde';
import { partieSauvegardee } from './jeu/partie-sauvegardee';
import type { EtatVue, Evenement } from './jeu/vue';
import type { AnnonceDkk } from './reseau/annonce';
import { Client, type Recherche } from './reseau/client';
import { Hote } from './reseau/hote';
import type { Carte } from './monde/carte';
import { chargeFeuilles } from './rendu/feuilles-images';
import { Rendu } from './rendu/rendu';
import { Intro } from './ui/intro';
import { EntreeBoss } from './ui/entree-boss';
import { Recrue } from './ui/recrue';
import { prepareInstallation } from './ui/installation';
import { Bulles, Histoire } from './ui/dialogues';
import { Hud } from './ui/hud';
import { controleurDeVersion, ecouteLaFenetre, joueEvenements, nomsDesJoueurs } from './ui/app-aides';
import { Menus, type Actions } from './ui/menus';
import { pleinEcran } from './ui/plein-ecran';
import { FinMiniJeu } from './ui/fin-mini-jeu';
import { SuiviRecrue } from './ui/suivi-recrue';
import { NIVEAUX } from './niveaux';
import type { ReglesArene } from './jeu/arene';
import type { CarteArene } from './ui/menus-arene';
import { ouvreEditeurDe, partieArene, partieEssai } from './ui/app-arene';
import type { DefNiveau } from './niveaux/format';
import { PanneauArene } from './ui/arene-ui';

const PAS_MS = 1000 / 60;
/** Les phases où SAUT et TIR servent au jeu (les mini-jeux passent leurs écrans eux-mêmes) : ils ne tournent pas les pages. */
const EN_ACTION: ReadonlySet<string> = new Set(['jeu', ...PHASES_MINI_JEUX]);
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
  private readonly rendu = new Rendu($('toile') as HTMLCanvasElement, () => this.sauvegarde.faits);
  private readonly hud = new Hud($('hud'));
  private readonly bulles = new Bulles($('bulle'));
  private readonly histoire = new Histoire(
    $('histoire'),
    () => this.suivant(),
    (nom) => this.bruitages.joue(nom),
  );
  private readonly clavier = new Clavier();
  private readonly tactile = new Tactile($('jeu'));
  private readonly finMini = new FinMiniJeu($('jeu'));
  private readonly menus = new Menus($('ecran'), this);
  private readonly arene = new PanneauArene($('jeu'), {
    suivant: () => this.suivant(),
    inviter: () => (this.mettreEnPause(), this.menus.inviter()),
    quitte: () => this.quitte(),
    partie: () => this.partie,
    place: (n) =>
      this.client ? this.client.envoie({ t: 'place', n }) : this.partie?.arene?.choisitPlace(0, n),
  });
  private partie: Partie | null = null;
  private hote: Hote | null = null;
  private client: Client | null = null;
  private enPause = false;
  private reste = 0;
  private avant = 0;
  private bitsAvant = 0;
  private derniereVue: EtatVue | null = null;
  private recrue!: Recrue;
  private readonly entreeBoss = new EntreeBoss();
  private readonly suiviRecrue = new SuiviRecrue(
    () => this.recrue,
    this.sauvegarde,
    () => this.enregistre(),
    () => this.appliqueOptions(),
  );
  /** l'essai d'un niveau de l'éditeur : de quoi y revenir, à la fin du niveau ou en le quittant */
  private essai: (() => void) | null = null;

  get estClient(): boolean {
    return !!this.client;
  }

  get estArene(): boolean {
    return !!this.partie?.arene || !!this.derniereVue?.arene;
  }

  demarre(): void {
    this.recrue = new Recrue($('intro') as HTMLCanvasElement, this.synthe);
    chargeFeuilles(import.meta.env.BASE_URL);
    // l'application installable : quand le navigateur propose de l'installer, le menu titre affiche le bouton
    prepareInstallation(import.meta.env.BASE_URL, () => {
      if (!this.partie && !this.client) this.menus.rafraichitTitre();
    });
    ecouteLaFenetre({
      synthe: this.synthe,
      geste: () => this.appliqueOptions(),
      recalibre: () => this.rendu.redimensionne(),
      entree: () => this.derniereVue && !EN_ACTION.has(this.derniereVue.phase) && this.suivant(),
      cache: () => this.partie && !this.multijoueur && this.mettreEnPause(),
      revient: () => this.controleVersion(),
    });
    this.clavier.onPause = () => (this.enPause ? this.reprend() : this.mettreEnPause());
    $('bouton-pause').addEventListener('click', () => this.mettreEnPause());
    this.tactile.montre(false);
    // après un rechargement de mise à jour, on retire le paramètre ?v= de l'adresse
    if (location.search.includes('v=')) history.replaceState(null, '', location.pathname + location.hash);
    this.controleVersion();
    if (location.hash.startsWith('#salon=')) this.menus.rejoindre();
    else {
      this.menus.titre();
      new Intro($('intro') as HTMLCanvasElement, this.synthe, () => this.appliqueOptions()).lance();
    }
    requestAnimationFrame((t) => this.boucle(t));
  }

  private readonly controleVersion = controleurDeVersion($('maj'));

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
    const prog = reprise ?? { niveau, drapeau: -1, vies: VIES_DEPART, score: 0 };
    const p = partieSauvegardee(prog, this.sauvegarde, () => this.enregistre());
    p.ajouteJoueur(0, membre);
    this.joue(p);
  }

  ouvreEditeur(): void {
    ouvreEditeurDe(this.menus, (def, retour) => this.teste(def, retour));
  }

  /** L'essai d'un niveau (de l'éditeur, ou refait), sans rien sauvegarder ; au bilan (ou en quittant), `retour`. */
  teste(def: DefNiveau, retour: () => void): void {
    this.joue(partieEssai(def, this.sauvegarde.membre), retour);
  }

  /** Le battle royale : contre l'ordinateur, ou (sans IA) un salon ouvert sur le Wi-Fi, en attendant les amis. */
  lanceArene(carte: CarteArene, regles: ReglesArene, ia: number): void {
    this.joue(partieArene(carte, regles, ia, this.sauvegarde.membre));
    if (!ia) void this.ouvreHote()?.ouvreWifi();
  }

  lanceMiniJeu(quel: MiniJeu): void {
    this.joue(nouveauMiniJeu(quel, this.sauvegarde.membre));
  }

  /** Une partie qui tourne ici ; `essai` : de quoi revenir à l'éditeur à la fin. */
  private joue(p: Partie, essai: (() => void) | null = null): void {
    this.arreteTout();
    this.suiviRecrue.oublie();
    this.arene.videFil();
    this.partie = p;
    this.essai = essai;
    this.entreEnJeu();
  }

  async rejoins(r: Recherche, a: Annonce<AnnonceDkk>, pseudo: string, membre: number): Promise<void> {
    const c = await Client.rejoins(r, a, pseudo, membre);
    this.arreteTout();
    this.suiviRecrue.oublie();
    this.client = c;
    if (c.niveauRecu) this.rendu.oublieNiveau();
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

  /** Depuis la pause : refait le niveau (seul l'hôte le peut) et reprend. */
  recommence(depuisLeDebut: boolean): void {
    if (!this.partie || this.client) return;
    this.partie.recommence(depuisLeDebut);
    this.reprend();
  }

  /** Vrai si la partie a passé un drapeau : on peut alors recommencer à celui-ci plutôt qu'au départ. */
  get aUnDrapeau(): boolean {
    return (this.partie?.drapeau ?? -1) >= 0;
  }

  quitte(): void {
    this.arreteTout();
    this.musique.joue(null);
    this.tactile.montre(false);
    for (const id of ['hud', 'bouton-pause', 'histoire', 'bulle']) $(id).hidden = true;
    const essai = this.essai;
    this.essai = null;
    if (essai) {
      this.menus.ferme();
      essai();
    } else this.menus.titre();
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
    if (matchMedia('(pointer: coarse)').matches) pleinEcran();
  }

  private arreteTout(): void {
    this.arene.maj(null, 0, false, []);
    this.hote?.ferme();
    this.hote = null;
    this.client?.ferme();
    this.client = null;
    this.partie = null;
    this.derniereVue = null;
  }

  private suivant(): void {
    if (this.histoire.retient()) return; // une pile de photos : ce toucher pose la suivante
    if (this.client) this.client.envoie({ t: 'suivant' });
    else this.partie?.suivant();
  }

  // ——— la boucle ———
  private commandes(): number {
    if (this.enPause || this.menus.ouvert || this.recrue.enCours || this.entreeBoss.enCours) return 0;
    return this.clavier.commandes | this.tactile.commandes | commandesManette() | this.finMini.commandes;
  }

  private boucle(t: number): void {
    requestAnimationFrame((x) => this.boucle(x));
    const dt = Math.min(250, t - (this.avant || t));
    this.avant = t;
    const bits = this.commandes();
    const appui = bits & ~this.bitsAvant;
    this.bitsAvant = bits;
    if (this.derniereVue && !EN_ACTION.has(this.derniereVue.phase) && appui & (C.SAUT | C.TIR))
      this.suivant();

    if (this.partie) {
      // seul, la partie attend pendant la pause et une scène coupée (recrue, entrée d'un boss)
      if (this.multijoueur || !(this.enPause || this.recrue.enCours || this.entreeBoss.enCours)) {
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
    const siege = this.client?.siege ?? 0;
    joueEvenements(l, this.derniereVue, siege, this.bruitages, this.bulles, (e) => this.arene.elimination(e));
  }

  private affiche(v: EtatVue, carte: Carte, siege: number): void {
    if (this.essai && v.phase === 'bilan') return this.quitte(); // l'essai d'un niveau de l'éditeur est fini
    this.derniereVue = v;
    this.finMini.maj(v);
    this.suiviRecrue.maj(v, siege);
    this.entreeBoss.maj(v);
    this.rendu.dessine(v, carte, siege);
    if (retiensRecords(this.sauvegarde, v)) this.enregistre();
    const noms = nomsDesJoueurs(this.client, this.hote, this.sauvegarde.pseudo);
    this.hud.maj(v, siege, noms);
    this.arene.maj(v, siege, !this.client, noms);
    const moi = v.joueurs[siege];
    this.tactile.pilote(v.phase);
    this.tactile.arme(moi?.present && moi.arme ? iconeDeLArme(moi.arme, 34) : null, moi?.munitions ?? 0);
    this.histoire.maj(v);
    this.musique.joue(v.boss >= 0 ? 'boss' : this.rendu.theme.musique);
  }
}
