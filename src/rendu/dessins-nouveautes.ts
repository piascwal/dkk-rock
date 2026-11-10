import { ANIM, G } from '../jeu/vue';
import { humain, type Pinceau } from './pinceau';

/**
 * Les nouveautés qu'on découvre de niveau en niveau (voir jeu/nouveautes.ts), dessinées en code en attendant leurs images : le
 * porteur de pancarte, le sonneur d'alarme, la grosse caisse trampoline, la bonbonne de fumée et la sirène.
 */
type Dessin = (p: Pinceau, e: number, f: number) => void;

const pasDe = (e: number, f: number) => (e === ANIM.COURT ? Math.floor(f / 5) % 4 : -1);

export const DESSINS_ENNEMIS_NOUVEAUX: Partial<Record<number, Dessin>> = {
  // le porteur de pancarte : costaud, polo rose, casquette ; devant lui, une grande pancarte « NON AU ROCK » qui le couvre
  [G.PANCARTE]: (p, e, f) => {
    const yt = humain(
      p,
      { peau: '#e0b088', haut: '#e8607a', bas: '#2a2a3a', chaussures: '#f0f0f0', carrure: 7 },
      { pas: pasDe(e, f) },
    );
    p(-4, yt - 1, 8, 2, '#2a2a3a'); // la casquette
    p(2, yt, 3, 1, '#2a2a3a');
    // le manche, puis le panneau, tenu devant lui (à droite : il regarde à droite)
    p(6, yt + 4, 1, 14, '#8a5a2b');
    p(3, yt - 4, 8, 13, '#1a1018');
    p(4, yt - 3, 6, 11, '#f5ecd6');
    p(5, yt - 1, 4, 1, '#c1121f');
    p(5, yt + 1, 4, 1, '#c1121f');
    p(5, yt + 3, 3, 1, '#c1121f');
    // la note de musique barrée
    p(5, yt + 5, 2, 2, '#1a1018');
    p(8, yt + 5, 1, 2, '#c1121f');
  },
  // le sonneur d'alarme : gilet jaune fluo, casquette rouge, un sifflet ; en alerte, il lève les bras
  [G.SONNEUR]: (p, e, f) => {
    const yt = humain(
      p,
      { peau: '#d8a078', haut: '#e8e020', bas: '#3a3a44', chaussures: '#222' },
      { pas: pasDe(e, f), brasLeves: e === ANIM.ALERTE || (e === ANIM.COURT && Math.floor(f / 8) % 2 === 0) },
    );
    p(-3, yt + 9, 6, 1, '#c8c8d0'); // la bande réfléchissante
    p(-3, yt - 1, 7, 2, '#c1121f'); // la casquette
    p(3, yt, 2, 1, '#c1121f');
    p(3, yt + 4, 2, 1, '#c8c8d0'); // le sifflet
  },
};

export const DESSINS_OBJETS_NOUVEAUX: Partial<Record<number, Dessin>> = {
  // la grosse caisse couchée, la peau vers le haut : `e` = 1 quand on vient de rebondir (la peau est enfoncée)
  [G.TREMPLIN]: (p, e) => {
    p(-10, -7, 20, 7, '#3b2a1e');
    p(-10, -7, 20, 1, '#c9a23a'); // le cercle
    p(-10, -1, 20, 1, '#c9a23a');
    for (const x of [-8, -3, 2, 7]) p(x, -6, 1, 5, '#8a96a3'); // les tirants
    // la peau
    if (e) {
      p(-9, -8, 3, 1, '#f5ecd6');
      p(6, -8, 3, 1, '#f5ecd6');
      p(-6, -7, 12, 1, '#d8ccb0');
    } else {
      p(-9, -9, 18, 2, '#f5ecd6');
      p(-4, -9, 8, 1, '#ffd23f'); // le logo
    }
  },
  // la bonbonne de fumée : `e` 0 posée, 1 elle siffle (elle tremble), 2 en vol de côté (couchée, nez devant), 3 droit en l'air
  [G.BONBONNE]: (p, e, f) => {
    const corps = (q: Pinceau) => {
      q(-3, -12, 6, 12, '#c8322a');
      q(-3, -12, 2, 12, '#e8605a');
      q(-3, -7, 6, 2, '#f5ecd6');
      q(-2, -14, 4, 2, '#8a96a3');
      q(-1, -15, 2, 1, '#5d6b73');
    };
    if (e === 2) {
      // couchée : (x, y) → (-y, x), la valve en avant ; la flamme derrière
      corps((x, y, w, h, c) => p(-y - h - 6, x - 6, h, w, c));
      p(-10 - (f % 2), -8, 4, 4, '#ffd23f');
      p(-13 - (f % 3), -7, 3, 2, '#ff9b2f');
      return;
    }
    const dx = e === 1 ? (f % 2 ? 1 : -1) : 0;
    corps((x, y, w, h, c) => p(x + dx, y, w, h, c));
    if (e === 1) p(-1 + dx, -18, 2, 3, '#e8e8f0'); // le sifflement
    if (e === 3) {
      p(-2, 0, 4, 4, '#ffd23f');
      p(-1, 4, 2, 3, '#ff9b2f');
    }
  },
  // la sirène sur son poteau : `e` 0 en veille, 1 elle hurle (le gyrophare tourne), 2 éteinte après avoir sonné
  [G.SIRENE]: (p, e, f) => {
    p(-1, -16, 2, 16, '#5d6b73');
    p(-3, -1, 6, 1, '#46525a');
    p(-3, -17, 6, 2, '#2a2a3a');
    const allume = e === 1 && Math.floor(f / 4) % 2 === 0;
    p(-3, -22, 6, 5, e === 2 ? '#4a2a2a' : allume ? '#ff4040' : '#c1121f');
    p(-2, -21, 2, 2, e === 2 ? '#5a3a3a' : allume ? '#ffd0d0' : '#e85050');
    if (e === 1) {
      // les ondes, d'un côté puis de l'autre
      const cote = Math.floor(f / 8) % 2 ? 1 : -1;
      p(cote * 5 - 1, -21, 1, 3, '#ff8080');
      p(cote * 7 - 1, -22, 1, 5, '#ff8080');
    }
  },
};
