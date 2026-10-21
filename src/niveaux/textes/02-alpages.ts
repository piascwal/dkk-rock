import type { DefNiveau } from '../format';

export const ALPAGES: Omit<DefNiveau, 'carte'> = {
  id: 'alpages',
  titre: 'Les Alpages Lounge',
  sousTitre: 'Niveau 4 — 2 000 mètres de chill',
  theme: 'montagne',
  intro: [
    {
      qui: 'NARRATEUR',
      texte:
        'Les Alpes. Air pur, vaches paisibles et festival de « chill deep tropical house » à 2 000 mètres.',
    },
    { qui: 'JBG', texte: 'Du lounge. De la musique d’ascenseur, mais sans l’ascenseur.' },
    { qui: 'MAT', texte: 'En vrai, la ligne de basse est pas mal.' },
    { qui: 'JBM', texte: 'MAT.' },
  ],
  dialogues: {
    1: [
      {
        qui: 'RADIO',
        texte:
          '... ici Radio Sommet, et voici trois heures de chill deep tropical house sans interruption...',
      },
      { qui: 'JBT', texte: 'Trois heures ? Notre plus long morceau fait 2 minutes 40.' },
      { qui: 'JBM', texte: 'Et il était trop long.' },
    ],
    2: [
      { qui: 'TOM', texte: 'Le chalet du DJ est là-haut. On grimpe !' },
      {
        qui: 'JBG',
        texte: 'Il y a une grotte sous nos pieds. Quelqu’un qui creuse bien pourrait y trouver un ami.',
      },
    ],
    3: [
      { qui: 'JBG', texte: 'Les vaches ont des casques audio.' },
      { qui: 'MAT', texte: 'Elles ont l’air heureuses.' },
      { qui: 'JBG', texte: 'C’est bien ça le plus inquiétant.' },
    ],
    4: [
      {
        qui: 'RADIO',
        texte:
          '... le yodel, chant des montagnes, permettait aux bergers de se parler d’une vallée à l’autre...',
      },
      { qui: 'JBM', texte: 'Le yodel, c’est juste un cri bien placé. Comme moi, en fait.' },
      { qui: 'TOM', texte: 'Toi, ton cri est rarement bien placé.' },
    ],
  },
  outro: [
    { qui: 'FADATCHI', texte: 'Kiwi.' },
    {
      qui: 'JBM',
      texte:
        'Fadatchi a raison. Direction Gréau, là-haut dans la neige : on dit qu’un yéti y mixe de la techno minimale depuis 1997.',
    },
  ],
};
