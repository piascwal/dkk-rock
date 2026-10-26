import { icone, type NomIcone } from './icones';

/** Un bouton à icône (et à texte, s'il y en a un) ; le titre s'affiche au survol et se lit au lecteur d'écran. */
export const bouton = (
  nom: NomIcone,
  texte: string,
  titre: string,
  action: () => void,
  classe = 'ed-bouton',
) => {
  const b = document.createElement('button');
  b.className = classe;
  b.append(icone(nom));
  if (texte) b.append(texte);
  b.title = titre;
  b.setAttribute('aria-label', titre);
  b.addEventListener('click', action);
  return b;
};
