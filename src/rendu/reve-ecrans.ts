import { HAUTEUR_VUE } from '../config';
import { BONUS_LUNE, DUREE_LUNE, VIES } from '../jeu/reve';
import { LONGUEUR } from '../jeu/reve-parcours';
import type { VueReve } from '../jeu/vue-reve';
import { disque } from './formes-pixels';
import { ecrit, ecritCentre, largeurTexte } from './police';
import { invitePodium } from './podium-invite';
import { dessineImage } from './reve-jbt';

/** Les écrans du rêve de JBT, par-dessus le ciel : le décollage, le compteur de piles, les vies, la route jusqu'à la lune, la fin. */

type Ctx = CanvasRenderingContext2D;

const BLANC = '#ffffff';
const JAUNE = '#ffd23f';
const ROSE = '#ff4fd8';
const ROUGE = '#ff6b5b';
const VERT = '#7cfc7c';
const CYAN = '#4ff0ff';

const joueur = (siege: number): string => `J${siege + 1}`;

function bandeau(ctx: Ctx, largeur: number, y: number, h: number): void {
  ctx.fillStyle = 'rgba(8,6,24,0.66)';
  ctx.fillRect(0, y, largeur, h);
}

/** Un cœur de pixels : plein (une vie qui reste) ou vide, cerné de noir. */
const COEUR = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
function coeur(ctx: Ctx, x: number, y: number, plein: boolean): void {
  for (const [dx, dy, couleur] of [
    [-1, 0, '#000'],
    [1, 0, '#000'],
    [0, -1, '#000'],
    [0, 1, '#000'],
    [0, 0, plein ? '#ff3a5a' : '#4a3050'],
  ] as const) {
    ctx.fillStyle = couleur;
    COEUR.forEach((ligne, j) => {
      for (let i = 0; i < ligne.length; i++) if (ligne[i] === 'X') ctx.fillRect(x + i + dx, y + j + dy, 1, 1);
    });
  }
  if (plein) {
    ctx.fillStyle = '#ffb0c0';
    ctx.fillRect(x + 1, y + 1, 1, 1);
  }
}

/** Le compteur de piles, les vies, et la route jusqu'à la lune (JBT avance sur une ligne vers une petite lune). */
function hud(ctx: Ctx, largeur: number, v: VueReve, tick: number): void {
  dessineImage(ctx, 'pile', 9, 9, 0, 1);
  ecrit(ctx, `${v.piles}`, 17, 4, JAUNE, 2);
  for (let i = 0; i < VIES; i++) coeur(ctx, largeur - 10 * VIES - 4 + i * 10, 4, i < v.vies);
  const l = Math.min(110, largeur - 150);
  const x0 = Math.round(largeur / 2 - l / 2);
  const k = Math.min(1, v.distance / LONGUEUR);
  ctx.fillStyle = 'rgba(8,6,24,0.7)';
  ctx.fillRect(x0 - 1, 7, l + 2, 4);
  ctx.fillStyle = '#6a4aa0';
  ctx.fillRect(x0, 8, l, 2);
  ctx.fillStyle = ROSE;
  ctx.fillRect(x0, 8, Math.round(l * k), 2);
  ctx.fillStyle = '#f2ecd0';
  disque(ctx, x0 + l + 5, 9, 4);
  ctx.fillStyle = BLANC;
  ctx.fillRect(x0 + Math.round(l * k) - 1, 6 + (tick % 20 < 10 ? 0 : 1), 3, 5);
}

