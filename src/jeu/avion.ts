import { MAX_JOUEURS } from '../config';
import { C, EtatCommandes } from './commandes';
import {
  BAS,
  BONUS,
  estBonus,
  estObstacle,
  HAUT_TAPIS,
  LONGUEURS,
  parcours,
  RAMPE,
  VOIES,
  voieAgent,
  type Objet,
} from './avion-parcours';
import * as R from './avion-regles';
import { OBJETS_RECENTS, vueDuConcours, type EtapeAvion, type VueAvion } from './vue-avion';

export {
  DECOLLAGE,
  DEPART_AVION,
  DUREE_EMBARQUE,
  DUREE_FIN,
  DUREE_INTRO,
  GRIMPE,
  envolApresEmbarquement,
  DUREE_RESULTAT,
  PORTEE,
  xAvion,
} from './avion-regles';

const VALIDE = C.SAUT | C.TIR;

/** L'avion de JBG, le niveau du mini-jeu (indice dans NIVEAUX) : entre la tournée et le Breizh Tour. */
export const NIVEAU_AVION = 15;

/**
 * L'avion de JBG (un mini-jeu façon Subway Surfers, de profil) : un hommage au jour où JBG a raté l'avion pour Madrid. Cette
 * fois, l'avion des DKK pour la Bretagne roule déjà sur la piste ; JBG court sur le tarmac, change de voie, saute, ramasse
 * les cartes d'embarquement et les bonus ; chaque faux pas lui fait perdre du terrain. Sur la voie du haut, quand l'échelle de
 * la porte arrière est à portée, il saute dessus. Chaque joueur court à son tour.
 */
export class ConcoursAvion {
  etape: EtapeAvion = 'intro';
  tours: number[];
  tour = 0;
  manche = 0;
  minuteur = 0;
  temps = 0;
  x = 0;
  voie = 0;
  voieVue = 0;
  z = 0;
  vz = 0;
  /** le convoyeur sur le tapis duquel il court (indice dans le tarmac), ou -1 */
  tapis = -1;
  trebuche = 0;
  invulnerable = 0;
  bonus = -1;
  bonusReste = 0;
  cartes = 0;
  chutes = 0;
  embarque = false;
  score = 0;
  consommes: number[] = [];
  scores: (number | null)[] = Array(MAX_JOUEURS).fill(null);
  fini = false;
  private pris = new Set<number>();
  private premier = 0;
  private alea: Objet[] = parcours(0);
  private readonly commandes = Array.from({ length: MAX_JOUEURS }, () => new EtatCommandes());

  constructor(
    sieges: readonly number[],
    readonly miniJeu: boolean,
  ) {
    this.tours = sieges.length ? [...sieges] : [0];
    this.nouvelleCourse();
  }

  get siege(): number {
    return this.tours[this.tour]!;
  }

  /** Le tarmac de cette course. */
  get tarmac(): Objet[] {
    return this.alea;
  }

  /** La hauteur de JBG au-dessus du tarmac (le tapis d'un convoyeur compris). */
  get elevation(): number {
    return this.z + (this.tapis >= 0 ? HAUT_TAPIS : 0);
  }

  maj(bits: ArrayLike<number>, presents: readonly number[], son: (nom: string) => void): void {
    for (let s = 0; s < MAX_JOUEURS; s++) this.commandes[s]!.avance(bits[s] ?? 0);
    if (this.etape !== 'podium' && !presents.includes(this.siege)) {
      this.tourSuivant(presents);
      return;
    }
    const k = this.commandes[this.siege]!;
    if (this.minuteur > 0) this.minuteur--;
    switch (this.etape) {
      case 'intro':
        if (this.minuteur === 0 || k.appuye(VALIDE)) {
          this.etape = 'course';
          son('moteur');
        }
        break;
      case 'course':
        this.course(k, son);
        break;
      case 'embarque':
      case 'rate':
        this.temps++;
        if (this.etape === 'embarque' && this.minuteur === R.MINUTEUR_ENVOL) son('moteur');
        if (this.minuteur === 0) this.termine();
        break;
      case 'resultat':
        if (this.minuteur === 0 || (this.minuteur < R.DUREE_RESULTAT - R.ATTENTE_APPUI && k.appuye(VALIDE)))
          this.tourSuivant(presents);
        break;
      case 'podium':
        // BAS : on rejoue la manche ; SAUT : on passe au niveau suivant (l'histoire) ou on rejoue (le menu)
        if (this.minuteur === 0 && presents.some((s) => this.commandes[s]!.appuye(C.BAS)))
          this.recommence(presents);
        else if (this.minuteur === 0 && presents.some((s) => this.commandes[s]!.appuye(VALIDE))) {
          if (this.miniJeu) this.recommence(presents);
          else this.fini = true;
        }
        break;
    }
  }

