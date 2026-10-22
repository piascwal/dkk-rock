import { ALERTE, boutsArc, posEtoile, posMeteore, ROCHER_ARC, type Parcours } from '../jeu/reve-parcours';
import { Aleatoire } from '../moteur/maths';
import { disque } from './formes-pixels';
import { dessineImage, dessinePileOr } from './reve-jbt';

/**
 * Ce qu'on croise dans le ciel du rêve : les astéroïdes et leurs arcs électriques, les météorites en feu, les étoiles filantes
 * (et leur alerte au bord de l'écran), les piles alcalines. Tout se déduit du parcours et de la distance parcourue : `ex` passe
 * d'une position du ciel à l'écran.
 */

type Ctx = CanvasRenderingContext2D;
type Repere = (x: number) => number;

const rochers = new Map<string, HTMLCanvasElement>();

/** Un rocher de l'espace, bosselé, éclairé d'en haut à gauche, ses cratères ; `feu` : une météorite, fendue de braises. */
function rocher(rayon: number, graine: number, feu: boolean): HTMLCanvasElement {
  const cle = `${rayon}-${graine}-${feu}`;
  let t = rochers.get(cle);
  if (t) return t;
  t = document.createElement('canvas');
  const n = rayon * 2 + 4;
  t.width = t.height = n;
  const c = t.getContext('2d')!;
  const r = new Aleatoire(graine * 31 + rayon);
  const bosses = Array.from({ length: 9 }, () => r.entre(0.82, 1.08));
  const bord = (a: number) => {
    const u = ((a / (Math.PI * 2)) * 9 + 9) % 9;
    const i = Math.floor(u);
    return rayon * (bosses[i]! * (1 - (u - i)) + bosses[(i + 1) % 9]! * (u - i));
  };
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const dx = x - n / 2 + 0.5;
      const dy = y - n / 2 + 0.5;
      const d = Math.hypot(dx, dy);
      const lim = bord(Math.atan2(dy, dx));
      if (d > lim) continue;
      const lumiere = (-dx - dy) / (rayon * 1.6);
      const base = feu ? [92, 60, 52] : [96, 88, 112];
      const k = 0.75 + 0.45 * lumiere + (d > lim - 1.2 ? -0.35 : 0);
      c.fillStyle = `rgb(${base.map((v) => Math.round(Math.max(0, Math.min(255, v * k)))).join(',')})`;
      c.fillRect(x, y, 1, 1);
    }
  for (let i = 0; i < Math.max(2, rayon / 3); i++) {
    const a = r.entre(0, Math.PI * 2);
    const d = r.entre(0, rayon * 0.6);
    const cx = n / 2 + Math.cos(a) * d;
    const cy = n / 2 + Math.sin(a) * d;
    const rr = r.entre(1, Math.max(1.2, rayon / 4));
    c.fillStyle = feu ? 'rgba(40,20,20,0.6)' : 'rgba(40,34,56,0.55)';
    disque(c, Math.round(cx), Math.round(cy), rr);
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.fillRect(Math.round(cx - rr), Math.round(cy + rr - 1), Math.max(1, Math.round(rr)), 1);
  }
  if (feu) {
    // des fissures de braise
    c.fillStyle = '#ff8a2a';
    for (let i = 0; i < rayon; i++) {
      const a = r.entre(0, Math.PI * 2);
      const d = r.entre(0, rayon * 0.7);
      c.fillRect(Math.round(n / 2 + Math.cos(a) * d), Math.round(n / 2 + Math.sin(a) * d), 1, 1);
    }
  }
  rochers.set(cle, t);
  return t;
}

function dessineRocher(ctx: Ctx, t: HTMLCanvasElement, x: number, y: number, angle: number): void {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.rotate(angle);
  ctx.drawImage(t, -t.width / 2, -t.height / 2);
  ctx.restore();
}

