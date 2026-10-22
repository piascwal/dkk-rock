import { HAUTEUR_VUE } from '../config';
import { DUREE_DECOLLAGE, DUREE_LUNE, DUREE_REVEIL } from '../jeu/reve';
import { LONGUEUR, LUNE_X, LUNE_Y, parcours, vitesse, type Parcours } from '../jeu/reve-parcours';
import type { VueReve } from '../jeu/vue-reve';
import { disque } from './formes-pixels';
import { ecrit } from './police';
import { dessineCiel } from './reve-ciel';
import { dessineEcranReve } from './reve-ecrans';
import { dessineImage, dessineJbt } from './reve-jbt';
import { dessineLune, jbtPlante, reveil } from './reve-lune';
import { dessineObstacles, lit } from './reve-obstacles';

/**
 * Le rêve de JBT à l'écran, d'après la seule vue (comme chez un invité) : le ciel de nuit qui défile en plans (reve-ciel.ts), les
 * piles et les obstacles (reve-obstacles.ts), JBT en super-héros à gauche de l'écran, la traînée d'étincelles quand il monte, les
 * traits de vitesse ; au bout, la pleine lune où il plante sa tête (reve-lune.ts) ; et les écrans (reve-ecrans.ts). Les éclats
 * des piles ramassées et les secousses des chocs ne vivent qu'ici : la vue dit seulement quelles piles sont prises, et quand.
 */

/** Où JBT vole, à l'écran (pixels depuis la gauche). */
export const JBT_X = 64;

interface Particule {
  x: number;
  y: number;
  vx: number;
  vy: number;
  vie: number;
  couleur: string;
}
interface Flottant {
  x: number;
  y: number;
  texte: string;
  vie: number;
}

const ETINCELLES = ['#ffd23f', '#ff8ae0', '#ffffff', '#9fe8ff'];

export class RenduReve {
  private manche = -1;
  private ciel: Parcours | null = null;
  private vues = new Set<number>();
  private particules: Particule[] = [];
  private flottants: Flottant[] = [];
  private secousse = 0;
  private flash = 0;
  private invulnerable = 0;

