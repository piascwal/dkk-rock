import type { DefNiveau } from '../format';

export const FISE: Omit<DefNiveau, 'carte'> = {
  id: 'fise',
  titre: 'Le FISE',
  sousTitre: 'Montpellier — Le rendez-vous obligatoire',
  theme: 'fise',
  intro: [
    {
      qui: 'NARRATEUR',
      texte:
        'Retour sur le continent, plein sud. Montpellier, les berges du Lez : le FISE, le Festival International des Sports Extrêmes.',
    },
    { qui: 'MAT', texte: 'Le rendez-vous obligatoire. On ne le rate jamais. JAMAIS.' },
    { qui: 'JBT', texte: 'Des sports extrêmes. Pas du sport extrême. Il insiste beaucoup sur le pluriel.' },
    {
      qui: 'MAT',
      texte: 'Parce qu’il y en a plein ! Skate, BMX, trottinette, roller, wake… Je veux tout voir.',
    },
  ],
  dialogues: {
    1: [
      {
        qui: 'NARRATEUR',
        texte:
          'L’entrée du festival. Les riders sont chez eux, et ils n’aiment pas qu’on coupe leurs lignes.',
      },
      { qui: 'MAT', texte: 'On ne coupe rien, on passe. Avec style.' },
    ],
    2: [
      {
        qui: 'TOM',
        texte: 'La tour du big air. Ils s’élancent de là-haut et atterrissent dans le bac à mousse.',
      },
      { qui: 'JBG', texte: 'La tyrolienne, c’est pareil, mais assis. Je prends la tyrolienne.' },
    ],
    3: [
      {
        qui: 'RADIO',
        texte: 'Radio FM, en direct du FISE : des drones filment tout. Souriez, vous êtes en ralenti.',
      },
      { qui: 'JBM', texte: 'Le ralenti, c’est mon tempo naturel.' },
    ],
    4: [
      {
        qui: 'NARRATEUR',
        texte: 'La finale. Les meilleurs riders du monde, et quatre rockers qui n’ont rien à faire là.',
      },
      { qui: 'MAT', texte: 'Si. On a une démo à faire.' },
    ],
  },
  outro: [
    { qui: 'NARRATEUR', texte: 'Le contest s’achève. Le public scande un nom : celui du groupe.' },
    { qui: 'MAT', texte: 'L’an prochain, je m’inscris en trottinette.' },
    { qui: 'TOM', texte: 'Il dit ça tous les ans.' },
  ],
};
