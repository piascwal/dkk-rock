import { HAUTEUR_VUE } from '../config';
import type { Carte } from '../monde/carte';
import { anneau, disque } from './formes-pixels';
import { ecritCentre } from './police';

type Sorte = 'carre' | 'fumee' | 'poussiere' | 'eclat' | 'texte' | 'flocon' | 'luciole' | 'onde';

interface Particule {
  sorte: Sorte;
  x: number;
  y: number;
  vx: number;
  vy: number;
  vie: number;
  vieMax: number;
  taille: number;
  couleur: string;
  gravite: number;
  texte?: string;
}

const MAX = 700;
/** Les paliers de couleur d'un nuage d'explosion, [cœur, liseré] : feu vif, braise, cendre. */
const FEU_VIF = ['#fff3b0', '#ffb347'];
const BRAISE = ['#c0502a', '#7a2a14'];
const CENDRE = ['#4a4a4a', '#2a2a2a'];
const CONFETTIS = ['#ff4fd8', '#ffd23f', '#3fa7f2', '#7cfc7c', '#ff6b35', '#ffffff'];

/**
 * Les particules sont purement visuelles et locales : chaque appareil les
 * fabrique à partir des évènements de la partie (débris, explosions, textes).
 */
export class Particules {
  private liste: Particule[] = [];

  private ajoute(p: Omit<Particule, 'vieMax'>): void {
    if (this.liste.length >= MAX) this.liste.shift();
    this.liste.push({ ...p, vieMax: p.vie });
  }

  debris(x: number, y: number, couleur: string, n = 6): void {
    for (let i = 0; i < n; i++)
      this.ajoute({
        sorte: 'carre',
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 3,
        vie: 40 + Math.random() * 30,
        taille: 1 + Math.floor(Math.random() * 3),
        couleur,
        gravite: 0.2,
      });
  }

