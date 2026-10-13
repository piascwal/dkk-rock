import type { Synthe } from '../audio/synthe';
import { G } from '../jeu/vue';
import { FEUILLES } from '../rendu/feuilles';
import { imageDe } from '../rendu/feuilles-images';
import { ecritCentre } from '../rendu/police';
import { VERSION } from '../version';
import { DUREE_CASE, dessineCase } from './intro-comics';
import { pleinEcran } from './plein-ecran';
import { CASES, ENTREES, FIN, IMPACT, INSTRUMENTS, joueIntro } from './intro-son';

/**
 * L'intro, au lancement : les cinq membres du groupe entrent sur scène un à un, sortent leurs instruments, le logo DKK
 * s'écrase et fait tout trembler, « Digital Kaskilt » s'écrit, Fadatchi déboule. Avant, chacun a sa case de BD.
 * Un bouton en bas permet de la passer.
 * Un premier écran attend un toucher : le navigateur n'autorise le son qu'après un geste.
 */
const H = 240;
const NOMS = ['JBT', 'JBM', 'JBG', 'MAT', 'TOM'];
const GENRES = [G.JBT, G.JBM, G.JBG, G.MAT, G.TOM];
const COULEURS = ['#e5432f', '#3fa7f2', '#ffd23f', '#7cfc7c', '#ff4fd8'];

interface Eclat {
  x: number;
  y: number;
  vx: number;
  vy: number;
  c: string;
}

export class Intro {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly bases = new Image();
  private w = 520;
  private debut = 0;
  private lancee = false;
  private finie = false;
  private eclats: Eclat[] = [];
  private readonly passer = document.createElement('button');

  constructor(
    private readonly toile: HTMLCanvasElement,
    private readonly synthe: Synthe,
    private readonly ensuite: () => void,
  ) {
    this.ctx = toile.getContext('2d')!;
    this.passer.className = 'passer-intro';
    this.passer.type = 'button';
    this.passer.textContent = 'Passer l’intro ›';
    this.passer.hidden = true;
    this.passer.addEventListener('click', () => this.termine());
    toile.after(this.passer);
    this.bases.src = `${import.meta.env.BASE_URL}sprites/intro-heros.png?v=${VERSION}`;
  }

  lance(): void {
    this.toile.hidden = false;
    this.dimensionne();
    window.addEventListener('resize', this.dimensionne);
    this.toile.addEventListener('pointerdown', this.touche);
    window.addEventListener('keydown', this.touche);
    requestAnimationFrame(this.image);
  }