  dessine(ctx: CanvasRenderingContext2D, v: VueReve, largeur: number, tick: number): void {
    if (v.manche !== this.manche || !this.ciel) {
      this.manche = v.manche;
      this.ciel = parcours(v.manche);
      this.vues = new Set(v.collectees);
      this.particules = [];
      this.flottants = [];
    }
    const p = this.ciel;
    const d = v.distance;
    // un choc : l'écran tremble et blanchit
    if (v.invulnerable > this.invulnerable + 10) {
      this.secousse = 10;
      this.flash = 8;
    }
    this.invulnerable = v.invulnerable;
    const sx = this.secousse > 0 ? Math.round(Math.sin(tick * 2.3) * this.secousse * 0.35) : 0;
    const sy = this.secousse > 0 ? Math.round(Math.cos(tick * 3.1) * this.secousse * 0.25) : 0;
    if (this.secousse > 0) this.secousse--;
    const ex = (x: number) => x - d + JBT_X;
    ctx.save();
    ctx.translate(sx, sy);
    dessineCiel(ctx, d, Math.min(1, d / LONGUEUR), largeur, tick);
    lit(ctx, ex(0));
    if (v.etape === 'vol' || v.etape === 'decollage') this.traits(ctx, largeur, d, tick);
    dessineObstacles(ctx, p, d, ex, largeur, new Set(v.collectees), tick);
    if (d > LONGUEUR - 700) {
      const choc = v.plante ? Math.max(0, v.minuteur - DUREE_LUNE + 40) / 40 : 0;
      dessineLune(ctx, ex(LUNE_X), LUNE_Y, tick, choc);
    }
    this.ramassees(v, ex);
    this.jbt(ctx, v, ex, tick);
    this.effets(ctx);
    ctx.restore();
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${(this.flash / 12).toFixed(2)})`;
      ctx.fillRect(0, 0, largeur, HAUTEUR_VUE);
      this.flash--;
    }
    if (v.etape === 'reveil' || (v.etape === 'resultat' && !v.plante))
      reveil(ctx, largeur, tick, v.etape === 'reveil' ? 1 - v.minuteur / DUREE_REVEIL : 1);
    dessineEcranReve(ctx, largeur, v, tick);
  }

  /** JBT, selon le moment : il décolle de son lit (de dos), vole (incliné selon qu'il monte ou descend), se plante, tombe. */
  private jbt(ctx: CanvasRenderingContext2D, v: VueReve, ex: (x: number) => number, tick: number): void {
    if (v.etape === 'decollage') {
      const k = 1 - v.minuteur / DUREE_DECOLLAGE;
      if (k < 0.7) {
        const e = k / 0.7;
        const y = 132 - (132 - v.y) * e * (2 - e);
        dessineImage(ctx, 'dos', JBT_X, y, 0, 0.62);
        if (tick % 2 === 0) this.etincelle(JBT_X + (tick % 7) - 3, y + 16, 0, 40);
      } else dessineJbt(ctx, JBT_X, v.y, -(1 - (k - 0.7) / 0.3) * 0.5, tick);
      return;
    }
    if (v.etape === 'vol' || (v.etape === 'lune' && !v.plante)) {
      const angle = v.etape === 'vol' ? Math.max(-0.4, Math.min(0.4, v.vy * 0.0022)) : 0;
      if (v.invulnerable > 0 && tick % 6 < 3) ctx.globalAlpha = 0.35;
      dessineJbt(ctx, JBT_X, v.y, angle, tick);
      ctx.globalAlpha = 1;
      // les étincelles du rêve derrière lui : une traînée quand il monte, quelques-unes sinon
      if (v.pousse || tick % 4 === 0)
        this.etincelle(JBT_X - 24, v.y + 2, -40 - Math.random() * 40, v.pousse ? 50 : 10);
      return;
    }
    if (v.plante || v.etape === 'lune') {
      const p = 1 - v.minuteur / DUREE_LUNE;
      jbtPlante(ctx, JBT_X, v.y, ex(LUNE_X), LUNE_Y, tick, v.etape === 'lune' ? p : 1);
      return;
    }
    if (v.etape === 'reveil') dessineImage(ctx, 'vol', JBT_X, v.y, tick * 0.25);
  }

  /** Les traits de vitesse : JBT traverse le ciel à toute allure. */
  private traits(ctx: CanvasRenderingContext2D, largeur: number, d: number, tick: number): void {
    const v = vitesse(d) / 60;
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (let i = 0; i < 12; i++) {
      const w = largeur + 80;
      const x = w - ((((tick * v * 2.2 + i * 97) % w) + w) % w) - 40;
      const y = 18 + ((i * 41) % 128);
      ctx.fillRect(Math.round(x), y, 10 + (i % 4) * 6, 1);
    }
  }

  /** Les piles qu'on vient de ramasser : un éclat d'étincelles et « +1 » (ou « +10 » pour une pile en or) qui s'envole. */
  private ramassees(v: VueReve, ex: (x: number) => number): void {
    const p = this.ciel!;
    for (const i of v.collectees) {
      if (this.vues.has(i)) continue;
      this.vues.add(i);
      const pile = p.piles[i];
      if (!pile) continue;
      const x = ex(pile.x);
      for (let k = 0; k < (pile.or ? 16 : 6); k++) {
        const a = (k / (pile.or ? 16 : 6)) * Math.PI * 2;
        this.particules.push({
          x,
          y: pile.y,
          vx: Math.cos(a) * 50,
          vy: Math.sin(a) * 50,
          vie: 18,
          couleur: pile.or ? '#ffd23f' : '#fff6c0',
        });
      }
      this.flottants.push({ x: x - 4, y: pile.y - 8, texte: pile.or ? '+10' : '+1', vie: 30 });
    }
  }

  private etincelle(x: number, y: number, vx: number, vy: number): void {
    this.particules.push({
      x,
      y: y + (Math.random() - 0.5) * 6,
      vx,
      vy: vy * (Math.random() - 0.2),
      vie: 16 + Math.floor(Math.random() * 14),
      couleur: ETINCELLES[Math.floor(Math.random() * ETINCELLES.length)]!,
    });
    if (this.particules.length > 260) this.particules.splice(0, this.particules.length - 260);
  }

  private effets(ctx: CanvasRenderingContext2D): void {
    this.particules = this.particules.filter((q) => --q.vie > 0);
    for (const q of this.particules) {
      q.x += q.vx / 60;
      q.y += q.vy / 60;
      q.vx *= 0.96;
      ctx.fillStyle = q.couleur;
      ctx.globalAlpha = Math.min(1, q.vie / 10);
      if (q.vie > 12) disque(ctx, Math.round(q.x), Math.round(q.y), 1);
      else ctx.fillRect(Math.round(q.x), Math.round(q.y), 1, 1);
    }
    ctx.globalAlpha = 1;
    this.flottants = this.flottants.filter((f) => --f.vie > 0);
    for (const f of this.flottants) {
      f.y -= 0.5;
      ecrit(ctx, f.texte, f.x, f.y, f.texte === '+10' ? '#ffd23f' : '#ffffff');
    }
  }
}
