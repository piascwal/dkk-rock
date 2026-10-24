import { ANIM, G } from '../jeu/vue';
import { humain, type Pinceau } from './pinceau';

/**
 * Les gens de l'International Tour, dessinés en code en attendant leurs planches (voir entites/ennemis/locaux.ts) : pieds en (0, 0),
 * tournés vers la droite. `e` : l'état (ANIM), `f` : le compteur d'animation.
 */
type Dessin = (p: Pinceau, e: number, f: number) => void;

const pasDe = (e: number, f: number) => (e === ANIM.COURT ? Math.floor(f / 5) % 4 : -1);
const attaque = (e: number) => e === ANIM.ATTAQUE;

/** Un quadrupède (mouton, élan) : le corps, la tête devant, quatre pattes qui trottent. */
function quadrupede(
  p: Pinceau,
  e: number,
  f: number,
  t: { l: number; h: number; corps: string; tete: string; pattes: string; haut: number },
): number {
  const trot = e === ANIM.COURT && Math.floor(f / 4) % 2 === 0;
  const y = -t.haut - t.h;
  p(-t.l / 2, y, t.l, t.h, t.corps);
  for (const [dx, d] of [
    [-t.l / 2 + 1, trot],
    [-t.l / 2 + 3, !trot],
    [t.l / 2 - 4, trot],
    [t.l / 2 - 2, !trot],
  ] as const)
    p(dx, -t.haut, 1, t.haut - (d ? 1 : 0), t.pattes);
  p(t.l / 2 - 1, y - 2, 4, 4, t.tete);
  p(t.l / 2 + 2, y - 1, 1, 1, '#111');
  return y;
}

