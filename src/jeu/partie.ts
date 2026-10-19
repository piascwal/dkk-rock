import {
  BPM,
  DELAI_REAPPARITION,
  HEROS_HAUTEUR,
  HEROS_LARGEUR,
  MAX_JOUEURS,
  TICKS_PAR_SECONDE,
  TUILE,
} from '../config';
import { Aleatoire } from '../moteur/maths';
import { Carte } from '../monde/carte';
import { Joueur } from '../entites/joueur';
import { Projectile } from '../entites/projectile';
import { Boss } from '../entites/ennemis/boss';
import { DjBoucle } from '../entites/ennemis/dj';
import { ATTENTE_VAN, Objet } from '../entites/objets';
import { niveauLu } from '../niveaux';
import { suivantDansMonde } from '../niveaux/arcs';
import type { NiveauLu } from '../niveaux/format';
import { pagesDe } from '../histoire/pages';
import type { Camp, Cible, Contexte, EntiteSimulee, Tyrolienne } from './contexte';
import { explose } from './explosions';
import { zoneVisible } from './zone-visible';
import { peuple, releveCarte } from './chargement';
import { changePhase } from './phases';
import { majTraversee, prepareTraversee, type Traversee } from './traversee';
import { interactions, membreLibre } from './interactions';
import type { Progression } from './sauvegarde';
import { CACHE_VIDE, calculeCibles, type CacheCibles } from './cibles';
import { construitVue } from './vue-partie';
import { DUREE_CARTE, GENRES_CONVERTIS, type EtatVue, type Evenement, type Phase } from './vue';

/**
 * La partie : toute la simulation, sur l'appareil hôte (ou seul). Elle reçoit
 * les commandes de chaque siège, avance d'un pas, et produit une vue
 * (EtatVue) et des évènements que le rendu dessine et que le réseau transmet.
 */
/** Le van file : ticks entre le démarrage de l'accélération et le bilan (il a alors quitté l'écran). */
const DUREE_FUITE = 100;

export class Partie implements Contexte {
  tick = 0;
  phase: Phase = 'histoire';
  page = 0;
  niveau: number;
  vies: number;
  score: number;
  drapeau: number;
  carte!: Carte;
  lu!: NiveauLu;
  tyroliennes: Tyrolienne[] = [];
  /** la traversée en ferry du niveau du port, une fois embarqué (voir traversee.ts) */
  traversee: Traversee | null = null;
  entites: EntiteSimulee[] = [];
  readonly joueurs: (Joueur | null)[] = Array<Joueur | null>(MAX_JOUEURS).fill(null);
  readonly rng = new Aleatoire(Date.now() & 0xffff);
  surLeTemps = false;
  numeroTemps = 0;
  secousse = 0;
  /** colonnes de dialogue déjà déclenchées */
  dejaDit = new Set<number>();
  /** explosions de caissons en attente : [tick, x, y] */
  enAttente: [number, number, number][] = [];
  finDans = -1;
  /** le van qui part, et le nombre de ticks avant le bilan (-1 : il n'est pas parti) */
  private van: Objet | null = null;
  departDans = -1;
  /** les ennemis convertis au rock depuis le début du niveau (voir GENRES_CONVERTIS) */
  convertis: number[] = GENRES_CONVERTIS.map(() => 0);
  /** change à chaque chargement de carte : le réseau renvoie alors la carte aux clients */
  generation = 0;
  /** prévenu à chaque drapeau et à chaque niveau fini */
  /** `niveauFini` : le niveau qui vient d'être terminé (sinon, simple mise à jour de la partie en cours) */
  onProgression: (p: Progression, fini: boolean, niveauFini?: number) => void = () => {};
  private evenements: Evenement[] = [];
  private commandes = new Uint8Array(MAX_JOUEURS);
  private id = 1;
  private cache: CacheCibles = CACHE_VIDE;

  constructor(p: Progression) {
    this.niveau = p.niveau;
    this.vies = p.vies;
    this.score = p.score;
    this.drapeau = p.drapeau;
    this.charge(p.niveau, p.drapeau);
    // reprise à un drapeau : on saute l'histoire déjà lue
    if (p.drapeau >= 0) this.phase = 'jeu';
  }

