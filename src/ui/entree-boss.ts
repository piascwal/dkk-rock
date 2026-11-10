import { ANIM, G, type EtatVue, type Genre } from '../jeu/vue';
import { FEUILLES } from '../rendu/feuilles';
import { dessineFeuille } from '../rendu/feuilles-images';

/**
 * L'entrée d'un boss, quand il se réveille (sa barre de vie apparaît dans la vue) : un éclair blanc, l'écran qui tremble, un
 * bandeau en travers de l'écran avec le boss en grand, son nom en grosses lettres qui tremblent et son titre ; puis le combat.
 * Seul, la partie attend pendant ce temps (comme pour une recrue) ; à plusieurs, elle continue dessous. Une fois par boss et par
 * niveau (pas à chaque reprise au drapeau). Un toucher ou une touche l'abrège après un instant. Ne lit que la vue : les clients
 * distants la voient aussi.
 */

const BOSS: Partial<Record<Genre, { nom: string; titre: string }>> = {
  [G.YETI_ALPHA]: { nom: 'YÉTI ALPHA', titre: 'Gardien des cimes · techno minimale' },
  [G.CHAMPION]: { nom: 'LE CHAMPION', titre: 'Roi du FISE · finale à Montpellier' },
  [G.DJ]: { nom: 'DJ BOUCLE', titre: 'Le maître du club · boss final' },
};

/** Durée (secondes), instant où le bandeau repart, et délai avant de pouvoir passer. */
const DUREE = 2.4;
const SORTIE = 2.05;
const AVANT_SAUT = 0.5;

const sortieDouce = (x: number) => 1 - (1 - Math.min(1, Math.max(0, x))) ** 3;

export class EntreeBoss {
  private readonly toile = document.createElement('canvas');
  private readonly ctx = this.toile.getContext('2d')!;
  private debut = 0;
  private genre: Genre = G.YETI_ALPHA;
  private actif = false;
  private bossAvant = -1;
  private niveau = -1;
  /** les boss déjà présentés dans ce niveau */
  private readonly vus = new Set<Genre>();

  constructor() {
    this.toile.className = 'entree-boss';
    this.toile.hidden = true;
    this.toile.setAttribute('aria-hidden', 'true');
    document.body.append(this.toile);
  }

  /** Vrai pendant l'animation : la partie attend (si on joue seul). */
  get enCours(): boolean {
    return this.actif;
  }

  maj(v: EtatVue): void {
    if (v.niveau !== this.niveau) {
      this.niveau = v.niveau;
      this.vus.clear();
    }
    const avant = this.bossAvant;
    this.bossAvant = v.boss;
    if (v.phase !== 'jeu' || v.boss < 0 || avant >= 0 || this.actif) return;
    const boss = v.entites.find((e) => BOSS[e.g] && !this.vus.has(e.g));
    if (!boss) return;
    this.vus.add(boss.g);
    this.joue(boss.g);
  }

  private joue(genre: Genre): void {
    this.genre = genre;
    this.actif = true;
    this.debut = performance.now();
    this.toile.hidden = false;
    window.addEventListener('keydown', this.touche, true);
    window.addEventListener('pointerdown', this.saute, true);
    requestAnimationFrame(this.image);
  }

  private touche = (e: KeyboardEvent): void => {
    if (e.code === 'Enter' || e.code === 'Escape' || e.code === 'Space') this.saute();
  };

  private saute = (): void => {
    const t = (performance.now() - this.debut) / 1000;
    if (t > AVANT_SAUT && t < SORTIE) this.debut = performance.now() - SORTIE * 1000;
  };

  private termine(): void {
    this.actif = false;
    this.toile.hidden = true;
    window.removeEventListener('keydown', this.touche, true);
    window.removeEventListener('pointerdown', this.saute, true);
  }

