import { HAUTEUR_VUE } from '../config';
import { POSITION_HEROS } from './camera';
import { Aleatoire } from '../moteur/maths';
import { Ciel } from './ciel';
import { arbreRond, brume, palmierPixel, sapinPixel } from './fonds-arbres';
import { DECORS_BRETONS, type Peinture } from './fonds-bretagne';
import { PEINTURE_FISE } from './fonds-fise';
import type { Decor, Theme } from './themes';

const LARGEUR_BANDE = 960;
/** Les décors sont peints sur une bande de 270 px de haut, calée en bas de la vue. */
const HAUTEUR_BANDE = 270;

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
    // des arbres sombres entre les maisons, une barrière de piquets
    for (let x = 30; x < LARGEUR_BANDE; x += r.entier(50, 90))
      arbreRond(c, x, 236, r.entier(22, 34), r.choix(['#27403a', '#2d4a3a', '#22362f']));
    c.fillStyle = '#1d1630';
    for (let x = 0; x < LARGEUR_BANDE; x += 4) c.fillRect(x, 226, 1, 8);
    c.fillRect(0, 229, LARGEUR_BANDE, 1);
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
    // une vraie forêt : des sapins et des arbres ronds de toutes tailles, plus de brume au pied
    for (let x = 0; x < LARGEUR_BANDE; x += r.entier(9, 20)) {
      const h = r.entier(16, 36);
      const y = 238 - r.entier(0, 26);
      if (r.suivant() < 0.65) sapinPixel(c, x, y, h, '#2f5a33');
      else arbreRond(c, x, y, h, r.choix(['#3f7a3a', '#4f9a3a', '#356a35']));
    }
    brume(c, LARGEUR_BANDE, 190, 262, 'rgba(255,255,255,0.2)');
  },
  pics: (c, r, th, plan) => {
    c.fillStyle = plan ? th.proche : th.lointain;
    cretes(c, r, plan ? 235 : 200, plan ? 60 : 130, plan ? 50 : 70, true);
    if (plan) {
      for (let x = 0; x < LARGEUR_BANDE; x += r.entier(12, 24))
        sapinPixel(c, x, 250 - r.entier(0, 8), r.entier(16, 32), '#5f7fa3', '#e8f2ff');
      brume(c, LARGEUR_BANDE, 200, 270, 'rgba(220,235,255,0.25)');
    }
  },
  palmiers: (c, r, th, plan) => {
    if (!plan) {
      c.fillStyle = th.lointain;
      c.fillRect(0, 190, LARGEUR_BANDE, 80);
      c.fillStyle = 'rgba(255,255,255,0.4)';
      for (let i = 0; i < 40; i++)
        c.fillRect(r.entier(0, LARGEUR_BANDE), r.entier(195, 260), r.entier(6, 20), 1);
      // des voiliers à l'horizon : une coque sombre, une voile claire en escalier
      for (let i = 0; i < 4; i++) {
        const bx = r.entier(40, LARGEUR_BANDE - 40);
        c.fillStyle = '#3a2a2a';
        c.fillRect(bx, 197, 12, 2);
        c.fillStyle = '#fff6dc';
        for (let k = 0; k < 9; k++) c.fillRect(bx + 4, 188 + k, 1 + Math.floor(k / 2), 1);
      }
      return;
    }
    for (let x = 20; x < LARGEUR_BANDE; x += r.entier(46, 90))
      palmierPixel(c, x, 252 - r.entier(0, 8), r.entier(36, 70), th.proche);
  },
  immeubles: (c, r, th, plan) => {
    for (let x = 0; x < LARGEUR_BANDE; x += r.entier(30, 55)) {
      const w = r.entier(26, 50);
      const h = plan ? r.entier(60, 140) : r.entier(90, 190);
      c.fillStyle = plan ? th.proche : th.lointain;
      c.fillRect(x, HAUTEUR_BANDE - h, w, h);
      fenetres(c, r, x, HAUTEUR_BANDE - h, w, h, plan ? '#ffd56b' : '#5b4a8a');
      const haut = HAUTEUR_BANDE - h;
      if (r.suivant() < 0.3) {
        c.fillRect(x + Math.round(w / 2), haut - 12, 1, 12);
        c.fillStyle = '#ff4f4f';
        c.fillRect(x + Math.round(w / 2), haut - 13, 1, 1);
      } else if (r.suivant() < 0.4) {
        c.fillStyle = plan ? '#0f0c20' : '#1b1538';
        c.fillRect(x + 4, haut - 7, 9, 7);
        c.fillRect(x + 6, haut - 9, 5, 2);
      }
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
  ...DECORS_BRETONS,
  fise: PEINTURE_FISE,
};

/** Vitesse de défilement des trois plans (1 = la même que le jeu) : lointain, moyen, proche. */
const PARALLAXE = [0.12, 0.3, 0.55];
/** Et le défilement vertical des plans, quand la caméra monte ou descend. */
const PARALLAXE_VERTICALE = [0.2, 0.45, 0.75];
/** Où se trouve le sol à l'écran quand le héros marche dessus, et où il se pose dans la bande d'un plan de décor. */
const HORIZON = Math.round(HAUTEUR_VUE * POSITION_HEROS) + 8;
const PIED_DE_BANDE = 238;

/** Le fond d'un monde : un ciel en dégradé et trois plans de décor qui défilent moins vite que le jeu. */
export class Fond {
  private readonly plans: HTMLCanvasElement[];
  private readonly ciel: Ciel;

  constructor(private readonly theme: Theme) {
    this.ciel = new Ciel(theme.decor);
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
    surface: number,
    tick: number,
    /** le ferry avance : de combien le fond a défilé en plus de la caméra (en pixels du monde) */
    decalage = 0,
  ): void {
    const th = this.theme;
    const camFond = camX + decalage;
    const g = ctx.createLinearGradient(0, 0, 0, HAUTEUR_VUE);
    g.addColorStop(0, th.ciel[0]);
    g.addColorStop(1, th.ciel[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, largeur, HAUTEUR_VUE);
    this.astres(ctx, largeur, tick);
    this.ciel.dessine(ctx, camFond, largeur, tick);
    // chaque plan est posé sur l'horizon : le pied de ses arbres suit le sol quand on marche, et glisse moins vite que lui
    // quand on monte ou descend (plus le plan est loin, moins il bouge) : de la profondeur, et des forêts visibles
    const solEcran = surface - camY;
    PARALLAXE.forEach((f, i) => {
      const x = -((camFond * f) % LARGEUR_BANDE);
      const pied = HORIZON + (solEcran - HORIZON) * PARALLAXE_VERTICALE[i]!;
      const y = Math.round(pied) - PIED_DE_BANDE;
      // sous la bande : de la couleur du plan, seulement là où l'écran existe
      const dessous = Math.max(0, y + HAUTEUR_BANDE - 1);
      if (dessous < HAUTEUR_VUE) {
        ctx.fillStyle = i === 0 ? th.lointain : th.proche;
        ctx.fillRect(0, dessous, largeur, HAUTEUR_VUE - dessous);
      }
      // et de la bande, seulement la part visible (trois images de 960 × 270 en entier, à chaque image, coûtaient cher)
      const h0 = Math.max(0, -y);
      const h1 = Math.min(HAUTEUR_BANDE, HAUTEUR_VUE - y);
      if (h1 <= h0) return;
      for (let k = 0; x + k * LARGEUR_BANDE < largeur; k++) {
        const dx = Math.round(x + k * LARGEUR_BANDE);
        const sx = Math.max(0, -dx);
        const sw = Math.min(LARGEUR_BANDE, largeur - dx) - sx;
        if (sw > 0) ctx.drawImage(this.plans[i]!, sx, h0, sw, h1 - h0, dx + sx, y + h0, sw, h1 - h0);
      }
    });
    this.ciel.oiseaux(ctx, camFond, largeur, tick);
  }

  private astres(ctx: CanvasRenderingContext2D, largeur: number, tick: number): void {
    const d = this.theme.decor;
    if (d === 'pavillons' || d === 'palmiers' || d === 'falaises' || d === 'fise') {
      ctx.fillStyle = d === 'pavillons' ? '#ffb36b' : '#fff3b0';
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
}
