import { TUILE } from '../config';
import { TAILLE_MAX, TAILLE_MIN } from './document';
import { ZOOM, type Editeur } from './editeur';

/**
 * Rogner ou agrandir la carte en tirant ses bords (depuis « Nom, thème et taille ») : on voit le cadre actuel, un cadre jaune qu'on
 * déplace par ses poignées (les quatre coins et le milieu de chaque côté, ou n'importe où le long d'un bord), ce qui sera rogné
 * en rouge et ce qui sera ajouté en vert ; « Appliquer » recadre (voir DocumentNiveau.recadre), « Annuler » laisse la carte telle
 * quelle. Un doigt qui ne saisit rien déplace la vue, deux doigts la zooment : on peut aller chercher un bord loin.
 */

/** Les tuiles ajoutées (+) ou rognées (−) de chaque côté. */
export interface Cotes {
  g: number;
  h: number;
  d: number;
  b: number;
}

/** Ce qu'on tient : -1 le bord gauche ou haut, 1 le droit ou bas, 0 ni l'un ni l'autre (sur chaque axe). */
export interface Prise {
  x: -1 | 0 | 1;
  y: -1 | 0 | 1;
}

const RAYON_DOIGT = 30;
const RAYON_SOURIS = 14;
const TAILLE_POIGNEE = 14;

export class Rognage {
  cotes: Cotes | null = null;
  private readonly barre = document.createElement('div');
  private readonly taille = document.createElement('span');

  constructor(private readonly ed: Editeur) {
    this.barre.className = 'ed-rognage';
    this.barre.hidden = true;
    const bouton = (texte: string, action: () => void, classe = '') => {
      const b = document.createElement('button');
      b.className = `ed-bouton ${classe}`;
      b.textContent = texte;
      b.addEventListener('click', action);
      return b;
    };
    this.barre.append(
      this.taille,
      bouton('Annuler', () => this.fin()),
      bouton('Appliquer', () => this.applique(), 'ed-principal'),
    );
    ed.racine.append(this.barre);
  }

  get actif(): boolean {
    return this.cotes !== null;
  }

  /** Le mode commence : toute la carte dans la vue, avec de la marge pour la rallonger. */
  demarre(): void {
    this.cotes = { g: 0, h: 0, d: 0, b: 0 };
    const { ed } = this;
    const [w, h] = [ed.toile.clientWidth, ed.toile.clientHeight];
    const L = ed.doc.largeur * TUILE;
    const H = ed.doc.hauteur * TUILE;
    ed.cam.zoom = Math.max(ZOOM[0], Math.min(1.5, (w * 0.7) / L, (h * 0.7) / H));
    ed.cam.x = L / 2 - w / ed.cam.zoom / 2;
    ed.cam.y = H / 2 - h / ed.cam.zoom / 2;
    this.barre.hidden = false;
    this.majTaille();
    ed.dit('Tirez les bords de la carte (les carrés jaunes) pour la rogner ou l’agrandir.');
    ed.redessine();
  }

  /** On quitte le mode, sans toucher à la carte. */
  fin(): void {
    if (!this.cotes) return;
    this.cotes = null;
    this.barre.hidden = true;
    this.ed.redessine();
  }

  applique(): void {
    const c = this.cotes;
    if (!c) return;
    const { ed } = this;
    ed.doc.commence();
    const ok = ed.doc.recadre(c.g, c.h, c.d, c.b);
    ed.doc.termine();
    if (!ok) return ed.dit('Cette taille n’est pas possible.', true);
    // ce qui était sous le regard y reste, même si l'on a ajouté ou rogné à gauche ou en haut
    ed.cam.x += c.g * TUILE;
    ed.cam.y += c.h * TUILE;
    this.fin();
    ed.dit(`Carte recadrée : ${ed.doc.largeur} × ${ed.doc.hauteur} tuiles.`);
  }

