import { HAUTEUR_VUE, TUILE } from '../config';
import { lisPersonnage } from '../entites/ennemis/gens';
import { Carte } from '../monde/carte';
import { ANIM, G, type Genre } from '../jeu/vue';
import { T, tuileDuCaractere } from '../monde/tuiles';
import { AtlasTuiles } from '../rendu/atlas-tuiles';
import { ACCESSOIRES, type NomAccessoire } from '../rendu/decor-objets';
import { dessineSprite, SPRITES, type Sprite } from '../rendu/decor-sprites';
import { dessineTuiles, dessineTyroliennes } from '../rendu/dessin-tuiles';
import { DESSINS_ENNEMIS } from '../rendu/dessins-ennemis';
import { dessineFeuille } from '../rendu/feuilles-images';
import { pinceau } from '../rendu/pinceau';
import { COULEURS_SIEGES } from '../rendu/indicateurs';
import { ecritCentre } from '../rendu/police';
import { THEMES, type NomTheme } from '../rendu/themes';
import { chaineDeTyroliennes, relieTyroliennes, type Poteau, type Tyrolienne } from '../niveaux/tyroliennes';
import { ennemiDeLaLettre, type Choix } from './catalogue';
import type { Decor, DocumentNiveau, ModuleEditeur } from './document';
import { trouveModule } from './modules-perso';

/**
 * Le rendu de l'éditeur, au plus près du jeu : le ciel du thème, le terrain dessiné par le jeu lui-même (rendu/dessin-tuiles.ts : les
 * textures du thème, l'herbe ou la neige sur le dessus, les coins arrondis, la paroi de fond, les lianes et les glaçons), les gens
 * avec leur planche ou leur dessin en code (le visage et l'apparence choisis sur leur case), les accessoires du décor ; les repères (départ, van, drapeaux...) en pastilles
 * lisibles. Une grille légère quand on zoome, et l'aperçu du geste en cours (la case visée, le rectangle, le module à poser).
 */

type Ctx = CanvasRenderingContext2D;

export interface Camera {
  /** le coin haut gauche de l'écran, en pixels du monde */
  x: number;
  y: number;
  /** pixels d'écran par pixel du monde */
  zoom: number;
}

export type Apercu =
  | { genre: 'case'; x: number; y: number }
  | { genre: 'rect'; x0: number; y0: number; x1: number; y1: number; pointille?: boolean }
  | { genre: 'module'; m: ModuleEditeur; x: number; ySol: number }
  | { genre: 'decor'; nom: string; x: number; ySol: number };

const PASTILLES: Record<string, string> = {
  '@': '#3fb04f',
  F: '#2a6fdb',
  '!': '#e8b000',
  K: '#a84fdb',
  '*': '#e8702a',
  '+': '#d8a800',
  '%': '#c8202a',
  '(': '#6a6a78',
  ')': '#6a6a78',
  $: '#6a6a78',
  tyro: '#6a6a78',
  // le dernier poteau de la tyrolienne qu'on trace
  tyroEnCours: '#e8702a',
  '&': '#2a8ac8',
  // les départs du battle royale : la couleur de chaque joueur
  ...Object.fromEntries(COULEURS_SIEGES.map((c, i) => [`J${i + 1}`, c])),
};
const BOSS_GENRE: Record<string, Genre> = { Y: G.YETI_ALPHA, P: G.CHAMPION, Z: G.DJ };
/** ce que la police pixel ne sait pas écrire (ni @ ni &), et le van en toutes lettres */
const SIGNES: Record<string, string> = {
  '@': 'GO',
  F: 'VAN',
  '&': 'B',
  $: '()',
  tyro: 'T',
  tyroEnCours: 'T',
};

/**
 * Les câbles des tyroliennes posées : celles de la carte (aucune tant qu'un poteau reste seul : le menu « Vérifier » dit lequel),
 * puis celles tracées poteau par poteau.
 */
function tyroliennesDe(doc: DocumentNiveau): Tyrolienne[] {
  const poteaux: Record<string, Poteau[]> = { '(': [], ')': [], $: [] };
  doc.lignes().forEach((l, ty) => {
    for (const m of l.matchAll(/[()$]/g)) poteaux[m[0]]!.push({ tx: m.index, ty });
  });
  const essaie = (f: () => Tyrolienne[]) => {
    try {
      return f();
    } catch {
      return [];
    }
  };
  return [
    ...essaie(() => relieTyroliennes(poteaux['(']!, poteaux[')']!, poteaux.$!)),
    ...doc.tyroliennes.flatMap((t) => (t.length > 1 ? essaie(() => chaineDeTyroliennes(t)) : [])),
  ];
}

