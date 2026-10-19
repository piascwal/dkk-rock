import type { DefNiveau } from '../format';

export const FERRY: Omit<DefNiveau, 'carte'> = {
  id: 'ferry',
  titre: 'La Traversée',
  sousTitre: 'Breizh 3 — Tenez le pont !',
  theme: 'port',
  intro: [
    {
      qui: 'NARRATEUR',
      texte:
        'Le ferry de Groix. Quarante-cinq minutes de traversée, et un équipage qui n’a pas fini de jouer sa note.',
    },
    { qui: 'JBM', texte: 'On embarque, on tient le pont, on arrive. Simple.' },
    { qui: 'JBG', texte: 'Rien n’est simple sur un bateau.' },
  ],
  dialogues: {
    1: [
      { qui: 'MAT', texte: 'Les marins montent à bord par les deux côtés. Et les goélands, par le ciel.' },
      { qui: 'TOM', texte: 'Restez groupés. Et surtout, ne tombez pas à l’eau.' },
    ],
  },
  outro: [
    { qui: 'JBM', texte: 'Groix en vue ! Tout le monde descend.' },
    { qui: 'MAT', texte: 'Même les goélands ont l’air soulagés.' },
  ],
};
