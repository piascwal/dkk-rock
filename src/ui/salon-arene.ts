import { MAX_JOUEURS } from '../config';
import { HEROS } from '../entites/heros';
import type { VueArene } from '../jeu/arene';
import { CASES_PAR_EQUIPE, equipeDeLaCase, NOMS_EQUIPES } from '../jeu/equipes';
import type { Partie } from '../jeu/partie';
import { COULEURS_EQUIPES, couleurDuSiege } from '../rendu/couleurs-arene';
import { el } from './elements';
import { nomArene } from './noms-arene';

/**
 * Le salon du battle royale, en cases : huit places (en équipes, quatre rouges et quatre bleues). On touche une case libre pour
 * s'y mettre (en équipes : changer de camp) ; l'hôte y ajoute un joueur de l'ordinateur (« + IA ») ou le retire (« ✕ »), et
 * choisit le mode : chacun pour soi, ou en équipes.
 */

export interface Salon {
  ar: VueArene;
  /** par siège : le joueur est-il là */
  presents: readonly boolean[];
  noms: readonly string[];
  siegeLocal: number;
  hote: boolean;
  /** la partie, chez l'hôte (pour l'IA et le mode) */
  partie: Partie | null;
  place(n: number): void;
  bouton(texte: string, action: () => void, principal?: boolean): HTMLButtonElement;
}

export function contenuSalon(s: Salon): HTMLElement[] {
  const { ar, hote, partie } = s;
  const mode = ar.equipes ? 'en équipes' : 'chacun pour soi';
  const ligneMode = hote
    ? s.bouton(`Mode : ${mode}`, () => partie?.arene?.changeMode(partie, !ar.equipes))
    : el('p', `Mode : ${mode}`, 'aide');
  const cases = Array.from({ length: MAX_JOUEURS }, (_, n) => caseDuSalon(s, n));
  if (!ar.equipes) {
    const grille = el('div', '', 'salon-grille');
    grille.append(...cases);
    return [ligneMode, grille];
  }
  const camps = el('div', '', 'salon-camps');
  for (const e of [0, 1]) {
    const camp = el('div', '', 'salon-camp');
    camp.style.setProperty('--couleur', COULEURS_EQUIPES[e]!);
    const grille = el('div', '', 'salon-grille-camp');
    grille.append(...cases.slice(e * CASES_PAR_EQUIPE, (e + 1) * CASES_PAR_EQUIPE));
    camp.append(el('div', `Équipe ${NOMS_EQUIPES[e]}`, 'salon-titre-camp'), grille);
    camps.append(camp);
  }
  return [ligneMode, camps];
}

/** Une case : son joueur (et, chez l'hôte, de quoi retirer un joueur de l'ordinateur), ou libre (s'y mettre, y ajouter une IA). */
function caseDuSalon(s: Salon, n: number): HTMLElement {
  const { ar, partie } = s;
  const siege = ar.places.findIndex((c, k) => c === n && s.presents[k]);
  const c = el('div', '', 'salon-case');
  if (siege >= 0) {
    c.style.setProperty('--couleur', couleurDuSiege(ar, siege));
    c.classList.toggle('moi', siege === s.siegeLocal);
    c.append(el('span', `${nomArene(s.noms, siege)}${siege === s.siegeLocal ? ' (vous)' : ''}`));
    if (s.hote && partie?.arene?.ia?.sieges.includes(siege)) {
      const retire = s.bouton('✕', () => partie.retireIA(siege));
      retire.setAttribute('aria-label', `Retirer ${nomArene(s.noms, siege)}`);
      c.append(retire);
    }
    return c;
  }
  c.classList.add('libre');
  if (ar.equipes) c.style.setProperty('--couleur', COULEURS_EQUIPES[equipeDeLaCase(n)]!);
  c.append(s.bouton('Venir', () => s.place(n)));
  if (s.hote)
    c.append(
      s.bouton('+ IA', () => {
        const ia = partie?.ajouteIA(Math.floor(Math.random() * HEROS.length)) ?? -1;
        if (ia >= 0) partie?.arene?.choisitPlace(ia, n);
      }),
    );
  return c;
}