export class DessinEditeur {
  private theme: NomTheme | null = null;
  private atlas!: AtlasTuiles;
  /** la carte du jeu faite du document (refaite quand il change), que dessine rendu/dessin-tuiles.ts */
  private carte: { doc: DocumentNiveau; version: number; carte: Carte; tyroliennes: Tyrolienne[] } | null =
    null;

  regleTheme(theme: NomTheme): void {
    if (theme === this.theme) return;
    this.theme = theme;
    this.atlas = new AtlasTuiles(THEMES[theme]);
  }

  private carteDe(doc: DocumentNiveau): Carte {
    if (this.carte?.doc === doc && this.carte.version === doc.version) return this.carte.carte;
    const [L, H] = [doc.largeur, doc.hauteur];
    const tuiles = new Uint8Array(L * H);
    const fond = new Uint8Array(L * H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < L; x++) {
        const c = doc.get(x, y);
        if (c === '.') fond[y * L + x] = 1;
        else tuiles[y * L + x] = tuileDuCaractere(c) ?? T.VIDE;
      }
    const carte = new Carte(L, H, tuiles, fond);
    this.carte = { doc, version: doc.version, carte, tyroliennes: tyroliennesDe(doc) };
    return carte;
  }

  /** Une case de la carte, son coin haut gauche en (x, y) (pixels du monde) ; `cle` : le personnage choisi sur la case. */
  case(ctx: Ctx, c: string, x: number, y: number, tx: number, ty: number, cle?: string): void {
    if (c === ' ') return;
    if (c === '.') return ctx.drawImage(this.atlas.paroi, x, y, TUILE, TUILE);
    const t = tuileDuCaractere(c);
    if (t !== null) {
      const toile = this.atlas.toile(t, tx, ty);
      if (toile) ctx.drawImage(toile, x, y, TUILE, TUILE);
      return;
    }
    const choisi = cle ? lisPersonnage(cle, this.theme!) : null;
    const def = choisi?.def ?? (/[a-z]/.test(c) ? ennemiDeLaLettre(c, this.theme!) : undefined);
    const genre = def?.genre ?? BOSS_GENRE[c];
    if (genre !== undefined && this.personnage(ctx, genre, x + TUILE / 2, y + TUILE, choisi?.apparence ?? 0))
      return;
    this.pastille(ctx, c, x, y);
  }

  /** Un personnage, pieds en (x, y) : sa planche si elle est chargée, sinon son dessin en code. */
  personnage(ctx: Ctx, genre: Genre, x: number, y: number, apparence = 0): boolean {
    ctx.save();
    ctx.translate(x, y);
    // une planche à apparences prend la sienne d'après le « compteur » (l'identifiant, en jeu) : voir rendu/feuilles.ts
    let ok = dessineFeuille(ctx, genre, ANIM.DEBOUT, apparence, false);
    const dessin = DESSINS_ENNEMIS[genre];
    if (!ok && dessin) {
      dessin(pinceau(ctx), ANIM.DEBOUT, 0);
      ok = true;
    }
    ctx.restore();
    return ok;
  }

