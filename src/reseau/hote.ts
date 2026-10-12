import {
  Annuaire,
  Liaison,
  Veille,
  genereCode,
  salonEnLigne,
  salonsDuReseau,
  type Signal,
} from '@piascwal/lan-kit';
import { MAX_JOUEURS } from '../config';
import type { Partie } from '../jeu/partie';
import type { Evenement } from '../jeu/vue';
import { valideAnnonceDkk, type AnnonceDkk } from './annonce';
import {
  APP_DKK,
  VERSION_PROTOCOLE,
  decodeCommandes,
  encodeEtat,
  valideMsgClient,
  type MsgHote,
} from './protocole';

interface Distant {
  siege: number;
  nom: string;
  liaison: Liaison;
  veille: Veille;
}

/**
 * L'appareil qui héberge : il fait tourner la partie et l'ouvre aux autres,
 * sur le même Wi-Fi (sans rien saisir) et/ou par Internet (avec un code).
 * Les joueurs peuvent rejoindre à tout moment, jusqu'à 4.
 */
export class Hote {
  readonly distants = new Map<number, Distant>();
  code: string | null = null;
  wifi: 'ferme' | 'ouvert' | 'erreur' = 'ferme';
  /** prévient l'interface : arrivée, départ, ping */
  onChange: () => void = () => {};
  private annuaires: Annuaire<AnnonceDkk>[] = [];
  private generation = -1;
  private dernierAnnonce = 0;

  constructor(
    private readonly partie: () => Partie,
    private readonly nom: string,
  ) {}

  get ouvert(): boolean {
    return this.annuaires.length > 0;
  }

  async ouvreWifi(): Promise<void> {
    try {
      const { salons, ipsPubliques } = await salonsDuReseau(APP_DKK);
      await this.branche(
        new Annuaire({ app: APP_DKK, salons, valideContenu: valideAnnonceDkk, testament: true }),
        false,
        ipsPubliques,
      );
      this.wifi = 'ouvert';
    } catch {
      this.wifi = 'erreur';
    }
    this.onChange();
  }

  /** Ouvre un salon sur Internet et renvoie son code, à donner aux amis. */
  async ouvreInternet(): Promise<string> {
    if (this.code) return this.code;
    const code = genereCode();
    const salon = await salonEnLigne(APP_DKK, code);
    await this.branche(
      new Annuaire({ app: APP_DKK, salons: [salon], valideContenu: valideAnnonceDkk, testament: true }),
      true,
      [],
    );
    this.code = code;
    this.onChange();
    return code;
  }

  private async branche(a: Annuaire<AnnonceDkk>, enLigne: boolean, ips: string[]): Promise<void> {
    a.onSignal = (de, salon, s) => void this.accueille(a, de, salon, s, enLigne, ips);
    await a.ouvre();
    this.annuaires.push(a);
    a.annonce(this.annonce());
  }

  private annonce(): AnnonceDkk {
    return { nom: this.nom, niveau: this.partie().niveau, joueurs: 1 + this.distants.size };
  }

  private siegeLibre(): number {
    for (let s = 1; s < MAX_JOUEURS; s++) if (!this.distants.has(s)) return s;
    return -1;
  }

  private async accueille(
    a: Annuaire<AnnonceDkk>,
    de: string,
    salon: number,
    s: Signal,
    enLigne: boolean,
    ips: string[],
  ): Promise<void> {
    if (s.type !== 'offre') return;
    if (this.siegeLibre() < 0) return void a.signale(de, salon, { type: 'refus', raison: 'complet' });
    const liaison = new Liaison(true, ips, { enLigne });
    try {
      const sdp = await liaison.accepteOffre(s.sdp);
      await a.signale(de, salon, { type: 'reponse', sdp });
      await liaison.ouverte();
    } catch {
      liaison.ferme();
      return;
    }
    this.accueilleLiaison(liaison, enLigne);
  }

  /** Une liaison ouverte : on attend le « salut » du joueur, puis il a un siège. */
  accueilleLiaison(liaison: Liaison, enLigne: boolean): void {
    let distant: Distant | null = null;
    const veille = new Veille(liaison, () => liaison.ferme(), enLigne ? 15_000 : 6000);
    liaison.onCtrl = (brut) => {
      if (veille.recu(brut as { t: string })) return;
      const m = valideMsgClient(brut);
      if (!m) return;
      if (m.t === 'suivant') this.partie().suivant();
      else if (m.t === 'salut' && !distant) {
        if (m.v !== VERSION_PROTOCOLE) return this.envoie(liaison, { t: 'refus', raison: 'version' });
        const siege = this.siegeLibre();
        if (siege < 0) return this.envoie(liaison, { t: 'refus', raison: 'complet' });
        distant = { siege, nom: m.nom, liaison, veille };
        this.distants.set(siege, distant);
        const p = this.partie();
        p.ajouteJoueur(siege, m.membre);
        this.envoie(liaison, { t: 'bienvenue', siege, niveau: p.niveau, carte: p.carte.versTexte() });
        this.annonceJoueurs();
      }
    };
    liaison.onJeu = (data) => {
      veille.recuJeu();
      const c = decodeCommandes(data);
      if (c && distant) this.partie().commande(distant.siege, c.bits);
    };
    liaison.onFerme = () => {
      veille.arrete();
      if (!distant) return;
      this.distants.delete(distant.siege);
      this.partie().retireJoueur(distant.siege);
      this.annonceJoueurs();
    };
  }

  private envoie(l: Liaison, m: MsgHote): void {
    l.envoieCtrl(m);
  }

  private annonceJoueurs(): void {
    const l = [
      { siege: 0, nom: this.nom },
      ...[...this.distants.values()].map((d) => ({ siege: d.siege, nom: d.nom })),
    ];
    for (const d of this.distants.values()) this.envoie(d.liaison, { t: 'joueurs', l });
    for (const a of this.annuaires) a.annonce(this.annonce());
    this.onChange();
  }

  /** À chaque pas de la partie : évènements (fiables), carte si elle a changé, et un instantané sur deux. */
  diffuse(evenements: Evenement[]): void {
    const p = this.partie();
    if (p.generation !== this.generation) {
      const premiere = this.generation === -1;
      this.generation = p.generation;
      if (!premiere)
        for (const d of this.distants.values())
          this.envoie(d.liaison, { t: 'niveau', niveau: p.niveau, carte: p.carte.versTexte() });
    }
    if (!this.distants.size) return;
    // les tuiles déjà envoyées avec la carte complète ne sont pas renvoyées
    if (evenements.length)
      for (const d of this.distants.values()) this.envoie(d.liaison, { t: 'ev', l: evenements });
    if (p.tick % 2 === 0) {
      const instantane = encodeEtat(p.vue());
      for (const d of this.distants.values()) d.liaison.envoieJeu(instantane);
    }
    if (performance.now() - this.dernierAnnonce > 10_000) {
      this.dernierAnnonce = performance.now();
      for (const a of this.annuaires) a.annonce(this.annonce());
    }
  }

  ferme(): void {
    for (const d of this.distants.values()) d.liaison.ferme();
    for (const a of this.annuaires) a.ferme();
    this.annuaires = [];
    this.distants.clear();
    this.code = null;
    this.wifi = 'ferme';
  }
}
