import { HAUTEUR_VUE } from '../config';
import { HEROS } from '../entites/heros';
import { ANIM, type Genre } from '../jeu/vue';
import { POINTS_VICTOIRE, TOURS } from '../jeu/kart';
import { NOTES, PILOTES, VOITURES } from '../jeu/kart-voiture';
import type { VueKart } from '../jeu/vue-kart';
import { dessineFeuille } from './feuilles-images';
import { HEROS_KART, imageKart } from './kart-images';
import { dessineVoiture } from './kart-piste';
import { ecrit, ecritCentre, largeurTexte } from './police';

/**
 * Les écrans du Grand Prix de la Sarré, par-dessus la piste : le choix des pilotes, le compte à rebours, la course (seul : la
 * place, le tour, le chrono, le bonus en réserve, l'ordre de la course ; à plusieurs : les points, les éliminés), la manche
 * gagnée, l'arrivée, et le podium (les DKK de face, avec leur instrument).
 */

type Ctx = CanvasRenderingContext2D;

export const COULEURS_KART = ['#ffd23f', '#4ff0ff', '#ff4fd8', '#7cfc7c', '#ff7a2a'];
const BLANC = '#ffffff';
const GRIS = '#8a8a92';

function bandeau(c: Ctx, x: number, y: number, w: number, h: number): void {
  c.fillStyle = 'rgba(8,10,24,0.72)';
  c.fillRect(x, y, w, h);
}

const chrono = (ticks: number): string => {
  const s = ticks / 60;
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
};

function damier(c: Ctx, largeur: number, y: number): void {
  for (let x = 0; x < largeur; x += 6)
    for (let r = 0; r < 2; r++) {
      c.fillStyle = (x / 6 + r) % 2 ? '#f2f2f2' : '#1a1a1e';
      c.fillRect(x, y + r * 3, 6, 3);
    }
}

/** Le choix des pilotes : les cinq DKK et leur voiture, leurs notes ; le curseur de chaque joueur, coché quand il a validé. */
export function ecranChoix(c: Ctx, largeur: number, v: VueKart, tick: number): void {
  const g = c.createLinearGradient(0, 0, 0, HAUTEUR_VUE);
  g.addColorStop(0, '#2a2a34');
  g.addColorStop(1, '#4a4a52');
  c.fillStyle = g;
  c.fillRect(0, 0, largeur, HAUTEUR_VUE);
  damier(c, largeur, 23);
  ecritCentre(c, 'GRAND PRIX DE LA SARRÉ', largeur / 2, 4, '#ffd23f', 2);
  ecritCentre(
    c,
    v.choix.length > 1 ? 'CHOISISSEZ VOS PILOTES' : 'CHOISIS TON PILOTE',
    largeur / 2,
    32,
    BLANC,
  );
  const x0 = Math.round(largeur / 2 - 135);
  PILOTES.forEach((nom, i) => {
    const x = x0 + i * 54;
    const joueurs = v.choix.filter((ch) => ch.pilote === i);
    c.fillStyle = joueurs.length ? 'rgba(255,210,63,0.22)' : 'rgba(0,0,0,0.3)';
    c.fillRect(x, 42, 50, 104);
    for (const ch of joueurs) {
      c.fillStyle = ch.valide ? '#7cfc7c' : '#ffd23f';
      c.fillRect(x, 42, 50, 1);
      c.fillRect(x, 145, 50, 1);
      c.fillRect(x, 42, 1, 104);
      c.fillRect(x + 49, 42, 1, 104);
      const etiquette = `J${ch.siege + 1}${ch.valide ? ' OK' : ''}`;
      ecritCentre(c, etiquette, x + 25, 36 - (tick % 30 < 15 && !ch.valide ? 1 : 0), c.fillStyle as string);
    }
    const img = imageKart(HEROS_KART[i]!);
    if (img) {
      const hh = 30;
      const hw = (hh * img.width) / img.height;
      c.imageSmoothingEnabled = true;
      c.drawImage(img, Math.round(x + 25 - hw / 2), 45, Math.round(hw), hh);
      c.imageSmoothingEnabled = false;
    }
    dessineVoiture(c, voitureFixe(i, x + 25, 95), tick, 30);
    ecritCentre(c, nom, x + 25, 114, COULEURS_KART[i]!);
    ecritCentre(c, VOITURES[i]!, x + 25, 121, '#c8c8d0');
    ['VIT.', 'TENUE', 'POIDS'].forEach((s, k) => {
      ecrit(c, s, x + 3, 128 + k * 6, GRIS);
      for (let b = 0; b < 5; b++) {
        c.fillStyle = b < NOTES[i]![k]! ? COULEURS_KART[i]! : '#2a2a34';
        c.fillRect(x + 27 + b * 4, 129 + k * 6, 3, 3);
      }
    });
  });
  bandeau(c, 0, 150, largeur, 10);
  ecritCentre(c, 'GAUCHE / DROITE : CHOISIR   SAUT : EN PISTE !', largeur / 2, 152, BLANC);
}

