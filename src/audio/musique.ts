import { BPM } from '../config';
import type { Theme } from '../rendu/themes';
import type { Synthe } from './synthe';

/**
 * Un petit séquenceur : 16 pas par mesure, au tempo du monde (les yétis et
 * les boss attaquent sur ce même temps). Chaque monde a sa grille d'accords
 * et son style : du rock pour les DKK, de la techno pour le club du DJ.
 */
interface Style {
  /** pas (0..15) où frappent la grosse caisse, la caisse claire, le charleston */
  kick: number[];
  caisse: number[];
  charley: number[];
  /** pas de la basse et des accords de guitare */
  basse: number[];
  guitare: number[];
  /** fondamentales des 4 mesures (en Hz, octave grave) */
  grille: number[];
  techno?: boolean;
}

const PAIRS = [0, 2, 4, 6, 8, 10, 12, 14];
const TOUS = [...Array(16).keys()];

const STYLES: Record<Theme['musique'], Style> = {
  garage: {
    kick: [0, 8, 10],
    caisse: [4, 12],
    charley: PAIRS,
    basse: PAIRS,
    guitare: [0, 3, 6, 8, 11, 14],
    grille: [82.4, 98, 110, 98],
  },
  montagne: {
    kick: [0, 7, 8],
    caisse: [4, 12],
    charley: PAIRS,
    basse: [0, 3, 6, 8, 11, 14],
    guitare: [0, 6, 8, 14],
    grille: [110, 146.8, 164.8, 146.8],
  },
  neige: {
    kick: [0, 4, 8, 12],
    caisse: [],
    charley: [2, 6, 10, 14],
    basse: [0, 3, 8, 11],
    guitare: [0],
    grille: [110, 110, 98, 110],
    techno: true,
  },
  plage: {
    kick: [0, 6, 8],
    caisse: [4, 12],
    charley: TOUS,
    basse: [0, 2, 3, 6, 8, 10, 11, 14],
    guitare: [2, 6, 10, 14],
    grille: [146.8, 196, 220, 196],
  },
  ville: {
    kick: [0, 3, 8, 11],
    caisse: [4, 12],
    charley: PAIRS,
    basse: TOUS,
    guitare: [0, 4, 8, 12],
    grille: [82.4, 130.8, 146.8, 123.5],
  },
  boss: {
    kick: [0, 4, 8, 12],
    caisse: [4, 12],
    charley: [2, 6, 10, 14],
    basse: [0, 2, 3, 6, 8, 10, 11, 14],
    guitare: [0, 3, 6, 10],
    grille: [110, 110, 130.8, 98],
    techno: true,
  },
};

export class Musique {
  private style: Style | null = null;
  private pas = 0;
  private prochain = 0;
  private minuteur: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly s: Synthe) {}

  joue(nom: Theme['musique'] | null): void {
    const style = nom ? STYLES[nom] : null;
    if (style === this.style) return;
    this.style = style;
    this.pas = 0;
    if (this.minuteur) clearInterval(this.minuteur);
    this.minuteur = null;
    if (!style) return;
    this.prochain = 0;
    this.minuteur = setInterval(() => this.planifie(), 50);
  }

  /** Programme les notes des 150 prochaines millisecondes (planification en avance : pas de saccades). */
  private planifie(): void {
    const ctx = this.s.ctx;
    const st = this.style;
    if (!ctx || !st || ctx.state !== 'running') return;
    const duree = 60 / BPM / 4;
    if (this.prochain < ctx.currentTime) this.prochain = ctx.currentTime + 0.05;
    while (this.prochain < ctx.currentTime + 0.15) {
      this.joueLePas(st, this.pas % 16, Math.floor(this.pas / 16) % 4, this.prochain, duree);
      this.pas++;
      this.prochain += duree;
    }
  }

  private joueLePas(st: Style, p: number, mesure: number, t: number, d: number): void {
    const s = this.s;
    const sortie = s.musique;
    const f = st.grille[mesure]!;
    if (st.kick.includes(p))
      s.note({ freq: 150, vers: 40, duree: 0.18, type: 'sine', volume: 0.7, quand: t, sortie });
    if (st.caisse.includes(p)) s.bruit({ duree: 0.12, volume: 0.35, passeHaut: 1500, quand: t, sortie });
    if (st.charley.includes(p)) s.bruit({ duree: 0.03, volume: 0.15, passeHaut: 7000, quand: t, sortie });
    if (st.basse.includes(p)) {
      const oct = st.techno && p % 4 === 2 ? 2 : 1;
      s.note({
        freq: (f / 2) * oct,
        duree: d * 1.6,
        type: st.techno ? 'square' : 'sawtooth',
        volume: 0.25,
        filtre: st.techno ? 300 + 200 * Math.sin(p) + 400 : 500,
        quand: t,
        sortie,
      });
    }
    if (st.guitare.includes(p)) {
      if (st.techno) {
        s.note({ freq: f * 4, duree: d * 1.2, type: 'square', volume: 0.06, filtre: 2500, quand: t, sortie });
      } else {
        s.note({ freq: f, duree: d * 2, type: 'sawtooth', volume: 0.07, filtre: 2200, quand: t, sortie });
        s.note({
          freq: f * 1.5,
          duree: d * 2,
          type: 'sawtooth',
          volume: 0.06,
          filtre: 2200,
          quand: t,
          sortie,
        });
      }
    }
  }
}
