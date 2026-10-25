import type { DefNiveau } from '../format';

export const OTTAWA: Omit<DefNiveau, 'carte'> = {
  id: 'ottawa',
  titre: 'Ottawa',
  sousTitre: 'International Tour 3 — Canada, les trois mois de Mat',
  theme: 'ottawa',
  // les cages de la patinoire et le drapeau du Parlement sont placés par le générateur ; le reste du décor est semé au hasard
  semis: true,
  intro: [
    {
      qui: 'NARRATEUR',
      texte:
        'De New York, le groupe monte vers le nord. Plus au nord. Encore. Là où le thermomètre arrête de compter.',
    },
    {
      qui: 'MAT',
      texte: 'Ottawa ! Mes trois mois au Canada, et mes cours au Glebe Collegiate.',
    },
    { qui: 'JBT', texte: 'Il fait combien, là ?' },
    { qui: 'MAT', texte: 'Moins vingt. Ici, on dit que c’est « frais ».' },
  ],
  dialogues: {
    1: [
      { qui: 'JBM', texte: 'Un castor vient de me mordre la basket.' },
      { qui: 'MAT', texte: 'C’est l’emblème du pays. Il a le droit.' },
    ],
    2: [
      {
        qui: 'MAT',
        texte:
          'Le Glebe Collegiate ! Mon casier était au sous-sol. Pour ressortir, on descend : c’est par là.',
      },
      { qui: 'TOM', texte: 'Tu étais bon élève ?' },
      { qui: 'MAT', texte: 'J’étais surtout « le Français ». Ça suffisait.' },
    ],
    3: [
      {
        qui: 'MAT',
        texte: 'La patinoire sur la rivière gelée ! Ici, le hockey n’est pas un sport. C’est une religion.',
      },
      { qui: 'JBG', texte: 'On n’a pas de patins.' },
      { qui: 'MAT', texte: 'Alors on glisse. Et on évite la rondelle.' },
    ],
    4: [
      {
        qui: 'MAT',
        texte:
          'La colline du Parlement. Pour passer, il faut monter dans la tour de la Paix. Comme d’habitude.',
      },
      { qui: 'JBT', texte: 'Bonjour, hi !' },
      { qui: 'MAT', texte: 'Voilà. Tu es bilingue.' },
    ],
    5: [
      { qui: 'MAT', texte: 'Le marché By. Une poutine, une queue de castor, et on repart.' },
      { qui: 'JBM', texte: 'Une queue de… castor ?' },
      { qui: 'MAT', texte: 'C’est une pâtisserie. Rassure-toi.' },
    ],
  },
  outro: [
    { qui: 'MAT', texte: 'Merci, Ottawa ! Prochaine étape : Lund, le voyage étudiant de Tom.' },
    { qui: 'TOM', texte: 'Là-bas, il fait nuit à quinze heures. Mais il fait moins froid.' },
  ],
};
