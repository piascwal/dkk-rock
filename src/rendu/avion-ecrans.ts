import { HAUTEUR_VUE } from '../config';
import { BONUS } from '../jeu/avion-parcours';
import { DECOLLAGE, PORTEE, xAvion } from '../jeu/avion';
import type { VueAvion } from '../jeu/vue-avion';
import { ecrit, ecritCentre, largeurTexte } from './police';
import { iconeBonus } from './avion-objets';

/** Les écrans de l'avion de JBG, par-dessus le tarmac : l'arrivée, la course (l'avion, le décollage, les cartes, le bonus), la fin. */

type Ctx = CanvasRenderingContext2D;

const BLANC = '#ffffff';
const JAUNE = '#ffd23f';
const ROSE = '#ff4fd8';
const ROUGE = '#ff6b5b';
const VERT = '#7cfc7c';
const CYAN = '#4ff0ff';

const joueur = (siege: number): string => `J${siege + 1}`;
/** Les pixels du tarmac en mètres, pour l'affichage. */
const METRES = 0.12;
const NOMS_BONUS: Record<(typeof BONUS)[number], string> = {
  solo: 'SOLO !',
  ressorts: 'RESSORTS',
  trottinette: 'TROTTINETTE',
  aimant: 'AIMANT',
};

function bandeau(ctx: Ctx, largeur: number, y: number, h: number): void {
  ctx.fillStyle = 'rgba(8,10,24,0.66)';
  ctx.fillRect(0, y, largeur, h);
}

const chrono = (s: number): string => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Les cartes, la distance qui le sépare de l'avion, le temps avant le décollage, le bonus et ce qui lui reste. */
function hud(ctx: Ctx, largeur: number, v: VueAvion, tick: number): void {
  // à droite du bouton de pause
  ctx.fillStyle = '#f2f2f2';
  ctx.fillRect(14, 5, 7, 5);
  ctx.fillStyle = '#2a6ad0';
  ctx.fillRect(14, 5, 7, 1);
  ecrit(ctx, `${v.cartes}`, 24, 3, JAUNE, 2);
  const ecart = Math.max(0, xAvion(v.temps) - v.x);
  const texte = ecart <= PORTEE ? 'À PORTÉE !' : `L’AVION : ${Math.round(ecart * METRES)} M`;
  ecritCentre(ctx, texte, largeur / 2, 4, ecart <= PORTEE ? VERT : BLANC);
  const reste = Math.max(0, DECOLLAGE - v.temps / 60);
  const t = `DÉCOLLAGE ${chrono(reste)}`;
  const urgent = reste < 10 && tick % 20 < 10;
  ecrit(ctx, t, largeur - 4 - largeurTexte(t), 4, reste < 10 ? (urgent ? ROUGE : JAUNE) : BLANC);
  // la jauge : JBG, à gauche, rattrape l'avion, à droite
  const l = Math.min(120, largeur - 120);
  const x0 = Math.round(largeur / 2 - l / 2);
  const k = 1 - Math.min(1, ecart / 1600);
  ctx.fillStyle = 'rgba(8,10,24,0.7)';
  ctx.fillRect(x0 - 1, 12, l + 2, 4);
  ctx.fillStyle = '#4a5a80';
  ctx.fillRect(x0, 13, l, 2);
  ctx.fillStyle = CYAN;
  ctx.fillRect(x0, 13, Math.round(l * k), 2);
  ctx.fillStyle = BLANC;
  ctx.fillRect(x0 + l - 2, 11, 5, 2);
  ctx.fillRect(x0 + l, 10, 1, 6);
  if (v.bonus >= 0) {
    const sorte = BONUS[v.bonus]!;
    iconeBonus(ctx, sorte, 9, 24);
    ecrit(ctx, NOMS_BONUS[sorte], 17, 20, CYAN);
    ctx.fillStyle = CYAN;
    ctx.fillRect(17, 27, Math.round(Math.min(40, v.bonusReste / 12)), 1);
  }
}