  /** Ce qu'on saisit à cet endroit de l'écran (coordonnées du client), ou null : une poignée d'abord, puis le long d'un bord. */
  prise(cx: number, cy: number, doigt: boolean): Prise | null {
    const r = this.ecran();
    if (!r) return null;
    const p = this.versEcran(cx, cy);
    const rayon = doigt ? RAYON_DOIGT : RAYON_SOURIS;
    const xs = [r.x0, (r.x0 + r.x1) / 2, r.x1];
    const ys = [r.y0, (r.y0 + r.y1) / 2, r.y1];
    let meilleure: Prise | null = null;
    let dMin = rayon;
    for (const [i, x] of xs.entries())
      for (const [j, y] of ys.entries()) {
        if (i === 1 && j === 1) continue;
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < dMin) [dMin, meilleure] = [d, { x: (i - 1) as Prise['x'], y: (j - 1) as Prise['y'] }];
      }
    if (meilleure) return meilleure;
    // le long d'un bord (sans tenir compte des coins, pris plus haut)
    const dansX = p.x > r.x0 - rayon && p.x < r.x1 + rayon;
    const dansY = p.y > r.y0 - rayon && p.y < r.y1 + rayon;
    const bords: [number, Prise, boolean][] = [
      [Math.abs(p.x - r.x0), { x: -1, y: 0 }, dansY],
      [Math.abs(p.x - r.x1), { x: 1, y: 0 }, dansY],
      [Math.abs(p.y - r.y0), { x: 0, y: -1 }, dansX],
      [Math.abs(p.y - r.y1), { x: 0, y: 1 }, dansX],
    ];
    const proche = bords.filter(([d, , dans]) => dans && d < rayon).sort((a, b) => a[0] - b[0])[0];
    return proche ? proche[1] : null;
  }

  /** Le doigt tire ce qu'il tient : le bord suit la limite de tuile la plus proche (sans sortir des tailles permises). */
  deplace(prise: Prise, cx: number, cy: number): void {
    const c = this.cotes;
    if (!c) return;
    const { ed } = this;
    const r = ed.toile.getBoundingClientRect();
    const tx = Math.round((ed.cam.x + (cx - r.left) / ed.cam.zoom) / TUILE);
    const ty = Math.round((ed.cam.y + (cy - r.top) / ed.cam.zoom) / TUILE);
    const [L, H] = [ed.doc.largeur, ed.doc.hauteur];
    const borne = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    if (prise.x < 0) c.g = borne(-tx, TAILLE_MIN[0] - L - c.d, TAILLE_MAX[0] - L - c.d);
    if (prise.x > 0) c.d = borne(tx - L, TAILLE_MIN[0] - L - c.g, TAILLE_MAX[0] - L - c.g);
    if (prise.y < 0) c.h = borne(-ty, TAILLE_MIN[1] - H - c.b, TAILLE_MAX[1] - H - c.b);
    if (prise.y > 0) c.b = borne(ty - H, TAILLE_MIN[1] - H - c.h, TAILLE_MAX[1] - H - c.h);
    this.majTaille();
    ed.redessine();
  }

  /** Le cadre, sur l'écran (pixels de la toile) : l'actuel, et le nouveau. */
  private ecran(): {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    ox0: number;
    oy0: number;
    ox1: number;
    oy1: number;
  } | null {
    const c = this.cotes;
    if (!c) return null;
    const { cam, doc } = this.ed;
    const sx = (t: number) => (t * TUILE - cam.x) * cam.zoom;
    const sy = (t: number) => (t * TUILE - cam.y) * cam.zoom;
    return {
      x0: sx(-c.g),
      y0: sy(-c.h),
      x1: sx(doc.largeur + c.d),
      y1: sy(doc.hauteur + c.b),
      ox0: sx(0),
      oy0: sy(0),
      ox1: sx(doc.largeur),
      oy1: sy(doc.hauteur),
    };
  }

  private versEcran(cx: number, cy: number): { x: number; y: number } {
    const r = this.ed.toile.getBoundingClientRect();
    return { x: cx - r.left, y: cy - r.top };
  }

  private majTaille(): void {
    const c = this.cotes!;
    const { doc } = this.ed;
    const signe = (n: number) => (n > 0 ? `+${n}` : String(n));
    this.taille.textContent = `${doc.largeur + c.g + c.d} × ${doc.hauteur + c.h + c.b} tuiles  (${signe(c.g + c.d)} larg., ${signe(c.h + c.b)} haut.)`;
  }

  /** Par-dessus la carte : le rogné en rouge, l'ajouté en vert, le nouveau cadre en jaune et ses poignées. */
  dessine(ctx: CanvasRenderingContext2D): void {
    const r = this.ecran();
    if (!r) return;
    const rect = (x0: number, y0: number, x1: number, y1: number) => ctx.rect(x0, y0, x1 - x0, y1 - y0);
    // chaque zone : le rectangle d'un cadre moins celui de l'autre (règle « pair-impair »), limité au premier
    const zone = (clip: number[], autre: number[], couleur: string) => {
      ctx.save();
      ctx.beginPath();
      rect(clip[0]!, clip[1]!, clip[2]!, clip[3]!);
      ctx.clip();
      ctx.beginPath();
      rect(clip[0]!, clip[1]!, clip[2]!, clip[3]!);
      rect(autre[0]!, autre[1]!, autre[2]!, autre[3]!);
      ctx.fillStyle = couleur;
      ctx.fill('evenodd');
      ctx.restore();
    };
    const ancien = [r.ox0, r.oy0, r.ox1, r.oy1];
    const nouveau = [r.x0, r.y0, r.x1, r.y1];
    zone(ancien, nouveau, 'rgba(229,50,50,0.45)');
    zone(nouveau, ancien, 'rgba(60,200,90,0.3)');
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.strokeRect(r.ox0, r.oy0, r.ox1 - r.ox0, r.oy1 - r.oy0);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffd23f';
    ctx.strokeRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
    for (const x of [r.x0, (r.x0 + r.x1) / 2, r.x1])
      for (const y of [r.y0, (r.y0 + r.y1) / 2, r.y1]) {
        if (x === (r.x0 + r.x1) / 2 && y === (r.y0 + r.y1) / 2) continue;
        ctx.fillStyle = '#000';
        ctx.fillRect(
          x - TAILLE_POIGNEE / 2 - 2,
          y - TAILLE_POIGNEE / 2 - 2,
          TAILLE_POIGNEE + 4,
          TAILLE_POIGNEE + 4,
        );
        ctx.fillStyle = '#ffd23f';
        ctx.fillRect(x - TAILLE_POIGNEE / 2, y - TAILLE_POIGNEE / 2, TAILLE_POIGNEE, TAILLE_POIGNEE);
      }
  }
}
