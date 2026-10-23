import { DECOLLAGE, DUREE_FIN, xAvion } from '../jeu/avion';
import { BONUS, LONGUEURS, estObstacle, parcours, type Objet } from '../jeu/avion-parcours';
import { ANIM, G, type Genre } from '../jeu/vue';
import type { VueAvion } from '../jeu/vue-avion';
import { dessineDecorFeuille, dessineFeuille } from './feuilles-images';
import { disque } from './formes-pixels';
import { ecrit } from './police';
import { dessineAvion } from './avion-appareil';
import { dessineFond, dessineTarmac, SOL_PISTE, SOL_VOIES } from './avion-decor';
import { dessineEcranAvion } from './avion-ecrans';
import { dessineObjet, voieDe } from './avion-objets';

/**
 * L'avion de JBG à l'écran, d'après la seule vue (comme chez un invité) : l'aéroport (avion-decor.ts), l'avion des DKK qui roule
 * au bout de la piste, de plus en plus grand à mesure que JBG le rattrape (avion-appareil.ts), le tarmac et ce qui l'encombre
 * (avion-objets.ts), JBG qui court (ses planches : la course, le saut, l'échelle), et les écrans (avion-ecrans.ts). Les éclats
 * des cartes ramassées et des obstacles pulvérisés par le solo ne vivent qu'ici.
 */

/** Où court JBG, à l'écran (pixels depuis la gauche). */
export const JBG_X = 64;

interface Eclat {
  x: number;
  y: number;
  vx: number;
  vy: number;
  vie: number;
  couleur: string;
}

export class RenduAvion {
  private manche = -1;
  private tarmac: Objet[] = [];
  private vus = new Set<number>();
  private eclats: Eclat[] = [];
  private flottants: { x: number; y: number; texte: string; vie: number; couleur: string }[] = [];
  private chutes = 0;
  private secousse = 0;

  dessine(ctx: CanvasRenderingContext2D, v: VueAvion, largeur: number, tick: number): void {
    if (v.manche !== this.manche) {
      this.manche = v.manche;
      this.tarmac = parcours(v.manche);
      this.vus = new Set(v.consommes);
      this.eclats = [];
      this.chutes = v.chutes;
    }
    if (v.chutes > this.chutes) this.secousse = 8;
    this.chutes = v.chutes;
    const sx = this.secousse > 0 ? Math.round(Math.sin(tick * 2.1) * this.secousse * 0.3) : 0;
    if (this.secousse > 0) this.secousse--;
    const ex = (x: number) => Math.round(x - v.x + JBG_X);
    ctx.save();
    ctx.translate(sx, 0);
    dessineFond(ctx, v.x, largeur, tick);
    this.avion(ctx, v, largeur, tick);
    dessineTarmac(ctx, v.x, largeur);
    this.objetsEtJbg(ctx, v, ex, largeur, tick);
    this.effets(ctx);
    ctx.restore();
    dessineEcranAvion(ctx, largeur, v, tick);
  }

  /** L'avion : loin, il est petit au bout de la piste ; près, il est grand et sa porte arrière arrive à la hauteur de JBG. */
  private avion(ctx: CanvasRenderingContext2D, v: VueAvion, largeur: number, tick: number): void {
    const ecart = xAvion(v.temps) - v.x;
    const s = Math.max(0.36, Math.min(1, 1.05 - ecart / 1800));
    const x = JBG_X + 10 + Math.max(0, ecart) * 0.12;
    if (x > largeur + 40) return;
    const k = (s - 0.36) / 0.64;
    const sol = Math.round(SOL_PISTE - 10 + 10 * k);
    const decolle = v.temps / 60 - DECOLLAGE;
    dessineAvion(
      ctx,
      x,
      sol,
      s,
      tick,
      ecart < 260,
      v.etape === 'rate' || v.embarque ? Math.max(0, decolle) : -1,
    );
  }

