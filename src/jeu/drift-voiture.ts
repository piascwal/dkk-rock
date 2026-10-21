import { PRE, type Pose } from './drift-pelouse';

/** Un pas de simulation, en secondes. */
const DT = 1 / 60;
/** Accélération et vitesse de pointe (m/s², m/s), freinage, marche arrière. */
const ACCELERATION = 9;
const POINTE = 21;
const FREINAGE = 16;
const RECUL = 6;
/** Ce que l'herbe et l'air retirent à la vitesse, par seconde (part de la vitesse). */
const TRAINEE = 0.35;
/** Le braquage, en radians par seconde, à pleine vitesse de virage. */
const BRAQUAGE = 2.1;
/**
 * L'adhérence latérale, par seconde : la part du glissement de côté qu'elle reprend. Sur l'herbe elle est faible ; en virage
 * appuyé et pied au plancher, plus faible encore (la voiture décroche).
 */
const ADHERENCE = 8;
const ADHERENCE_DECROCHE = 2.6;
/** Le pare-chocs contre la clôture : la marge (m) et ce qui reste de la vitesse au rebond. */
const MARGE = 1.2;
/** La part du glissement repris par l'adhérence qui relance la voiture dans son axe. */
const RELANCE = 0.7;
const REBOND = 0.35;

/** Ce que le pilote fait de ses commandes à ce pas : gaz, frein, volant (-1 à gauche, +1 à droite). */
export interface Pilotage {
  gaz: boolean;
  frein: boolean;
  volant: number;
}

/**
 * La voiture du concours, vue de dessus : une position, un cap, et une vitesse dans le pré. À chaque pas, la vitesse est relue
 * dans l'axe de la voiture (devant, de côté) : les gaz et le frein jouent sur l'avant, l'adhérence ronge le côté. Quand le cap
 * tourne plus vite que l'herbe ne suit, la voiture part en travers : c'est le drift.
 */
export class Voiture implements Pose {
  x = PRE.largeur / 2;
  y = 5;
  cap = Math.PI / 2;
  vx = 0;
  vy = 0;
  /** ce que les roues font à la pelouse à ce pas : 0 rien, 1 herbe arrachée, 2 terre, 3 boue (voir drift-pelouse.ts) */
  griffe = 0;
  /** la voiture vient de taper la clôture */
  choc = false;

  get vitesse(): number {
    return Math.hypot(this.vx, this.vy);
  }

  /** La vitesse de côté (glissement), en m/s : positive vers la gauche. */
  get glisse(): number {
    return -this.vx * Math.sin(this.cap) + this.vy * Math.cos(this.cap);
  }

  avance(p: Pilotage): void {
    const fx = Math.cos(this.cap);
    const fy = Math.sin(this.cap);
    let avant = this.vx * fx + this.vy * fy;
    let cote = this.glisse;

    if (p.gaz) avant += ACCELERATION * DT * (1 - Math.max(0, avant) / POINTE);
    if (p.frein)
      avant = avant > 0.5 ? avant - FREINAGE * DT : Math.max(-RECUL, avant - ACCELERATION * 0.5 * DT);
    avant -= avant * TRAINEE * DT;

    const decroche = p.gaz && Math.abs(p.volant) > 0 && Math.abs(avant) > 12;
    const adherence = decroche ? ADHERENCE_DECROCHE : ADHERENCE;
    // ce que l'adhérence reprend au glissement n'est pas tout perdu : une part relance la voiture dans son axe (elle sort du
    // virage en gardant de l'élan, comme en drift)
    const repris = cote * (1 - Math.exp(-adherence * DT));
    cote -= repris;
    avant += Math.sign(avant || 1) * Math.abs(repris) * RELANCE;

    // le volant : sans vitesse, il ne fait rien ; en marche arrière, il tourne à l'envers ; en travers, la voiture pivote mieux
    const enTravers = Math.abs(cote) > 2;
    const tour = BRAQUAGE * Math.min(1, Math.abs(avant) / 5) * (enTravers ? 1.15 : 1);
    this.vx = avant * fx - cote * fy;
    this.vy = avant * fy + cote * fx;
    this.cap -= p.volant * tour * Math.sign(avant || 1) * DT;

    this.x += this.vx * DT;
    this.y += this.vy * DT;
    this.choc = this.borne();

    const glisse = Math.abs(cote);
    const patine = p.gaz && Math.abs(avant) < 4;
    this.griffe = glisse > 7 ? 3 : glisse > 4 ? 2 : glisse > 1.5 || patine ? 1 : 0;
  }

  /** La clôture du pré : la voiture rebondit dessus. Vrai si elle l'a touchée. */
  private borne(): boolean {
    let choc = false;
    if (this.x < MARGE || this.x > PRE.largeur - MARGE) {
      this.x = Math.min(PRE.largeur - MARGE, Math.max(MARGE, this.x));
      this.vx = -this.vx * REBOND;
      choc = true;
    }
    if (this.y < MARGE || this.y > PRE.profondeur - MARGE) {
      this.y = Math.min(PRE.profondeur - MARGE, Math.max(MARGE, this.y));
      this.vy = -this.vy * REBOND;
      choc = true;
    }
    return choc;
  }

  pose(): Pose {
    return { x: this.x, y: this.y, cap: this.cap };
  }
}
