import type { DefNiveau } from '../format';

export const GARAGE: Omit<DefNiveau, 'carte'> = {
  id: 'garage',
  titre: 'Le Garage',
  sousTitre: 'Niveau 1 — La reformation',
  theme: 'garage',
  intro: [
    {
      qui: 'NARRATEUR',
      texte:
        '2026. La musique n’est pas morte : elle a été remplacée. Par des boucles de quatre secondes, des voix passées au correcteur et des refrains de trois mots.',
    },
    {
      qui: 'NARRATEUR',
      texte:
        'Dans le garage des parents de JBT, cinq anciens du collège ressortent leurs instruments. Le groupe s’appelait les DKK. Personne ne se souvient de ce que ça voulait dire.',
    },
    {
      qui: 'NARRATEUR',
      texte:
        'Le Clos : la vieille maison de la famille de JBT, au bout d’un champ. C’est là que les DKK répétaient, avant.',
      image: 'scene-clos.png',
    },
    { qui: 'TOM', texte: 'Regardez ! Dérapage contrôlé !' },
    { qui: 'JBT', texte: 'Tom. C’est le terrain de mes parents.' },
    { qui: 'TOM', texte: 'Et la Renault 11 tient la route.' },
    { qui: 'MAT', texte: 'Elle n’a pas de ceinture, à l’arrière.' },
    {
      qui: 'NARRATEUR',
      texte:
        'Une dernière fois, ils se retrouvent au Clos pour élaborer le plan. Autour de la table, comme toujours : des spaghettis pour tout le monde.',
      image: 'scene-repas.png',
    },
    {
      qui: 'JBM',
      texte: 'Voilà le plan. On monte le son, on débranche le DJ, et on rentre pour le dessert.',
    },
    { qui: 'MAT', texte: 'Regardez bien : un spaghetti par le nez.' },
    { qui: 'TOM', texte: 'Mat ! Pas pendant que je mange !' },
    { qui: 'JBM', texte: 'Pfff ! Mon eau !' },
    {
      qui: 'NARRATEUR',
      texte:
        'La scène est restée célèbre chez les DKK. Personne n’en a gardé la vidéo. Personne ne l’a oubliée.',
    },
    { qui: 'JBM', texte: 'Le ventre plein, on peut sauver le rock.', image: '' },
    {
      qui: 'JBM',
      texte: 'Les gars. Ce matin, à la radio, j’ai entendu un morceau. Il n’y avait PAS DE GUITARE.',
    },
    { qui: 'JBG', texte: 'Pas de solo ?' },
    { qui: 'TOM', texte: 'Pas même une rythmique ?' },
    { qui: 'MAT', texte: '... et la basse ?' },
    { qui: 'JBM', texte: 'Mat. Personne n’entend jamais la basse.' },
    {
      qui: 'JBT',
      texte:
        'Il paraît qu’un certain DJ Boucle hypnotise le monde avec un beat qui ne s’arrête jamais. Il faut le débrancher.',
    },
    {
      qui: 'NARRATEUR',
      texte:
        'Fadatchi, le kiwi mascotte du groupe — dernier représentant d’une espèce totalement disparue, selon JBM, qui n’a jamais vérifié — hoche la tête.',
    },
    { qui: 'JBM', texte: 'Prenez vos instruments. On repart en tournée. ROCK NEVER DIES.' },
  ],
  dialogues: {
    1: [
      { qui: 'JBT', texte: 'Mes parents ont dit qu’on pouvait répéter ici si on ne touchait à rien.' },
      { qui: 'MAT', texte: 'Il y a déjà un trou dans le mur.' },
      { qui: 'JBT', texte: '... à rien à partir de maintenant.' },
    ],
    2: [
      { qui: 'TOM', texte: 'Des fêtards autotunés ! On vise avec TIR, on saute avec SAUT.' },
      { qui: 'JBG', texte: 'Et SPÉCIAL, c’est pour quand on a vraiment, vraiment raison. Donc souvent.' },
    ],
    3: [
      {
        qui: 'JBG',
        texte:
          'Une échelle. Ou alors on saute contre le mur, en poussant vers lui : de petits sauts qui montent, comme des pros.',
      },
    ],
    4: [
      { qui: 'MAT', texte: 'Une cage ! Encore un membre du groupe qui s’est fait enfermer.' },
      {
        qui: 'NARRATEUR',
        texte: 'Libérer un membre rapporte une vie, et vous prenez sa place. C’est la démocratie du rock.',
      },
    ],
    5: [{ qui: 'TOM', texte: 'Des caissons de basses. Tirez dessus. Les caissons de basses DÉTESTENT ça.' }],
    6: [
      { qui: 'JBT', texte: 'Une tyrolienne ! On saute dessus, elle nous porte. BAS pour lâcher.' },
      { qui: 'MAT', texte: 'Et si on tombe dans le ravin ?' },
      { qui: 'JBT', texte: 'On perd une vie. Et notre dignité, mais ça c’est déjà fait.' },
    ],
  },
  outro: [
    { qui: 'JBM', texte: 'Première date de la tournée : réussie.' },
    { qui: 'MAT', texte: 'Il n’y avait personne.' },
    {
      qui: 'JBM',
      texte: 'Réussie quand même. Direction les Alpes : un festival de « chill lounge » y endort les vaches.',
    },
  ],
};
