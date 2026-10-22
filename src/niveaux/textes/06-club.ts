import type { DefNiveau } from '../format';

export const CLUB: Omit<DefNiveau, 'carte'> = {
  id: 'club',
  titre: 'Le Club Infini',
  sousTitre: 'Niveau 10 — Le morceau qui ne finit jamais',
  theme: 'club',
  intro: [
    {
      qui: 'NARRATEUR',
      texte:
        'Le Club Infini. Le morceau qui y passe a commencé il y a onze ans. Il n’a toujours pas eu de refrain.',
    },
    { qui: 'JBG', texte: 'On grimpe, on débranche, on rentre.' },
    { qui: 'TOM', texte: 'Et après ?' },
    { qui: 'JBM', texte: 'Après, on fait un album.' },
  ],
  dialogues: {
    1: [
      { qui: 'NARRATEUR', texte: 'Les videurs sont costauds : il en faut, du rock, pour les faire tomber.' },
    ],
    2: [
      { qui: 'MAT', texte: 'J’entends une ligne de basse. Une VRAIE.' },
      { qui: 'JBT', texte: 'C’est toi qui joues, Mat.' },
    ],
    3: [
      { qui: 'DJ', texte: 'Approchez. Écoutez. Ce beat est parfait, parce qu’il ne change JAMAIS.' },
      { qui: 'JBM', texte: 'Le rock non plus ne change jamais !' },
      { qui: 'JBG', texte: '... attends, c’est pas un peu le même argument ?' },
      { qui: 'JBM', texte: 'TAIS-TOI ET JOUE. Cassez ses enceintes d’abord : elles le protègent !' },
    ],
  },
  outro: [
    { qui: 'DJ', texte: 'Vous... vous avez cassé mes platines.' },
    { qui: 'JBM', texte: 'Et toi, notre adolescence.' },
    {
      qui: 'DJ',
      texte:
        'Je m’appelle Sébastien. J’étais au collège avec vous. Vous m’avez viré des DKK en 4e parce que j’avais apporté un synthé.',
    },
    { qui: 'NARRATEUR', texte: 'Un long silence. Quelque part, un charley tourne encore dans le vide.' },
    { qui: 'JBT', texte: '... Ah oui. Seb.' },
    { qui: 'MAT', texte: 'Il jouait bien, Seb.' },
  ],
};