  private image = (): void => {
    if (!this.actif) return;
    const t = (performance.now() - this.debut) / 1000;
    if (t >= DUREE) return this.termine();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const [W, H] = [innerWidth, innerHeight];
    if (this.toile.width !== Math.round(W * dpr)) this.toile.width = Math.round(W * dpr);
    if (this.toile.height !== Math.round(H * dpr)) this.toile.height = Math.round(H * dpr);
    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // l'entrée (0 → 1) puis la sortie (1 → 0)
    const entre = sortieDouce(t / 0.3);
    const sort = sortieDouce((t - SORTIE) / (DUREE - SORTIE));
    const present = entre * (1 - sort);
    ctx.fillStyle = `rgba(10, 4, 14, ${0.5 * present})`;
    ctx.fillRect(0, 0, W, H);
    // l'écran tremble au début
    const secousse = Math.max(0, 1 - t / 0.45) * 8;
    ctx.save();
    ctx.translate((Math.random() - 0.5) * secousse, (Math.random() - 0.5) * secousse);
    this.bandeau(ctx, W, H, (entre - 1 + sort) * W * 1.2);
    this.boss(ctx, W, H, t, (entre - 1) * W * 0.6 - sort * W * 1.2);
    this.nom(ctx, W, H, t, (1 - entre) * W * 0.6 + sort * W * 1.2);
    ctx.restore();
    // l'éclair blanc
    if (t < 0.18) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * (1 - t / 0.18)})`;
      ctx.fillRect(0, 0, W, H);
    }
    requestAnimationFrame(this.image);
  };

  /** Le bandeau penché, noir, bordé de rouge et de jaune, décalé de `dx`. */
  private bandeau(ctx: CanvasRenderingContext2D, W: number, H: number, dx: number): void {
    const h = H * 0.36;
    const y = H * 0.5 - h / 2;
    const pente = H * 0.08;
    const forme = (marge: number) => {
      ctx.beginPath();
      ctx.moveTo(dx - 40, y - marge + pente);
      ctx.lineTo(dx + W + 40, y - marge - pente);
      ctx.lineTo(dx + W + 40, y + h + marge - pente);
      ctx.lineTo(dx - 40, y + h + marge + pente);
      ctx.closePath();
    };
    forme(10);
    ctx.fillStyle = '#ffd23f';
    ctx.fill();
    forme(5);
    ctx.fillStyle = '#c4172c';
    ctx.fill();
    forme(0);
    ctx.fillStyle = '#120914';
    ctx.fill();
  }

  /** Le boss en grand, pieds sous le bandeau, à gauche ; d'abord blanc (l'éclair), puis en couleurs. */
  private boss(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, dx: number): void {
    const f = FEUILLES[this.genre];
    if (!f) return;
    const hauteur = (f.h * (f.echelle ?? 1)) / (f.densite ?? 1);
    const k = (H * 0.62) / hauteur;
    // il retombe sur ses pieds en arrivant
    const rebond = Math.abs(Math.sin(Math.min(1, t / 0.4) * Math.PI)) * H * 0.04 * Math.max(0, 1 - t / 0.4);
    ctx.save();
    ctx.translate(W * 0.27 + dx, H * 0.5 + H * 0.24 - rebond);
    ctx.scale(k, k);
    if (t < 0.25 && 'filter' in ctx) ctx.filter = 'brightness(4) grayscale(1)';
    dessineFeuille(ctx, this.genre, ANIM.DEBOUT, 0, false);
    ctx.restore();
  }

  /** Le nom, en lettres qui tremblent (le relief du logo), et le titre dessous. */
  private nom(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, dx: number): void {
    const b = BOSS[this.genre];
    if (!b) return;
    const police = getComputedStyle(document.documentElement).getPropertyValue('--titre') || 'monospace';
    const x0 = W * 0.48 + dx;
    const y = H * 0.5;
    ctx.textBaseline = 'middle';
    // la plus grande taille qui tient entre le boss et le bord droit (le nom, et son titre plus petit)
    const place = W * 0.5 - 16;
    ctx.font = `700 100px ${police}`;
    const largeur = Math.max(ctx.measureText(b.nom).width + 6, ctx.measureText(b.titre).width * 0.3);
    const taille = Math.min(H * 0.13, (100 * place) / largeur);
    ctx.font = `700 ${Math.round(taille * 0.32)}px ${police}`;
    ctx.fillStyle = '#ff2e93';
    ctx.fillText('BOSS', x0, y - taille * 0.85);
    ctx.font = `700 ${Math.round(taille)}px ${police}`;
    let x = x0;
    for (const lettre of b.nom) {
      const tremble = 1 + (t < 0.6 ? 2 : 0);
      const [ox, oy] = [(Math.random() - 0.5) * tremble, (Math.random() - 0.5) * tremble];
      for (const [d, c] of [
        [6, '#000'],
        [4, '#ff2e93'],
        [2, '#00c2d1'],
        [0, '#fff4d6'],
      ] as const) {
        ctx.fillStyle = c;
        ctx.fillText(lettre, x + ox + d, y + oy + d);
      }
      x += ctx.measureText(lettre).width;
    }
    ctx.globalAlpha = Math.min(1, Math.max(0, (t - 0.35) / 0.3));
    ctx.font = `700 ${Math.round(taille * 0.3)}px ${police}`;
    ctx.fillStyle = '#ffd23f';
    ctx.fillText(b.titre, x0, y + taille * 0.85);
    ctx.globalAlpha = 1;
  }
}
