import { HAUTEUR_VUE } from '../config';
import { DUREE_SURVOL, HAUTEUR, ZONE } from '../jeu/plongeon';
import type { VuePlongeon } from '../jeu/vue';
import { ecrit, ecritCentre, largeurTexte } from './police';
import { invitePodium } from './podium-invite';

/** Les écrans du concours de plongeon, par-dessus les gorges : le survol, le parapet, la chute, l'arrivée, la note, le podium. */

const BLANC = '#ffffff';
const JAUNE = '#ffd23f';
const ROSE = '#ff4fd8';
const ROUGE = '#ff6b5b';
const VERT = '#7cfc7c';

const joueur = (siege: number): string => `J${siege + 1}`;

function bandeau(ctx: CanvasRenderingContext2D, largeur: number, y: number, h: number): void {
  ctx.fillStyle = 'rgba(10, 14, 20, 0.62)';
  ctx.fillRect(0, y, largeur, h);
}

/** Où Tom est tombé, et ce qui lui arrive. */
function recit(v: VuePlongeon): [string, string] {
  if (v.zone === ZONE.BERGE)
    return ['SUR LA BERGE ! PLANTÉ COMME UN PIQUET.', 'LES POMPIERS DE SAINT-CÉZAIRE SONT EN ROUTE.'];
  if (v.zone === ZONE.BAS)
    return ['PEU PROFOND : LA TÊTE DANS LES GALETS (-10).', 'UNE BOSSE QUI TIENDRA JUSQU’AUX ALPES.'];
  return [
    v.score >= 95 ? 'PILE DANS LE TROU D’EAU !' : 'DANS LE TROU D’EAU.',
    'LE GROUPE APPLAUDIT DEPUIS LA BERGE.',
  ];
}

export function dessineEcranPlongeon(
  ctx: CanvasRenderingContext2D,
  largeur: number,
  v: VuePlongeon,
  tick: number,
): void {
  const m = largeur / 2;
  switch (v.etape) {
    case 'visee':
      bandeau(ctx, largeur, 0, 26);
      ecritCentre(ctx, 'LE SAUT DU PONT DES TUVES', m, 3, JAUNE, 2);
      ecritCentre(ctx, `${joueur(v.siege)} - TOM`, m, 17, ROSE);
      if (v.vise < DUREE_SURVOL) {
        bandeau(ctx, largeur, HAUTEUR_VUE - 12, 12);
        ecritCentre(ctx, 'LE TROU D’EAU EST LÀ. RETIENS BIEN OÙ.', m, HAUTEUR_VUE - 10, BLANC);
        return;
      }
      bandeau(ctx, largeur, HAUTEUR_VUE - 22, 22);
      if (v.tension > 0) {
        ecritCentre(ctx, 'TIRE PLUS OU MOINS, VISE AVEC < >', m, HAUTEUR_VUE - 20, BLANC);
        ecritCentre(ctx, 'LÂCHE POUR SAUTER !', m, HAUTEUR_VUE - 10, JAUNE);
      } else {
        ecritCentre(ctx, '< > SE PLACER', m, HAUTEUR_VUE - 20, BLANC);
        ecritCentre(
          ctx,
          'TIRE LE JOYSTICK VERS LE BAS (OU SAUT) : TENDRE LES JAMBES',
          m,
          HAUTEUR_VUE - 10,
          BLANC,
        );
      }
      return;
    case 'chute': {
      ecrit(ctx, `${Math.max(0, Math.round(HAUTEUR - v.y))} M`, 4, 14, BLANC, 2);
      if (v.eraflures) {
        const texte = `ÉRAFLURES ${v.eraflures}`;
        ecrit(ctx, texte, largeur - 4 - largeurTexte(texte), 14, ROUGE);
      }
      bandeau(ctx, largeur, HAUTEUR_VUE - 12, 12);
      ecritCentre(ctx, '< > SE DIRIGER', m, HAUTEUR_VUE - 10, BLANC);
      return;
    }
    case 'impact':
      ecritCentre(
        ctx,
        v.zone === ZONE.BERGE ? 'AÏE !' : 'PLOUF !',
        m,
        20,
        v.zone === ZONE.BERGE ? ROUGE : BLANC,
        3,
      );
      return;
    case 'resultat': {
      const [ou, suite] = recit(v);
      // en haut de l'écran, pour qu'on voie Tom en bas : planté, ou qui nage vers la berge
      bandeau(ctx, largeur, 0, 52);
      ecritCentre(ctx, `PRÉCISION ${v.score} %`, m, 3, JAUNE, 2);
      ecritCentre(ctx, ou, m, 20, v.zone === ZONE.PROFOND ? VERT : ROUGE);
      if (v.eraflures)
        ecritCentre(
          ctx,
          `${v.eraflures} BRANCHE${v.eraflures > 1 ? 'S' : ''} (-${5 * v.eraflures})`,
          m,
          30,
          ROUGE,
        );
      ecritCentre(ctx, suite, m, 41, ROSE);
      return;
    }
    case 'podium': {
      bandeau(ctx, largeur, 0, HAUTEUR_VUE);
      ecritCentre(ctx, 'PODIUM DU PONT DES TUVES', m, 10, JAUNE, 2);
      const classement = v.scores
        .map((score, siege) => (score === null ? null : { score, siege }))
        .filter((s): s is { score: number; siege: number } => s !== null)
        .sort((a, b) => b.score - a.score);
      classement.forEach((s, i) => {
        const ligne = `${i + 1}. ${joueur(s.siege)} TOM   ${s.score} %`;
        ecritCentre(ctx, ligne, m, 36 + i * 14, i === 0 ? JAUNE : BLANC, i === 0 ? 2 : 1);
      });
      if (v.minuteur === 0 && tick % 50 < 36) invitePodium(ctx, m, 132, v.miniJeu, 'EN ROUTE POUR LES ALPES');
      return;
    }
  }
}