export const DESSINS_LOCAUX: Partial<Record<number, Dessin>> = {
  // Beauvais : le passager perdu, sa valise cabine aux mesures exactes, son plan de la ville
  [G.PASSAGER]: (p, e, f) => {
    const yt = humain(
      p,
      { peau: '#e8b890', haut: '#4a6aa8', bas: '#3a3a44', chaussures: '#e8e8e8' },
      { pas: pasDe(e, f), brasLeves: attaque(e) },
    );
    p(-7, -7, 4, 7, '#2a2a30'); // la valise à roulettes
    p(-6, -9, 2, 2, '#5a5a62');
    p(-3, yt - 1, 6, 2, '#c8a060'); // le chapeau de touriste
  },
  // Beauvais : le passager pressé, qui court avec son sac « priority »
  [G.PRESSE]: (p, e, f) => {
    const yt = humain(
      p,
      { peau: '#f0c8a0', haut: '#1a1a22', bas: '#2a2a30', chaussures: '#8a4a2a' },
      { pas: pasDe(e, f) },
    );
    p(-5, yt + 8, 4, 5, '#ffd23f'); // le sac jaune
    p(-2, yt + 6, 4, 1, '#d02a2a'); // la cravate
    p(2, yt + 1, 2, 1, '#8a8a90'); // le téléphone à l'oreille
  },
  // Beauvais : la gargouille de la cathédrale, ailes de pierre, gueule ouverte
  [G.GARGOUILLE]: (p, _e, f) => {
    const bat = Math.floor(f / 6) % 2 === 0;
    p(-5, -9, 10, 6, '#8a8678');
    p(3, -11, 5, 5, '#9a9686');
    p(6, -9, 3, 1, '#2a2a28'); // la gueule
    p(6, -11, 1, 1, '#ff4a2a'); // l'œil
    p(-9, bat ? -14 : -10, 5, 3, '#7a766a'); // les ailes
    p(-1, bat ? -15 : -11, 5, 3, '#7a766a');
    p(-7, -4, 2, 2, '#6a665a');
    p(2, -4, 2, 2, '#6a665a');
  },
  // Limerick : l'habitué du pub, casquette plate, pull vert, sa pinte de stout
  [G.HABITUE]: (p, e, f) => {
    const yt = humain(
      p,
      { peau: '#f0b8a0', haut: '#2a7a3a', bas: '#4a4038', chaussures: '#2a1a12' },
      { pas: pasDe(e, f), brasLeves: attaque(e) },
    );
    p(-4, yt - 1, 8, 2, '#5a5040'); // la casquette plate
    p(2, yt, 3, 1, '#5a5040');
    p(-3, yt + 4, 6, 1, '#c86a3a'); // la barbe rousse
    p(4, yt + 8, 3, 4, '#1a1410'); // la pinte
    p(4, yt + 7, 3, 1, '#f2ead8');
  },
  // Limerick : le mouton, laine blanche, tête noire
  [G.MOUTON]: (p, e, f) => {
    const y = quadrupede(p, e, f, {
      l: 11,
      h: 6,
      corps: '#f2f0e6',
      tete: '#1a1a1a',
      pattes: '#1a1a1a',
      haut: 4,
    });
    p(-4, y - 1, 7, 1, '#ffffff'); // la laine qui frise
    p(-5, y + 2, 1, 2, '#e0ded2');
  },
  // Limerick : le pilier du Munster, maillot rouge, short blanc, oreilles en chou-fleur
  [G.PILIER]: (p, e, f) => {
    const yt = humain(
      p,
      { peau: '#f0b8a0', haut: '#c8102e', bas: '#f2f2f2', chaussures: '#1a1a1a', carrure: 10, jambes: 6 },
      { pas: pasDe(e, f), brasLeves: attaque(e) },
    );
    p(-4, yt, 1, 2, '#e09880'); // les oreilles
    p(3, yt, 1, 2, '#e09880');
    p(-5, yt + 7, 10, 1, '#1a1a1a'); // le col
  },
  // Lund : l'étudiant en salopette bleue de sa nation étudiante, écussons cousus
  [G.ETUDIANT]: (p, e, f) => {
    const salopette = '#3fa7f2';
    const yt = humain(
      p,
      { peau: '#f6d6b8', haut: '#f2f2f2', bas: salopette, chaussures: '#1a1a22' },
      { pas: pasDe(e, f), brasLeves: attaque(e) },
    );
    p(-3, yt + 6, 6, 6, salopette); // le plastron
    p(-2, yt + 8, 2, 2, '#ffd23f'); // un écusson
    p(-3, yt - 1, 6, 2, '#e8d8a0'); // les cheveux blonds
  },
  // Lund : le cycliste, sur son vélo hollandais, il sonne
  [G.CYCLISTE]: (p, e, f) => {
    const roule = Math.floor(f / 3) % 2;
    p(-6, -4, 4, 4, '#1a1a22');
    p(3, -4, 4, 4, '#1a1a22');
    p(-5, -3, 2, 2, roule ? '#8a8a90' : '#c8c8d0');
    p(4, -3, 2, 2, roule ? '#c8c8d0' : '#8a8a90');
    p(-4, -6, 9, 1, '#3fa7f2'); // le cadre
    p(4, -10, 1, 5, '#3fa7f2');
    p(3, -11, 3, 1, '#1a1a22'); // le guidon
    humain(
      p,
      { peau: '#f6d6b8', haut: '#e8e0c8', bas: '#3a4a6a', chaussures: '#1a1a22', jambes: 3 },
      { pas: e === ANIM.COURT ? Math.floor(f / 3) % 4 : -1 },
    );
    if (Math.floor(f / 10) % 3 === 0) p(6, -12, 2, 2, '#ffd23f'); // la sonnette
  },
  // Lund : l'élan, grand, brun, ses bois en palmes
  [G.ELAN]: (p, e, f) => {
    const y = quadrupede(p, e, f, {
      l: 15,
      h: 8,
      corps: '#5a3a22',
      tete: '#4a2e1a',
      pattes: '#3a2414',
      haut: 8,
    });
    p(6, y - 6, 1, 4, '#c8b080'); // les bois
    p(4, y - 7, 5, 1, '#c8b080');
    p(9, y - 6, 1, 4, '#c8b080');
    p(8, y - 8, 4, 1, '#c8b080');
    p(9, y + 2, 2, 2, '#3a2414'); // la clochette sous le menton
  },
  // New York : le trader, costume, bretelles, deux téléphones
  [G.TRADER]: (p, e, f) => {
    const yt = humain(
      p,
      { peau: '#f0c8a0', haut: '#2a3a5a', bas: '#2a3a5a', chaussures: '#1a1a1a' },
      { pas: pasDe(e, f), brasLeves: attaque(e) },
    );
    p(-1, yt + 6, 2, 5, '#d02a2a'); // la cravate rouge
    p(-3, yt - 1, 6, 2, '#2a1a10'); // les cheveux gominés
    p(4, yt + 2, 2, 3, '#1a1a1a'); // le téléphone
    if (attaque(e)) p(-6, yt - 4, 2, 3, '#1a1a1a'); // le second, brandi
  },
  // New York : le rat, qui traîne sa part de pizza plus grande que lui
  [G.RAT]: (p, e, f) => {
    const trot = e === ANIM.COURT && Math.floor(f / 3) % 2 === 0;
    p(-5, -4, 8, 3, '#6a6460');
    p(3, -4, 3, 2, '#7a7470');
    p(5, -3, 1, 1, '#ff9aa8'); // le museau
    p(4, -4, 1, 1, '#111');
    p(-9, -2, 4, 1, '#c89a9a'); // la queue
    p(-4, -1, 1, 1, '#4a4440');
    p(trot ? 0 : 1, -1, 1, 1, '#4a4440');
    p(4, -8, 5, 4, '#f0c060'); // la part de pizza
    p(5, -7, 1, 1, '#c8302a');
    p(7, -6, 1, 1, '#c8302a');
  },
  // New York : le pigeon gris, gorge irisée, il bat des ailes
  [G.PIGEON]: (p, _e, f) => {
    const bat = Math.floor(f / 4) % 2 === 0;
    p(-5, -6, 9, 4, '#8a8e9a');
    p(3, -8, 3, 3, '#6a6e7a');
    p(3, -6, 2, 1, '#5ab08a'); // la gorge irisée
    p(6, -7, 1, 1, '#e8a85a');
    p(-3, bat ? -10 : -5, 6, 2, '#6a6e7a');
    p(-7, -5, 2, 1, '#5a5e6a');
  },
  // Marseille : le supporter de l'OM, maillot blanc et bleu ciel, écharpe, fumigène quand il chante
  [G.SUPPORTER]: (p, e, f) => {
    const yt = humain(
      p,
      { peau: '#d8a070', haut: '#f2f2f2', bas: '#2a4a8a', chaussures: '#f2f2f2' },
      { pas: pasDe(e, f), brasLeves: attaque(e) },
    );
    p(-3, yt + 6, 6, 1, '#3fb0e8'); // la bande bleu ciel
    p(-4, yt + 5, 8, 1, '#3fb0e8'); // l'écharpe
    p(-3, yt - 1, 6, 1, '#1a1a1a');
    if (attaque(e)) {
      p(4, yt - 6, 1, 4, '#5a5a5a');
      p(3, yt - 8, 3, 2, Math.floor(f / 3) % 2 ? '#ff4a2a' : '#ffd23f');
    }
  },
  // Marseille : le livreur en scooter, casque sur la tête, sac isotherme
  [G.SCOOTER]: (p, e, f) => {
    p(-6, -3, 3, 3, '#1a1a22');
    p(4, -3, 3, 3, '#1a1a22');
    p(-5, -6, 11, 3, '#e8e8ee'); // la carrosserie
    p(5, -10, 1, 5, '#8a8a90');
    p(4, -11, 3, 1, '#1a1a22');
    humain(
      p,
      { peau: '#c88a5a', haut: '#3a3a44', bas: '#2a2a30', chaussures: '#1a1a22', jambes: 3 },
      { pas: e === ANIM.COURT ? Math.floor(f / 3) % 4 : -1 },
    );
    p(-3, -18, 6, 3, '#d02a2a'); // le casque
    p(-8, -14, 5, 5, '#3fb0a8'); // le sac isotherme
  },
  // Marseille : le bouliste, casquette, marcel, une boule dans chaque main
  [G.BOULISTE]: (p, e, f) => {
    const yt = humain(
      p,
      { peau: '#c88a5a', haut: '#f2f2f2', bas: '#5a4a3a', chaussures: '#3a2a1a', carrure: 8 },
      { pas: pasDe(e, f), brasLeves: attaque(e) },
    );
    p(-4, yt - 1, 8, 2, '#2a4a8a'); // la casquette
    p(2, yt, 3, 1, '#2a4a8a');
    p(-3, yt + 4, 6, 1, '#5a5a5a'); // la moustache
    p(4, yt + 10, 3, 3, '#8a8e96'); // la boule
  },
};