  // ——— Contexte ———
  prochainId(): number {
    this.id = (this.id % 65000) + 1;
    return this.id;
  }
  ajoute(e: EntiteSimulee): void {
    // un ennemi hors de la zone visible ne tire pas
    if (e instanceof Projectile && e.camp === 'ennemis' && !this.visible(e.x, e.y)) return;
    this.entites.push(e);
  }
  heros(): readonly Cible[] {
    return this.cache.heros;
  }
  visible(x: number, y: number): boolean {
    return zoneVisible(this.cache.heros, x, y);
  }
  cibles(camp: Camp): readonly Cible[] {
    return this.cache[camp];
  }
  props(): readonly Cible[] {
    return this.cache.props;
  }
  explosion(x: number, y: number, rayon: number, degats: number, camp: Camp): void {
    explose(this, x, y, rayon, degats, camp);
  }
  evenement(e: Evenement): void {
    this.evenements.push(e);
  }
  son(n: string, x: number, y: number): void {
    this.evenements.push({ k: 'son', n, x: Math.round(x), y: Math.round(y) });
  }
  texte(x: number, y: number, s: string, c = '#ffffff'): void {
    this.evenements.push({ k: 'texte', x: Math.round(x), y: Math.round(y), s, c });
  }
  secoue(force: number): void {
    this.secousse = Math.max(this.secousse, force);
  }
  ennemiVaincu(x: number, y: number, points: number, genre: number): void {
    this.score += points;
    const i = GENRES_CONVERTIS.indexOf(genre);
    if (i >= 0) this.convertis[i] = Math.min(255, this.convertis[i]! + 1);
    this.evenements.push({ k: 'confettis', x, y });
    this.texte(x, y - 10, `+${points}`, '#ffd23f');
  }

  // ——— joueurs ———
  /** Un joueur rejoint (ou démarre) : il apparaît près d'un autre héros, ou au dernier drapeau. */
  ajouteJoueur(siege: number, membrePrefere: number): void {
    if (this.joueurs[siege]) return;
    const [x, y] = this.pointApparition();
    const j = new Joueur(this.prochainId(), siege, membreLibre(this, membrePrefere), x, y);
    this.joueurs[siege] = j;
    if (this.tick > 0) this.evenement({ k: 'bulle', qui: j.def.qui, texte: this.rng.choix(j.def.rejoint) });
  }

  retireJoueur(siege: number): void {
    this.joueurs[siege] = null;
    this.commandes[siege] = 0;
  }

  commande(siege: number, bits: number): void {
    if (siege >= 0 && siege < MAX_JOUEURS) this.commandes[siege] = bits;
  }

  /** Un joueur veut passer la page d'histoire (ou recommencer après une défaite). */
  suivant(): void {
    if (this.phase === 'jeu') return;
    if (this.phase === 'carte') {
      this.chargeNiveauSuivant(); // on peut passer le trajet
      return;
    }
    const pages = pagesDe(this.phase, this.niveau);
    if (this.page + 1 < pages.length) {
      this.page++;
      return;
    }
    this.page = 0;
    changePhase(this);
  }

  /** Le départ du niveau, ou le dernier drapeau levé. */
  private pointDeDepart(): [number, number] {
    const r = this.drapeau >= 0 ? this.lu.drapeaux[this.drapeau]! : this.lu.depart;
    // les pieds sur le sol de la case de départ
    return [r.x + (TUILE - HEROS_LARGEUR) / 2, r.y + TUILE - HEROS_HAUTEUR];
  }

  /** Où réapparaît un héros : près d'un autre héros vivant, sinon au départ. */
  pointApparition(): [number, number] {
    // en pleine traversée, le pont est fermé : on revient à bord, pas sur le quai
    if (this.traversee) return this.traversee.pointApparition;
    const vivant = this.joueurs.find((j) => j && !j.mort);
    if (vivant) return [vivant.corps.x, vivant.corps.y - 4];
    return this.pointDeDepart();
  }

  // ——— niveaux ———
  charge(niveau: number, drapeau: number): void {
    this.niveau = niveau;
    this.drapeau = drapeau;
    this.generation++;
    this.convertis = GENRES_CONVERTIS.map(() => 0);
    this.lu = niveauLu(niveau);
    this.carte = new Carte(this.lu.largeur, this.lu.hauteur, this.lu.tuiles, this.lu.fond);
    // les tuiles de l'ancienne carte n'ont plus de sens
    this.evenements = this.evenements.filter((e) => e.k !== 'tuile');
    this.tyroliennes = this.lu.tyroliennes;
    this.entites = [];
    this.enAttente = [];
    this.finDans = -1;
    this.departDans = -1;
    this.van = null;
    this.dejaDit = new Set();
    peuple(this);
    prepareTraversee(this);
    // un nouveau niveau, ou une reprise : tout le monde repart du départ, pas de là où il était
    const [x, y] = this.pointDeDepart();
    for (const j of this.joueurs) if (j) j.reapparait(x, y, j.membre);
  }

  /**
   * Recommence le niveau (la carte est refaite, détruite ou non : de quoi se sortir d'une impasse à force d'avoir tout cassé).
   * Les vies et le score restent ; `depuisLeDebut` repart du départ plutôt que du dernier drapeau.
   */
  recommence(depuisLeDebut: boolean): void {
    if (this.phase !== 'jeu') return;
    this.charge(this.niveau, depuisLeDebut ? -1 : this.drapeau);
    this.onProgression(this.progression(), false);
  }

  private chargeNiveauSuivant(): void {
    this.charge(suivantDansMonde(this.niveau) ?? this.niveau, -1);
    this.phase = 'histoire';
    this.page = 0;
  }

