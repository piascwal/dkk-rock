import { HAUTEUR_VUE } from '../config';
import type { Carte } from '../monde/carte';
import { ecritCentre } from './police';

type Sorte = 'carre' | 'fumee' | 'eclat' | 'texte' | 'flocon' | 'luciole' | 'onde';

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

  dessine(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    for (const p of this.liste) {
      const x = Math.round(p.x - camX);
      const y = Math.round(p.y - camY);
      const t = p.vie / p.vieMax;
      switch (p.sorte) {
        case 'fumee': {
          const r = p.taille * (1.4 - t * 0.6);
          ctx.globalAlpha = Math.min(1, t * 1.5);
          ctx.fillStyle = t > 0.6 ? p.couleur : t > 0.35 ? '#c0502a' : '#4a4a4a';
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          break;
        }
        case 'onde':
          ctx.strokeStyle = p.couleur;
          ctx.globalAlpha = t;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, p.taille * (1 - t * 0.7), 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
          break;
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
