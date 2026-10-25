import { TICKS_PAR_SECONDE } from '../config';
import type { Aleatoire } from '../moteur/maths';
import { CAISSES, surPiste } from './kart-piste';
import { BONUS_KART, DUREES_KART, RAYON, type VoitureKart } from './kart-voiture';
import { FLAQUES_MAX } from './vue-kart';

/**
 * Les bonus du Grand Prix de la Sarré : les caisses « ? » posées en travers de la piste (on en prend une si l'on n'a rien en
 * réserve ; elle réapparaît quelques secondes plus tard), ce que fait chaque bonus lancé, et les flaques d'huile qui font tourner
 * sur soi-même ceux qui roulent dedans.
 */

const REAPPARITION = 3 * TICKS_PAR_SECONDE;
const VIE_FLAQUE = 20 * TICKS_PAR_SECONDE;
/** La portée du marteau : la voiture juste devant, pas plus loin. */
const PORTEE_MARTEAU = 150;

export class Bonus {
  /** pour chaque caisse, les ticks avant qu'elle ne réapparaisse (0 : elle est là) */
  attente: number[] = CAISSES.map(() => 0);
  flaques: { x: number; y: number; vie: number }[] = [];
  private readonly positions = CAISSES.map(([f, d]) => surPiste(f, d));

  /** Les caisses présentes, un bit par caisse. */
  get masque(): number {
    return this.attente.reduce((m, a, k) => (a === 0 ? m | (1 << k) : m), 0);
  }

  /** Un pas : les caisses qui réapparaissent, les flaques qui sèchent, ce que les voitures ramassent ou traversent. */
  maj(voitures: readonly VoitureKart[], rng: Aleatoire, son: (nom: string) => void): void {
    for (let k = 0; k < this.attente.length; k++) if (this.attente[k]! > 0) this.attente[k]!--;
    this.flaques = this.flaques.filter((f) => --f.vie > 0);
    for (const v of voitures) {
      if (v.elimine) continue;
      this.positions.forEach((p, k) => {
        if (this.attente[k] !== 0 || v.saut > 0 || Math.hypot(p.x - v.x, p.y - v.y) > RAYON + 4) return;
        this.attente[k] = REAPPARITION;
        if (v.bonus < 0) {
          v.bonus = rng.entier(0, BONUS_KART.length - 1);
          son('ramasse');
        }
      });
      const f = this.flaques.findIndex((f) => Math.hypot(f.x - v.x, f.y - v.y) < RAYON + 8);
      if (f >= 0 && v.subit('glisse')) {
        this.flaques.splice(f, 1);
        son('chute');
      }
    }
  }

  /** La voiture lance son bonus. */
  lance(v: VoitureKart, voitures: readonly VoitureKart[], son: (nom: string) => void): void {
    const quoi = BONUS_KART[v.bonus];
    v.bonus = -1;
    switch (quoi) {
      case 'turbo':
        v.turbo = DUREES_KART.turbo;
        son('moteur');
        return;
      case 'huile':
        this.flaques.push({ x: v.x - Math.cos(v.a) * 18, y: v.y - Math.sin(v.a) * 18, vie: VIE_FLAQUE });
        if (this.flaques.length > FLAQUES_MAX) this.flaques.shift();
        return;
      case 'marteau': {
        // la voiture juste devant (dans le sens de la course), à portée
        const cible = voitures
          .filter(
            (o) =>
              o !== v &&
              !o.elimine &&
              o.avance > v.avance &&
              Math.hypot(o.x - v.x, o.y - v.y) < PORTEE_MARTEAU,
          )
          .sort((a, b) => a.avance - b.avance)[0];
        son(cible?.subit('ecrase') ? 'boum' : 'rebond');
        return;
      }
      case 'bouclier':
        v.bouclier = DUREES_KART.bouclier;
        son('ramasse');
        return;
      case 'ressort':
        v.saut = DUREES_KART.saut;
        son('saut');
        return;
    }
  }
}
