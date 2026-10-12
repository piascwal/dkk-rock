import { HAUTEUR_VUE } from '../config';
import { Aleatoire } from '../moteur/maths';
import type { Decor, Theme } from './themes';

const LARGEUR_BANDE = 960;
/** Les décors sont peints sur une bande de 270 px de haut, calée en bas de la vue. */
const HAUTEUR_BANDE = 270;

type Peinture = (c: CanvasRenderingContext2D, r: Aleatoire, th: Theme, plan: 0 | 1) => void;

/** Une ligne de crêtes : du point (x, y) on monte et on descend au hasard. */
function cretes(
  c: CanvasRenderingContext2D,
  r: Aleatoire,
  base: number,
  ampl: number,
  pas: number,
  pointu: boolean,
): void {
  c.beginPath();
  c.moveTo(0, HAUTEUR_BANDE);
  let y = base;
  for (let x = 0; x <= LARGEUR_BANDE; x += pas) {
    y = pointu
      ? base - r.entre(0, ampl)
      : Math.max(base - ampl, Math.min(base, y + r.entre(-ampl / 3, ampl / 3)));
    c.lineTo(x, y);
    if (pointu) c.lineTo(x + pas / 2, base - r.entre(0, ampl * 0.3));
  }
  c.lineTo(LARGEUR_BANDE, base);
  c.lineTo(LARGEUR_BANDE, HAUTEUR_BANDE);
  c.fill();
}

function fenetres(
  c: CanvasRenderingContext2D,
  r: Aleatoire,
  x: number,
  y: number,
  w: number,
  h: number,
  allumee: string,
): void {
  for (let fy = y + 4; fy < y + h - 4; fy += 6)
    for (let fx = x + 3; fx < x + w - 3; fx += 5)
      if (r.suivant() < 0.35) {
        c.fillStyle = allumee;
        c.fillRect(fx, fy, 2, 3);
      }
}

