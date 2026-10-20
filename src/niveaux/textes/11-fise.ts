import type { DefNiveau } from '../format';

export const FISE: Omit<DefNiveau, 'carte'> = {
  id: 'fise',
  titre: 'Le FISE',
  sousTitre: 'Montpellier — Le rendez-vous obligatoire',
  theme: 'fise',
  intro: [
    {
      qui: 'NARRATEUR',
      image: 'logo-fise.png',
      texte:
        'Retour sur le continent, plein sud. Montpellier, mi-mai, plein soleil : le FISE, sur les berges du Lez, de l’Hôtel de Ville à l’Hôtel de Région.',
    },
    { qui: 'MAT', texte: 'Le rendez-vous obligatoire. On ne le rate jamais. JAMAIS.' },
    { qui: 'JBT', texte: 'Des sports extrêmes. Pas du sport extrême. Il insiste beaucoup sur le pluriel.' },
    {
      qui: 'MAT',
      texte:
        'Parce qu’il y en a plein ! BMX, skate, roller, trottinette, breaking… Et le tram s’arrête juste devant.',
    },
  ],
  dialogues: {
    1: [
      {
        qui: 'NARRATEUR',
        texte:
          'L’entrée du festival, au pied de l’Hôtel de Ville : un grand cube de verre bleu posé au bord du Lez.',
      },
      { qui: 'TOM', texte: 'Même la mairie s’est mise en couleurs.' },
    ],
    2: [
      { qui: 'JBG', texte: 'Les food trucks, à l’ombre des platanes. Enfin un peu de fraîcheur.' },
      { qui: 'JBM', texte: 'Et les pissotières. Vingt minutes de queue. Le vrai sport extrême du FISE.' },
    ],
    3: [
      {
        qui: 'MAT',
        texte: 'Le park en bois ! Tu descends, tu prends de la vitesse sur le plat, tu remontes en face.',
      },
      { qui: 'JBT', texte: 'Moi, je descends. Pour la remontée, on verra.' },
    ],
    4: [
      {
        qui: 'NARRATEUR',
        texte: 'La scène de breaking, au bord de l’eau. Les b-boys ne cèdent pas un mètre de leur cercle.',
      },
      { qui: 'JBM', texte: 'Un battle ? On a une guitare. Ça compte ?' },
    ],
    5: [
      { qui: 'TOM', texte: 'Le flat BMX : ils tournent sur une roue, sans jamais poser le pied.' },
      { qui: 'JBG', texte: 'Moi aussi je tourne en rond. Mais personne n’applaudit.' },
    ],
    6: [
      {
        qui: 'RADIO',
        texte:
          'Radio FM, en direct des berges du Lez : trente degrés à l’ombre, et le big air vient d’ouvrir.',
      },
      { qui: 'JBG', texte: 'La tour, le bac à mousse… Je prends la tyrolienne. Comme d’habitude.' },
    ],
    7: [
      {
        qui: 'NARRATEUR',
        texte:
          'Le village des marques, face à l’Arbre Blanc : ses balcons sortent de partout, comme des branches.',
      },
      { qui: 'MAT', texte: 'Un jour, j’habiterai là. Avec vue sur le FISE.' },
    ],
    8: [
      {
        qui: 'NARRATEUR',
        texte:
          'La main stage, devant l’Hôtel de Région. Le Champion attend, et toute la berge d’en face regarde.',
      },
      { qui: 'MAT', texte: 'On a une démo à faire.' },
    ],
  },
  outro: [
    {
      qui: 'NARRATEUR',
      texte: 'Le contest s’achève. Toute la berge d’en face scande un nom : celui du groupe.',
    },
    { qui: 'MAT', texte: 'L’an prochain, je m’inscris en trottinette.' },
    { qui: 'TOM', texte: 'Il dit ça tous les ans.' },
  ],
};