const voitureFixe = (pilote: number, x: number, y: number) => ({
  pilote,
  siege: -1,
  x,
  y,
  a: -Math.PI / 2,
  bonus: -1,
  effets: 0,
  tour: 1,
  place: 1,
  points: 0,
});

/** Le bonus en réserve, dans sa case : une icône par bonus. */
function iconeBonus(c: Ctx, bonus: number, x: number, y: number): void {
  bandeau(c, x, y, 18, 18);
  const r = (dx: number, dy: number, w: number, h: number, col: string) => {
    c.fillStyle = col;
    c.fillRect(x + dx, y + dy, w, h);
  };
  // [dx, dy, l, h, couleur] : le turbo (trois flammes), l'huile (une flaque irisée), le marteau, le bouclier, le ressort
  const icones: [number, number, number, number, string][][] = [
    [
      [4, 5, 3, 8, '#ffd23f'],
      [7, 6, 3, 6, '#ff9a3a'],
      [10, 7, 3, 4, '#d02a2a'],
    ],
    [
      [3, 7, 12, 6, '#1a1a1e'],
      [5, 8, 4, 1, '#ff4fd8'],
      [9, 10, 4, 1, '#4ff0ff'],
    ],
    [
      [8, 6, 2, 9, '#8a5a2a'],
      [4, 4, 10, 4, '#c8c8d0'],
    ],
    [
      [4, 3, 10, 9, '#4ff0ff'],
      [6, 12, 6, 2, '#4ff0ff'],
      [6, 5, 6, 5, '#1a2440'],
    ],
    [0, 1, 2, 3].map((k) => [5, 4 + k * 3, 8, 1, '#c8c8d0']),
  ];
  for (const [dx, dy, w, h, col] of icones[bonus] ?? []) r(dx, dy, w, h, col);
}

/** Pendant la course : seul, la place, le tour, le chrono, le bonus, l'ordre ; à plusieurs, les points de chacun. */
export function hudKart(c: Ctx, largeur: number, v: VueKart, tick: number): void {
  if (v.multi) return hudMulti(c, largeur, v, tick);
  const moi = v.voitures.find((x) => x.siege >= 0);
  if (!moi) return;
  bandeau(c, 0, 0, largeur, 14);
  // à droite du bouton de pause
  ecrit(c, `${moi.place}E`, 24, 2, '#ffd23f', 2);
  ecrit(c, `/${v.voitures.length}`, 41, 6, BLANC);
  ecritCentre(c, `TOUR ${moi.tour}/${TOURS}`, largeur / 2, 4, BLANC);
  const t = chrono(v.temps);
  ecrit(c, t, largeur - 4 - largeurTexte(t), 4, BLANC);
  iconeBonus(c, moi.bonus, 4, 18);
  if (moi.bonus >= 0) ecrit(c, 'TIR', 7, 38, GRIS);
  [...v.voitures]
    .sort((a, b) => a.place - b.place)
    .forEach((x, i) => {
      bandeau(c, largeur - 30, 18 + i * 9, 26, 8);
      ecrit(c, `${i + 1}`, largeur - 28, 20 + i * 9, GRIS);
      ecrit(
        c,
        PILOTES[x.pilote]!,
        largeur - 21,
        20 + i * 9,
        x === moi && tick % 20 < 14 ? BLANC : COULEURS_KART[x.pilote]!,
      );
    });
}

function hudMulti(c: Ctx, largeur: number, v: VueKart, tick: number): void {
  bandeau(c, 0, 0, largeur, 22);
  ecritCentre(c, `LE PREMIER À ${POINTS_VICTOIRE} MANCHES`, largeur / 2, 2, '#ffd23f');
  const l = Math.floor(largeur / v.voitures.length);
  v.voitures.forEach((x, i) => {
    const px = 6 + i * l;
    const elimine = (x.effets & 32) !== 0;
    ecrit(c, PILOTES[x.pilote]!, px, 11, elimine ? GRIS : COULEURS_KART[x.pilote]!);
    for (let b = 0; b < POINTS_VICTOIRE; b++) {
      c.fillStyle = b < x.points ? COULEURS_KART[x.pilote]! : '#2a2a34';
      c.fillRect(px + 16 + b * 5, 12, 4, 4);
    }
    if (elimine && tick % 30 < 20) ecrit(c, 'OUT', px, 17, '#ff6b5b');
  });
}

