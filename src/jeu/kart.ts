import { MAX_JOUEURS, TICKS_PAR_SECONDE } from '../config';
import { Aleatoire } from '../moteur/maths';
import { C, EtatCommandes } from './commandes';
import { Bonus } from './kart-bonus';
import { piloteIA, nouvelleIA, type EtatIA } from './kart-ia';
import { LONGUEUR_TOUR, grille } from './kart-piste';
import { PILOTES, VoitureKart, heurte, type CommandesKart } from './kart-voiture';
import { EFFETS_KART, type EtapeKart, type VueKart } from './vue-kart';

/** Le karting de la Sarré, le niveau du mini-jeu (indice dans NIVEAUX) : ajouté en fin de liste, joué juste après Gréau. */
export const NIVEAU_KART = 21;
export const TOURS = 3;
/** À plusieurs : le premier à ce nombre de manches gagne. */
export const POINTS_VICTOIRE = 8;
/** La caméra : ce qu'elle montre du monde (la vue de référence, 284 × 160, au zoom de la course), pour la règle de l'écran. */
export const ZOOM_KART = 0.62;
export const DEMI_VUE = [142 / ZOOM_KART, 80 / ZOOM_KART] as const;

const SECONDE = TICKS_PAR_SECONDE;
const DUREE_DEPART = 3 * SECONDE;
const DUREE_MANCHE = Math.round(2.5 * SECONDE);
const DUREE_ARRIVEE = 6 * SECONDE;
const ATTENTE_APPUI = SECONDE;
const VALIDE = C.SAUT | C.TIR;

/**
 * Le Grand Prix de la Sarré (un mini-jeu façon Micro Machines) : pour l'anniversaire de sa passion pour la F1, les DKK offrent
 * à Mat la piste du karting de la Sarré, et chacun y vient avec sa propre voiture. Chaque joueur choisit son pilote ; seul, il
 * court trois tours contre les quatre autres (l'ordinateur) ; à plusieurs, c'est la règle de l'écran : la caméra suit le premier,
 * qui en sort perd la manche, le dernier en piste la gagne, et le premier à huit manches remporte le Grand Prix.
 */
export class ConcoursKart {
  etape: EtapeKart = 'choix';
  minuteur = 0;
  temps = 0;
  choix: { siege: number; pilote: number; valide: boolean }[];
  voitures: VoitureKart[] = [];
  /** le siège qui conduit chaque voiture (-1 : l'ordinateur), et l'état des pilotes de l'ordinateur */
  sieges: number[] = [];
  private ia: EtatIA[] = [];
  points: number[] = [];
  gagnant = -1;
  classement: number[] = [];
  camX = 0;
  camY = 0;
  bonus = new Bonus();
  fini = false;
  private rng = new Aleatoire(2024);
  private readonly commandes = Array.from({ length: MAX_JOUEURS }, () => new EtatCommandes());

  constructor(
    sieges: readonly number[],
    /** le héros de chaque siège : le pilote proposé d'office */
    membres: readonly number[],
    readonly miniJeu: boolean,
  ) {
    const pris = new Set<number>();
    this.choix = (sieges.length ? sieges : [0]).map((siege, k) => {
      let pilote = membres[k] ?? k;
      while (pris.has(pilote)) pilote = (pilote + 1) % PILOTES.length;
      pris.add(pilote);
      return { siege, pilote, valide: false };
    });
  }

  get multi(): boolean {
    return this.choix.length > 1;
  }

  maj(bits: ArrayLike<number>, presents: readonly number[], son: (nom: string) => void): void {
    for (let s = 0; s < MAX_JOUEURS; s++) this.commandes[s]!.avance(bits[s] ?? 0);
    if (this.minuteur > 0) this.minuteur--;
    switch (this.etape) {
      case 'choix':
        return this.choisit(presents, son);
      case 'depart':
        if (this.minuteur % SECONDE === 0 && this.minuteur > 0) son('alerte');
        this.suitLaCamera();
        if (this.minuteur === 0) {
          this.etape = 'course';
          son('demarrage');
        }
        return;
      case 'course':
      case 'arrivee':
        return this.course(presents, son);
      case 'manche':
        this.suitLaCamera();
        if (this.minuteur === 0) this.mancheSuivante();
        return;
      case 'podium':
        if (this.minuteur === 0 && presents.some((s) => this.commandes[s]!.appuye(VALIDE))) {
          if (this.miniJeu) this.recommence();
          else this.fini = true;
        }
    }
  }

  /** Chacun choisit son pilote (pas un pilote déjà pris), puis valide ; tous prêts, on se met en grille. */
  private choisit(presents: readonly number[], son: (nom: string) => void): void {
    this.choix = this.choix.filter((c) => presents.includes(c.siege) || this.choix.length === 1);
    for (const c of this.choix) {
      const k = this.commandes[c.siege]!;
      if (c.valide) continue;
      const sens = k.appuye(C.DROITE) ? 1 : k.appuye(C.GAUCHE) ? -1 : 0;
      if (sens) {
        do c.pilote = (c.pilote + sens + PILOTES.length) % PILOTES.length;
        while (this.choix.some((o) => o !== c && o.pilote === c.pilote));
        son('rebond');
      }
      if (k.appuye(VALIDE)) {
        c.valide = true;
        son('ramasse');
      }
    }
    if (this.choix.every((c) => c.valide)) this.enGrille();
  }

