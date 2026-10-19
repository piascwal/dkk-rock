import type { DefNiveau } from '../format';

export const CIMES: Omit<DefNiveau, 'carte'> = {
  id: 'cimes',
  titre: 'Les Cimes Minimales',
  sousTitre: 'Niveau 3 — Boum. Tchk. Boum. Tchk.',
  theme: 'neige',
  // le niveau finit au sommet : le van en repart en décollant
  envol: true,
  intro: [
    {
      qui: 'NARRATEUR',
      texte:
        'Les cimes enneigées. Ici, depuis des années, des yétis écoutent le même kick. Boum. Tchk. Boum. Tchk.',
    },
    { qui: 'TOM', texte: 'Ils n’attaquent que sur le temps. Profitez du contretemps !' },
    { qui: 'JBT', texte: 'Le contretemps, c’est mon domaine.' },
    { qui: 'JBG', texte: 'Toi, tu joues TOUT à contretemps.' },
  ],
  dialogues: {
    1: [
      {
        qui: 'YETI',
        texte: 'Boum... tchk... Vous avez entendu cette variation ? Le charley a bougé d’un millimètre.',
      },
      { qui: 'JBM', texte: 'Non.' },
    ],
    2: [
      { qui: 'JBG', texte: 'La glace, ça glisse. Et la neige tombe si on tire en dessous.' },
      { qui: 'MAT', texte: 'Comme ma carrière.' },
    ],
    3: [
      {
        qui: 'RADIO',
        texte:
          'Flash spécial : la techno est née à Detroit dans les années 80, inventée par de jeunes musiciens qui rêvaient du futur...',
      },
      { qui: 'JBG', texte: '... c’est intéressant, en fait.' },
      {
        qui: 'JBM',
        texte: 'Coupe ça. On a un Yéti Alpha à débrancher. Il saute sur le premier temps : esquivez !',
      },
    ],
  },
  outro: [
    { qui: 'TOM', texte: 'Le Yéti Alpha nous a laissé une mixtape.' },
    { qui: 'JBT', texte: 'On l’écoute ?' },
    { qui: 'JBM', texte: '... juste pour savoir à quoi s’attendre.' },
    {
      qui: 'NARRATEUR',
      texte: 'Ils l’écoutent en boucle pendant tout le trajet vers la côte. Personne n’en parle.',
    },
  ],
};
