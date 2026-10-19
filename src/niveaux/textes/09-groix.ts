import type { DefNiveau } from '../format';

export const GROIX: Omit<DefNiveau, 'carte'> = {
  id: 'groix',
  titre: 'L’Île de Groix',
  sousTitre: 'Breizh 3 — La note du phare',
  theme: 'groix',
  intro: [
    {
      qui: 'NARRATEUR',
      texte:
        'Groix. Une île de falaises, de lande et de vent, à quarante-cinq minutes de ferry. Quarante-cinq longues minutes.',
    },
    { qui: 'JBG', texte: 'Je ne veux plus jamais voir un bateau.' },
    { qui: 'TOM', texte: 'Il faudra pourtant rentrer.' },
    { qui: 'JBG', texte: 'J’habiterai ici. Je deviendrai gardien de phare.' },
  ],
  dialogues: {
    1: [
      { qui: 'MAT', texte: 'Port-Tudy. Les marins nous attendent sur les pontons, l’accordéon en joue.' },
      { qui: 'JBT', texte: 'L’accordéon, en joue. J’ai bien entendu.' },
    ],
    2: [
      { qui: 'NARRATEUR', texte: 'La côte sauvage : des falaises à pic, et la mer qui frappe dessous.' },
      { qui: 'JBM', texte: 'On ne tombe pas. Le rock reste debout, surtout au bord des falaises.' },
    ],
    3: [
      { qui: 'TOM', texte: 'Le phare ! La note vient de là-haut.' },
      { qui: 'JBG', texte: 'Il me faut ce phare. Pour plus tard. Pour ma retraite.' },
    ],
    4: [
      { qui: 'RADIO', texte: 'Radio FM, en direct de l’île : la note faiblit ! Les binious hésitent !' },
      { qui: 'JBM', texte: 'Ils hésitent ? Alors on les aide à choisir. Une gamme complète, les gars !' },
    ],
  },
  outro: [
    { qui: 'NARRATEUR', texte: 'La note se brise. Les binious repartent, chacun sur un air différent.' },
    { qui: 'MAT', texte: 'Ça fait un peu cacophonie.' },
    { qui: 'JBM', texte: 'Ça s’appelle un fest-noz. Et c’est magnifique.' },
  ],
};
