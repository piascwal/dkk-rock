import type { DefNiveau } from '../format';

export const LUND: Omit<DefNiveau, 'carte'> = {
  id: 'lund',
  titre: 'Lund',
  sousTitre: 'International Tour 4 — Suède, le voyage étudiant de Tom',
  theme: 'lund',
  intro: [
    {
      qui: 'TOM',
      texte: 'Lund ! Mon voyage étudiant. J’y ai appris trois mots de suédois : fika, skål et tack.',
    },
    { qui: 'JBM', texte: 'Il fait nuit à quinze heures.' },
    { qui: 'TOM', texte: 'C’est l’heure de la fika. On ne parle pas de la nuit.' },
  ],
  dialogues: {
    1: [{ qui: 'TOM', texte: 'J’avais une salopette, moi aussi. Jaune. Elle sent encore la fête.' }],
    2: [
      { qui: 'TOM', texte: 'Le géant de la crypte est resté coincé. Comme JBG dans les tyroliennes.' },
      { qui: 'JBG', texte: 'Une fois. C’était une fois.' },
    ],
    3: [
      { qui: 'MAT', texte: 'Une horloge qui joue le même air depuis 1424. Elle était là avant DJ Boucle.' },
    ],
    4: [{ qui: 'TOM', texte: 'La visite était obligatoire. Je l’ai faite trois fois. Il y avait un café.' }],
    5: [
      { qui: 'RADIO', texte: 'Un élan a été signalé sur la piste cyclable.' },
      { qui: 'TOM', texte: 'C’est la Suède, c’est normal. On ne le klaxonne pas.' },
    ],
  },
  outro: [
    { qui: 'TOM', texte: 'Tack så mycket, Lund ! Prochaine étape, la plus exotique de toutes : Beauvais.' },
    { qui: 'JBT', texte: 'J’y ai été prof de sport. Préparez vos baskets.' },
  ],
};
