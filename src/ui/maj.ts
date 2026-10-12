import { rechargeVersion } from '../version';

/** Le bandeau « nouvelle version disponible » : recharger, ou continuer avec la version ouverte. */
export function afficheNouvelleVersion(element: HTMLElement, derniere: string): void {
  element.replaceChildren();
  const texte = document.createElement('span');
  texte.textContent = `Nouvelle version disponible (v${derniere}).`;
  const recharger = document.createElement('button');
  recharger.type = 'button';
  recharger.textContent = 'Recharger';
  recharger.addEventListener('click', () => rechargeVersion(derniere));
  const plusTard = document.createElement('button');
  plusTard.type = 'button';
  plusTard.className = 'discret';
  plusTard.textContent = 'Plus tard';
  plusTard.addEventListener('click', () => (element.hidden = true));
  element.append(texte, recharger, plusTard);
  element.hidden = false;
}
