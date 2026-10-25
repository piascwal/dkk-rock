import { EFFETS_KART, type VueKart } from '../jeu/vue-kart';
import { POSITIONS } from './kart-piste';
import { ecritCentre } from './police';

/**
 * Ce qui jaillit des bonus, d'après la seule vue : on compare les effets d'une image à la suivante. Un effet qui apparaît lance son
 * texte (« TURBO ! », « BAM ! »...) qui monte et s'efface, et une gerbe d'éclats ; une caisse qui disparaît éclate ; un coup de marteau
 * sur la voiture d'un joueur fait trembler l'écran (`secousse`, en images).
 */
type Ctx = CanvasRenderingContext2D;

interface Texte {
  x: number;
  y: number;
  age: number;
  texte: string;
  couleur: string;
}

interface Eclat {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  vie: number;
  taille: number;
  couleur: string;
}

const TEXTES: readonly [number, string, string][] = [
  [EFFETS_KART.turbo, 'TURBO !', '#ffd23f'],
  [EFFETS_KART.ecrase, 'BAM !', '#ff5a2a'],
  [EFFETS_KART.glisse, 'SPLASH !', '#ff4fd8'],
  [EFFETS_KART.saut, 'BOING !', '#7cfc7c'],
  [EFFETS_KART.bouclier, 'BOUCLIER !', '#4ff0ff'],
  [EFFETS_KART.remis, 'OUPS !', '#ffffff'],
];
const VIE_TEXTE = 55;
const CAISSE = ['#ff4fd8', '#ffd23f', '#4ff0ff', '#7cfc7c'];
const GERBES: Partial<Record<number, readonly string[]>> = {
  [EFFETS_KART.turbo]: ['#ffffff', '#ffd23f', '#ff9a3a'],
  [EFFETS_KART.ecrase]: ['#8a8a92', '#c8c8d0', '#3a3a42'],
  [EFFETS_KART.glisse]: ['#16161e', '#ff4fd8', '#4ff0ff'],
};

export class FlottantsKart {
  secousse = 0;
  private avant: number[] = [];
  private caisses = -1;
  private textes: Texte[] = [];
  private eclats: Eclat[] = [];

  maj(v: VueKart): void {
    if (v.etape !== 'course' && v.etape !== 'arrivee') {
      this.avant = [];
      this.caisses = -1;
      this.textes = [];
      this.eclats = [];
      return;
    }
    v.voitures.forEach((x, i) => {
      const nouveau = x.effets & ~(this.avant[i] ?? x.effets);
      this.avant[i] = x.effets;
      for (const [bit, texte, couleur] of TEXTES) {
        if (!(nouveau & bit)) continue;
        this.textes.push({ x: x.x, y: x.y, age: 0, texte, couleur });
        const gerbe = GERBES[bit];
        if (gerbe) this.gerbe(x.x, x.y, gerbe, bit === EFFETS_KART.ecrase ? 16 : 10);
      }
      if (nouveau & EFFETS_KART.ecrase && x.siege >= 0) this.secousse = 12;
    });
    const perdues = this.caisses >= 0 ? this.caisses & ~v.caisses : 0;
    POSITIONS.forEach((p, k) => {
      if (perdues & (1 << k)) this.gerbe(p.x, p.y, CAISSE, 14);
    });
    this.caisses = v.caisses;
    for (const e of this.eclats) {
      e.x += e.vx;
      e.y += e.vy;
      e.vx *= 0.94;
      e.vy *= 0.94;
    }
    this.eclats = this.eclats.filter((e) => ++e.age < e.vie);
    this.textes = this.textes.filter((t) => ++t.age < VIE_TEXTE);
  }

  private gerbe(x: number, y: number, couleurs: readonly string[], n: number): void {
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + k * 0.7;
      const vitesse = 1.2 + (k % 3) * 0.8;
      this.eclats.push({
        x,
        y,
        vx: Math.cos(a) * vitesse,
        vy: Math.sin(a) * vitesse,
        age: 0,
        vie: 18 + (k % 4) * 4,
        taille: 2 + (k % 2),
        couleur: couleurs[k % couleurs.length]!,
      });
    }
  }

  /** Dans le monde, par-dessus les voitures. */
  dessine(c: Ctx): void {
    for (const e of this.eclats) {
      c.globalAlpha = 1 - e.age / e.vie;
      c.fillStyle = e.couleur;
      c.fillRect(Math.round(e.x), Math.round(e.y), e.taille, e.taille);
    }
    for (const t of this.textes) {
      c.globalAlpha = Math.min(1, (VIE_TEXTE - t.age) / 15);
      ecritCentre(c, t.texte, t.x, t.y - 18 - t.age * 0.45, t.couleur, t.age < 8 ? 3 : 2);
    }
    c.globalAlpha = 1;
  }
}