/** Ce que le rêve a rapporté : les piles, la lune (ou pas), le score. */
function resultat(ctx: Ctx, largeur: number, v: VueReve): void {
  const m = largeur / 2;
  bandeau(ctx, largeur, 22, 104);
  ecritCentre(ctx, v.plante ? 'EN PLEINE LUNE !' : 'LE RÊVE S’ARRÊTE LÀ', m, 28, v.plante ? JAUNE : ROUGE, 2);
  const lignes: [string, string, string][] = [
    ['PILES ALCALINES', `${v.piles}`, BLANC],
    ['LA LUNE', v.plante ? `+${BONUS_LUNE}` : 'PERDUE DE VUE', v.plante ? VERT : ROUGE],
  ];
  lignes.forEach(([a, b, c], i) => {
    const y = 50 + i * 12;
    ecrit(ctx, a, m - 70, y, BLANC);
    ecrit(ctx, b, m + 70 - largeurTexte(b), y, c);
  });
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(m - 70, 75, 140, 1);
  ecrit(ctx, 'SCORE', m - 70, 82, JAUNE, 2);
  ecrit(ctx, `${v.score}`, m + 70 - largeurTexte(`${v.score}`, 2), 82, JAUNE, 2);
  const mot = v.plante
    ? 'JBT SE RÉVEILLE AVEC UN GROS MAL DE TÊTE.'
    : v.piles > 60
      ? 'JBT SE RÉVEILLE, LES POCHES PLEINES DE PILES.'
      : 'JBT SE RÉVEILLE. LA LUNE ATTENDRA.';
  ecritCentre(ctx, mot, m, 106, ROSE);
}

export function dessineEcranReve(ctx: Ctx, largeur: number, v: VueReve, tick: number): void {
  const m = largeur / 2;
  switch (v.etape) {
    case 'decollage':
      bandeau(ctx, largeur, 0, 26);
      ecritCentre(ctx, 'LE RÊVE DE JBT', m, 3, JAUNE, 2);
      ecritCentre(ctx, `${joueur(v.siege)} - JBT, SUPER-HÉROS`, m, 17, ROSE);
      bandeau(ctx, largeur, HAUTEUR_VUE - 32, 32);
      ecritCentre(ctx, 'TIENS LE BOUTON OU L’ÉCRAN : MONTER   LÂCHE : DESCENDRE', m, HAUTEUR_VUE - 29, BLANC);
      ecritCentre(ctx, 'RAMASSE LES PILES, ÉVITE TOUT LE RESTE', m, HAUTEUR_VUE - 19, CYAN);
      ecritCentre(ctx, 'ET RETROUVE LA PLEINE LUNE !', m, HAUTEUR_VUE - 10, JAUNE);
      return;
    case 'vol':
      hud(ctx, largeur, v, tick);
      return;
    case 'lune':
      hud(ctx, largeur, v, tick);
      if (v.plante && v.minuteur < DUREE_LUNE - 20) ecritCentre(ctx, 'BONK !', m, 30, JAUNE, 3);
      else if (!v.plante) ecritCentre(ctx, 'LA VOILÀ !', m, 30, BLANC, 2);
      return;
    case 'reveil':
      if (tick % 20 < 14) ecritCentre(ctx, 'DRIIIIIING !', m, 18, ROUGE, 3);
      ecritCentre(ctx, 'JBT SE RÉVEILLE EN SURSAUT.', m, 120, ROSE);
      return;
    case 'resultat':
      resultat(ctx, largeur, v);
      return;
    case 'podium': {
      bandeau(ctx, largeur, 0, HAUTEUR_VUE);
      ecritCentre(ctx, 'LES RÊVES DE LA NUIT', m, 10, JAUNE, 2);
      const classement = v.scores
        .map((score, siege) => (score === null ? null : { score, siege }))
        .filter((s): s is { score: number; siege: number } => s !== null)
        .sort((a, b) => b.score - a.score);
      classement.forEach((s, i) => {
        const ligne = `${i + 1}. ${joueur(s.siege)} JBT   ${s.score} POINTS`;
        ecritCentre(ctx, ligne, m, 36 + i * 14, i === 0 ? JAUNE : BLANC, i === 0 ? 2 : 1);
      });
      if (v.minuteur === 0 && tick % 50 < 36)
        invitePodium(ctx, m, 132, v.miniJeu, 'DEBOUT, ON MONTE DANS LA TOUR');
      return;
    }
  }
}