const DECORS: Record<Decor, Peinture> = {
  pavillons: (c, r, th, plan) => {
    c.fillStyle = plan ? th.proche : th.lointain;
    if (!plan) return cretes(c, r, 200, 40, 30, false);
    for (let x = 0; x < LARGEUR_BANDE; x += r.entier(60, 90)) {
      const w = r.entier(36, 50);
      const h = r.entier(26, 36);
      c.fillStyle = th.proche;
      c.fillRect(x, 230 - h, w, h + 40);
      c.beginPath();
      c.moveTo(x - 4, 230 - h);
      c.lineTo(x + w / 2, 230 - h - 16);
      c.lineTo(x + w + 4, 230 - h);
      c.fill();
      fenetres(c, r, x, 230 - h, w, h, '#ffcf6b');
    }
  },
  montagnes: (c, r, th, plan) => {
    if (!plan) {
      c.fillStyle = th.lointain;
      cretes(c, r, 190, 110, 80, true);
      c.fillStyle = '#ffffff';
      c.globalAlpha = 0.5;
      for (let i = 0; i < 6; i++)
        c.fillRect(r.entier(0, LARGEUR_BANDE), r.entier(20, 70), r.entier(30, 60), 6);
      c.globalAlpha = 1;
      return;
    }
    c.fillStyle = th.proche;
    cretes(c, r, 230, 40, 40, false);
    for (let x = 0; x < LARGEUR_BANDE; x += r.entier(10, 22))
      sapin(c, x, 236 - r.entier(0, 30), r.entier(14, 26), '#2f5a33');
  },
  pics: (c, r, th, plan) => {
    c.fillStyle = plan ? th.proche : th.lointain;
    cretes(c, r, plan ? 235 : 200, plan ? 60 : 130, plan ? 50 : 70, true);
    if (plan)
      for (let x = 0; x < LARGEUR_BANDE; x += r.entier(14, 30)) sapin(c, x, 245, r.entier(12, 20), '#e8f2ff');
  },
  palmiers: (c, r, th, plan) => {
    if (!plan) {
      c.fillStyle = th.lointain;
      c.fillRect(0, 190, LARGEUR_BANDE, 80);
      c.fillStyle = 'rgba(255,255,255,0.4)';
      for (let i = 0; i < 40; i++)
        c.fillRect(r.entier(0, LARGEUR_BANDE), r.entier(195, 260), r.entier(6, 20), 1);
      return;
    }
    for (let x = 20; x < LARGEUR_BANDE; x += r.entier(70, 130))
      palmier(c, x, 250, r.entier(50, 80), th.proche);
  },
  immeubles: (c, r, th, plan) => {
    for (let x = 0; x < LARGEUR_BANDE; x += r.entier(30, 55)) {
      const w = r.entier(26, 50);
      const h = plan ? r.entier(60, 140) : r.entier(90, 190);
      c.fillStyle = plan ? th.proche : th.lointain;
      c.fillRect(x, HAUTEUR_BANDE - h, w, h);
      fenetres(c, r, x, HAUTEUR_BANDE - h, w, h, plan ? '#ffd56b' : '#5b4a8a');
      if (plan && r.suivant() < 0.25) {
        c.fillStyle = r.choix(['#ff4fd8', '#3fe0ff', '#7cfc7c']);
        c.fillRect(x + 4, HAUTEUR_BANDE - h + 6, w - 8, 3);
      }
    }
  },
  club: (c, _r, th, plan) => {
    c.fillStyle = plan ? th.proche : th.lointain;
    for (let x = 0; x < LARGEUR_BANDE; x += plan ? 120 : 70) {
      const h = plan ? 90 : 150;
      c.fillRect(x + 10, HAUTEUR_BANDE - h, plan ? 40 : 24, h);
      c.fillStyle = '#000';
      for (let y = HAUTEUR_BANDE - h + 10; y < HAUTEUR_BANDE; y += 22) {
        c.beginPath();
        c.arc(x + 10 + (plan ? 20 : 12), y, plan ? 8 : 5, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = plan ? th.proche : th.lointain;
    }
  },
};

function sapin(c: CanvasRenderingContext2D, x: number, y: number, h: number, coul: string): void {
  c.fillStyle = coul;
  c.beginPath();
  c.moveTo(x, y - h);
  c.lineTo(x - h / 3, y);
  c.lineTo(x + h / 3, y);
  c.fill();
  c.fillRect(x - 1, y, 2, 30);
}

function palmier(c: CanvasRenderingContext2D, x: number, y: number, h: number, coul: string): void {
  c.strokeStyle = coul;
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(x, y);
  c.quadraticCurveTo(x + 10, y - h / 2, x + 4, y - h);
  c.stroke();
  c.fillStyle = coul;
  for (const a of [-2.6, -2, -1.2, -0.5, 0.1]) {
    c.beginPath();
    c.ellipse(x + 4 + Math.cos(a) * 12, y - h + Math.sin(a) * 6 + 4, 14, 3, a, 0, Math.PI * 2);
    c.fill();
  }
}

/** Vitesse de défilement des trois plans (1 = la même que le jeu) : lointain, moyen, proche. */
const PARALLAXE = [0.12, 0.3, 0.55];

/** Le fond d'un monde : un ciel en dégradé et trois plans de décor qui défilent moins vite que le jeu. */
export class Fond {
  private readonly plans: HTMLCanvasElement[];

  constructor(private readonly theme: Theme) {
    // le plan proche reprend le dessin du plan moyen, autre graine, assombri : plus près, plus sombre
    this.plans = ([0, 1, 1] as const).map((plan, i) => {
      const toile = document.createElement('canvas');
      toile.width = LARGEUR_BANDE;
      toile.height = HAUTEUR_BANDE;
      const c = toile.getContext('2d')!;
      DECORS[theme.decor](c, new Aleatoire(7 + i * 13), theme, plan);
      if (i === 2) {
        c.globalCompositeOperation = 'source-atop';
        c.fillStyle = 'rgba(0,0,0,0.35)';
        c.fillRect(0, 0, LARGEUR_BANDE, HAUTEUR_BANDE);
      }
      return toile;
    });
  }

  dessine(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    largeur: number,
    basMonde: number,
    tick: number,
  ): void {
    const th = this.theme;
    const g = ctx.createLinearGradient(0, 0, 0, HAUTEUR_VUE);
    g.addColorStop(0, th.ciel[0]);
    g.addColorStop(1, th.ciel[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, largeur, HAUTEUR_VUE);
    this.astres(ctx, largeur, tick);
    // en haut d'un niveau, le décor descend : on voit plus de ciel
    const hauteurAuDessus = Math.max(0, basMonde - HAUTEUR_VUE - camY);
    PARALLAXE.forEach((f, i) => {
      const x = -((camX * f) % LARGEUR_BANDE);
      const y = HAUTEUR_VUE - HAUTEUR_BANDE + Math.round(hauteurAuDessus * f * 0.6) + i * 6;
      for (let k = 0; x + k * LARGEUR_BANDE < largeur; k++)
        ctx.drawImage(this.plans[i]!, Math.round(x + k * LARGEUR_BANDE), y);
    });
    if (th.decor === 'club') this.lasers(ctx, largeur, tick);
  }

  private astres(ctx: CanvasRenderingContext2D, largeur: number, tick: number): void {
    const d = this.theme.decor;
    if (d === 'pavillons' || d === 'palmiers') {
      ctx.fillStyle = d === 'palmiers' ? '#fff3b0' : '#ffb36b';
      ctx.beginPath();
      ctx.arc(largeur * 0.7, 120, 26, 0, Math.PI * 2);
      ctx.fill();
    } else if (d === 'pics' || d === 'immeubles') {
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 40; i++) {
        if ((i * 7 + Math.floor(tick / 20)) % 13 === 0) continue;
        ctx.fillRect((i * 97) % largeur, (i * 53) % 140, 1, 1);
      }
      ctx.fillStyle = '#f4f1d0';
      ctx.beginPath();
      ctx.arc(largeur * 0.2, 50, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private lasers(ctx: CanvasRenderingContext2D, largeur: number, tick: number): void {
    ctx.globalAlpha = 0.25;
    const couleurs = ['#ff4fd8', '#3fe0ff', '#7cfc7c'];
    for (let i = 0; i < 6; i++) {
      const a = Math.sin(tick / 40 + i) * 0.8 + Math.PI / 2;
      const ox = (largeur / 6) * i + 40;
      ctx.strokeStyle = couleurs[i % 3]!;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ox, 0);
      ctx.lineTo(ox + Math.cos(a) * 400, Math.sin(a) * 400);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}
