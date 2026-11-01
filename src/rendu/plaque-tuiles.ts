import { TUILE } from '../config';
import type { Carte } from '../monde/carte';
import { T } from '../monde/tuiles';
import type { AtlasTuiles } from './atlas-tuiles';
import { casesVisibles, dessineAnimees, dessineTuiles, dessineZone, prepareCase } from './dessin-tuiles';
import { dessineVegetation } from './vegetation';

/**
 * La photo des tuiles : ce qui ne bouge pas (parois, tuiles, bords, fissures) est dessiné une fois sur de petites toiles, des
 * dalles de 4 × 4 cases, et à chaque image on recolle les dalles visibles (une soixantaine de collages au lieu de six cents
 * tuiles et parois). Une dalle retient l'état des cases qu'elle montre et de leurs voisines (leurs bords et leur paroi en
 * dépendent) : quand l'une change (cassée, fissurée, posée), la dalle est redessinée. Les dalles sont petites pour qu'en
 * changer une ne coûte presque rien au navigateur (une grande toile modifiée se recopie en entier). Celles qui sortent de
 * l'écran sont gardées un moment, puis rendues ; celles qui vont entrer sont dessinées d'avance quand l'image est calme. Ce qui
 * bouge (l'eau, le reflet du tonneau d'or, la végétation) se dessine par-dessus à chaque image.
 */

/** le côté d'une dalle, en cases */
const C = 4;
/** le temps (ms) qu'une image calme peut passer à préparer les dalles autour de l'écran, puis à peindre les tuiles d'avance */
const BUDGET_AVANCE = 1.5;
/** le temps (ms) qu'une image peut passer à dessiner des dalles neuves ; au-delà, les autres attendent l'image suivante */
const BUDGET_IMAGE = 4;

interface Dalle {
  /** null : rien à montrer (du ciel), on ne la colle pas */
  toile: HTMLCanvasElement | null;
  /** l'état des cases de la dalle et d'une case autour */
  etat: Uint16Array;
  /** la dernière image où elle a servi */
  vue: number;
}

export class PlaqueTuiles {
  private carte: Carte | null = null;
  private atlas: AtlasTuiles | null = null;
  /** pixels de la photo par pixel du jeu : une tuile y fait un nombre entier de pixels */
  private echelle = 0;
  private dalles = new Map<number, Dalle>();
  private libres: HTMLCanvasElement[] = [];
  private image = 0;
  /** la case jusqu'où les tuiles du niveau sont peintes d'avance */
  private avance = 0;

  /** Un nouveau niveau (ou le même, rechargé) : tout est à redessiner. */
  oublie(): void {
    this.carte = null;
  }

  dessine(
    ctx: CanvasRenderingContext2D,
    carte: Carte,
    atlas: AtlasTuiles,
    camX: number,
    camY: number,
    largeur: number,
    tick: number,
  ): void {
    const m = ctx.getTransform();
    // une toile tournée ou déformée : on dessine tuile par tuile, comme avant
    if (m.b || m.c || m.a <= 0 || m.d <= 0)
      return dessineTuiles(ctx, carte, atlas, camX, camY, largeur, tick);
    const echelle = Math.max(1, Math.round(TUILE * m.a)) / TUILE;
    if (carte !== this.carte || atlas !== this.atlas || echelle !== this.echelle) {
      for (const d of this.dalles.values()) if (d.toile) this.libres.push(d.toile);
      this.dalles.clear();
      if (carte !== this.carte) this.avance = 0;
      [this.carte, this.atlas, this.echelle] = [carte, atlas, echelle];
    }
    this.image++;
    const [tx0, ty0, tx1, ty1] = casesVisibles(carte, camX, camY, largeur);
    const [dx0, dy0, dx1, dy1] = [
      Math.floor(tx0 / C),
      Math.floor(ty0 / C),
      Math.floor(tx1 / C),
      Math.floor(ty1 / C),
    ];
    let calme = true;
    const tp = TUILE * C;
    const limite = performance.now() + BUDGET_IMAGE;
    const directes: [number, number][] = [];
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    for (let dy = dy0; dy <= dy1; dy++)
      for (let dx = dx0; dx <= dx1; dx++) {
        // trop de dalles neuves d'un coup (le début du niveau, un saut de caméra) : les dernières, dessinées tuile par tuile
        // pour cette image, attendront la suivante
        if (!this.dalles.has(dy * 100000 + dx) && performance.now() > limite) {
          directes.push([dx, dy]);
          calme = false;
          continue;
        }
        const [dalle, refaite] = this.dalle(dx, dy);
        if (refaite) calme = false;
        if (!dalle.toile) continue;
        // au pixel près : les bords des dalles voisines tombent sur les mêmes pixels de l'écran
        const x = Math.round(m.a * (dx * tp - camX) + m.e);
        const y = Math.round(m.d * (dy * tp - camY) + m.f);
        const x2 = Math.round(m.a * ((dx + 1) * tp - camX) + m.e);
        const y2 = Math.round(m.d * ((dy + 1) * tp - camY) + m.f);
        ctx.drawImage(dalle.toile, x, y, x2 - x, y2 - y);
      }
    ctx.restore();
    for (const [dx, dy] of directes)
      dessineZone(ctx, carte, atlas, dx * C, dy * C, dx * C + C - 1, dy * C + C - 1, camX, camY);
    dessineAnimees(ctx, carte, tx0, ty0, tx1, ty1, camX, camY, tick);
    dessineVegetation(ctx, carte, camX, camY, largeur, atlas.theme.decor, tick);
    if (calme) this.prepareAutour(dx0, dy0, dx1, dy1);
    if (this.image % 60 === 0) this.rendLesLointaines(dx0, dy0, dx1, dy1);
  }