/** Un éclair entre deux points : une ligne brisée qui change à chaque image. */
function eclair(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, r: Aleatoire, ampl: number): void {
  const l = Math.hypot(x2 - x1, y2 - y1);
  const n = Math.max(3, Math.round(l / 6));
  const nx = -(y2 - y1) / (l || 1);
  const ny = (x2 - x1) / (l || 1);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const e = r.entre(-ampl, ampl);
    ctx.lineTo(x1 + (x2 - x1) * t + nx * e, y1 + (y2 - y1) * t + ny * e);
  }
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function arcs(ctx: Ctx, p: Parcours, d: number, ex: Repere, largeur: number, tick: number): void {
  p.arcs.forEach((a, i) => {
    const [x1, y1, x2, y2] = boutsArc(a, d);
    const [sx1, sx2] = [ex(x1), ex(x2)];
    if (Math.max(sx1, sx2) < -20 || Math.min(sx1, sx2) > largeur + 20) return;
    const r = new Aleatoire(Math.floor(tick / 2) * 977 + i * 13);
    ctx.lineCap = 'round';
    for (const [couleur, epaisseur, ampl] of [
      ['rgba(110,190,255,0.22)', 8, 2],
      ['rgba(150,220,255,0.6)', 3, 3],
      ['#ffffff', 1, 3],
    ] as const) {
      ctx.strokeStyle = couleur;
      ctx.lineWidth = epaisseur;
      eclair(ctx, sx1, y1, sx2, y2, r, ampl);
    }
    const t = rocher(ROCHER_ARC + 1, i % 5, false);
    for (const [x, y] of [
      [sx1, y1],
      [sx2, y2],
    ] as const) {
      dessineRocher(ctx, t, x, y, d * 0.01 + i);
      // l'électrode : un anneau qui crépite sur le rocher
      ctx.fillStyle = tick % 6 < 3 ? '#9fe8ff' : '#ffffff';
      for (let k = 0; k < 4; k++) {
        const an = r.entre(0, Math.PI * 2);
        ctx.fillRect(Math.round(x + Math.cos(an) * 7), Math.round(y + Math.sin(an) * 7), 1, 1);
      }
    }
  });
}

