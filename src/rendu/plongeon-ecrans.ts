import { HAUTEUR_VUE } from '../config';
import { DUREE_SURVOL, ENTREE, HAUTEUR, ZONE } from '../jeu/plongeon';
import type { VuePlongeon } from '../jeu/vue';
import { ecrit, ecritCentre, largeurTexte } from './police';

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
    return ['PEU PROFOND : GENOUX RÂPÉS SUR LES GALETS (-10).', 'IL BOITERA JUSQU’AUX ALPES.'];
  return [
    v.score >= 95 ? 'PILE DANS LE TROU D’EAU !' : 'DANS LE TROU D’EAU.',
    'LE GROUPE APPLAUDIT DEPUIS LA BERGE.',
  ];
}

function entree(v: VuePlongeon): [string, string] {
  if (v.entree === ENTREE.PARFAITE) return ['ENTRÉE PARFAITE, BRAS TENDUS (+10)', VERT];
  if (v.entree === ENTREE.PLAT) return ['À PLAT ! ÇA CLAQUE (-25)', ROUGE];
  if (v.entree === ENTREE.GAINEE) return ['BRAS TENDUS TROP TÔT', BLANC];
  return ['', BLANC];
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
      bandeau(ctx, largeur, 26, 12);
      ecritCentre(ctx, '< > SE PLACER   SAUT : SAUTER (L’ÉLAN AU MILIEU)', m, 28, BLANC);
      return;
    case 'chute': {
      ecrit(ctx, `${Math.max(0, Math.round(HAUTEUR - v.y))} M`, 4, 14, BLANC, 2);
      if (v.eraflures) {
        const texte = `ÉRAFLURES ${v.eraflures}`;
        ecrit(ctx, texte, largeur - 4 - largeurTexte(texte), 14, ROUGE);
      }
      bandeau(ctx, largeur, HAUTEUR_VUE - 12, 12);
      const aide = v.bras ? 'BRAS TENDUS !' : '< > SE DIRIGER   SAUT : TENDRE LES BRAS';
      ecritCentre(ctx, aide, m, HAUTEUR_VUE - 10, v.bras ? VERT : BLANC);
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
      const [e, couleur] = entree(v);
      bandeau(ctx, largeur, 14, 80);
      ecritCentre(ctx, `PRÉCISION ${v.score} %`, m, 18, JAUNE, 2);
      ecritCentre(ctx, ou, m, 38, v.zone === ZONE.PROFOND ? VERT : ROUGE);
      if (e) ecritCentre(ctx, e, m, 50, couleur);
      if (v.eraflures)
        ecritCentre(
          ctx,
          `${v.eraflures} BRANCHE${v.eraflures > 1 ? 'S' : ''} (-${5 * v.eraflures})`,
          m,
          62,
          ROUGE,
        );
      ecritCentre(ctx, suite, m, 78, ROSE);
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
      if (v.minuteur === 0 && tick % 50 < 36)
        ecritCentre(ctx, v.miniJeu ? 'SAUT : REJOUER' : 'SAUT : EN ROUTE POUR LES ALPES', m, 132, BLANC);
      return;
    }
  }
}
