import { Annuaire, Liaison, Veille, salonEnLigne, salonsDuReseau, type Annonce } from '@piascwal/lan-kit';
import { Carte } from '../monde/carte';
import { NB_TUILES, type Tuile } from '../monde/tuiles';
import { installeNiveau, niveauLu } from '../niveaux';
import { valideDef } from '../niveaux/mes-niveaux';
import type { EntiteVue, EtatVue, Evenement } from '../jeu/vue';
import { valideAnnonceDkk, type AnnonceDkk } from './annonce';
import {
  APP_DKK,
  VERSION_PROTOCOLE,
  decodeEtat,
  encodeCommandes,
  valideMsgHote,
  type MsgClient,
} from './protocole';

/** La recherche des parties : sur le Wi-Fi (automatique) ou par code. */
export class Recherche {
  readonly annonces = new Map<string, Annonce<AnnonceDkk>>();
  onMaj: () => void = () => {};

  private constructor(
    readonly annuaire: Annuaire<AnnonceDkk>,
    readonly enLigne: boolean,
    readonly ips: string[],
  ) {
    annuaire.onAnnonce = (a) => {
      this.annonces.set(a.id, a);
      this.onMaj();
    };
    annuaire.onRetrait = (id) => {
      this.annonces.delete(id);
      this.onMaj();
    };
  }

  static async wifi(): Promise<Recherche> {
    const { salons, ipsPubliques } = await salonsDuReseau(APP_DKK);
    return Recherche.ouvre(
      new Annuaire({ app: APP_DKK, salons, valideContenu: valideAnnonceDkk }),
      false,
      ipsPubliques,
    );
  }

  static async code(code: string): Promise<Recherche> {
    const salon = await salonEnLigne(APP_DKK, code);
    return Recherche.ouvre(
      new Annuaire({ app: APP_DKK, salons: [salon], valideContenu: valideAnnonceDkk }),
      true,
      [],
    );
  }

  private static async ouvre(a: Annuaire<AnnonceDkk>, enLigne: boolean, ips: string[]): Promise<Recherche> {
    const r = new Recherche(a, enLigne, ips);
    await a.ouvre();
    a.ecouteAnnonces();
    return r;
  }

  ferme(): void {
    this.annuaire.ferme();
  }
}

/**
 * Un joueur qui a rejoint une partie : il envoie ses commandes et reçoit la
 * vue de l'hôte, qu'il lisse entre deux instantanés.
 */
export class Client {
  siege = 0;
  niveau = 0;
  carte!: Carte;
  joueurs: { siege: number; nom: string }[] = [];
  onEvenements: (e: Evenement[]) => void = () => {};
  onFerme: () => void = () => {};
  private etat: EtatVue | null = null;
  private precedent: EtatVue | null = null;
  private recuA = 0;
  private intervalle = 33;
  private seq = 0;
  /** l'hôte nous a envoyé son niveau de l'éditeur : le rendu doit oublier ce qu'il avait gardé pour cet indice */
  niveauRecu = false;
  readonly veille: Veille;

  private constructor(
    readonly liaison: Liaison,
    enLigne: boolean,
  ) {
    this.veille = new Veille(liaison, () => liaison.ferme(), enLigne ? 15_000 : 6000);
  }

  /** Rejoint la partie annoncée ; échoue (Error) si elle est pleine, d'une autre version ou injoignable. */
  static async rejoins(r: Recherche, a: Annonce<AnnonceDkk>, nom: string, membre: number): Promise<Client> {
    const liaison = new Liaison(true, r.ips, { enLigne: r.enLigne });
    const reponse = new Promise<void>((ok, ko) => {
      r.annuaire.onSignal = (de, _salon, s) => {
        if (de !== a.id) return;
        if (s.type === 'refus') ko(new Error(s.raison));
        else if (s.type === 'reponse') void liaison.accepteReponse(s.sdp).then(ok, ko);
      };
      setTimeout(() => ko(new Error('délai')), 20_000);
    });
    try {
      const sdp = await liaison.creeOffre();
      await r.annuaire.signale(a.id, a.salon, { type: 'offre', sdp, nom, spect: false });
      await reponse;
      await liaison.ouverte();
    } catch (e) {
      liaison.ferme();
      throw e;
    }
    return Client.surLiaison(liaison, r.enLigne, nom, membre);
  }