function meteores(ctx: Ctx, p: Parcours, d: number, ex: Repere, largeur: number, tick: number): void {
  p.meteores.forEach((m, i) => {
    const pos = posMeteore(m, d);
    const x = ex(pos.x);
    if (x < -40 || x > largeur + 60) return;
    // la traînée de feu, derrière (à droite : elle fonce vers la gauche)
    for (let k = 10; k >= 1; k--) {
      const t = k / 10;
      const ondule = Math.sin(tick / 3 + k + i) * t * 2;
      ctx.fillStyle = `rgba(${255},${Math.round(220 - 150 * t)},${Math.round(80 - 60 * t)},${(0.55 * (1 - t) + 0.1).toFixed(2)})`;
      disque(
        ctx,
        Math.round(x + m.rayon * 0.6 + k * m.rayon * 0.45),
        Math.round(pos.y + ondule),
        Math.max(1, m.rayon * (1 - t * 0.7)),
      );
    }
    const g = ctx.createRadialGradient(x, pos.y, 0, x, pos.y, m.rayon * 1.8);
    g.addColorStop(0, 'rgba(255,160,60,0.45)');
    g.addColorStop(1, 'rgba(255,100,40,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - m.rayon * 2, pos.y - m.rayon * 2, m.rayon * 4, m.rayon * 4);
    dessineRocher(ctx, rocher(Math.round(m.rayon), i % 7, true), x, pos.y, -d * 0.03 + i);
  });
}

/** Une étoile à cinq branches. */
function etoile(ctx: Ctx, x: number, y: number, r: number, couleur: string): void {
  ctx.fillStyle = couleur;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.fill();
}

function etoilesFilantes(ctx: Ctx, p: Parcours, d: number, ex: Repere, largeur: number, tick: number): void {
  for (const e of p.etoiles) {
    const pos = posEtoile(e, d);
    const x = pos ? ex(pos.x) : Infinity;
    if (d < e.x - ALERTE || x < -120) continue;
    if (x > largeur - 6) {
      // l'alerte, au bord de l'écran, à sa hauteur : elle clignote de plus en plus vite
      const proche = e.x - d < 80;
      if (!proche && tick % 12 >= 7) continue;
      const bx = largeur - 11;
      ctx.fillStyle = proche ? '#ff3a3a' : '#ffd23f';
      ctx.beginPath();
      ctx.moveTo(bx, e.y - 7);
      ctx.lineTo(bx + 8, e.y + 6);
      ctx.lineTo(bx - 8, e.y + 6);
      ctx.fill();
      ctx.fillStyle = '#1a1020';
      ctx.fillRect(bx - 1, e.y - 3, 2, 5);
      ctx.fillRect(bx - 1, e.y + 3, 2, 2);
      if (proche) {
        ctx.fillStyle = 'rgba(255,60,60,0.18)';
        ctx.fillRect(0, e.y - 1, largeur, 2);
      }
      continue;
    }
    // la traînée : une longue queue dorée qui pâlit, des éclats
    for (let k = 0; k < 26; k++) {
      const t = k / 26;
      ctx.fillStyle = `rgba(255,${Math.round(240 - 80 * t)},${Math.round(180 - 150 * t)},${(0.85 * (1 - t)).toFixed(2)})`;
      ctx.fillRect(
        Math.round(x + 3 + k * 3.5),
        Math.round(e.y - 2 + t * 1.5),
        4,
        Math.max(1, Math.round(4 * (1 - t))),
      );
    }
    const g = ctx.createRadialGradient(x, e.y, 0, x, e.y, 14);
    g.addColorStop(0, 'rgba(255,250,200,0.8)');
    g.addColorStop(1, 'rgba(255,220,120,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 14, e.y - 14, 28, 28);
    etoile(ctx, x, e.y, 6, '#fff6c0');
    etoile(ctx, x, e.y, 3, '#ffffff');
  }
}

/** Les piles alcalines qui restent à ramasser : elles flottent doucement, une lueur autour ; les dorées valent dix. */
function piles(
  ctx: Ctx,
  p: Parcours,
  d: number,
  ex: Repere,
  largeur: number,
  prises: ReadonlySet<number>,
  tick: number,
): void {
  let i = 0;
  let haut = p.piles.length;
  while (i < haut) {
    const m = (i + haut) >> 1;
    if (ex(p.piles[m]!.x) < -12) i = m + 1;
    else haut = m;
  }
  for (; i < p.piles.length; i++) {
    const pile = p.piles[i]!;
    const x = ex(pile.x);
    if (x > largeur + 12) break;
    if (prises.has(i)) continue;
    const y = pile.y + Math.sin((tick + i * 7) / 12) * 1.5;
    const g = ctx.createRadialGradient(x, y, 0, x, y, pile.or ? 12 : 7);
    g.addColorStop(0, pile.or ? 'rgba(255,220,80,0.6)' : 'rgba(255,200,120,0.3)');
    g.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 12, y - 12, 24, 24);
    if (pile.or) {
      dessinePileOr(ctx, x, y, 1.6);
      if ((tick + i * 5) % 30 < 8) etoile(ctx, x + 6, y - 6, 3, '#fff6c0');
    } else dessineImage(ctx, 'pile', x, y, 0, 1.05);
  }
}

/** Le lit de JBT, sur le toit, d'où il décolle (il dort, après tout). */
export function lit(ctx: Ctx, x: number): void {
  const y = 150;
  if (x < -40 || x > 400) return;
  ctx.fillStyle = '#5a3a24';
  ctx.fillRect(x - 16, y - 9, 2, 9);
  ctx.fillRect(x + 14, y - 6, 2, 6);
  ctx.fillStyle = '#e8e2f2';
  ctx.fillRect(x - 14, y - 6, 28, 3);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 14, y - 8, 7, 3); // l'oreiller
  ctx.fillStyle = '#3a6ad0';
  ctx.fillRect(x - 6, y - 7, 20, 4); // la couette, repoussée
  ctx.fillStyle = '#2a4aa0';
  ctx.fillRect(x - 6, y - 4, 20, 1);
}

export function dessineObstacles(
  ctx: Ctx,
  p: Parcours,
  d: number,
  ex: Repere,
  largeur: number,
  prises: ReadonlySet<number>,
  tick: number,
): void {
  piles(ctx, p, d, ex, largeur, prises, tick);
  meteores(ctx, p, d, ex, largeur, tick);
  arcs(ctx, p, d, ex, largeur, tick);
  etoilesFilantes(ctx, p, d, ex, largeur, tick);
  ctx.lineCap = 'butt';
  ctx.lineWidth = 1;
}