  explosion(x: number, y: number, r: number): void {
    this.ajoute({ sorte: 'onde', x, y, vx: 0, vy: 0, vie: 14, taille: r, couleur: '#fff3b0', gravite: 0 });
    const n = Math.min(40, 10 + r / 2);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = Math.random() * r * 0.08;
      this.ajoute({
        sorte: 'fumee',
        x: x + Math.cos(a) * r * 0.3,
        y: y + Math.sin(a) * r * 0.3,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 0.4,
        vie: 25 + Math.random() * 30,
        taille: 4 + Math.random() * (r / 5),
        couleur: Math.random() < 0.5 ? '#ff9b2f' : '#ffd23f',
        gravite: -0.02,
      });
    }
    for (let i = 0; i < 12; i++)
      this.ajoute({
        sorte: 'eclat',
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.8) * 5,
        vie: 20 + Math.random() * 20,
        taille: 1,
        couleur: '#fff',
        gravite: 0.15,
      });
  }

  impact(x: number, y: number, couleur: string): void {
    for (let i = 0; i < 4; i++)
      this.ajoute({
        sorte: 'eclat',
        x,
        y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        vie: 10 + Math.random() * 8,
        taille: 1,
        couleur,
        gravite: 0,
      });
  }

  /** Le van qui démarre : fumée d'échappement, nuage de poussière et graviers projetés vers l'arrière. */
  van(x: number, y: number, vitesse: number): void {
    const rapide = Math.min(1, vitesse / 6);
    for (let i = 0; i < 2; i++)
      this.ajoute({
        sorte: 'poussiere',
        x: x - 20 + Math.random() * 4,
        y: y - 3 - Math.random() * 3,
        vx: -0.3 - vitesse * 0.35 * Math.random(),
        vy: -0.15 - Math.random() * 0.35,
        vie: 40 + Math.random() * 30,
        taille: 4 + Math.random() * 4,
        couleur: i ? '#d9d4c7' : '#a7a29a',
        gravite: -0.004,
      });
    // la fumée sombre du pot d'échappement, à l'arrière bas
    if (Math.random() < 0.7)
      this.ajoute({
        sorte: 'poussiere',
        x: x - 27,
        y: y - 7,
        vx: -0.6 - rapide,
        vy: -0.1 - Math.random() * 0.2,
        vie: 30 + Math.random() * 20,
        taille: 3 + Math.random() * 3,
        couleur: '#4c4c52',
        gravite: -0.01,
      });
    if (vitesse < 0.3) return;
    for (let i = 0; i < 2 + Math.round(rapide * 4); i++)
      this.ajoute({
        sorte: 'carre',
        x: x - 16 + Math.random() * 4,
        y: y - 1,
        vx: -1 - vitesse * 0.3 - Math.random() * 3,
        vy: -1.2 - Math.random() * 2.6,
        vie: 35 + Math.random() * 25,
        taille: Math.random() < 0.3 ? 2 : 1,
        couleur: ['#8a8378', '#b9b2a3', '#5f5a52', '#d2c9b4'][Math.floor(Math.random() * 4)]!,
        gravite: 0.22,
      });
  }

  confettis(x: number, y: number): void {
    for (let i = 0; i < 18; i++)
      this.ajoute({
        sorte: 'carre',
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: -1 - Math.random() * 3,
        vie: 50 + Math.random() * 30,
        taille: 2,
        couleur: CONFETTIS[i % CONFETTIS.length]!,
        gravite: 0.08,
      });
  }

  texte(x: number, y: number, s: string, couleur: string): void {
    this.ajoute({ sorte: 'texte', x, y, vx: 0, vy: -0.5, vie: 70, taille: 1, couleur, gravite: 0, texte: s });
  }

  /** Météo du thème, dans le champ de la caméra. */
  meteo(sorte: 'neige' | 'lucioles' | 'confettis' | null, camX: number, camY: number, largeur: number): void {
    if (!sorte || Math.random() > (sorte === 'neige' ? 0.5 : 0.08)) return;
    const x = camX + Math.random() * largeur;
    if (sorte === 'neige')
      this.ajoute({
        sorte: 'flocon',
        x,
        y: camY - 4,
        vx: -0.3,
        vy: 0.5 + Math.random() * 0.5,
        vie: 600,
        taille: 1,
        couleur: '#fff',
        gravite: 0,
      });
    else if (sorte === 'lucioles')
      this.ajoute({
        sorte: 'luciole',
        x,
        y: camY + Math.random() * HAUTEUR_VUE,
        vx: 0,
        vy: -0.1,
        vie: 200,
        taille: 1,
        couleur: '#f4ff8a',
        gravite: 0,
      });
    else
      this.ajoute({
        sorte: 'carre',
        x,
        y: camY - 4,
        vx: 0,
        vy: 0.6,
        vie: 500,
        taille: 1,
        couleur: CONFETTIS[Math.floor(Math.random() * 6)]!,
        gravite: 0,
      });
  }

  maj(carte: Carte | null): void {
    for (const p of this.liste) {
      p.vie--;
      p.vy += p.gravite;
      if (p.sorte === 'flocon') p.vx = Math.sin(p.vie / 30) * 0.4;
      if (p.sorte === 'luciole') p.vx = Math.sin(p.vie / 20) * 0.3;
      const nx = p.x + p.vx;
      const ny = p.y + p.vy;
      if (carte && (p.sorte === 'carre' || p.sorte === 'flocon') && carte.solideEnPixel(nx, ny)) {
        if (p.sorte === 'flocon') p.vie = Math.min(p.vie, 30);
        p.vx *= 0.5;
        p.vy = p.gravite > 0 ? -p.vy * 0.3 : 0;
        continue;
      }
      p.x = nx;
      p.y = ny;
    }
    this.liste = this.liste.filter((p) => p.vie > 0);
  }

  /**
   * Les nuages d'explosion : tous les liserés d'abord, puis tous les cœurs, pour que les boules qui se chevauchent
   * forment une seule masse (et non des bulles qui montrent chacune leur contour), puis les reflets.
   */
  private nuages(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    const nuages = this.liste
      .filter((p) => p.sorte === 'fumee')
      .map((p) => {
        const t = p.vie / p.vieMax;
        const r = p.taille * (1.4 - t * 0.6) * (t < 0.25 ? t * 4 : 1);
        const [coeur, bord] =
          t > 0.8 ? FEU_VIF : t > 0.6 ? [p.couleur, '#c0502a'] : t > 0.35 ? BRAISE : CENDRE;
        return { x: Math.round(p.x - camX), y: Math.round(p.y - camY), r, t, coeur, bord };
      })
      .filter((n) => n.r >= 1);
    for (const n of nuages) {
      ctx.fillStyle = n.bord;
      disque(ctx, n.x, n.y, n.r + 1);
    }
    for (const n of nuages) {
      ctx.fillStyle = n.coeur;
      disque(ctx, n.x, n.y, n.r);
    }
    for (const n of nuages) {
      if (n.t <= 0.35) continue;
      // un reflet plus clair en haut à gauche
      ctx.fillStyle = n.t > 0.6 ? '#fff3b0' : '#ff9b2f';
      disque(ctx, n.x - Math.round(n.r * 0.3), n.y - Math.round(n.r * 0.3), n.r * 0.4);
    }
  }

  dessine(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    this.nuages(ctx, camX, camY);
    for (const p of this.liste) {
      const x = Math.round(p.x - camX);
      const y = Math.round(p.y - camY);
      const t = p.vie / p.vieMax;
      switch (p.sorte) {
        case 'fumee':
          break; // dessinée avant, en bloc (voir nuages)
        case 'poussiere': {
          // même principe, sans transparence : de la poussière qui pâlit puis rétrécit
          const r = p.taille * (0.7 + (1 - t) * 0.9) * (t < 0.3 ? t / 0.3 : 1);
          if (r < 1) break;
          ctx.fillStyle = p.couleur;
          disque(ctx, x, y, r);
          if (r > 2.5) {
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            disque(ctx, x - 1, y - 1, r * 0.5);
          }
          break;
        }
        case 'onde': {
          // l'onde de choc : un éclair blanc plein les premières images, puis un anneau d'un pixel qui s'élargit par à-coups
          const r = Math.round((p.taille * (1 - t * 0.7)) / 3) * 3;
          if (t > 0.7) {
            ctx.fillStyle = '#ffffff';
            disque(ctx, x, y, p.taille * 0.45 * (1.3 - t));
          }
          ctx.fillStyle = t > 0.4 ? p.couleur : '#ff9b2f';
          if (t > 0.15) anneau(ctx, x, y, r);
          break;
        }
        case 'texte':
          ecritCentre(ctx, p.texte ?? '', x, y, p.couleur);
          break;
        case 'luciole':
          ctx.globalAlpha = 0.5 + 0.5 * Math.sin(p.vie / 6);
          ctx.fillStyle = p.couleur;
          ctx.fillRect(x, y, 1, 1);
          ctx.globalAlpha = 1;
          break;
        default:
          ctx.globalAlpha = Math.min(1, t * 3);
          ctx.fillStyle = p.couleur;
          ctx.fillRect(x, y, p.taille, p.taille);
          ctx.globalAlpha = 1;
      }
    }
  }
}
