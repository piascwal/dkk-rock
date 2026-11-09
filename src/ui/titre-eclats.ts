import type { Scene } from './titre-physique';

/**
 * Les éclats de l'écran titre en scène : notes, étincelles, éclats, fumée et le charleston lancé (la batterie, titre-batterie.ts ;
 * les instruments et le logo cassés, titre-concert.ts). Dessinés devant les héros.
 */

export interface Morceau {
  x: number;
  y: number;
  vx: number;
  vy: number;
  t0: number;
  vie: number;
  couleur: string;
  forme: 'eclat' | 'note' | 'etincelle' | 'fumee' | 'cymbale';
  taille: number;
}

/** Ce qui porte des éclats : leur liste et l'heure (s). */
export interface Eclats {
  morceaux: Morceau[];
  t: number;
}

const hasard = (a: number, b: number) => a + Math.random() * (b - a);

export function lance(b: Eclats, m: Omit<Morceau, 't0'>): void {
  if (b.morceaux.length < 160) b.morceaux.push({ ...m, t0: b.t });
}

/** Une gerbe d'éclats qui jaillit de (x, y) . */
export function gerbe(
  b: Eclats,
  s: Scene,
  x: number,
  y: number,
  couleurs: string[],
  n: number,
  /** la taille des éclats (1 : ordinaire) */
  grand = 1,
): void {
  for (let i = 0; i < n; i++) {
    const a = hasard(-Math.PI * 0.95, -Math.PI * 0.05);
    const v = s.hh * hasard(1.5, 4);
    const couleur = couleurs[i % couleurs.length]!;
    lance(b, {
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      vie: 1.2,
      couleur,
      forme: 'eclat',
      taille: hasard(1.5, 3) * grand,
    });
  }
}

/** Un nuage de fumée sur un rectangle de l'écran. */
export function nuage(b: Eclats, s: Scene, x0: number, y0: number, x1: number, y1: number, n: number): void {
  for (let i = 0; i < n; i++) {
    const [vx, vy] = [hasard(-0.6, 0.6) * s.hh, hasard(-0.7, -0.1) * s.hh];
    const [x, y] = [hasard(x0, x1), hasard(y0, y1)];
    lance(b, {
      x,
      y,
      vx,
      vy,
      vie: hasard(1, 1.6),
      couleur: '#c8c0d0',
      forme: 'fumee',
      taille: s.hh * hasard(0.15, 0.3),
    });
  }
}

/** Les éclats bougent : la pesanteur, et ils rebondissent sur la scène. */
export function avanceEclats(b: Eclats, s: Scene, dt: number): void {
  for (const m of b.morceaux) {
    if (m.forme === 'eclat' || m.forme === 'cymbale') m.vy += s.hh * 9 * dt;
    [m.x, m.y] = [m.x + m.vx * dt, m.y + m.vy * dt];
    if ((m.forme === 'eclat' || m.forme === 'cymbale') && m.y > s.sol && m.vy > 0)
      [m.y, m.vy, m.vx] = [s.sol, -m.vy * 0.35, m.vx * 0.6];
  }
  b.morceaux = b.morceaux.filter((m) => b.t - m.t0 < m.vie && m.x > -50 && m.x < s.W + 50);
}

/** Les notes, étincelles, éclats, fumée et le charleston lancé (devant les héros). */
export function dessineEclats(ctx: CanvasRenderingContext2D, b: Eclats, s: Scene): void {
  const u = Math.max(1, s.hh / 45);
  for (const m of b.morceaux) {
    const age = (b.t - m.t0) / m.vie;
    ctx.globalAlpha = Math.max(0, m.forme === 'fumee' ? 0.55 * (1 - age) : 1 - age * age);
    ctx.fillStyle = m.couleur;
    const [x, y] = [Math.round(m.x), Math.round(m.y)];
    if (m.forme === 'note') {
      // une croche : la tête, la hampe, le crochet
      ctx.fillRect(x, y, 3 * u, 2 * u);
      ctx.fillRect(x + 2 * u, y - 6 * u, u, 7 * u);
      ctx.fillRect(x + 3 * u, y - 6 * u, 2 * u, u);
      ctx.fillRect(x + 4 * u, y - 5 * u, u, 2 * u);
    } else if (m.forme === 'fumee') {
      ctx.beginPath();
      ctx.arc(x, y, m.taille * (0.6 + age * 0.8), 0, Math.PI * 2);
      ctx.fill();
    } else if (m.forme === 'cymbale') {
      // un disque doré qui tournoie (vu de plus en plus de profil), cerclé de sombre
      const r = m.taille;
      const ry = Math.max(0.12, Math.abs(Math.cos(b.t * 9))) * r * 0.45;
      for (const [c, d] of [
        ['#3a2e10', u],
        [m.couleur, 0],
      ] as const) {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.ellipse(x, y, r + d, ry + d, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#fff3b0';
      ctx.fillRect(x - r * 0.5, y - ry * 0.4, r * 0.4, Math.max(1, ry * 0.25));
    } else ctx.fillRect(x, y, m.taille * u, m.taille * u);
  }
  ctx.globalAlpha = 1;
}