  progression(): Progression {
    return { niveau: this.niveau, drapeau: this.drapeau, vies: this.vies, score: this.score };
  }

  // ——— le pas de simulation ———
  avance(): void {
    this.tick++;
    const temps = Math.floor((this.tick * BPM) / (60 * TICKS_PAR_SECONDE));
    this.surLeTemps = temps !== this.numeroTemps;
    this.numeroTemps = temps;
    if (this.secousse > 0) this.secousse = Math.max(0, this.secousse - 1);
    if (this.phase === 'carte' && ++this.page >= DUREE_CARTE) this.chargeNiveauSuivant();
    if (this.phase !== 'jeu') return;

    this.recalculeCibles();
    for (let s = 0; s < MAX_JOUEURS; s++) {
      const j = this.joueurs[s];
      if (!j) continue;
      j.maj(this, this.commandes[s]!);
      if (j.mort) this.gereMort(j);
    }
    this.recalculeCibles();
    const actifs = this.joueurs.filter((j): j is Joueur => !!j && !j.mort);
    for (const e of this.entites) {
      if (e.fini) continue;
      // loin de tous les héros, le monde attend (sauf ce qui vole déjà)
      const pos = (e as Partial<Cible>).x;
      if (pos !== undefined && actifs.length && !('def' in e && 'age' in e)) {
        if (actifs.every((j) => Math.abs(j.corps.x - pos) > 640)) continue;
      }
      e.maj(this);
    }
    majTraversee(this);
    this.recalculeCibles();
    interactions(this);
    this.entites = this.entites.filter((e) => !e.fini);
    releveCarte(this);
    this.finDeNiveau();
    this.majDepart();
  }

  private gereMort(j: Joueur): void {
    if (j.delaiReapparition === 0) {
      j.delaiReapparition = DELAI_REAPPARITION;
      return;
    }
    if (--j.delaiReapparition > 1) return;
    if (this.vies > 0) {
      this.vies--;
      const [x, y] = this.pointApparition();
      j.reapparait(x, y, membreLibre(this, (j.membre + 1) % 5, j.siege));
      j.delaiReapparition = 0;
    } else if (this.joueurs.every((o) => !o || o.mort)) {
      this.phase = 'perdu';
      this.page = 0;
    } else j.delaiReapparition = 2;
  }

  private finDeNiveau(): void {
    const dj = this.entites.find((e) => e instanceof DjBoucle);
    if (this.lu.boss.some((b) => b.lettre === 'Z') && !dj && this.finDans < 0) this.finDans = 180;
    if (this.finDans > 0 && --this.finDans === 0) this.termineNiveau();
  }

  /** Les héros montent dans le van : il démarre, la caméra le suit, le bilan vient quand il a disparu. */
  lanceDepart(van: Objet): void {
    if (this.phase !== 'jeu' || this.departDans >= 0) return;
    // sur le ferry, c'est la traversée qui conduit le van (il descend tout seul à Groix, voir traversee.ts)
    if (this.traversee) return;
    van.demarre();
    this.van = van;
    this.departDans = ATTENTE_VAN + DUREE_FUITE;
    for (const j of this.joueurs) if (j) j.embarque = true;
    this.son('demarrage', van.corps.x, van.corps.y);
  }

  private majDepart(): void {
    if (this.departDans < 0) return;
    // les héros (invisibles) restent dans le van : la caméra le suit
    const v = this.van!.corps;
    for (const j of this.joueurs)
      if (j) {
        j.corps.x = v.x + v.w / 2 - j.corps.w / 2;
        j.corps.y = v.y + v.h - j.corps.h;
      }
    if (--this.departDans === 0) {
      this.departDans = -1;
      this.termineNiveau();
    }
  }

  termineNiveau(): void {
    if (this.phase !== 'jeu') return;
    this.score += 1000 + this.vies * 200;
    this.phase = 'convertis';
    this.page = 0;
    this.drapeau = -1;
    this.son('victoire', 0, 0);
    this.onProgression(
      { ...this.progression(), niveau: suivantDansMonde(this.niveau) ?? this.niveau },
      true,
      this.niveau,
    );
  }

  private recalculeCibles(): void {
    this.cache = calculeCibles(this.joueurs, this.entites);
  }

  /** La vie du boss éveillé, pour la barre du HUD. */
  bossActif(): Boss | null {
    for (const e of this.entites) if (e instanceof Boss && e.eveille && !e.fini && e.pvMax > 40) return e;
    return null;
  }

  vue(): EtatVue {
    return construitVue(this);
  }

  releveEvenements(): Evenement[] {
    const e = this.evenements;
    this.evenements = [];
    return e;
  }

  /** Centre des héros pour situer la caméra de l'hôte et le réveil des ennemis. */
  get largeurMonde(): number {
    return this.carte.largeur * TUILE;
  }
}
