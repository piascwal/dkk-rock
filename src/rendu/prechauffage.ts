import { TUILE } from '../config';
import type { EtatVue } from '../jeu/vue';
import type { Carte } from '../monde/carte';
import type { AtlasTuiles } from './atlas-tuiles';
import { prepareCase } from './dessin-tuiles';
import { zoneAGarder } from './blocs-tuiles';
import { niveauLu } from '../niveaux';

/**
 * Le préchauffage d'un niveau : ses tuiles (chaque variante, ses bords, sa paroi de fond) sont peintes d'avance, colonne par
 * colonne, pendant que le niveau commence (les cartes de l'histoire, les dialogues d'ouverture) ; en jeu, plus rien n'est à
 * peindre pour la première fois quand la caméra découvre un endroit : pas d'à-coup. Chaque image y passe un peu de temps (plus
 * avant que le jeu ne démarre, très peu ensuite).
 */
/**
 * Le niveau est-il prêt à se montrer ? Tout est préchauffé, et le jeu dessiné dessous (sous le drap du van) tourne sans à-coup
 * depuis un moment : les blocs de tuiles, les images des personnages sont prêts. Le van attend ce signal pour repartir (à
 * l'essai, voir transition-van.ts).
 */
export const etatNiveau = { pret: false };
/** Tant d'images fluides d'affilée (moins de 25 ms chacune), une fois tout préchauffé. */
const IMAGES_FLUIDES = 20;

export class Prechauffage {
  private fluides = 0;
  private avant = 0;

  private carte: Carte | null = null;
  private atlas: AtlasTuiles | null = null;
  /** la première colonne peinte (un peu avant la caméra : on reprend peut-être à un drapeau), et combien le sont */
  private debut = 0;
  private faites = 0;

  /** À chaque image : dix millisecondes avant que le jeu ne démarre (l'histoire, les dialogues), une seule ensuite. */
  maj(vue: EtatVue, carte: Carte, atlas: AtlasTuiles, siege: number): void {
    // on part un peu avant le héros (on reprend peut-être à un drapeau), puis vers la droite
    const heros = vue.joueurs[siege] ?? vue.joueurs.find((j) => j.present);
    this.commence(carte, atlas, Math.floor((heros?.x ?? 0) / TUILE) - 20);
    this.avance(vue.phase === 'jeu' ? 1 : 10);
    // la zone du dernier drapeau passé reste peinte : on y réapparaît après une mort (voir blocs-tuiles.ts)
    [zoneAGarder.x, zoneAGarder.y] = [-1, -1];
    for (const d of niveauLu(vue.niveau).drapeaux)
      if (heros && d.x <= heros.x && d.x > zoneAGarder.x) [zoneAGarder.x, zoneAGarder.y] = [d.x, d.y];
    const maintenant = performance.now();
    this.fluides = this.fini && maintenant - this.avant < 25 ? this.fluides + 1 : 0;
    this.avant = maintenant;
    etatNiveau.pret = this.fluides >= IMAGES_FLUIDES;
  }

  /** Un nouveau niveau : on repart de la colonne `depuis` (celle de la caméra), vers la droite, puis le début du niveau. */
  commence(carte: Carte, atlas: AtlasTuiles, depuis: number): void {
    if (carte === this.carte && atlas === this.atlas) return;
    [this.carte, this.atlas, this.faites] = [carte, atlas, 0];
    this.fluides = 0;
    etatNiveau.pret = false;
    this.debut = Math.max(0, Math.min(carte.largeur - 1, depuis - 4));
  }

  /** Vrai quand tout le niveau est peint. */
  get fini(): boolean {
    return !this.carte || this.faites >= this.carte.largeur;
  }

  /**
   * Avance d'au plus `budget` millisecondes. Une colonne prend une fraction de milliseconde : même à une milliseconde par image,
   * on va plus vite que le héros qui court, le préchauffage reste devant lui.
   */
  avance(budget: number): void {
    const { carte, atlas } = this;
    if (!carte || !atlas || this.fini) return;
    const fin = performance.now() + budget;
    while (this.faites < carte.largeur && performance.now() < fin) {
      const tx = (this.debut + this.faites) % carte.largeur;
      for (let ty = 0; ty < carte.hauteur; ty++) prepareCase(carte, atlas, tx, ty);
      this.faites++;
    }
  }
}
