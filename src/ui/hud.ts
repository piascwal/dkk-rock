import { QUARTS_PAR_COEUR } from '../config';
import { HEROS } from '../entites/heros';
import { armeRamassee } from '../entites/armes';
import { PHASES_MINI_JEUX } from '../jeu/mini-jeux';
import type { EtatVue } from '../jeu/vue';
import { animeCoeurs } from './hud-effets';
import { coeursEnQuarts, icone, iconeDeLArme, rangeeDIcones } from './icones-hud';
import { nomArene } from './noms-arene';

/** Le HUD (HTML) : un cartouche par joueur, les vies et le score, la barre du boss. Mis à jour seulement quand il change. */
export class Hud {
  private dernier = '';
  /** les points de vie de chacun à la dernière image (pour animer les cœurs qui changent) */
  private pvAvant: (number | null)[] = [];

  constructor(private readonly element: HTMLElement) {}

  maj(v: EtatVue, siegeLocal: number, noms: string[]): void {
    // pendant un mini-jeu (drift, plongeon), le chrono et le score sont dans le canvas : pas de HUD des héros
    this.element.hidden = PHASES_MINI_JEUX.has(v.phase);
    const ar = v.arene;
    const joueurs = v.joueurs
      .map((j, s) => {
        if (!j.present) return '';
        // en battle royale, à 8 : seulement son propre cartouche (les autres ont leur repère de couleur)
        if (ar && s !== siegeLocal) return '';
        const h = HEROS[j.membre]!;
        const arme = armeRamassee(j.arme);
        const nom = noms[s] && v.joueurs.filter((x) => x.present).length > 1 ? ` · ${noms[s]}` : '';
        return `<div class="hud-joueur${j.mort ? ' mort' : ''}" data-siege="${s}" style="--couleur:${h.couleur}">
          ${s === siegeLocal ? '▶ ' : ''}${ar ? echappe(nomArene(noms, s)) : `${h.nom}${echappe(nom)}`}
          <span class="coeurs" aria-label="${j.pv / QUARTS_PAR_COEUR} cœurs">${coeursEnQuarts(j.pv)}</span>
          <span class="etoiles">${rangeeDIcones(icone('mediator'), Math.min(6, j.speciaux))}</span>
          ${arme ? `<br>${rangeeDIcones(iconeDeLArme(j.arme), 1)} ${arme.nom} ×${j.munitions}` : ''}
        </div>`;
      })
      .join('');
    const boss =
      v.boss >= 0 ? `<div id="barre-boss"><div style="width:${Math.round(v.boss * 100)}%"></div></div>` : '';
    const html = `<div class="hud-joueurs">${joueurs}</div>
      <div class="hud-droite">${ar ? droiteArene(v, siegeLocal) : `${rangeeDIcones(icone('guitare'), 1)} × ${v.vies}<br>${v.score.toLocaleString('fr-FR')}`}</div>${boss}`;
    if (html !== this.dernier) {
      this.dernier = html;
      this.element.innerHTML = html;
    }
    v.joueurs.forEach((j, s) => {
      const avant = this.pvAvant[s];
      this.pvAvant[s] = j.present && !j.mort ? j.pv : null;
      const coeurs = this.element.querySelector<HTMLElement>(`[data-siege="${s}"] .coeurs`);
      if (avant != null && this.pvAvant[s] != null && coeurs) animeCoeurs(coeurs, avant, j.pv);
    });
  }
}

/** Échappe un texte venu d'ailleurs (pseudo d'un joueur distant) avant de le mettre dans du HTML. */
export const echappe = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** En battle royale, à droite : ses vies et ses éliminations, combien sont encore en lice, le temps de combat. */
function droiteArene(v: EtatVue, siege: number): string {
  const ar = v.arene!;
  const presents = v.joueurs.filter((j) => j.present).length;
  const enLice = ar.vies.filter((n, s) => n > 0 && v.joueurs[s]?.present).length;
  const temps =
    ar.etape === 'combat'
      ? ` · ${Math.floor(ar.minuteur / 60)}:${String(ar.minuteur % 60).padStart(2, '0')}`
      : '';
  return `${rangeeDIcones(icone('guitare'), 1)} × ${ar.vies[siege] ?? 0} · ${ar.eliminations[siege] ?? 0} élim.<br>${ar.etape === 'salon' ? 'Salon' : `En lice ${enLice}/${presents}`}${temps}`;
}