  /** Sur une liaison ouverte : se présente à l'hôte et attend son accueil. */
  static async surLiaison(liaison: Liaison, enLigne: boolean, nom: string, membre: number): Promise<Client> {
    const c = new Client(liaison, enLigne);
    try {
      await c.accueil(nom, membre);
    } catch (e) {
      c.ferme();
      throw e;
    }
    return c;
  }

  private accueil(nom: string, membre: number): Promise<void> {
    return new Promise((ok, ko) => {
      const garde = setTimeout(() => ko(new Error('délai')), 10_000);
      this.liaison.onCtrl = (brut) => {
        if (this.veille.recu(brut as { t: string })) return;
        const m = valideMsgHote(brut);
        if (!m) return;
        if (m.t === 'refus') {
          clearTimeout(garde);
          ko(new Error(m.raison));
        } else if (m.t === 'def') {
          // un niveau de l'éditeur de l'hôte : on le relit (il vient d'ailleurs) avant de le jouer
          const def = valideDef(m.def, `hote-${m.niveau}`);
          if (!def) {
            clearTimeout(garde);
            return ko(new Error('niveau'));
          }
          installeNiveau(m.niveau, def);
          this.niveauRecu = true;
        } else if (m.t === 'bienvenue') {
          clearTimeout(garde);
          this.siege = m.siege;
          this.chargeCarte(m.niveau, m.carte);
          ok();
        } else if (m.t === 'niveau') this.chargeCarte(m.niveau, m.carte);
        else if (m.t === 'ev') this.appliqueEvenements(m.l);
        else if (m.t === 'joueurs') this.joueurs = m.l;
      };
      this.liaison.onJeu = (data) => {
        this.veille.recuJeu();
        const e = decodeEtat(data);
        if (!e || (this.etat && e.tick <= this.etat.tick)) return;
        const t = performance.now();
        if (this.etat) this.intervalle = this.intervalle * 0.8 + Math.min(100, t - this.recuA) * 0.2;
        this.precedent = this.etat;
        this.etat = e;
        this.recuA = t;
      };
      this.liaison.onFerme = () => {
        this.veille.arrete();
        this.onFerme();
      };
      this.envoie({ t: 'salut', nom, membre, v: VERSION_PROTOCOLE });
    });
  }

  private chargeCarte(niveau: number, texte: string): void {
    const lu = niveauLu(niveau);
    this.niveau = niveau;
    this.carte = new Carte(lu.largeur, lu.hauteur, lu.tuiles, lu.fond);
    this.carte.appliqueTexte(texte);
  }

  private appliqueEvenements(l: Evenement[]): void {
    for (const e of l) {
      if (e.k !== 'tuile' || ![e.x, e.y, e.t].every(Number.isInteger) || e.t < 0 || e.t >= NB_TUILES)
        continue;
      this.carte.pose(e.x, e.y, e.t as Tuile);
    }
    this.carte.modifications = [];
    this.onEvenements(l);
  }

  envoie(m: MsgClient): void {
    this.liaison.envoieCtrl(m);
  }

  envoieCommandes(bits: number): void {
    this.liaison.envoieJeu(encodeCommandes(bits, this.seq++));
  }

  /** La vue à dessiner maintenant : positions lissées entre les deux derniers instantanés. */
  vue(): EtatVue | null {
    const e = this.etat;
    const p = this.precedent;
    if (!e || !p) return e;
    const t = Math.min(1, (performance.now() - this.recuA) / this.intervalle);
    const avant = new Map(p.entites.map((x) => [x.id, x]));
    const lisse = (x: EntiteVue): EntiteVue => {
      const a = avant.get(x.id);
      if (!a || a.g !== x.g || Math.abs(a.x - x.x) > 48) return x;
      return { ...x, x: a.x + (x.x - a.x) * t, y: a.y + (x.y - a.y) * t };
    };
    return { ...e, entites: e.entites.map(lisse) };
  }

  ferme(): void {
    this.veille.arrete();
    this.liaison.ferme();
  }
}