  /** La grille : seul, le joueur part quatrième parmi les cinq ; à plusieurs, les joueurs seuls, dans l'ordre des sièges. */
  private enGrille(): void {
    const joueurs = this.choix.map((c) => c.pilote);
    const pilotes = this.multi ? joueurs : PILOTES.map((_, k) => k).filter((k) => k !== joueurs[0]);
    if (!this.multi) pilotes.splice(3, 0, joueurs[0]!);
    this.voitures = pilotes.map((p) => new VoitureKart(p));
    this.sieges = pilotes.map((p) => this.choix.find((c) => c.pilote === p)?.siege ?? -1);
    this.ia = pilotes.map(() => nouvelleIA());
    this.points = pilotes.map(() => 0);
    this.voitures.forEach((v, k) => {
      const g = grille(k);
      v.pose(g.x, g.y, g.a, g.i, -(14 + Math.floor(k / 2) * 22 + (k % 2) * 8) * 2.5);
    });
    this.bonus = new Bonus();
    this.temps = 0;
    this.gagnant = -1;
    this.etape = 'depart';
    this.minuteur = DUREE_DEPART;
    this.suitLaCamera(true);
  }

  /** Un pas de course : chaque voiture conduit (le joueur, ou l'ordinateur), les chocs, les bonus, l'arrivée ou la règle de l'écran. */
  private course(presents: readonly number[], son: (nom: string) => void): void {
    this.temps++;
    const tete = Math.max(...this.voitures.filter((v, k) => this.sieges[k]! >= 0).map((v) => v.avance));
    this.voitures.forEach((v, k) => {
      if (v.elimine) return;
      const siege = this.sieges[k]!;
      const humain = siege >= 0 && presents.includes(siege) && v.arrivee < 0;
      let cmd: CommandesKart;
      let lance = false;
      if (humain) {
        const c = this.commandes[siege]!;
        cmd = {
          gauche: c.tenu(C.GAUCHE),
          droite: c.tenu(C.DROITE),
          gaz: c.tenu(C.SAUT) || c.tenu(C.HAUT),
          frein: c.tenu(C.BAS),
        };
        lance = v.bonus >= 0 && c.appuye(C.TIR);
      } else {
        const r = piloteIA(v, this.ia[k]!, this.voitures, this.rng);
        cmd = r.k;
        lance = r.lance;
      }
      v.avanceUnPas(cmd, siege >= 0 || this.multi ? 1 : this.pouce(v, tete));
      if (lance) this.bonus.lance(v, this.voitures, son);
    });
    for (let a = 0; a < this.voitures.length; a++)
      for (let b = a + 1; b < this.voitures.length; b++)
        if (heurte(this.voitures[a]!, this.voitures[b]!)) son('boum');
    for (const v of this.voitures)
      if (v.choc) {
        v.choc = false;
        son('boum');
      }
    this.bonus.maj(this.voitures, this.rng, son);
    this.suitLaCamera();
    if (this.multi) this.regleDeLEcran(presents, son);
    else this.arrivees(son);
  }

  /**
   * Seul, le coup de pouce (ou de frein) d'un pilote de l'ordinateur : ils roulent un peu moins vite que le joueur ; sorti de
   * l'écran devant lui, un pilote lève franchement le pied ; resté loin derrière, il remonte. Le peloton reste groupé.
   */
  private pouce(v: VoitureKart, tete: number): number {
    const dehors = Math.abs(v.x - this.camX) > DEMI_VUE[0] || Math.abs(v.y - this.camY) > DEMI_VUE[1];
    if (dehors && v.avance > tete) return 0.7;
    if (v.avance < tete - 300) return 1.05;
    return 0.92;
  }

  /** Seul : les tours, les arrivées ; le joueur arrivé, les autres ont quelques secondes pour finir. */
  private arrivees(son: (nom: string) => void): void {
    for (const v of this.voitures)
      if (v.arrivee < 0 && v.avance >= TOURS * LONGUEUR_TOUR) {
        v.arrivee = this.temps;
        if (this.sieges[this.voitures.indexOf(v)]! >= 0) {
          this.etape = 'arrivee';
          this.minuteur = DUREE_ARRIVEE;
          son('liberation');
        }
      }
    if (this.etape === 'arrivee' && (this.minuteur === 0 || this.voitures.every((v) => v.arrivee >= 0)))
      this.auPodium(
        this.voitures
          .map((_, k) => k)
          .sort((a, b) => this.rang(this.voitures[a]!) - this.rang(this.voitures[b]!)),
      );
  }

