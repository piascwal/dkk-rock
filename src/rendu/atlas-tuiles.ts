import { TUILE } from '../config';
import { bruit } from '../moteur/maths';
import { NB_TUILES, T } from '../monde/tuiles';
import { moucheture, PEINTRES_PIERRES, px, type Peintre } from './atlas-pierres';
import { DEBORD, habille, habilleParoi } from './bords-tuiles';
import { PEINTRES_TISSU } from './tissu';
import type { Theme } from './themes';

const VARIANTES = 4;

function tonneau(c: CanvasRenderingContext2D, bois: string, cercle: string, pancarte: string): void {
  px(c, 3, 1, 10, 14, bois);
  px(c, 2, 4, 12, 8, bois);
  px(c, 2, 4, 12, 1, cercle);
  px(c, 2, 11, 12, 1, cercle);
  px(c, 4, 6, 8, 4, pancarte);
}

const PEINTRES: Partial<Record<number, Peintre>> = {
  ...PEINTRES_PIERRES,
  ...PEINTRES_TISSU,
  [T.TERRE]: (c, v, th) => {
    px(c, 0, 0, 16, 16, th.terre);
    moucheture(c, v, 'rgba(0,0,0,0.25)', 10, 1);
    moucheture(c, v, 'rgba(255,255,255,0.12)', 5, 2);
  },
  [T.ROCHE]: (c, v) => {
    px(c, 0, 0, 16, 16, '#6d6d78');
    px(c, 0, 0, 16, 1, '#8a8a96');
    px(c, 0, 15, 16, 1, '#4f4f58');
    moucheture(c, v, '#585862', 8, 3);
    moucheture(c, v, '#9393a0', 4, 4);
    px(c, 3 + v, 6, 5, 1, '#55555f');
  },
  [T.BRIQUE]: (c) => {
    px(c, 0, 0, 16, 16, '#7a2a20');
    for (let r = 0; r < 4; r++) {
      const dec = r % 2 ? 4 : 0;
      for (let b = -1; b < 2; b++) px(c, b * 8 + dec + 1, r * 4 + 1, 7, 3, r % 2 ? '#a5402f' : '#9c3b2e');
    }
  },
  [T.METAL]: (c) => {
    px(c, 0, 0, 16, 16, '#7d8996');
    px(c, 1, 1, 14, 14, '#95a2b0');
    px(c, 1, 1, 14, 1, '#c4ced8');
    for (const [x, y] of [
      [2, 2],
      [12, 2],
      [2, 12],
      [12, 12],
    ] as const)
      px(c, x, y, 2, 2, '#5c6670');
  },
  [T.SOCLE]: (c, v) => {
    px(c, 0, 0, 16, 16, '#26232b');
    moucheture(c, v, '#34303a', 12, 5);
  },
  [T.NEIGE]: (c, v) => {
    px(c, 0, 0, 16, 16, '#e6f0fb');
    moucheture(c, v, '#c4d6ec', 8, 6);
    px(c, 0, 15, 16, 1, '#b8cbe2');
  },
  [T.GLACE]: (c, v) => {
    px(c, 0, 0, 16, 16, '#8fd0ee');
    px(c, 2 + v, 2, 8, 1, '#e8fbff');
    px(c, 4 + v, 3, 3, 1, '#e8fbff');
    px(c, 1, 10, 4, 1, '#c8f0ff');
    px(c, 0, 15, 16, 1, '#5fa8c8');
  },
  [T.BOIS]: (c, v) => {
    px(c, 0, 0, 16, 16, '#8a5a2b');
    for (let r = 0; r < 4; r++) {
      px(c, 0, r * 4, 16, 1, '#5e3b1a');
      px(c, (v * 5 + r * 7) % 16, r * 4 + 2, 1, 1, '#5e3b1a');
    }
    px(c, 0, 1, 16, 1, '#a8743a');
  },
  [T.PLATEFORME]: (c) => {
    px(c, 0, 0, 16, 4, '#a8743a');
    px(c, 0, 0, 16, 1, '#d29a55');
    px(c, 0, 4, 16, 1, '#5e3b1a');
    px(c, 2, 5, 2, 4, '#5e3b1a');
    px(c, 12, 5, 2, 4, '#5e3b1a');
  },
  [T.ECHELLE]: (c) => {
    px(c, 2, 0, 2, 16, '#9a6a35');
    px(c, 12, 0, 2, 16, '#9a6a35');
    for (let y = 2; y < 16; y += 5) px(c, 2, y, 12, 2, '#c49a5a');
  },
  // les parties incassables gardent l'allure de leur matériau, juste un peu plus sombres
  [T.ECHELON]: (c) => {
    px(c, 2, 0, 2, 16, '#7a5228');
    px(c, 12, 0, 2, 16, '#7a5228');
    for (let y = 2; y < 16; y += 5) px(c, 2, y, 12, 2, '#a07a42');
  },
  [T.PITON]: (c) => {
    px(c, 0, 0, 16, 4, '#8a5e2c');
    px(c, 0, 0, 16, 1, '#b07f45');
    px(c, 0, 4, 16, 1, '#4a2e12');
    px(c, 2, 5, 2, 4, '#4a2e12');
    px(c, 12, 5, 2, 4, '#4a2e12');
  },
  [T.CAISSE]: (c) => {
    px(c, 0, 0, 16, 16, '#6b4520');
    px(c, 1, 1, 14, 14, '#b07d3c');
    for (let i = 1; i < 15; i++) {
      px(c, i, i, 2, 1, '#6b4520');
      px(c, 15 - i - 1, i, 2, 1, '#6b4520');
    }
  },
  [T.CAISSON]: (c) => {
    px(c, 0, 0, 16, 16, '#151515');
    px(c, 1, 1, 14, 14, '#2b2b2b');
    c.fillStyle = '#111';
    c.beginPath();
    c.arc(8, 9, 5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#555';
    c.beginPath();
    c.arc(8, 9, 2, 0, Math.PI * 2);
    c.fill();
    px(c, 3, 2, 10, 1, '#ff4fd8');
  },
  // les tonneaux WOG (repli en code si l'image ne charge pas) : un fût, deux cerclages, la pancarte
  [T.TONNEAU_WOG]: (c) => tonneau(c, '#8a5a2b', '#3a3a40', '#c49a5a'),
  [T.TONNEAU_OR]: (c) => tonneau(c, '#e8b92a', '#a8741a', '#fff0a0'),
  [T.SABLE]: (c, v) => {
    px(c, 0, 0, 16, 16, '#e3c47e');
    moucheture(c, v, '#c9a862', 10, 7);
    moucheture(c, v, '#f6e2a8', 6, 8);
  },
  [T.VITRE]: (c, v) => {
    px(c, 0, 0, 16, 16, '#5b6470');
    px(c, 1, 1, 14, 14, v % 2 ? '#ffd56b' : '#7fc4e8');
    px(c, 3, 3, 1, 4, 'rgba(255,255,255,0.7)');
    px(c, 5, 3, 1, 2, 'rgba(255,255,255,0.7)');
  },
  [T.BIDON]: (c) => {
    px(c, 2, 0, 12, 16, '#c1121f');
    px(c, 2, 0, 2, 16, '#e5432f');
    px(c, 2, 9, 12, 1, '#7a0c14');
    px(c, 5, 2, 6, 3, '#222');
  },
  [T.BETON]: (c, v) => {
    px(c, 0, 0, 16, 16, '#8b8b85');
    moucheture(c, v, '#77776f', 9, 9);
    px(c, 0, 15, 16, 1, '#6a6a64');
    px(c, 15, 0, 1, 16, '#6a6a64');
  },
  // le revêtement noir mat des modules du FISE (en attendant sa planche) : une masse lisse, à peine mouchetée
  [T.PARC]: (c, v) => {
    px(c, 0, 0, 16, 16, '#26262b');
    moucheture(c, v, '#2c2c31', 7, 7);
  },
  // le contreplaqué lisse des rampes de bois (half-pipe, spine), en attendant sa planche : des lés clairs, des vis en ligne
  [T.RAMPE]: (c, v) => {
    px(c, 0, 0, 16, 16, '#d8a868');
    moucheture(c, v, '#cc9a5c', 5, 5);
    for (const x of [2, 13]) for (const y of [3, 12]) px(c, x, y, 1, 1, '#8a6a3a');
  },
  // le caisson de basses à LED violette (repli du sprite) : comme le bleu, mais violet
  [T.CAISSON_ROSE]: (c) => {
    px(c, 0, 0, 16, 16, '#151515');
    px(c, 1, 1, 14, 14, '#2b2236');
    c.fillStyle = '#111';
    c.beginPath();
    c.arc(8, 9, 5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#6a3a7a';
    c.beginPath();
    c.arc(8, 9, 2, 0, Math.PI * 2);
    c.fill();
    px(c, 3, 2, 10, 1, '#c84fff');
  },
  // la barrière du boss : des montants noirs, trois lasers roses entre eux ; elle s'ouvre à la mort du boss
  [T.BARRIERE]: (c) => {
    px(c, 0, 0, 16, 16, '#12121a');
    px(c, 0, 0, 2, 16, '#3a3a46');
    px(c, 14, 0, 2, 16, '#3a3a46');
    for (const y of [2, 7, 12]) px(c, 2, y, 12, 2, '#ff4fd8');
  },
  // les tuiles canal des toits : des rangées de demi-tuiles rouges, l'ombre du dessous de chacune
  [T.TOIT]: (c) => {
    px(c, 0, 0, 16, 16, '#8a3020');
    for (let r = 0; r < 4; r++)
      for (let x = r % 2 ? -2 : 0; x < 16; x += 4) {
        px(c, x, r * 4, 3, 3, r % 2 ? '#c8603a' : '#b8492e');
        px(c, x, r * 4, 3, 1, '#d8784a');
      }
  },
  // l'eau de la Siagne : translucide (on voit le fond), quelques reflets (la surface est peinte à part, voir dessin-tuiles.ts)
  [T.EAU]: (c, v) => {
    px(c, 0, 0, 16, 16, 'rgba(60, 150, 190, 0.55)');
    moucheture(c, v, 'rgba(180, 230, 245, 0.5)', 4, 11);
  },
  // la boue du lit de la rivière : brune, luisante, des flaques sombres
  [T.BOUE]: (c, v) => {
    px(c, 0, 0, 16, 16, '#5a4028');
    moucheture(c, v, '#7a5a38', 8, 12);
    moucheture(c, v, '#3a2818', 6, 13);
    px(c, 2 + v * 2, 1, 5, 1, '#8a6a48');
  },
  // le plateau rose des modules (box jump, spine, haut des quarters) : rose sur le dessus, noir dessous
  [T.PLATEAU]: (c, v) => {
    px(c, 0, 0, 16, 16, '#232327');
    px(c, 0, 0, 16, 6, '#e8607a');
    moucheture(c, v, '#d8506a', 6, 3);
    px(c, 0, 6, 16, 1, '#d8d8d8');
  },
};

/** Les tuiles fournies en sprite (outils/fixe-tuiles.py), 96 × 96 : elles remplacent le dessin en code dès qu'elles sont chargées. */
const IMAGES_TUILES: Partial<Record<number, string>> = {
  [T.CAISSE]: 'tuile-caisse.png',
  [T.CAISSON]: 'tuile-caisson.png',
  [T.TONNEAU_WOG]: 'tuile-tonneau-wog.png',
  [T.TONNEAU_OR]: 'tuile-tonneau-or.png',
  [T.BIDON]: 'tuile-bidon.png',
  [T.BOIS]: 'tuile-bois.png',
  [T.CAISSON_ROSE]: 'tuile-caisson-rose.png',
};
const imagesTuiles = new Map<number, HTMLImageElement>();

export function chargeTuiles(base: string, version: string): void {
  for (const [t, fichier] of Object.entries(IMAGES_TUILES)) {
    const img = new Image();
    img.onload = () => imagesTuiles.set(Number(t), img);
    img.src = `${base}sprites/${fichier}?v=${version}`;
  }
}

/** Le sprite d'une tuile, s'il est chargé (aussi pour le décor : caisses de fond). */
export const imageTuile = (t: number): HTMLImageElement | undefined => imagesTuiles.get(t);

/** Les textures des tuiles d'un thème, dessinées une fois au chargement du niveau. */
export class AtlasTuiles {
  private readonly toiles: (HTMLCanvasElement | null)[][] = [];
  readonly paroi: HTMLCanvasElement;

  constructor(readonly theme: Theme) {
    for (let t = 0; t < NB_TUILES; t++) {
      const peintre = PEINTRES[t];
      this.toiles.push(
        Array.from({ length: VARIANTES }, (_, v) =>
          peintre ? this.peins((c) => peintre(c, v, theme)) : null,
        ),
      );
    }
    this.paroi = this.peins((c) => {
      px(c, 0, 0, 16, 16, theme.paroi);
      moucheture(c, 0, 'rgba(0,0,0,0.3)', 10, 11);
      px(c, 0, 0, 16, 1, 'rgba(0,0,0,0.25)');
    });
  }

  private peins(f: (c: CanvasRenderingContext2D) => void): HTMLCanvasElement {
    const toile = document.createElement('canvas');
    toile.width = TUILE;
    toile.height = TUILE;
    f(toile.getContext('2d')!);
    return toile;
  }

  /** À dessiner en TUILE × TUILE : un sprite fourni est plus fin que le jeu. */
  toile(t: number, tx: number, ty: number): HTMLCanvasElement | HTMLImageElement | null {
    return imagesTuiles.get(t) ?? this.toiles[t]?.[this.variante(tx, ty)] ?? null;
  }

  private variante(tx: number, ty: number): number {
    return Math.floor(bruit(tx, ty, 3) * VARIANTES);
  }

  private readonly habillees = new Map<number, HTMLCanvasElement>();
  private readonly parois = new Map<number, HTMLCanvasElement>();

  /** La paroi de fond aux coins extérieurs arrondis selon les côtés qui donnent sur l'air libre. */
  paroiHabillee(cotes: number): HTMLCanvasElement {
    let toile = this.parois.get(cotes);
    if (!toile) {
      toile = document.createElement('canvas');
      toile.width = TUILE;
      toile.height = TUILE;
      habilleParoi(toile.getContext('2d')!, this.paroi, cotes);
      this.parois.set(cotes, toile);
    }
    return toile;
  }

  /** La tuile habillée selon ses côtés libres (voir bords-tuiles.ts), haute de 16 + DEBORD, faite à la demande. */
  habillee(t: number, tx: number, ty: number, cotes: number): HTMLCanvasElement | null {
    const v = this.variante(tx, ty);
    const cle = (t * VARIANTES + v) * 32 + cotes;
    let toile = this.habillees.get(cle);
    if (toile) return toile;
    const source = this.toiles[t]?.[v];
    if (!source) return null;
    toile = document.createElement('canvas');
    toile.width = TUILE;
    toile.height = TUILE + DEBORD;
    habille(toile.getContext('2d')!, source, t, v, cotes, this.theme.dessus);
    this.habillees.set(cle, toile);
    return toile;
  }
}
