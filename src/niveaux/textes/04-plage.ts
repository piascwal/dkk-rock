import type { DefNiveau } from '../format';

export const PLAGE: Omit<DefNiveau, 'carte'> = {
  id: 'plage',
  titre: 'Les Plages Électroniques',
  sousTitre: 'Niveau 6 — À gauche, à droite',
  theme: 'plage',
  intro: [
    {
      qui: 'NARRATEUR',
      texte:
        'Cannes, la plage du Palais des Festivals : Les Plages Électroniques. On arrive à 14 heures, on repart à minuit et demi, sourd.',
    },
    {
      qui: 'JBT',
      texte: 'Le tube de l’été : une chorégraphie, trois accords et un refrain dans une langue inventée.',
    },
    { qui: 'TOM', texte: 'Trois accords ? Comme nous, en fait.' },
    { qui: 'JBM', texte: 'NOUS, c’est pas pareil.' },
  ],
  dialogues: {
    1: [
      {
        qui: 'NARRATEUR',
        texte: 'Attention aux danseurs du tube de l’été : ils explosent littéralement d’enthousiasme.',
      },
    ],
    2: [
      { qui: 'MAT', texte: 'Le sable s’effondre si on creuse dessous.' },
      { qui: 'JBG', texte: 'Merci Mat. Personne n’allait creuser.' },
      { qui: 'MAT', texte: 'Moi si.' },
    ],
    3: [
      {
        qui: 'RADIO',
        texte: '... reggae, cumbia, raï, kuduro : chaque été apporte ses rythmes venus d’ailleurs...',
      },
      { qui: 'TOM', texte: 'La cumbia, ça groove quand même vachement.' },
      { qui: 'JBM', texte: 'On n’écoute pas la radio pendant le travail.' },
    ],
  },
  outro: [
    { qui: 'JBG', texte: 'La plage est libérée.' },
    { qui: 'MAT', texte: 'Ça fait une heure que je fredonne le tube.' },
    { qui: 'JBM', texte: 'Personne n’a rien entendu. Direction la ville.' },
  ],
};
