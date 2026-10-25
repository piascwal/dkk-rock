import { ANIM, G } from '../jeu/vue';
import { humain, type Pinceau } from './pinceau';

/**
 * Les gens d'Ottawa, dessinés en code comme ceux du reste de l'International Tour (voir dessins-locaux.ts) : pieds en (0, 0),
 * tournés vers la droite. `e` : l'état (ANIM), `f` : le compteur d'animation.
 */
type Dessin = (p: Pinceau, e: number, f: number) => void;

const pasDe = (e: number, f: number) => (e === ANIM.COURT ? Math.floor(f / 5) % 4 : -1);
const attaque = (e: number) => e === ANIM.ATTAQUE;

export const DESSINS_OTTAWA: Partial<Record<number, Dessin>> = {
  // le hockeyeur : maillot rouge à bande noire et or, casque à visière, patins ; la crosse sur la glace, levée pour le lancer
  [G.HOCKEYEUR]: (p, e, f) => {
    const yt = humain(
      p,
      { peau: '#f0c8a0', haut: '#c8102e', bas: '#1a1a1a', chaussures: '#e8e8ee', carrure: 8 },
      { pas: pasDe(e, f), brasLeves: attaque(e) },
    );
    p(-4, yt + 8, 8, 1, '#1a1a1a'); // la bande du maillot
    p(-4, yt + 9, 8, 1, '#c8a040');
    p(-3, yt - 1, 6, 3, '#1a1a1a'); // le casque
    p(2, yt + 1, 2, 1, '#9ad8f0'); // la visière
    p(-3, 0, 7, 1, '#c8c8d0'); // les lames des patins
    if (attaque(e)) {
      p(5, yt - 6, 1, 10, '#8a5a2a'); // la crosse levée
      p(5, yt - 7, 3, 1, '#1a1a1a');
    } else {
      p(5, yt + 9, 1, 9, '#8a5a2a'); // la crosse sur la glace
      p(5, -1, 4, 1, '#1a1a1a');
    }
  },
  // le castor : brun, les dents en avant, la queue plate qui claque ; en attaque, il brandit une bûche
  [G.CASTOR]: (p, e, f) => {
    const trot = e === ANIM.COURT && Math.floor(f / 4) % 2 === 0;
    p(-5, -7, 10, 6, '#7a4a26');
    p(4, -8, 4, 4, '#8a5a30');
    p(7, -7, 1, 1, '#111');
    p(8, -5, 1, 2, '#f2f2e0'); // les dents
    p(-11, trot ? -4 : -3, 6, 3, '#3a2a1e'); // la queue plate
    p(-10, trot ? -4 : -3, 1, 1, '#4a3a2a');
    p(-4, -1, 2, 1, '#5a3418');
    p(2, -1, 2, 1, '#5a3418');
    if (attaque(e)) p(4, -11, 6, 2, '#a8743a');
  },
  // la bernache du Canada : corps gris-brun, long cou noir, la jugulaire blanche ; elle bat des ailes, les replie pour piquer
  [G.BERNACHE]: (p, e, f) => {
    const bat = Math.floor(f / 4) % 2 === 0 && !attaque(e);
    p(-6, -6, 10, 4, '#8a7a66');
    p(-6, -3, 9, 1, '#e8e2d6'); // le ventre clair
    p(4, -10, 2, 5, '#1a1a1a'); // le cou
    p(5, -12, 4, 3, '#1a1a1a'); // la tête
    p(5, -11, 2, 1, '#f2f2f2'); // la jugulaire
    p(9, -11, 2, 1, '#2a2a2a'); // le bec
    p(-3, bat ? -11 : -5, 7, 2, '#6a5a48'); // l'aile
    p(-8, -6, 2, 2, '#1a1a1a'); // la queue
  },
  // le gardien de but : énorme, jambières blanches, masque à grille, bouclier et mitaine
  [G.GARDIEN]: (p, e, f) => {
    const yt = humain(
      p,
      { peau: '#f0c8a0', haut: '#c8102e', bas: '#f2f2f2', chaussures: '#e8e8ee', carrure: 11, jambes: 6 },
      { pas: pasDe(e, f), brasLeves: attaque(e) },
    );
    p(-5, -7, 4, 7, '#f2f2f2'); // les jambières
    p(1, -7, 4, 7, '#f2f2f2');
    p(-5, -4, 4, 1, '#c8102e');
    p(1, -4, 4, 1, '#c8102e');
    p(-3, yt - 1, 7, 6, '#f2f2f2'); // le masque
    for (const x of [-2, 0, 2]) p(x, yt + 1, 1, 3, '#5a5a62');
    p(5, yt + 8, 4, 6, '#1a1a1a'); // le bouclier
    p(-9, yt + 7, 4, 4, '#c8a040'); // la mitaine
    p(6, -1, 5, 1, '#1a1a1a'); // la palette de la crosse
  },
};