  /** Le rang d'une voiture : les arrivées dans l'ordre, puis les autres selon la distance courue. */
  private rang(v: VoitureKart): number {
    return v.arrivee >= 0 ? v.arrivee : 1e9 - v.avance;
  }

  /** À plusieurs : qui sort de l'écran (ou s'en va) est éliminé ; le dernier en piste gagne la manche. */
  private regleDeLEcran(presents: readonly number[], son: (nom: string) => void): void {
    this.voitures.forEach((v, k) => {
      if (v.elimine) return;
      const dehors =
        Math.abs(v.x - this.camX) > DEMI_VUE[0] + 6 || Math.abs(v.y - this.camY) > DEMI_VUE[1] + 6;
      if ((dehors && this.temps > SECONDE) || !presents.includes(this.sieges[k]!)) {
        v.elimine = true;
        son('chute');
      }
    });
    const enPiste = this.voitures.filter((v) => !v.elimine);
    if (enPiste.length > 1) return;
    this.gagnant = enPiste[0] ? this.voitures.indexOf(enPiste[0]) : -1;
    if (this.gagnant >= 0) this.points[this.gagnant]!++;
    son('liberation');
    this.etape = 'manche';
    this.minuteur = DUREE_MANCHE;
  }

  /** La manche suivante : tout le monde regroupé en grille là où était le gagnant ; ou le podium, s'il a ses huit manches. */
  private mancheSuivante(): void {
    if (this.points.some((p) => p >= POINTS_VICTOIRE)) {
      this.auPodium(this.voitures.map((_, k) => k).sort((a, b) => this.points[b]! - this.points[a]!));
      return;
    }
    const meneur = this.voitures[this.gagnant] ?? this.voitures[0]!;
    const origine = meneur.i + 30;
    this.voitures.forEach((v, k) => {
      const g = grille(k, origine);
      v.elimine = false;
      v.pose(g.x, g.y, g.a, g.i, meneur.avance - k);
    });
    this.temps = 0;
    this.etape = 'depart';
    this.minuteur = 2 * SECONDE;
    this.suitLaCamera(true);
  }

  private auPodium(classement: number[]): void {
    this.classement = classement;
    this.etape = 'podium';
    this.minuteur = ATTENTE_APPUI;
  }

  /** La caméra suit le joueur (seul) ou le premier (à plusieurs), un peu en avant de lui. */
  private suitLaCamera(net = false): void {
    const suivie = this.multi
      ? this.voitures.filter((v) => !v.elimine).sort((a, b) => b.avance - a.avance)[0]
      : this.voitures[this.sieges.findIndex((s) => s >= 0)];
    if (!suivie) return;
    const cx = suivie.x + suivie.vx * (this.multi ? 0.15 : 0.35);
    const cy = suivie.y + suivie.vy * (this.multi ? 0.15 : 0.35);
    const k = net ? 1 : 0.1;
    this.camX += (cx - this.camX) * k;
    this.camY += (cy - this.camY) * k;
  }

  private recommence(): void {
    for (const c of this.choix) c.valide = false;
    this.voitures = [];
    this.classement = [];
    this.etape = 'choix';
  }

  vue(): VueKart {
    const ordre = this.voitures
      .map((_, k) => k)
      .sort((a, b) => this.rang(this.voitures[a]!) - this.rang(this.voitures[b]!));
    return {
      etape: this.etape,
      minuteur: this.minuteur,
      temps: this.temps,
      miniJeu: this.miniJeu,
      multi: this.multi,
      camX: this.camX,
      camY: this.camY,
      voitures: this.voitures.map((v, k) => ({
        pilote: v.pilote,
        siege: this.sieges[k]!,
        x: v.x,
        y: v.y,
        a: v.a,
        bonus: v.bonus,
        effets:
          (v.turbo > 0 ? EFFETS_KART.turbo : 0) |
          (v.ecrase > 0 ? EFFETS_KART.ecrase : 0) |
          (v.glisse > 0 ? EFFETS_KART.glisse : 0) |
          (v.saut > 0 ? EFFETS_KART.saut : 0) |
          (v.bouclier > 0 ? EFFETS_KART.bouclier : 0) |
          (v.elimine ? EFFETS_KART.elimine : 0) |
          (v.arrivee >= 0 ? EFFETS_KART.arrive : 0) |
          (v.remis > 0 ? EFFETS_KART.remis : 0),
        tour: Math.min(TOURS, Math.max(1, Math.floor(v.avance / LONGUEUR_TOUR) + 1)),
        place: ordre.indexOf(k) + 1,
        points: this.points[k] ?? 0,
        saut: v.saut,
        ecrase: v.ecrase,
        cogne: v.cogne,
      })),
      choix: this.choix.map((c) => ({ ...c })),
      flaques: this.bonus.flaques.map((f) => ({ x: f.x, y: f.y })),
      caisses: this.bonus.masque,
      gagnant: this.gagnant,
      arrivees: this.voitures.map((v) => v.arrivee),
      classement: [...this.classement],
    };
  }
}