function resultat(ctx: Ctx, largeur: number, v: VueAvion): void {
  const m = largeur / 2;
  bandeau(ctx, largeur, 20, 108);
  ecritCentre(ctx, v.embarque ? 'À BORD !' : 'L’AVION EST PARTI...', m, 26, v.embarque ? VERT : ROUGE, 2);
  const avance = Math.max(0, Math.floor(DECOLLAGE - v.temps / 60));
  const lignes: [string, string, string][] = [
    ['CARTES D’EMBARQUEMENT', `${v.cartes} X 5`, BLANC],
    ['EMBARQUEMENT', v.embarque ? '+300' : 'RATÉ', v.embarque ? VERT : ROUGE],
    ['AVANCE SUR LE DÉCOLLAGE', v.embarque ? `${avance} S X 10` : '-', BLANC],
    ['FAUX PAS', `${v.chutes}`, v.chutes ? ROUGE : VERT],
  ];
  lignes.forEach(([a, b, c], i) => {
    ecrit(ctx, a, m - 80, 46 + i * 11, BLANC);
    ecrit(ctx, b, m + 80 - largeurTexte(b), 46 + i * 11, c);
  });
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(m - 80, 92, 160, 1);
  ecrit(ctx, 'SCORE', m - 80, 98, JAUNE, 2);
  ecrit(ctx, `${v.score}`, m + 80 - largeurTexte(`${v.score}`, 2), 98, JAUNE, 2);
  const mot = v.embarque
    ? v.chutes === 0
      ? 'SANS UN FAUX PAS. MADRID EST VENGÉ.'
      : 'IL S’ASSOIT, ESSOUFFLÉ. PERSONNE NE LUI A GARDÉ DE PLACE.'
    : 'IL ARRIVERA EN BRETAGNE EN STOP. COMME POUR MADRID.';
  ecritCentre(ctx, mot, m, 116, ROSE);
}

export function dessineEcranAvion(ctx: Ctx, largeur: number, v: VueAvion, tick: number): void {
  const m = largeur / 2;
  switch (v.etape) {
    case 'intro':
      bandeau(ctx, largeur, 0, 26);
      ecritCentre(ctx, 'L’AVION DE JBG', m, 3, JAUNE, 2);
      ecritCentre(ctx, `${joueur(v.siege)} - JBG, EN RETARD`, m, 17, ROSE);
      // les consignes dans le ciel : les voies restent dégagées
      bandeau(ctx, largeur, 26, 30);
      ecritCentre(ctx, 'GAUCHE / DROITE : VOIE   HAUT : SAUTER   BAS : GLISSER', m, 28, BLANC);
      ecritCentre(ctx, 'ÉVITE TOUT, PRENDS LES CARTES ET LES BONUS', m, 37, CYAN);
      ecritCentre(ctx, 'ET SAUTE SUR L’ÉCHELLE, PAR LA VOIE DU MILIEU !', m, 46, JAUNE);
      return;
    case 'course': {
      hud(ctx, largeur, v, tick);
      if (xAvion(v.temps) - v.x <= PORTEE && tick % 16 < 11)
        ecritCentre(ctx, v.voie === 1 ? 'SAUTE !' : 'AU MILIEU !', m, 34, v.voie === 1 ? VERT : JAUNE, 3);
      else if (v.trebuche > 0) ecritCentre(ctx, 'AÏE ! L’AVION FILE...', m, 34, ROUGE);
      return;
    }
    case 'embarque':
      ecritCentre(ctx, 'À BORD !', m, 30, VERT, 3);
      return;
    case 'rate':
      ecritCentre(ctx, 'TROP TARD...', m, 30, ROUGE, 3);
      return;
    case 'resultat':
      resultat(ctx, largeur, v);
      return;
    case 'podium': {
      bandeau(ctx, largeur, 0, HAUTEUR_VUE);
      ecritCentre(ctx, 'LE DERNIER APPEL', m, 10, JAUNE, 2);
      const classement = v.scores
        .map((score, siege) => (score === null ? null : { score, siege }))
        .filter((s): s is { score: number; siege: number } => s !== null)
        .sort((a, b) => b.score - a.score);
      classement.forEach((s, i) => {
        const ligne = `${i + 1}. ${joueur(s.siege)} JBG   ${s.score} POINTS`;
        ecritCentre(ctx, ligne, m, 36 + i * 14, i === 0 ? JAUNE : BLANC, i === 0 ? 2 : 1);
      });
      if (v.minuteur === 0 && tick % 50 < 36)
        ecritCentre(ctx, v.miniJeu ? 'SAUT : REJOUER' : 'SAUT : CAP SUR LA BRETAGNE', m, 132, BLANC);
      return;
    }
  }
}
