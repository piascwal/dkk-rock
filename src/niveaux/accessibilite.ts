import { TUILE } from '../config';
import { Carte } from '../monde/carte';
import { T } from '../monde/tuiles';
import type { NiveauLu } from './format';

/**
 * Peut-on aller du départ à une case, sans rien détruire et sans saut contre les murs ? Modèle prudent du héros (une case de
 * large, deux de haut) : marcher, tomber, sauter de 2 cases vers le haut et 3 de côté, grimper aux échelles, prendre les
 * tyroliennes. Le résultat : 1 pour chaque case (y × largeur + x) où les pieds du héros peuvent se poser.
 *
 * Il sert aux tests (on atteint la fin, chaque drapeau) et aux cachettes des cartes Sibylle (cachettes.ts) : une carte
 * cachée doit pouvoir se prendre sans rien casser.
 */
export function accessibles(lu: NiveauLu, barriereOuverte = true): Uint8Array {
  // la barrière du boss s'ouvre quand on le bat : elle ne coupe pas le chemin (sauf pour vérifier qu'on ne la contourne pas)
  const tuiles = Uint8Array.from(lu.tuiles, (t) => (barriereOuverte && t === T.BARRIERE ? T.VIDE : t));
  const c = new Carte(lu.largeur, lu.hauteur, tuiles, lu.fond);
  const L = lu.largeur;
  // le héros fait presque deux tuiles de haut : il lui faut la case et celle du dessus
  const libre = (x: number, y: number) => y >= 1 && !c.solide(x, y) && !c.solide(x, y - 1);
  const porte = (x: number, y: number) => {
    const p = c.props(x, y + 1);
    return p.solide || (p.echelle && !c.props(x, y).echelle);
  };
  const echelle = (x: number, y: number) => c.props(x, y).echelle;
  /** tombe depuis (x, y) jusqu'à un appui ; null si c'est le vide */
  const chute = (x: number, y: number): [number, number] | null => {
    for (let yy = y; yy < lu.hauteur; yy++) {
      if (!libre(x, yy)) return null;
      if (porte(x, yy) || echelle(x, yy)) return [x, yy];
    }
    return null;
  };

  const vu = new Uint8Array(L * lu.hauteur);
  const file: [number, number][] = [];
  const ajoute = (p: [number, number] | null) => {
    if (!p || p[0] < 0 || p[0] >= L) return;
    const k = p[1] * L + p[0];
    if (vu[k]) return;
    vu[k] = 1;
    file.push(p);
  };
  ajoute(chute(lu.depart.tx, lu.depart.ty));

  for (let tete = 0; tete < file.length; tete++) {
    const [x, y] = file[tete]!;
    for (const d of [-1, 1]) {
      // marcher (puis tomber)
      if (libre(x + d, y)) ajoute(chute(x + d, y));
      // sauter : monter (jusqu'à 2 cases), avancer (jusqu'à 3), retomber
      for (let h = 1; h <= 2; h++) {
        if (!libre(x, y - h)) break;
        for (let dx = 1; dx <= 3; dx++) {
          const tx = x + d * dx;
          if (!libre(tx, y - h)) break;
          ajoute(chute(tx, y - h));
        }
        ajoute(chute(x, y - h));
      }
    }
    if (echelle(x, y) || echelle(x, y + 1)) {
      if (libre(x, y - 1) && (echelle(x, y) || echelle(x, y - 1))) ajoute([x, y - 1]);
      if (libre(x, y + 1) && echelle(x, y + 1)) ajoute([x, y + 1]);
    }
    for (const t of lu.tyroliennes) {
      const ax = Math.floor(t.x1 / TUILE);
      const ay = Math.floor(t.y1 / TUILE);
      if (Math.abs(ax - x) <= 3 && y - ay >= 0 && y - ay <= 3) {
        const bx = Math.floor(t.x2 / TUILE);
        ajoute(chute(bx - 1, Math.floor(t.y2 / TUILE) + 1));
      }
    }
  }
  return vu;
}
