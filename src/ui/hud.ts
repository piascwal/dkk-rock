import { HEROS } from '../entites/heros';
import { armeRamassee } from '../entites/armes';
import { PHASES_MINI_JEUX } from '../jeu/mini-jeux';
import type { EtatVue } from '../jeu/vue';
import { icone, iconeDeLArme, rangeeDIcones } from './icones-hud';

/** Le HUD (HTML) : un cartouche par joueur, les vies et le score, la barre du boss. Mis à jour seulement quand il change. */
export class Hud {
  private dernier = '';

  constructor(private readonly element: HTMLElement) {}

  maj(v: EtatVue, siegeLocal: number, noms: string[]): void {
    // pendant un mini-jeu (drift, plongeon), le chrono et le score sont dans le canvas : pas de HUD des héros
    this.element.hidden = PHASES_MINI_JEUX.has(v.phase);
    const joueurs = v.joueurs
      .map((j, s) => {
        if (!j.present) return '';
        const h = HEROS[j.membre]!;
        const arme = armeRamassee(j.arme);
        const nom = noms[s] && v.joueurs.filter((x) => x.present).length > 1 ? ` · ${noms[s]}` : '';
        return `<div class="hud-joueur${j.mort ? ' mort' : ''}" style="--couleur:${h.couleur}">
          ${s === siegeLocal ? '▶ ' : ''}${h.nom}${echappe(nom)}
          <span class="coeurs">${rangeeDIcones(icone('coeur'), j.pv)}</span>
          <span class="etoiles">${rangeeDIcones(icone('mediator'), Math.min(6, j.speciaux))}</span>
          ${arme ? `<br>${rangeeDIcones(iconeDeLArme(j.arme), 1)} ${arme.nom} ×${j.munitions}` : ''}
        </div>`;
      })
      .join('');
    const boss =
      v.boss >= 0 ? `<div id="barre-boss"><div style="width:${Math.round(v.boss * 100)}%"></div></div>` : '';
    const html = `<div class="hud-joueurs">${joueurs}</div>
      <div class="hud-droite">${rangeeDIcones(icone('guitare'), 1)} × ${v.vies}<br>${v.score.toLocaleString('fr-FR')}</div>${boss}`;
    if (html === this.dernier) return;
    this.dernier = html;
    this.element.innerHTML = html;
  }
}

/** Échappe un texte venu d'ailleurs (pseudo d'un joueur distant) avant de le mettre dans du HTML. */
export const echappe = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