  /** Un repère : une pastille de couleur et son signe (le chiffre d'un dialogue, @ pour le départ...). */
  pastille(ctx: Ctx, c: string, x: number, y: number): void {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x + 1, y + 1, TUILE - 1, TUILE - 1);
    ctx.fillStyle = PASTILLES[c] ?? '#5a5a8a';
    ctx.fillRect(x + 1, y + 1, TUILE - 2, TUILE - 2);
    ecritCentre(ctx, SIGNES[c] ?? c, x + TUILE / 2, y + 5, '#ffffff');
  }

  /** Un accessoire de décor, posé sur la rangée `ySol`. */
  decor(ctx: Ctx, [nom, tx, ty]: Decor, alpha = 1): void {
    const quoi = nom as NomAccessoire;
    if (!(quoi in ACCESSOIRES)) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(tx * TUILE + TUILE / 2, ty * TUILE);
    const v = (tx * 7 + ty * 13) % 256;
    if (!(SPRITES.has(quoi) && dessineSprite(ctx, quoi as Sprite, v, 'rgba(0,0,0,0)'))) {
      ctx.scale(1.4, 1.4);
      ACCESSOIRES[quoi](pinceau(ctx), v);
    }
    ctx.restore();
  }

  /** `enCours` : le dernier poteau de la tyrolienne qu'on trace, s'il y en a une. */
  dessine(
    ctx: Ctx,
    doc: DocumentNiveau,
    cam: Camera,
    w: number,
    h: number,
    apercu: Apercu | null,
    enCours: [number, number] | null = null,
  ): void {
    this.regleTheme(doc.theme);
    const th = THEMES[doc.theme];
    const ciel = ctx.createLinearGradient(0, 0, 0, h);
    ciel.addColorStop(0, th.ciel[0]);
    ciel.addColorStop(1, th.ciel[1]);
    ctx.fillStyle = ciel;
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);
    const L = doc.largeur * TUILE;
    const H = doc.hauteur * TUILE;
    const tx0 = Math.max(0, Math.floor(cam.x / TUILE));
    const ty0 = Math.max(0, Math.floor(cam.y / TUILE));
    const tx1 = Math.min(doc.largeur, Math.ceil((cam.x + w / cam.zoom) / TUILE) + 1);
    const ty1 = Math.min(doc.hauteur, Math.ceil((cam.y + h / cam.zoom) / TUILE) + 1);
    this.terrain(ctx, doc, cam, w, h);
    dessineTyroliennes(ctx, this.carte!.tyroliennes, this.carteDe(doc), 0, 0); // le terrain vient de refaire la carte
    for (const d of doc.decor) if (d[1] >= tx0 - 6 && d[1] < tx1 + 6) this.decor(ctx, d);
    for (let ty = ty0; ty < ty1; ty++)
      for (let tx = tx0; tx < tx1; tx++) {
        const c = doc.get(tx, ty);
        if (c !== ' ' && c !== '.' && tuileDuCaractere(c) === null)
          this.case(ctx, c, tx * TUILE, ty * TUILE, tx, ty, doc.gensEn(tx, ty));
      }
    // les départs du battle royale, rangés à part : une pastille de la couleur du joueur
    doc.departs.forEach((d, i) => d && this.pastille(ctx, `J${i + 1}`, d[0] * TUILE, d[1] * TUILE));
    // les poteaux des tyroliennes tracées, rangés à part eux aussi
    for (const t of doc.tyroliennes)
      for (const [x, y] of t)
        this.pastille(
          ctx,
          enCours?.[0] === x && enCours[1] === y ? 'tyroEnCours' : 'tyro',
          x * TUILE,
          y * TUILE,
        );
    if (cam.zoom >= 1.5) this.grille(ctx, tx0, ty0, tx1, ty1);
    // hors de la carte : un voile sombre, et le bord
    ctx.fillStyle = 'rgba(10,8,20,0.7)';
    const [vx, vy, vw, vh] = [cam.x - 2, cam.y - 2, w / cam.zoom + 4, h / cam.zoom + 4];
    if (vy < 0) ctx.fillRect(vx, vy, vw, -vy);
    if (vy + vh > H) ctx.fillRect(vx, H, vw, vy + vh - H);
    if (vx < 0) ctx.fillRect(vx, vy, -vx, vh);
    if (vx + vw > L) ctx.fillRect(L, vy, vx + vw - L, vh);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1 / cam.zoom;
    ctx.strokeRect(0, 0, L, H);
    if (apercu) this.apercu(ctx, apercu, cam);
    ctx.restore();
  }

  /**
   * Le terrain, dessiné par le jeu (rendu/dessin-tuiles.ts), par bandes de la hauteur de sa vue (il ne dessine que celle-là) : chaque
   * bande est découpée à sa hauteur, une rangée à cheval sur deux bandes n'est pas dessinée deux fois.
   */
  private terrain(ctx: Ctx, doc: DocumentNiveau, cam: Camera, w: number, h: number): void {
    const carte = this.carteDe(doc);
    const largeur = w / cam.zoom + TUILE;
    for (let b = Math.floor(cam.y / TUILE) * TUILE; b < cam.y + h / cam.zoom; b += HAUTEUR_VUE) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(cam.x - TUILE, b, largeur + 2 * TUILE, HAUTEUR_VUE);
      ctx.clip();
      ctx.translate(Math.round(cam.x), b);
      dessineTuiles(ctx, carte, this.atlas, Math.round(cam.x), b, largeur, 0);
      ctx.restore();
    }
  }

  private grille(ctx: Ctx, tx0: number, ty0: number, tx1: number, ty1: number): void {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let tx = tx0; tx <= tx1; tx++) ctx.fillRect(tx * TUILE, ty0 * TUILE, 0.5, (ty1 - ty0) * TUILE);
    for (let ty = ty0; ty <= ty1; ty++) ctx.fillRect(tx0 * TUILE, ty * TUILE, (tx1 - tx0) * TUILE, 0.5);
  }

  private apercu(ctx: Ctx, a: Apercu, cam: Camera): void {
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 2 / cam.zoom;
    if (a.genre === 'case') ctx.strokeRect(a.x * TUILE, a.y * TUILE, TUILE, TUILE);
    else if (a.genre === 'rect') {
      const [x0, x1] = [Math.min(a.x0, a.x1), Math.max(a.x0, a.x1)];
      const [y0, y1] = [Math.min(a.y0, a.y1), Math.max(a.y0, a.y1)];
      // la sélection (un module à faire) en pointillés ; le rectangle plein, teinté
      ctx.fillStyle = a.pointille ? 'rgba(120,200,255,0.12)' : 'rgba(255,210,63,0.18)';
      ctx.fillRect(x0 * TUILE, y0 * TUILE, (x1 - x0 + 1) * TUILE, (y1 - y0 + 1) * TUILE);
      if (a.pointille) ctx.setLineDash([4 / cam.zoom, 3 / cam.zoom]);
      ctx.strokeRect(x0 * TUILE, y0 * TUILE, (x1 - x0 + 1) * TUILE, (y1 - y0 + 1) * TUILE);
      ctx.setLineDash([]);
    } else if (a.genre === 'module') {
      const y0 = a.ySol - a.m.sol;
      ctx.globalAlpha = 0.7;
      a.m.lignes.forEach((l, dy) =>
        [...l].forEach((c, dx) =>
          this.case(ctx, c, (a.x + dx) * TUILE, (y0 + dy) * TUILE, a.x + dx, y0 + dy),
        ),
      );
      ctx.globalAlpha = 1;
      ctx.strokeRect(a.x * TUILE, y0 * TUILE, a.m.lignes[0]!.length * TUILE, a.m.lignes.length * TUILE);
    } else {
      this.decor(ctx, [a.nom, a.x, a.ySol], 0.75);
      ctx.strokeRect(a.x * TUILE, (a.ySol - 1) * TUILE, TUILE, TUILE);
    }
  }

  /** La vignette d'un choix de la palette, dans une toile de `w` × `h` pixels. */
  vignette(c: CanvasRenderingContext2D, choix: Choix, theme: NomTheme, w: number, h: number): void {
    this.regleTheme(theme);
    c.clearRect(0, 0, w, h);
    c.imageSmoothingEnabled = false;
    c.save();
    if (choix.famille === 'tuiles') {
      c.scale(w / TUILE, h / TUILE);
      this.case(c, choix.cle, 0, 0, 0, 0);
    } else if (choix.famille === 'gens' || choix.famille === 'objets') {
      const z = choix.famille === 'gens' ? Math.min(w, h) / 26 : Math.min(w, h) / TUILE;
      c.translate(w / 2, h);
      c.scale(z, z);
      const boss = /^[A-Z]$/.test(choix.cle);
      if (choix.famille === 'gens' && !boss) this.case(c, 'a', -TUILE / 2, -TUILE, 0, 0, choix.cle);
      else this.case(c, choix.cle, -TUILE / 2, -TUILE, 0, 0);
    } else if (choix.famille === 'decor') {
      c.translate(w / 2 - TUILE / 2, h);
      c.scale(0.7, 0.7);
      this.decor(c, [choix.cle, 0, 0]);
    } else {
      const m = trouveModule(choix.cle);
      if (!m) return c.restore();
      const z = Math.min(w / (m.lignes[0]!.length * TUILE), h / (m.lignes.length * TUILE));
      c.translate((w - m.lignes[0]!.length * TUILE * z) / 2, (h - m.lignes.length * TUILE * z) / 2);
      c.scale(z, z);
      m.lignes.forEach((l, dy) =>
        [...l].forEach((ch, dx) => this.case(c, ch, dx * TUILE, dy * TUILE, dx, dy)),
      );
    }
    c.restore();
  }
}
