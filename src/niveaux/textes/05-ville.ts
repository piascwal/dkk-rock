import type { DefNiveau } from '../format';

export const VILLE: Omit<DefNiveau, 'carte'> = {
  id: 'ville',
  titre: 'La Ville Autotunée',
  sousTitre: 'Niveau 8 — Même le métro chante juste',
  theme: 'ville',
  intro: [
    {
      qui: 'NARRATEUR',
      texte:
        'La ville. Chaque voix y passe au correcteur de hauteur. Même les annonces du métro chantent juste. C’est insupportable.',
    },
    { qui: 'JBM', texte: 'Je chante faux depuis 2006, et j’en suis fier.' },
    { qui: 'JBT', texte: 'On le sait, JBM. On le sait.' },
  ],
  dialogues: {
    1: [{ qui: 'JBG', texte: 'Les robots vocodeurs sont costauds. Visez longtemps, ou visez explosif.' }],
    2: [{ qui: 'TOM', texte: 'Une tyrolienne entre les toits ! Le rock, c’est aussi de l’escalade.' }],
    3: [
      {
        qui: 'RADIO',
        texte:
          '... le vocodeur fut inventé en 1939 pour transmettre la voix ; quarante ans plus tard, Kraftwerk en faisait de la musique...',
      },
      { qui: 'MAT', texte: 'Kraftwerk, c’était quand même vachement bien.' },
      { qui: 'JBM', texte: 'MAT !' },
    ],
    4: [{ qui: 'JBT', texte: 'La tour du Club Infini est droit devant. DJ Boucle est tout en haut.' }],
  },
  outro: [
    { qui: 'JBM', texte: 'Demain, on monte dans la tour.' },
    { qui: 'JBT', texte: 'Ce soir, on répète.' },
    {
      qui: 'NARRATEUR',
      texte: 'Ils répètent. Le voisin appelle la police. Ils le prennent comme un compliment.',
    },
  ],
};
