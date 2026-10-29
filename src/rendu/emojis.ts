/**
 * De petits emojis en pixel art qui surgissent au-dessus d'un personnage (un cœur, par exemple) : un « pop », une
 * montée lente, puis ils s'effacent. Purement visuels : ils naissent côté rendu, d'après la vue.
 */
type Ctx = CanvasRenderingContext2D;

interface Modele {
  /** une chaîne par rangée : X plein, o reflet, . vide */
  rangees: readonly string[];
  plein: string;
  reflet: string;
  contour: string;
}

export const MODELES = {
  coeur: {
    rangees: ['.XX.XX.', 'XoXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'],
    plein: '#ff9ccf',
    reflet: '#ffe3f1',
    contour: '#b0508c',
  },
} satisfies Record<string, Modele>;

export type NomEmoji = keyof typeof MODELES;

interface Emoji {
  nom: NomEmoji;
  x: number;
  y: number;
  age: number;
  /** l'entité qu'il accompagne : il la suit tant qu'elle est à l'écran */
  suit?: Suivi;
}

/** Une entité accompagnée, et le décalage de l'emoji par rapport à ses pieds. */
export interface Suivi {
  id: number;
  dx: number;
  dy: number;
}

const DUREE = 75;
const FONDU = 22;
/** Discrets : des easter eggs, pas des alertes. */
const OPACITE = 0.38;

export class Emojis {
  private readonly liste: Emoji[] = [];

  /** Fait surgir un emoji à (x, y), en pixels du monde (le point du bas) ; avec `suit`, il reste collé à l'entité. */
  pop(nom: NomEmoji, x: number, y: number, suit?: Suivi): void {
    if (this.liste.length < 24) this.liste.push({ nom, x, y, age: 0, suit });
  }

  /** Recolle les emojis à leur entité, qui a bougé depuis. */
  accompagne(entites: readonly { id: number; x: number; y: number }[]): void {
    for (const e of this.liste) {
      const v = e.suit && entites.find((o) => o.id === e.suit!.id);
      if (v && e.suit) {
        e.x = v.x + e.suit.dx;
        e.y = v.y + e.suit.dy;
      }
    }
  }

  /** Un pas d'animation (une image dessinée). */
  maj(): void {
    for (const e of this.liste) e.age++;
    for (let i = this.liste.length - 1; i >= 0; i--) if (this.liste[i]!.age >= DUREE) this.liste.splice(i, 1);
  }

  dessine(ctx: Ctx, camX: number, camY: number): void {
    for (const e of this.liste) {
      const m: Modele = MODELES[e.nom];
      // le pop : tout petit, un peu trop gros, puis à sa taille ; ensuite il monte en ralentissant
      const echelle = e.age < 3 ? 0.6 : e.age < 9 ? 1.4 : 1;
      const monte = Math.round(5 * (1 - Math.exp(-e.age / 25)));
      const fondu = e.age > DUREE - FONDU ? (DUREE - e.age) / FONDU : 1;
      const h = m.rangees.length;
      const w = m.rangees[0]!.length;
      ctx.save();
      ctx.globalAlpha = fondu * OPACITE;
      ctx.translate(Math.round(e.x) - camX, Math.round(e.y) - camY - monte);
      ctx.scale(echelle, echelle);
      ctx.translate(-Math.floor(w / 2), -h);
      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ] as const) {
        ctx.fillStyle = m.contour;
        this.pixels(ctx, m, dx, dy, true);
      }
      this.pixels(ctx, m, 0, 0, false);
      ctx.restore();
    }
  }

  private pixels(ctx: Ctx, m: Modele, dx: number, dy: number, contour: boolean): void {
    m.rangees.forEach((ligne, y) => {
      for (let x = 0; x < ligne.length; x++) {
        const c = ligne[x]!;
        if (c === '.') continue;
        if (!contour) ctx.fillStyle = c === 'o' ? m.reflet : m.plein;
        ctx.fillRect(x + dx, y + dy, 1, 1);
      }
    });
  }
}
