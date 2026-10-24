import { HAUTEUR_VUE } from '../config';
import { VITESSE } from '../jeu/avion-regles';
import { BAS, LONGUEURS, estObstacle, type Objet } from '../jeu/avion-parcours';
import { SOL_PISTE, SOL_VOIES } from './avion-decor';
import { voieDe } from './avion-objets';

/**
 * Ce qui rend le tarmac lisible, de profil : la voie de JBG éclairée (on sait où l'on court), une marque au sol sous chaque
 * obstacle de sa voie (rouge : il faut changer de voie ; jaune : il faut sauter ; cyan : la rampe d'un camion à tapis, on monte
 * dessus), et au bord droit de l'écran, l'annonce de ce qui arrive sur chaque voie, une seconde avant que ça n'entre à l'écran.
 */

type Ctx = CanvasRenderingContext2D;

type Geste = 'evite' | 'saute' | 'monte';
const COULEURS: Record<Geste, string> = { evite: '255,70,70', saute: '255,210,63', monte: '79,240,255' };

export const gesteDe = (o: Objet): Geste | null =>
  !estObstacle(o) ? null : o.sorte === 'convoyeur' ? 'monte' : BAS.has(o.sorte as never) ? 'saute' : 'evite';

/** Le haut et le bas d'une voie à l'écran (les lignes jaunes qui les séparent sont à 7 pixels sous le sol de chaque voie). */
function bornes(voie: number): [number, number] {
  const haut = voie >= 2 ? SOL_PISTE + 5 : SOL_VOIES[voie + 1]! + 8;
  const bas = voie <= 0 ? HAUTEUR_VUE : SOL_VOIES[voie]! + 8;
  return [haut, bas];
}

/** La voie de JBG, éclairée d'un voile clair et bordée de deux filets ; elle glisse avec lui quand il change de voie. */
export function eclaireVoie(c: Ctx, voieVue: number, largeur: number): void {
  const b = Math.floor(voieVue);
  const f = voieVue - b;
  const [h0, b0] = bornes(b);
  const [h1, b1] = bornes(Math.min(2, b + 1));
  const haut = Math.round(h0 + (h1 - h0) * f);
  const bas = Math.round(b0 + (b1 - b0) * f);
  c.fillStyle = 'rgba(255,255,255,0.12)';
  c.fillRect(0, haut, largeur, bas - haut);
  c.fillStyle = 'rgba(255,255,255,0.32)';
  c.fillRect(0, haut, largeur, 1);
  c.fillRect(0, bas - 1, largeur, 1);
}

/** La marque au sol d'un obstacle sur la voie de JBG, qui pulse : ce qu'il faut faire, avant même de reconnaître l'objet. */
export function marqueSol(c: Ctx, o: Objet, x: number, voie: number, tick: number): void {
  const g = gesteDe(o);
  if (!g) return;
  const long = LONGUEURS[o.sorte as keyof typeof LONGUEURS];
  const y = SOL_VOIES[voie]!;
  const a = 0.5 + 0.2 * Math.sin(tick / 5);
  c.fillStyle = `rgba(${COULEURS[g]},${a.toFixed(2)})`;
  c.beginPath();
  c.ellipse(x + long / 2, y, long / 2 + 3, 3, 0, 0, Math.PI * 2);
  c.fill();
}

/** Ce qui arrive dans la seconde, voie par voie, annoncé au bord droit : une flèche de la couleur du geste à faire. */
export function annonces(
  c: Ctx,
  tarmac: readonly Objet[],
  pris: ReadonlySet<number>,
  ex: (x: number) => number,
  largeur: number,
  s: number,
  voieJbg: number,
  tick: number,
): void {
  const proches: (Objet | null)[] = [null, null, null];
  const distances = [Infinity, Infinity, Infinity];
  for (let i = 0; i < tarmac.length; i++) {
    const o = tarmac[i]!;
    const x = ex(o.x);
    if (x <= largeur) continue;
    if (x > largeur + VITESSE) break;
    if (pris.has(i) || !gesteDe(o)) continue;
    const voie = voieDe(o, s);
    if (x < distances[voie]!) {
      distances[voie] = x;
      proches[voie] = o;
    }
  }
  proches.forEach((o, voie) => {
    if (!o) return;
    const g = gesteDe(o)!;
    const k = 1 - (distances[voie]! - largeur) / VITESSE; // de 0 (une seconde) à 1 (il entre à l'écran)
    const a = (voie === voieJbg ? 0.55 : 0.3) + 0.4 * k;
    const clignote = voie === voieJbg && k > 0.6 && tick % 10 < 5;
    c.fillStyle = `rgba(${clignote ? '255,255,255' : COULEURS[g]},${Math.min(1, a).toFixed(2)})`;
    const y = SOL_VOIES[voie]! - 5;
    const x = largeur - 4;
    // la flèche, pointée vers JBG
    for (let r = 0; r < 5; r++) c.fillRect(x - 6 + r, y - r, 1, 2 * r + 1);
    c.fillRect(x - 1, y - 2, 4, 5);
    // le signe du geste : une barre (éviter), un chevron vers le haut (sauter), une rampe (monter)
    c.fillStyle = `rgba(20,20,30,${Math.min(1, a).toFixed(2)})`;
    if (g === 'evite') c.fillRect(x - 2, y - 1, 3, 3);
    else if (g === 'saute') {
      c.fillRect(x - 2, y, 1, 1);
      c.fillRect(x - 1, y - 1, 1, 1);
      c.fillRect(x, y, 1, 1);
    } else for (let r = 0; r < 3; r++) c.fillRect(x - 3 + r, y + 1 - r, 1, 1);
  });
}
