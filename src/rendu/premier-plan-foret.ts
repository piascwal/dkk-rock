import type { Aleatoire } from '../moteur/maths';
import { T } from '../monde/tuiles';
import { chene } from './fonds-bretagne';
import { pied, toile, type DefPremierPlan, type Pose, type Sorte } from './premier-plan';

/**
 * Le premier plan de la forêt bretonne, posé sur le terrain (voir premier-plan.ts) : les vieux chênes moussus du fond du
 * sous-bois (`chene`, fonds-bretagne.ts), mais tout près de l'objectif, plus grands et plus sombres. Leur tronc plonge jusqu'au
 * fond du niveau, leur couronne passe en haut de l'image : on les croise sans qu'ils bougent quand on saute.
 */
const ECORCE = '#241b13';
const FEUILLES = ['#14301f', '#1a3826', '#112a1a'];
/** les terrains où l'on pose un chêne : la terre du sous-bois et la roche des dalles (pas les planches des ponts) */
const SOLS: ReadonlySet<number> = new Set([T.TERRE, T.ROCHE]);

/**
 * Un vieux chêne de hauteur `h` : son tronc, coupé au bas de l'image (le dessin des racines reste dehors : l'image est étirée vers
 * le bas, il lui faut un tronc droit), ses deux branches, sa couronne en haut avec de la place au-dessus pour ses feuilles.
 */
function grandChene(h: number, graine: Aleatoire): Sorte {
  const largeur = Math.round(h * 0.95) + 30;
  const hauteur = h + 20;
  const [t, c] = toile(largeur, hauteur);
  const cx = Math.round(largeur / 2);
  chene(c, graine, cx, hauteur + 6, h, ECORCE, graine.choix(FEUILLES));
  return { toile: t, pied: { x: cx, y: hauteur - 1 }, prolonge: true, opacite: 0.78 };
}

export const PREMIER_PLAN_FORET: DefPremierPlan = {
  parallaxe: 1.4,
  sortes: (r) => [grandChene(150, r), grandChene(175, r), grandChene(200, r)],
  pose: (terrain, r) => {
    const poses: Pose[] = [];
    let tx = 10;
    while (tx < terrain.largeur - 6) {
      const s = terrain.surface(tx);
      if (!s || !SOLS.has(s.tuile)) {
        tx++;
        continue;
      }
      poses.push({ sorte: r.entier(0, 2), ...pied(tx, s.ty) });
      tx += r.entier(8, 15);
    }
    return poses;
  },
};