  /** La dalle (dx, dy), à jour ; et si elle vient d'être (re)dessinée. */
  private dalle(dx: number, dy: number): [Dalle, boolean] {
    const cle = dy * 100000 + dx;
    let d = this.dalles.get(cle);
    if (d && !this.change(dx, dy, d.etat)) {
      d.vue = this.image;
      return [d, false];
    }
    if (!d) {
      d = { toile: null, etat: new Uint16Array((C + 2) * (C + 2)), vue: 0 };
      this.change(dx, dy, d.etat);
      this.dalles.set(cle, d);
    }
    d.vue = this.image;
    const [x0, y0] = [dx * C, dy * C];
    // une dalle de ciel (aucune tuile, aucune paroi, ni sur elle ni autour) : pas de toile
    if (this.vide(x0, y0)) {
      if (d.toile) this.libres.push(d.toile);
      d.toile = null;
      return [d, true];
    }
    if (!d.toile) {
      d.toile = this.libres.pop() ?? document.createElement('canvas');
      d.toile.width = d.toile.height = Math.round(TUILE * C * this.echelle);
    }
    const c = d.toile.getContext('2d')!;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, d.toile.width, d.toile.height);
    c.setTransform(this.echelle, 0, 0, this.echelle, 0, 0);
    c.imageSmoothingEnabled = false;
    // une case de plus tout autour : ce qui déborde des voisines (herbe, tonneaux) tombe aussi sur la dalle
    dessineZone(c, this.carte!, this.atlas!, x0 - 1, y0 - 1, x0 + C, y0 + C, x0 * TUILE, y0 * TUILE);
    return [d, true];
  }

  private vide(x0: number, y0: number): boolean {
    const carte = this.carte!;
    for (let ty = y0 - 1; ty <= y0 + C; ty++)
      for (let tx = x0 - 1; tx <= x0 + C; tx++)
        if (carte.get(tx, ty) !== T.VIDE || carte.aFond(tx, ty)) return false;
    return true;
  }

  /** Met `etat` à jour (les cases de la dalle et une case autour : tuile et fissures) ; vrai s'il a changé. Sans rien allouer. */
  private change(dx: number, dy: number, etat: Uint16Array): boolean {
    const carte = this.carte!;
    let k = 0;
    let change = false;
    for (let j = -1; j <= C; j++)
      for (let i = -1; i <= C; i++, k++) {
        const [tx, ty] = [dx * C + i, dy * C + j];
        let e = 0;
        if (carte.dedans(tx, ty)) {
          const u = carte.usure(tx, ty);
          e = carte.get(tx, ty) * 4 + (u < 0.35 ? 2 : u < 0.7 ? 1 : 0) + 1;
        }
        if (etat[k] !== e) [etat[k], change] = [e, true];
      }
    return change;
  }

  /**
   * Une image calme prépare les dalles d'une rangée autour de l'écran (celles qui vont entrer), tant qu'il reste du temps ;
   * puis peint d'avance les tuiles du niveau, colonne par colonne : rien à peindre en pleine course.
   */
  private prepareAutour(dx0: number, dy0: number, dx1: number, dy1: number): void {
    const fin = performance.now() + BUDGET_AVANCE;
    for (let dy = dy0 - 1; dy <= dy1 + 1; dy++)
      for (let dx = dx0 - 1; dx <= dx1 + 1; dx++) {
        if (dy >= dy0 && dy <= dy1 && dx >= dx0 && dx <= dx1) continue;
        if (this.dalles.has(dy * 100000 + dx)) continue;
        if (performance.now() >= fin) return;
        this.dalle(dx, dy);
      }
    const carte = this.carte!;
    const total = carte.largeur * carte.hauteur;
    while (this.avance < total && performance.now() < fin)
      for (let n = 0; n < 32 && this.avance < total; n++, this.avance++)
        prepareCase(carte, this.atlas!, Math.floor(this.avance / carte.hauteur), this.avance % carte.hauteur);
  }

  /** Les dalles loin de l'écran (plus de deux dalles) et pas vues depuis un moment retournent à la réserve. */
  private rendLesLointaines(dx0: number, dy0: number, dx1: number, dy1: number): void {
    for (const [cle, d] of this.dalles) {
      const dy = Math.round(cle / 100000);
      const dx = cle - dy * 100000;
      const loin = dx < dx0 - 2 || dx > dx1 + 2 || dy < dy0 - 2 || dy > dy1 + 2;
      if (loin && this.image - d.vue > 30) {
        if (d.toile) this.libres.push(d.toile);
        this.dalles.delete(cle);
      }
    }
    this.libres.length = Math.min(this.libres.length, 32);
  }
}
