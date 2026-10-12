import { ANIM, G } from '../jeu/vue';
import { VERSION } from '../version';
import type { Qui } from '../niveaux/format';
import { HEROS } from '../entites/heros';
import { DESSINS_BOSS } from '../rendu/dessins-boss';
import { DESSINS_ENNEMIS } from '../rendu/dessins-ennemis';
import { dessineHeros, dessineKiwi } from '../rendu/dessins-heros';
import { pinceau, type Pinceau } from '../rendu/pinceau';

/** Couleur du nom de chaque personnage dans les dialogues. */
export const COULEURS: Record<Qui, string> = {
  JBT: HEROS[0]!.couleur,
  JBM: HEROS[1]!.couleur,
  JBG: HEROS[2]!.couleur,
  MAT: HEROS[3]!.couleur,
  TOM: HEROS[4]!.couleur,
  FADATCHI: '#e8cf8a',
  NARRATEUR: '#f6efe4',
  YETI: '#9fd8f0',
  DJ: '#ff4fd8',
  RADIO: '#7cfc7c',
};

export const NOMS: Record<Qui, string> = {
  JBT: 'JBT',
  JBM: 'JBM',
  JBG: 'JBG',
  MAT: 'Mat',
  TOM: 'Tom',
  FADATCHI: 'Fadatchi',
  NARRATEUR: 'Narrateur',
  YETI: 'Yéti',
  DJ: 'DJ Boucle',
  RADIO: 'Radio',
};

const MEMBRES: Partial<Record<Qui, number>> = { JBT: 0, JBM: 1, JBG: 2, MAT: 3, TOM: 4 };

/** [largeur, hauteur, dessin] du portrait de chaque personnage, pieds au milieu du bas. */
const DESSINS: Record<Qui, [number, number, (p: Pinceau) => void]> = {
  ...(Object.fromEntries(
    Object.entries(MEMBRES).map(([q, m]) => [
      q,
      [22, 22, (p: Pinceau) => dessineHeros(p, m, ANIM.DEBOUT, 0)],
    ]),
  ) as Record<'JBT' | 'JBM' | 'JBG' | 'MAT' | 'TOM', [number, number, (p: Pinceau) => void]>),
  FADATCHI: [16, 14, (p) => dessineKiwi(p, ANIM.DEBOUT, 0)],
  YETI: [22, 22, (p) => DESSINS_ENNEMIS[G.YETI]!(p, 0, 0)],
  DJ: [40, 44, (p) => DESSINS_BOSS[G.DJ]!(p, 1, 0)],
  RADIO: [
    18,
    14,
    (p) => {
      p(-8, -11, 16, 10, '#5e3b1a');
      p(-6, -9, 6, 6, '#222');
      p(2, -9, 4, 2, '#7cfc7c');
      p(2, -5, 4, 1, '#c49a5a');
      p(4, -14, 1, 3, '#888');
    },
  ],
  NARRATEUR: [
    18,
    18,
    (p) => {
      p(-7, -15, 14, 14, '#111');
      p(-5, -13, 10, 10, '#1d1d1d');
      p(-2, -10, 4, 4, '#e5432f');
      p(-1, -9, 2, 2, '#ffd23f');
    },
  ],
};

const cache = new Map<Qui, string>();

/** Le portrait d'un personnage, en image (data URL) pour le HTML. */
/** Les portraits fournis en pleine définition (public/portraits/) : ils remplacent les dessins en code. */
const IMAGES: Partial<Record<Qui, string>> = { JBT: 'jbt', JBM: 'jbm', JBG: 'jbg', MAT: 'mat', TOM: 'tom' };

export function portrait(qui: Qui): string {
  const fichier = IMAGES[qui];
  if (fichier) return `${import.meta.env.BASE_URL}portraits/${fichier}.png?v=${VERSION}`;
  let url = cache.get(qui);
  if (url) return url;
  const [w, h, dessin] = DESSINS[qui];
  const toile = document.createElement('canvas');
  toile.width = w;
  toile.height = h;
  const ctx = toile.getContext('2d')!;
  ctx.translate(Math.floor(w / 2), h - 1);
  dessin(pinceau(ctx));
  url = toile.toDataURL();
  cache.set(qui, url);
  return url;
}

export const QUI_DES_MEMBRES: Qui[] = ['JBT', 'JBM', 'JBG', 'MAT', 'TOM'];