  /** Un pas de course : changer de voie, sauter, avancer, ramasser, se cogner ; l'avion à portée, ou parti. */
  private course(k: EtatCommandes, son: (nom: string) => void): void {
    this.temps++;
    if (k.appuye(C.HAUT) && this.voie < VOIES - 1) this.changeVoie(1);
    if (k.appuye(C.BAS) && this.voie > 0) this.changeVoie(-1);
    this.voieVue +=
      Math.sign(this.voie - this.voieVue) * Math.min(Math.abs(this.voie - this.voieVue), 10 * R.DT);
    const avion = R.xAvion(this.temps);
    const aPortee = avion - this.x <= R.PORTEE;
    if (k.appuye(VALIDE) && aPortee && this.voie === VOIES - 1) {
      this.etape = 'embarque';
      this.embarque = true;
      this.minuteur = R.DUREE_EMBARQUE;
      son('liberation');
      return;
    }
    if (k.appuye(VALIDE) && this.z === 0) {
      this.vz = this.bonusEst('ressorts') ? R.SAUT_RESSORTS : R.SAUT;
      son('saut');
    }
    if (this.z > 0 || this.vz > 0) {
      this.vz -= R.PESANTEUR * R.DT;
      this.z = Math.max(0, this.z + this.vz * R.DT);
      if (this.z === 0) this.vz = 0;
    }
    const v = this.trebuche > 0 ? R.LENT : this.bonusEst('trottinette') ? R.TROTTINETTE : R.VITESSE;
    // à portée de l'échelle, il ne peut pas la dépasser : il court sous la porte arrière en attendant de sauter
    this.x = Math.min(this.x + v * R.DT, aPortee ? Math.max(this.x, avion) : Infinity);
    if (this.trebuche > 0) this.trebuche--;
    if (this.invulnerable > 0) this.invulnerable--;
    if (this.bonusReste > 0 && --this.bonusReste === 0) this.bonus = -1;
    this.tarmacSousLesPieds(son);
    if (this.temps / R.SECONDE >= R.DECOLLAGE) {
      this.etape = 'rate';
      this.minuteur = R.DUREE_FIN;
      son('moteur');
    }
  }

  private bonusEst = (nom: (typeof BONUS)[number]): boolean => this.bonus === BONUS.indexOf(nom);

  private changeVoie(sens: number): void {
    this.voie += sens;
    if (this.tapis >= 0) {
      // on quitte le tapis par le côté : on retombe sur le tarmac
      this.z = HAUT_TAPIS + this.z;
      this.tapis = -1;
    }
  }

  private prend(i: number): void {
    this.pris.add(i);
    this.consommes = [...this.consommes.slice(1 - OBJETS_RECENTS), i];
  }

