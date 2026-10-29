import { TUILE } from '../config';
import type { Carte } from '../monde/carte';
import type { Pose } from './decor';

/**
 * Les braises : de petits points de feu qui s'élèvent des flammes du décor (flambeaux, feux de camp) pour leur donner l'illusion
 * d'une animation, les sprites étant fixes. Elles naissent côté rendu, d'après les accessoires visibles ; rien dans la simulation.
 */
interface Source {
  /** la hauteur de la flamme au-dessus du sol (pixels du jeu) */
  haut: number;
  /** la chance d'émettre une braise à chaque image */
  debit: number;
}

const SOURCES: Readonly<Record<string, Source>> = {
  torche: { haut: 21, debit: 0.1 },
  flambeau: { haut: 26, debit: 0.14 },
  feuDeCamp: { haut: 10, debit: 0.2 },
};

interface Braise {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  vie: number;
  phase: number;
}

/** Du jaune vif au rouge sombre à mesure que la braise monte et refroidit. */
const COULEURS = ['#fff3b0', '#ffd23f', '#ff9b2f', '#ff6b35', '#c4361f'];
const MAX = 120;

export class Braises {
  private readonly liste: Braise[] = [];

  emet(x: number, y: number): void {
    if (this.liste.length >= MAX) return;
    this.liste.push({
      x: x + (Math.random() - 0.5) * 4,
      y,
      vx: (Math.random() - 0.5) * 0.12,
      vy: -(0.25 + Math.random() * 0.4),
      age: 0,
      vie: 30 + Math.random() * 40,
      phase: Math.random() * 6,
    });
  }

  /** Les accessoires à flamme d'un niveau, triés une fois pour toutes (pas de parcours de tout le décor à chaque image). */
  private sources: { o: Pose; source: Source }[] = [];

  regle(poses: readonly Pose[]): void {
    this.sources = [];
    for (const o of poses) {
      const source = SOURCES[o.quoi];
      if (source && !o.devant) this.sources.push({ o, source });
    }
    this.liste.length = 0;
  }

  /** Les accessoires à flamme visibles, dont le sol tient encore, laissent échapper des braises. */
  emetDepuis(carte: Carte, camX: number, largeur: number): void {
    for (const { o, source } of this.sources) {
      const x = o.tx * TUILE + TUILE / 2;
      if (x < camX - 24 || x > camX + largeur + 24) continue;
      if (!carte.props(o.tx, o.ty).solide || carte.solide(o.tx, o.ty - 1)) continue;
      if (Math.random() < source.debit) this.emet(x, o.ty * TUILE - source.haut);
    }
  }

  maj(): void {
    for (const b of this.liste) {
      b.age++;
      // un petit balancement : la braise ondule en montant
      b.x += b.vx + Math.sin(b.age / 6 + b.phase) * 0.12;
      b.y += b.vy;
      b.vy *= 0.992;
    }
    for (let i = this.liste.length - 1; i >= 0; i--)
      if (this.liste[i]!.age >= this.liste[i]!.vie) this.liste.splice(i, 1);
  }

  dessine(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    for (const b of this.liste) {
      const k = b.age / b.vie;
      ctx.globalAlpha = k > 0.6 ? (1 - k) / 0.4 : 1;
      ctx.fillStyle = COULEURS[Math.min(COULEURS.length - 1, Math.floor(k * COULEURS.length))]!;
      const t = k < 0.3 ? 2 : 1;
      ctx.fillRect(Math.round(b.x) - camX, Math.round(b.y) - camY, t, t);
    }
    ctx.globalAlpha = 1;
  }
}
