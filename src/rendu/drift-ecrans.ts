import { HAUTEUR_VUE, TICKS_PAR_SECONDE } from '../config';
import { PILOTES } from '../jeu/drift';
import type { VueDrift } from '../jeu/vue';
import { dessineVignette } from './drift-voitures';
import { ecrit, ecritCentre, largeurTexte } from './police';

/** Les écrans du concours de drift, par-dessus le pré : choix du pilote, compte à rebours, chrono, score, podium. */

const BLANC = '#ffffff';
const JAUNE = '#ffd23f';
const ROSE = '#ff4fd8';
const ROUGE = '#ff3b3b';
const COULEURS_PILOTES = ['#e8e8e8', '#ffd23f'];

const pourcent = (p: number): string => `${p.toFixed(1).replace('.', ',')} %`;
const joueur = (siege: number): string => `J${siege + 1}`;

/** Un bandeau sombre, pour lire un texte sur le pré. */
function bandeau(ctx: CanvasRenderingContext2D, largeur: number, y: number, h: number): void {
  ctx.fillStyle = 'rgba(10, 14, 20, 0.62)';
  ctx.fillRect(0, y, largeur, h);
}

export function dessineEcranDrift(
  ctx: CanvasRenderingContext2D,
  largeur: number,
  v: VueDrift,
  tick: number,
): void {
  switch (v.etape) {
    case 'choix':
      return choix(ctx, largeur, v, tick);
    case 'compte':
      return compte(ctx, largeur, v);
    case 'course':
      return chrono(ctx, largeur, v);
    case 'resultat':
      return resultat(ctx, largeur, v);
    case 'podium':
      return podium(ctx, largeur, v, tick);
  }
}

function choix(ctx: CanvasRenderingContext2D, largeur: number, v: VueDrift, tick: number): void {
  bandeau(ctx, largeur, 0, HAUTEUR_VUE);
  const m = largeur / 2;
  ecritCentre(ctx, 'CONCOURS DE DRIFT', m, 6, JAUNE, 2);
  ecritCentre(ctx, 'LE PRÉ DU CLOS : UNE MINUTE POUR SACCAGER LA PELOUSE', m, 20, BLANC);
  ecritCentre(ctx, `${joueur(v.siege)}, CHOISIS TON PILOTE`, m, 32, ROSE);
  for (const p of [0, 1]) {
    const x = m + (p ? 48 : -48);
    const choisi = p === v.pilote;
    if (choisi && tick % 40 < 30) {
      ctx.fillStyle = JAUNE;
      ctx.fillRect(x - 36, 108, 72, 2);
    }
    dessineVignette(ctx, p, x, 104, choisi ? 1 : 0.8);
    ecritCentre(ctx, PILOTES[p]!, x, 113, choisi ? COULEURS_PILOTES[p]! : '#8a8a8a', choisi ? 2 : 1);
  }
  ecritCentre(ctx, 'GAUCHE / DROITE : CHOISIR    SAUT : C’EST PARTI', m, 130, BLANC);
  ecritCentre(ctx, 'GAZ : HAUT OU SAUT   FREIN : BAS   FREIN À MAIN : TIR', m, 142, '#9fd3ff');
}

function compte(ctx: CanvasRenderingContext2D, largeur: number, v: VueDrift): void {
  const n = Math.ceil(v.minuteur / TICKS_PAR_SECONDE);
  bandeau(ctx, largeur, 26, 26);
  ecritCentre(ctx, n > 0 ? String(n) : 'DRIFT !', largeur / 2, 30, n > 0 ? BLANC : JAUNE, 4);
  ecritCentre(ctx, `${joueur(v.siege)} - ${PILOTES[v.pilote]}`, largeur / 2, 6, COULEURS_PILOTES[v.pilote]!);
}

function chrono(ctx: CanvasRenderingContext2D, largeur: number, v: VueDrift): void {
  const s = Math.ceil(v.minuteur / TICKS_PAR_SECONDE);
  const temps = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  bandeau(ctx, largeur, 0, 15);
  // les dix dernières secondes clignotent en rouge
  const fin = s <= 10;
  if (!fin || v.minuteur % 30 < 20) ecritCentre(ctx, temps, largeur / 2, 2, fin ? ROUGE : BLANC, 2);
  const score = `PELOUSE SACCAGÉE ${pourcent(v.pourcent)}`;
  ecrit(ctx, score, largeur - 4 - largeurTexte(score), 2, JAUNE);
  // le pilote et sa vitesse, en bas à gauche (en haut à gauche, il y a le bouton de pause)
  ecrit(ctx, `${joueur(v.siege)} - ${PILOTES[v.pilote]}`, 4, HAUTEUR_VUE - 18, COULEURS_PILOTES[v.pilote]!);
  ecrit(ctx, `${Math.round(v.vitesse * 3.6)} KM/H`, 4, HAUTEUR_VUE - 9, BLANC);
}

/** Ce qu'en pensent les parents de JBT, selon la part du pré saccagée. */
function verdict(p: number): string {
  if (p < 8) return 'LES PARENTS DE JBT N’ONT RIEN REMARQUÉ.';
  if (p < 18) return 'JOLI. LE JARDINIER VA PLEURER.';
  if (p < 30) return 'LE PRÉ DU CLOS NE S’EN REMETTRA PAS.';
  return 'IL N’Y A PLUS DE PELOUSE. IL Y A UN CHAMP DE BOUE.';
}

function resultat(ctx: CanvasRenderingContext2D, largeur: number, v: VueDrift): void {
  bandeau(ctx, largeur, 34, 46);
  const m = largeur / 2;
  ecritCentre(ctx, 'TEMPS ÉCOULÉ !', m, 38, BLANC);
  ecritCentre(ctx, `${PILOTES[v.pilote]} : ${pourcent(v.pourcent)}`, m, 50, COULEURS_PILOTES[v.pilote]!, 2);
  ecritCentre(ctx, verdict(v.pourcent), m, 68, ROSE);
}

function podium(ctx: CanvasRenderingContext2D, largeur: number, v: VueDrift, tick: number): void {
  bandeau(ctx, largeur, 0, HAUTEUR_VUE);
  const m = largeur / 2;
  ecritCentre(ctx, 'PODIUM DU PRÉ DU CLOS', m, 10, JAUNE, 2);
  const classement = v.scores
    .map((s, siege) => (s ? { ...s, siege } : null))
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => b.pourcent - a.pourcent);
  classement.forEach((s, i) => {
    const ligne = `${i + 1}. ${joueur(s.siege)} ${PILOTES[s.pilote]}   ${pourcent(s.pourcent)}`;
    ecritCentre(ctx, ligne, m, 36 + i * 14, i === 0 ? JAUNE : BLANC, i === 0 ? 2 : 1);
  });
  if (classement[0]) ecritCentre(ctx, verdict(classement[0].pourcent), m, 100, ROSE);
  if (v.minuteur === 0 && tick % 50 < 36)
    ecritCentre(ctx, v.miniJeu ? 'SAUT : REJOUER' : 'SAUT : EN ROUTE POUR LA TOURNÉE', m, 132, BLANC);
}
