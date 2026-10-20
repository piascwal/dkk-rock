import { VERSION } from '../version';
import { roues, type Pose } from '../jeu/drift-pelouse';
import { FOCALE, HAUTEUR, HORIZON, type Regard } from './drift-sol';

/** Les planches sont à 6 pixels par pixel du jeu (voir outils/fixe-voitures.py). */
const DENSITE = 6;
/** Les pilotes, dans l'ordre de `VueDrift.pilote`, et le nom de leurs planches. */
const NOMS = ['tom', 'matt'];
/** En deçà de cet écart entre le cap de la voiture et celui de la caméra, on la voit de dos ; au-delà, de trois quarts. */
const DE_DOS = 0.22;

const images = new Map<string, HTMLImageElement>();

/** Charge les vues arrière des deux voitures (celles qui manquent sont remplacées par un rectangle). */
export function chargeVoitures(base: string): void {
  for (const nom of NOMS)
    for (const vue of ['dos', 'biais', 'biais-droite']) {
      const img = new Image();
      img.onload = () => images.set(`${nom}-${vue}`, img);
      img.src = `${base}sprites/drift-${nom}-${vue}.png?v=${VERSION}`;
    }
}

/** Où tombe un point du sol (x, y en mètres) à l'écran, et son échelle ; null s'il est derrière la caméra. */
export function projette(
  regard: Regard,
  largeur: number,
  x: number,
  y: number,
): { sx: number; sy: number; z: number } | null {
  const dx = Math.cos(regard.cap);
  const dy = Math.sin(regard.cap);
  const z = (x - regard.x) * dx + (y - regard.y) * dy;
  if (z < 0.5) return null;
  const lat = (x - regard.x) * dy - (y - regard.y) * dx;
  return { sx: largeur / 2 + (lat * FOCALE) / z, sy: HORIZON + (HAUTEUR * FOCALE) / z, z };
}

/**
 * Dessine la voiture du pilote : de dos, ou de trois quarts quand elle part en travers par rapport à la caméra (la vue dédiée à
 * ce côté ou, à défaut, celle de l'autre côté retournée). `secoue` : elle tressaute (elle laboure la pelouse).
 */
export function dessineVoiture(
  ctx: CanvasRenderingContext2D,
  regard: Regard,
  largeur: number,
  voiture: Pose,
  pilote: number,
  echelle: number,
  secoue: boolean,
): void {
  const p = projette(regard, largeur, voiture.x, voiture.y);
  if (!p) return;
  const nom = NOMS[pilote] ?? 'tom';
  let ecart = voiture.cap - regard.cap;
  ecart = Math.atan2(Math.sin(ecart), Math.cos(ecart));
  // la vue de trois quarts selon l'écart : `biais-droite` quand la voiture pivote vers la gauche de la caméra, `biais` vers la
  // droite ; une vue qui manque est l'autre, retournée
  const vue = ecart > DE_DOS ? 'biais-droite' : ecart < -DE_DOS ? 'biais' : 'dos';
  let img = images.get(`${nom}-${vue}`);
  let retourne = false;
  if (!img && vue !== 'dos') {
    img = images.get(`${nom}-${vue === 'biais' ? 'biais-droite' : 'biais'}`);
    retourne = true;
  }
  const k = echelle / p.z;
  const y = Math.round(p.sy + 3 * k + (secoue ? Math.round(Math.random()) : 0));
  const x = Math.round(p.sx);
  // l'ombre, sous la voiture
  ctx.fillStyle = 'rgba(20, 40, 10, 0.35)';
  ctx.fillRect(Math.round(x - 30 * k), y - Math.round(3 * k), Math.round(60 * k), Math.round(5 * k));
  if (!img) {
    ctx.fillStyle = pilote ? '#1a1a1a' : '#e8e8e8';
    ctx.fillRect(Math.round(x - 26 * k), Math.round(y - 30 * k), Math.round(52 * k), Math.round(30 * k));
    return;
  }
  const w = Math.round((img.width / DENSITE) * k);
  const h = Math.round((img.height / DENSITE) * k);
  ctx.save();
  ctx.translate(x, y);
  if (retourne) ctx.scale(-1, 1);
  ctx.drawImage(img, -Math.round(w / 2), -h, w, h);
  ctx.restore();
}

interface Motte {
  x: number;
  y: number;
  vx: number;
  vy: number;
  vie: number;
  couleur: string;
  taille: number;
}

/** Ce que les roues projettent selon ce qu'elles arrachent : des brins d'herbe, de la terre, de la boue. */
const PROJECTIONS = [[], ['#4c8f2f', '#86c255'], ['#7a5530', '#5c8f35'], ['#4f3320', '#6b4528']];

/** Les mottes projetées par les roues arrière quand elles griffent la pelouse : de petits carrés qui volent et retombent. */
export class Mottes {
  private liste: Motte[] = [];

  projette(regard: Regard, largeur: number, voiture: Pose, griffe: number): void {
    if (griffe <= 0) return;
    const couleurs = PROJECTIONS[griffe]!;
    for (const [x, y] of roues(voiture).slice(0, 2)) {
      const p = projette(regard, largeur, x, y);
      if (!p) continue;
      for (let i = 0; i < griffe; i++)
        this.liste.push({
          x: p.sx + (Math.random() - 0.5) * 4,
          y: p.sy - 2,
          vx: (Math.random() - 0.5) * 3,
          vy: -1 - Math.random() * 2.5 * griffe,
          vie: 18 + Math.random() * 16,
          couleur: couleurs[Math.floor(Math.random() * couleurs.length)]!,
          taille: Math.random() < 0.3 ? 2 : 1,
        });
    }
    if (this.liste.length > 400) this.liste.splice(0, this.liste.length - 400);
  }

  dessine(ctx: CanvasRenderingContext2D): void {
    for (const m of this.liste) {
      m.x += m.vx;
      m.y += m.vy;
      m.vy += 0.3;
      m.vie--;
      ctx.fillStyle = m.couleur;
      ctx.fillRect(Math.round(m.x), Math.round(m.y), m.taille, m.taille);
    }
    this.liste = this.liste.filter((m) => m.vie > 0);
  }

  vide(): void {
    this.liste = [];
  }
}

/** Une voiture de dos, posée à plat (l'écran du choix du pilote) : pieds en (x, y), à l'échelle `k`. */
export function dessineVignette(
  ctx: CanvasRenderingContext2D,
  pilote: number,
  x: number,
  y: number,
  k: number,
): void {
  const img = images.get(`${NOMS[pilote] ?? 'tom'}-dos`);
  if (!img) return;
  const w = Math.round((img.width / DENSITE) * k);
  const h = Math.round((img.height / DENSITE) * k);
  ctx.drawImage(img, Math.round(x - w / 2), Math.round(y - h), w, h);
}