  private dimensionne = (): void => {
    const k = Math.max(1, Math.floor((innerHeight * (devicePixelRatio || 1)) / H));
    this.w = Math.round((H * innerWidth) / innerHeight);
    this.toile.width = this.w * k;
    this.toile.height = H * k;
    this.ctx.setTransform(k, 0, 0, k, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  };

  private touche = (e: Event): void => {
    e.preventDefault();
    if (!this.lancee) {
      // le premier toucher : le son devient possible, l'intro démarre
      this.synthe.demarre();
      pleinEcran();
      this.lancee = true;
      this.debut = performance.now();
      setTimeout(() => joueIntro(this.synthe), 30);
      this.passer.hidden = false;
    } else if (e instanceof KeyboardEvent && (e.code === 'Escape' || e.code === 'Enter')) this.termine();
  };

  private termine(): void {
    if (this.finie) return;
    this.finie = true;
    this.toile.hidden = true;
    this.passer.remove();
    window.removeEventListener('resize', this.dimensionne);
    window.removeEventListener('keydown', this.touche);
    this.toile.removeEventListener('pointerdown', this.touche);
    this.ensuite();
  }

  private image = (): void => {
    if (this.finie) return;
    const t = this.lancee ? (performance.now() - this.debut) / 1000 : 0;
    this.dessine(t);
    if (t > FIN + 1.5) this.termine();
    else requestAnimationFrame(this.image);
  };

  private dessine(t: number): void {
    const c = this.ctx;
    const w = this.w;
    c.save();
    // le tremblement après l'impact du logo
    const choc = t > IMPACT ? Math.max(0, 1 - (t - IMPACT) / 0.7) : 0;
    if (choc)
      c.translate(
        Math.round((Math.random() - 0.5) * 10 * choc),
        Math.round((Math.random() - 0.5) * 10 * choc),
      );
    const fond = c.createLinearGradient(0, 0, 0, H);
    fond.addColorStop(0, '#0b0510');
    fond.addColorStop(1, '#2a1033');
    c.fillStyle = fond;
    c.fillRect(-10, -10, w + 20, H + 20);
    if (!this.lancee) {
      ecritCentre(c, 'DKK', w / 2, 80, '#fff4d6', 6);
      if (Math.floor(performance.now() / 500) % 2)
        ecritCentre(c, 'Touchez pour rocker', w / 2, 150, '#ffd23f', 2);
      c.restore();
      return;
    }
    // les cases de BD, l'une après l'autre
    const k = CASES.findIndex((d) => t >= d && t < d + DUREE_CASE);
    if (k >= 0) {
      dessineCase(c, w, k, (t - CASES[k]!) / DUREE_CASE, t);
      c.restore();
      return;
    }
    // la scène : le plancher
    c.fillStyle = '#1a0a14';
    c.fillRect(-10, 214, w + 20, 40);
    c.fillStyle = '#3a1a2a';
    c.fillRect(-10, 214, w + 20, 2);
    this.heros(t);
    this.logo(t);
    this.kiwi(t);
    if (t > INSTRUMENTS && t < INSTRUMENTS + 0.15) {
      c.fillStyle = 'rgba(255,255,255,0.8)';
      c.fillRect(-10, -10, w + 20, H + 20);
    }
    if (t > IMPACT + 2.4 && Math.floor(t * 2) % 2) ecritCentre(c, 'ROCK NEVER DIES', w / 2, 6, '#ffd23f', 2);
    c.restore();
  }

  private heros(t: number): void {
    const c = this.ctx;
    GENRES.forEach((g, i) => {
      const t0 = ENTREES[i]!;
      if (t < t0) return;
      const x = Math.round(this.w * (0.14 + i * 0.18));
      // entrée par le bas, avec un rebond
      const u = Math.min(1, (t - t0) / 0.35);
      const rebond = 1 + 2.2 * (u - 1) ** 3 + 1.2 * (u - 1) ** 2;
      const y = Math.round(214 + (1 - rebond) * 140);
      // le projecteur
      c.fillStyle = COULEURS[i]!;
      c.globalAlpha = 0.12;
      c.beginPath();
      c.moveTo(x - 6, 0);
      c.lineTo(x + 6, 0);
      c.lineTo(x + 40, 214);
      c.lineTo(x - 40, 214);
      c.fill();
      c.globalAlpha = 1;
      const f = FEUILLES[g];
      const img = imageDe(g);
      if (t > INSTRUMENTS && f && img) {
        const col = Math.floor(t * 6) % 4; // ils bougent en rythme
        c.drawImage(img, col * f.w, 0, f.w, f.h, x - (f.pied ?? f.w / 2), y - f.h, f.w, f.h);
      } else if (this.bases.complete && this.bases.naturalWidth)
        c.drawImage(this.bases, i * 128, 0, 128, 128, x - 64, y - 128, 128, 128);
      ecritCentre(c, NOMS[i]!, x, Math.max(y, 214) + 8, COULEURS[i]!, 2);
    });
  }

  private logo(t: number): void {
    if (t < IMPACT - 0.4) return;
    const c = this.ctx;
    const u = Math.min(1, (t - (IMPACT - 0.4)) / 0.4);
    const y = Math.round(-80 + (20 + 80) * u * u);
    const ecrase = t > IMPACT && t < IMPACT + 0.12 ? 2 : 0;
    const taille = 8;
    const x = this.w / 2;
    if (t > IMPACT && !this.eclats.length)
      for (let k = 0; k < 60; k++)
        this.eclats.push({
          x: x + (Math.random() - 0.5) * 140,
          y: 70,
          vx: (Math.random() - 0.5) * 6,
          vy: -Math.random() * 5,
          c: ['#fff4d6', '#00c2d1', '#ff2e93', '#c4172c', '#888'][k % 5]!,
        });
    for (const e of this.eclats) {
      e.x += e.vx;
      e.y += e.vy;
      e.vy += 0.25;
      c.fillStyle = e.c;
      c.fillRect(Math.round(e.x), Math.round(e.y), 2, 2);
    }
    for (const [d, col] of [
      [9, '#000000'],
      [6, '#ff2e93'],
      [3, '#00c2d1'],
      [0, '#fff4d6'],
    ] as const)
      ecritCentre(c, 'DKK', x + d, y + d + ecrase, col, taille);
    if (t > IMPACT + 0.3) {
      const n = Math.min(15, Math.floor((t - IMPACT - 0.3) / 0.05));
      ecritCentre(c, 'DIGITAL KASKILT'.slice(0, n), x, y + 50, '#ffffff', 2);
      // la bande de tartan
      const lw = 150;
      const bandes = ['#c4172c', '#0b6e4f', '#1b3a8a'];
      for (let k = 0; k < lw; k += 4) {
        c.fillStyle = bandes[Math.floor(k / 12) % 3]!;
        c.fillRect(Math.round(x - lw / 2 + k), y + 62, 4, 4);
      }
    }
  }

  private kiwi(t: number): void {
    const debut = IMPACT + 1;
    if (t < debut) return;
    const f = FEUILLES[G.KIWI];
    const img = imageDe(G.KIWI);
    if (!f || !img) return;
    const u = Math.min(1, (t - debut) / 1.2);
    const x = Math.round(-60 + (this.w * 0.55 + 60) * u);
    const court = u < 1;
    const ligne = court ? 1 : 0;
    const col = Math.floor(t * (court ? 12 : 6)) % (f.images[ligne] ?? 1);
    const saut = !court && Math.floor(t * 3) % 3 === 0 ? -6 : 0;
    this.ctx.drawImage(
      img,
      col * f.w,
      ligne * f.h,
      f.w,
      f.h,
      x - f.w,
      236 - f.h * 2 + saut,
      f.w * 2,
      f.h * 2,
    );
  }
}