/** Le compte à rebours, la manche gagnée, l'arrivée : en grand au milieu. */
export function annonceKart(c: Ctx, largeur: number, v: VueKart): void {
  const m = largeur / 2;
  if (v.etape === 'depart') {
    const s = Math.ceil(v.minuteur / 60);
    ecritCentre(c, s > 0 ? `${s}` : 'GO !', m, 60, s > 0 ? '#ffd23f' : '#7cfc7c', 4);
  } else if (v.etape === 'course' && v.temps < 50) ecritCentre(c, 'GO !', m, 60, '#7cfc7c', 4);
  else if (v.etape === 'manche') {
    const g = v.voitures[v.gagnant];
    bandeau(c, m - 70, 54, 140, 22);
    ecritCentre(c, g ? `${PILOTES[g.pilote]} GAGNE LA MANCHE !` : 'MANCHE NULLE', m, 58, '#ffd23f');
    if (g) ecritCentre(c, `${g.points} / ${POINTS_VICTOIRE}`, m, 67, BLANC);
  } else if (v.etape === 'arrivee') {
    const moi = v.voitures.find((x) => x.siege >= 0);
    if (moi) ecritCentre(c, moi.place === 1 ? 'VICTOIRE !' : `${moi.place}E !`, m, 56, '#ffd23f', 3);
  }
}

/** Le podium : les trois premiers de face, avec leur instrument, sur leurs marches ; le champagne du vainqueur ; les écarts. */
export function ecranPodium(c: Ctx, largeur: number, v: VueKart, tick: number): void {
  const g = c.createLinearGradient(0, 0, 0, HAUTEUR_VUE);
  g.addColorStop(0, '#2a6fdb');
  g.addColorStop(1, '#8ac8f0');
  c.fillStyle = g;
  c.fillRect(0, 0, largeur, HAUTEUR_VUE);
  c.fillStyle = '#5c5c64';
  c.fillRect(0, 110, largeur, 50);
  damier(c, largeur, 108);
  const m = largeur / 2;
  const premier = v.voitures[v.classement[0]!];
  if (!premier) return;
  ecritCentre(c, `${PILOTES[premier.pilote]} REMPORTE LE GRAND PRIX`, m, 5, '#ffd23f', 2);
  ecritCentre(c, 'DE LA SARRÉ !', m, 18, BLANC, 2);
  const marches: [number, number, number][] = [
    [0, m, 80],
    [1, m - 52, 90],
    [2, m + 52, 98],
  ];
  for (const [rang, x, y] of marches) {
    const voiture = v.voitures[v.classement[rang]!];
    if (!voiture) continue;
    c.fillStyle = '#e8e8ec';
    c.fillRect(x - 24, y, 48, 110 - y);
    c.fillStyle = '#c8c8d0';
    c.fillRect(x - 24, y, 48, 3);
    ecritCentre(c, `${rang + 1}`, x, y + 8, '#1a2440', 2);
    c.save();
    c.translate(x, y);
    c.scale(2.3, 2.3);
    dessineFeuille(c, HEROS[voiture.pilote]!.genre as Genre, ANIM.DEBOUT, Math.floor(tick / 8), false);
    c.restore();
  }
  // le champagne du vainqueur, en trois gerbes
  for (let j = 0; j < 3; j++)
    for (let k = 0; k < 14; k++) {
      const t = (k / 13 + tick / 90) % 1;
      c.fillStyle = k % 3 ? '#fff6c8' : '#ffe08a';
      const x = m + 14 + t * (30 + j * 10);
      const y = 46 - t * (26 - j * 6) + t * t * (24 + j * 4);
      c.fillRect(Math.round(x), Math.round(y), t > 0.7 ? 1 : 2, t > 0.7 ? 1 : 2);
    }
  for (let k = 0; k < 60; k++) {
    c.fillStyle = COULEURS_KART[k % 5]!;
    c.fillRect((k * 53 + tick) % largeur, ((k * 29 + tick * (1 + (k % 3))) % 100) + 24, 2, 1);
  }
  v.voitures.forEach((x, i) =>
    dessineVoiture(c, { ...x, x: 34 + i * 54, y: 136, a: -Math.PI / 2, effets: 0 }, tick, 30),
  );
  bandeau(c, 0, 150, largeur, 10);
  const lignes = v.classement.slice(0, 3).map((k, i) => {
    const x = v.voitures[k]!;
    if (v.multi) return `${PILOTES[x.pilote]} ${x.points}`;
    const t = v.arrivees[k]!;
    const t0 = v.arrivees[v.classement[0]!]!;
    return i === 0
      ? `${PILOTES[x.pilote]} ${chrono(t)}`
      : `${PILOTES[x.pilote]} ${t >= 0 ? `+${((t - t0) / 60).toFixed(1)} S` : '-'}`;
  });
  ecritCentre(c, lignes.join('   '), m, 152, BLANC);
  if (v.minuteur === 0 && tick % 50 < 36)
    ecritCentre(c, v.miniJeu ? 'SAUT : REJOUER' : 'SAUT : CAP SUR LES PLAGES', m, 141, BLANC);
}