  /** Ce qu'il y a sur le tarmac autour de JBG : les cartes, les bonus, le tapis d'un convoyeur, les obstacles. */
  private tarmacSousLesPieds(son: (nom: string) => void): void {
    const t = this.alea;
    const s = this.temps / R.SECONDE;
    while (this.premier < t.length && t[this.premier]!.x + 90 < this.x) this.premier++;
    const tapis = this.tapis >= 0 ? t[this.tapis]! : null;
    if (tapis && this.x > tapis.x + LONGUEURS.convoyeur) {
      this.z = HAUT_TAPIS + this.z; // au bout du tapis, il saute en bas
      this.tapis = -1;
    }
    for (let i = this.premier; i < t.length && t[i]!.x < this.x + R.PORTEE_AIMANT; i++) {
      const o = t[i]!;
      if (this.pris.has(i)) continue;
      const devant = o.x - this.x;
      if (
        this.bonusEst('solo') &&
        estObstacle(o) &&
        o.sorte !== 'convoyeur' &&
        devant > 0 &&
        devant < R.PORTEE_SOLO
      ) {
        this.prend(i); // les notes du solo le pulvérisent
        son('explosion');
        continue;
      }
      if (o.sorte === 'carte') {
        const attire = this.bonusEst('aimant') && devant < R.PORTEE_AIMANT && devant > -10;
        const touche =
          o.voie === this.voie && Math.abs(devant) < 8 && Math.abs(this.elevation - o.hauteur) < 12;
        if (attire || touche) {
          this.prend(i);
          this.cartes++;
          son('tintement');
        }
        continue;
      }
      const voie = o.sorte === 'agent' ? voieAgent(o, s) : o.voie;
      if (voie !== this.voie) continue;
      const long = estObstacle(o) ? LONGUEURS[o.sorte] : 8;
      // un peu de tolérance : un obstacle frôlé n'est pas un faux pas
      const marge = estObstacle(o) ? R.TOLERANCE : 0;
      if (this.x + 4 - marge < o.x || this.x - 4 + marge > o.x + long) continue;
      if (estBonus(o)) {
        if (this.elevation > 18) continue;
        this.prend(i);
        this.bonus = BONUS.indexOf(o.sorte);
        this.bonusReste = R.DUREES[o.sorte] * R.SECONDE;
        son('ramasse');
        continue;
      }
      if (o.sorte === 'convoyeur') {
        if (this.tapis === i) continue;
        // par l'arrière (la rampe), ou en lui retombant dessus : on court sur le tapis ; sinon on s'y cogne par le côté
        if (this.x < o.x + RAMPE || this.z >= HAUT_TAPIS - 2) {
          if (this.vz > 0 && this.z > 0) continue;
          this.tapis = i;
          this.z = Math.max(0, this.z - HAUT_TAPIS);
          this.vz = Math.min(0, this.vz);
          continue;
        }
      } else if (this.tapis >= 0)
        continue; // là-haut, rien ne le touche
      else if (
        BAS.has(o.sorte as never)
          ? this.z > R.HAUT_BAS
          : this.bonusEst('ressorts') && this.z > R.HAUT_RESSORTS
      )
        continue;
      this.choc(i, son);
    }
  }

  /** Un faux pas : il trébuche (et perd du terrain sur l'avion), sauf si la trottinette encaisse le choc pour lui. */
  private choc(i: number, son: (nom: string) => void): void {
    if (this.invulnerable > 0) return;
    if (this.bonusEst('trottinette')) {
      this.bonus = -1;
      this.bonusReste = 0;
      this.invulnerable = R.INTOUCHABLE;
      son('boum');
      return;
    }
    this.trebuche = R.TREBUCHE;
    this.invulnerable = R.INTOUCHABLE;
    this.chutes++;
    son(this.alea[i]!.sorte === 'flaque' ? 'chute' : 'aie');
  }

  /** La course est finie : les cartes, et s'il est dans l'avion, l'embarquement et son avance sur le décollage. */
  private termine(): void {
    const avance = Math.max(0, R.DECOLLAGE - this.temps / R.SECONDE);
    this.score =
      this.cartes * R.POINTS_CARTE +
      (this.embarque ? R.POINTS_EMBARQUE + Math.floor(avance) * R.POINTS_SECONDE : 0);
    const avant = this.scores[this.siege];
    if (avant === null || avant === undefined || this.score > avant) this.scores[this.siege] = this.score;
    this.etape = 'resultat';
    this.minuteur = R.DUREE_RESULTAT;
  }

  private nouvelleCourse(): void {
    this.manche = (this.manche + 1) % 256;
    this.alea = parcours(this.manche);
    this.etape = 'intro';
    this.minuteur = R.DUREE_INTRO;
    this.temps = 0;
    this.x = 0;
    this.voie = this.voieVue = 1;
    this.z = this.vz = 0;
    this.tapis = -1;
    this.trebuche = this.invulnerable = 0;
    this.bonus = -1;
    this.bonusReste = 0;
    this.cartes = this.chutes = this.score = 0;
    this.embarque = false;
    this.consommes = [];
    this.pris = new Set();
    this.premier = 0;
  }

  private tourSuivant(presents: readonly number[]): void {
    do this.tour++;
    while (this.tour < this.tours.length && !presents.includes(this.siege));
    if (this.tour < this.tours.length) return this.nouvelleCourse();
    this.tour = Math.max(0, this.tours.length - 1);
    this.etape = 'podium';
    this.minuteur = R.ATTENTE_APPUI;
  }

  private recommence(presents: readonly number[]): void {
    this.tours = presents.length ? [...presents] : [0];
    this.tour = 0;
    this.scores = Array(MAX_JOUEURS).fill(null);
    this.nouvelleCourse();
  }

  vue(): VueAvion {
    return vueDuConcours(this);
  }
}
