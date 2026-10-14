import { G } from '../jeu/vue';
import { FEUILLES } from '../rendu/feuilles';
import { imageDe } from '../rendu/feuilles-images';
import { ecrit, ecritCentre, largeurTexte } from '../rendu/police';

/**
 * Les cases de BD de l'intro : chaque membre du groupe a la sienne, l'une après l'autre. Trame de points, lignes de
 * vitesse, gros plan sur le personnage, encadré avec son nom et son rôle, onomatopée dans une étoile. Tout en pixels.
 */
export const DUREE_CASE = 0.95;

const PERSOS = [
  { g: G.JBT, nom: 'JBT', role: 'Batterie', cri: 'BOUM !', couleur: '#e5432f', fond: '#4a0f0a' },
  { g: G.JBM, nom: 'JBM', role: 'Chant', cri: 'YEAH !', couleur: '#3fa7f2', fond: '#0a2a4a' },
  { g: G.JBG, nom: 'JBG', role: 'Guitare solo', cri: 'WIIIZ !', couleur: '#ffd23f', fond: '#4a3a0a' },
  { g: G.MAT, nom: 'MAT', role: 'Basse', cri: 'BWOMM !', couleur: '#7cfc7c', fond: '#0a3a1a' },
  { g: G.TOM, nom: 'TOM', role: 'Guitare rythmique', cri: 'TCHAK !', couleur: '#ff4fd8', fond: '#3a0a3a' },
];

const H = 240;

/** Une étoile d'onomatopée, en marches d'escalier (pas de courbe lissée). */
function etoile(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, couleur: string): void {
  for (let y = -r; y <= r; y += 2)
    for (let x = -r; x <= r; x += 2) {
      const a = Math.atan2(y, x);
      const pointe = r * (0.62 + 0.38 * Math.abs(Math.cos(a * 5)));
      const d = Math.hypot(x, y);
      if (d > pointe) continue;
      c.fillStyle = d > pointe - 3 ? '#000000' : couleur;
      c.fillRect(Math.round(cx + x), Math.round(cy + y), 2, 2);
    }
}

/** La case du personnage `i`, à l'avancement `u` (0 → 1) de son passage, `t` le temps en secondes. */
export function dessineCase(c: CanvasRenderingContext2D, w: number, i: number, u: number, t: number): void {
  const p = PERSOS[i]!;
  const gauche = i % 2 === 0;
  // la case entre en glissant (150 ms), reste, puis s'efface vers l'autre côté
  const entree = Math.min(1, u / 0.16);
  const sortie = Math.max(0, (u - 0.88) / 0.12);
  const dx = Math.round((1 - entree) ** 2 * (gauche ? -w : w) + sortie ** 2 * (gauche ? w : -w));
  c.save();
  c.translate(dx, 0);
  // fond : trame de points de BD, plus gros vers le bas
  c.fillStyle = p.fond;
  c.fillRect(-4, -4, w + 8, H + 8);
  c.fillStyle = p.couleur;
  c.globalAlpha = 0.35;
  for (let y = 4; y < H; y += 8)
    for (let x = (y / 8) % 2 ? 4 : 8; x < w; x += 8) {
      const r = 1 + Math.floor((y / H) * 3);
      c.fillRect(x - r, y - r, r * 2, r * 2);
    }
  // lignes de vitesse, qui partent du personnage
  const cx = gauche ? w * 0.36 : w * 0.64;
  c.globalAlpha = 0.5;
  c.fillStyle = '#ffffff';
  for (let k = 0; k < 28; k++) {
    const a = (k / 28) * Math.PI * 2 + t * 0.4;
    const r0 = 70 + ((k * 37) % 30);
    for (let d = r0; d < r0 + 120; d += 4)
      c.fillRect(Math.round(cx + Math.cos(a) * d), Math.round(120 + Math.sin(a) * d), 2, 2);
  }
  c.globalAlpha = 1;
  // le personnage en gros plan (×2, au pixel près), qui bouge en rythme
  const f = FEUILLES[p.g];
  const img = imageDe(p.g);
  if (f && img) {
    const col = Math.floor(t * 6) % (f.images[0] ?? 1);
    const zoom = 2;
    const bas = H + 30; // les pieds sortent du cadre : c'est un gros plan
    c.drawImage(
      img,
      col * f.w,
      0,
      f.w,
      f.h,
      Math.round(cx - (f.pied ?? f.w / 2) * zoom),
      bas - f.h * zoom,
      f.w * zoom,
      f.h * zoom,
    );
  }
  // le cadre de la case : un bord noir épais
  c.fillStyle = '#000000';
  for (const [x, y, ww, hh] of [
    [0, 0, w, 6],
    [0, H - 6, w, 6],
    [0, 0, 6, H],
    [w - 6, 0, 6, H],
  ] as const)
    c.fillRect(x, y, ww, hh);
  // l'encadré du nom, comme une légende de BD
  const bx = gauche ? Math.round(w * 0.6) : 16;
  const bw = Math.round(w * 0.36);
  // (les lettres ont un liseré sombre : texte clair sur fond noir, pour rester net)
  c.fillStyle = p.couleur;
  c.fillRect(bx - 3, 141, bw + 6, 62);
  c.fillStyle = '#0a0508';
  c.fillRect(bx, 144, bw, 56);
  const lettres = Math.min(p.nom.length, Math.floor((u - 0.12) / 0.05));
  if (lettres > 0) ecritCentre(c, p.nom.slice(0, lettres), bx + bw / 2, 152, p.couleur, 6);
  if (u > 0.4) ecritCentre(c, p.role.toUpperCase(), bx + bw / 2, 186, '#ffffff', 2);
  // l'onomatopée qui éclate
  if (u > 0.2) {
    const r = Math.round(30 * Math.min(1, (u - 0.2) / 0.08));
    const ox = gauche ? Math.round(w * 0.78) : Math.round(w * 0.2);
    etoile(c, ox, 62, r + 6, p.couleur);
    if (r > 20) ecrit(c, p.cri, ox - largeurTexte(p.cri, 2) / 2, 57, '#ffffff', 2);
  }
  c.restore();
}