  /** Les objets et JBG, voie par voie, de la plus lointaine à la plus proche (JBG à sa place dans cet ordre). */
  private objetsEtJbg(
    ctx: CanvasRenderingContext2D,
    v: VueAvion,
    ex: (x: number) => number,
    largeur: number,
    tick: number,
  ): void {
    const s = v.temps / 60;
    const pris = new Set(v.consommes);
    this.nouveauxPris(v, ex, s);
    const visibles = this.tarmac
      .map((o, i) => ({ o, i, x: ex(o.x) }))
      .filter(
        ({ o, i, x }) =>
          !pris.has(i) && x > -(estObstacle(o) ? LONGUEURS[o.sorte] : 10) - 10 && x < largeur + 10,
      );
    const voieJbg = v.voieVue;
    for (let voie = 2; voie >= 0; voie--) {
      for (const { o, i, x } of visibles) if (voieDe(o, s) === voie) dessineObjet(ctx, o, i, x, s, tick);
      if (Math.round(voieJbg) === voie && v.etape !== 'embarque') this.jbg(ctx, v, tick);
    }
    if (v.etape === 'embarque') this.grimpe(ctx, v, tick);
  }

  /** JBG : il court, saute, trébuche, file en trottinette, joue son solo ; ses pieds au sol de sa voie (ou sur le tapis). */
  private jbg(ctx: CanvasRenderingContext2D, v: VueAvion, tick: number): void {
    const voie = v.voieVue;
    const bas = Math.floor(voie);
    const f = voie - bas;
    const sol =
      SOL_VOIES[bas]! + ((SOL_VOIES[Math.min(2, bas + 1)] ?? SOL_VOIES[bas]!) - SOL_VOIES[bas]!) * f;
    const y = Math.round(sol - v.z - (v.surTapis ? 14 : 0));
    // son ombre au sol
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(JBG_X - 5, Math.round(sol - (v.surTapis ? 14 : 0)) - 1, 10, 2);
    if (v.invulnerable > 0 && v.trebuche === 0 && tick % 6 < 3) ctx.globalAlpha = 0.5;
    ctx.save();
    ctx.translate(JBG_X, y);
    const bonus = v.bonus >= 0 ? BONUS[v.bonus] : null;
    const course = v.etape === 'course' || v.etape === 'intro';
    if (bonus === 'trottinette' && v.z === 0) {
      ctx.fillStyle = '#4ff0ff';
      ctx.fillRect(-8, -2, 16, 2);
      ctx.fillRect(6, -18, 1, 16);
      ctx.fillRect(3, -18, 6, 1);
      ctx.fillStyle = '#1a1a20';
      disque(ctx, -6, 0, 2);
      disque(ctx, 6, 0, 2);
      ctx.translate(0, -3);
      dessineFeuille(ctx, G.JBG as Genre, ANIM.DEBOUT, tick, false);
    } else if (v.trebuche > 0) {
      ctx.rotate(-0.7);
      if (!dessineDecorFeuille(ctx, 'jbg-saut', 0)) dessineFeuille(ctx, G.JBG as Genre, ANIM.SAUT, 0, false);
      ctx.rotate(0.7);
      for (let k = 0; k < 3; k++) {
        const a = tick / 6 + (k * Math.PI * 2) / 3;
        ctx.fillStyle = '#ffd23f';
        ctx.fillRect(Math.round(Math.cos(a) * 8) - 6, -26 + Math.round(Math.sin(a) * 2), 2, 2);
      }
    } else if (v.z > 0) {
      if (!dessineDecorFeuille(ctx, 'jbg-saut', 0)) dessineFeuille(ctx, G.JBG as Genre, ANIM.SAUT, 0, false);
    } else
      dessineFeuille(
        ctx,
        G.JBG as Genre,
        course ? ANIM.COURT : ANIM.DEBOUT,
        Math.floor(tick / 3) % 12,
        false,
      );
    ctx.restore();
    ctx.globalAlpha = 1;
    // le solo : des notes et des ondes qui partent devant lui
    if (bonus === 'solo')
      for (let k = 0; k < 4; k++) {
        const p = ((tick * 3 + k * 18) % 70) / 70;
        ctx.fillStyle = `rgba(255,${200 - k * 30},80,${(1 - p).toFixed(2)})`;
        ctx.fillRect(Math.round(JBG_X + 8 + p * 70), Math.round(y - 14 - Math.sin(p * 9 + k) * 4), 2, 3);
        ctx.fillRect(Math.round(JBG_X + 9 + p * 70), Math.round(y - 16 - Math.sin(p * 9 + k) * 4), 2, 1);
      }
    if (bonus === 'aimant' && tick % 8 < 4) {
      ctx.strokeStyle = 'rgba(255,90,90,0.5)';
      ctx.beginPath();
      ctx.arc(JBG_X, y - 12, 16, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (bonus === 'ressorts' && tick % 4 < 2) {
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(JBG_X - 4, y + 1, 2, 1);
      ctx.fillRect(JBG_X + 3, y + 1, 2, 1);
    }
  }

  /** L'embarquement : JBG grimpe à l'échelle, de dos, puis disparaît par la porte. */
  private grimpe(ctx: CanvasRenderingContext2D, v: VueAvion, tick: number): void {
    const p = 1 - v.minuteur / DUREE_FIN;
    if (p > 0.55) return;
    const ecart = Math.max(0, xAvion(v.temps) - v.x);
    const x = JBG_X + 10 + ecart * 0.12 + 5;
    const y = SOL_VOIES[2]! - (p / 0.55) * 26;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (!dessineDecorFeuille(ctx, 'jbg-echelle', (tick >> 3) & 1))
      dessineFeuille(ctx, G.JBG as Genre, ANIM.ECHELLE, tick, false);
    ctx.restore();
  }

  /** Ce que la vue dit avoir été pris ou cassé depuis la dernière image : des éclats, et ce que ça rapporte. */
  private nouveauxPris(v: VueAvion, ex: (x: number) => number, s: number): void {
    for (const i of v.consommes) {
      if (this.vus.has(i)) continue;
      this.vus.add(i);
      const o = this.tarmac[i];
      if (!o) continue;
      const x = ex(o.x) + 3;
      const y = SOL_VOIES[voieDe(o, s)]! - 6 - o.hauteur;
      const casse = estObstacle(o);
      const n = casse ? 12 : 6;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        this.eclats.push({
          x,
          y,
          vx: Math.cos(a) * (casse ? 70 : 40),
          vy: Math.sin(a) * (casse ? 70 : 40) - (casse ? 30 : 0),
          vie: casse ? 24 : 14,
          couleur: casse ? ['#ff7a1a', '#ffd23f', '#c8c8d0'][k % 3]! : '#fff6c0',
        });
      }
      if (o.sorte === 'carte')
        this.flottants.push({ x: x - 4, y: y - 6, texte: '+5', vie: 24, couleur: '#ffffff' });
      else if (!casse)
        this.flottants.push({ x: x - 12, y: y - 8, texte: 'BONUS !', vie: 40, couleur: '#4ff0ff' });
    }
  }

  private effets(ctx: CanvasRenderingContext2D): void {
    this.eclats = this.eclats.filter((e) => --e.vie > 0);
    for (const e of this.eclats) {
      e.x += e.vx / 60;
      e.y += e.vy / 60;
      e.vy += 3;
      ctx.fillStyle = e.couleur;
      ctx.fillRect(Math.round(e.x), Math.round(e.y), e.vie > 10 ? 2 : 1, e.vie > 10 ? 2 : 1);
    }
    this.flottants = this.flottants.filter((f) => --f.vie > 0);
    for (const f of this.flottants) {
      f.y -= 0.4;
      ecrit(ctx, f.texte, Math.round(f.x), Math.round(f.y), f.couleur);
    }
  }
}
