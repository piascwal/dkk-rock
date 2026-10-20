import { TUILE } from '../src/config';
import { Carte } from '../src/monde/carte';
import { T } from '../src/monde/tuiles';
import type { NiveauLu } from '../src/niveaux/format';

/**
 * Peut-on aller du départ à une case, sans rien détruire et sans saut contre
 * les murs ? Modèle prudent du héros (une case de large, deux de haut) :
 * marcher, tomber, sauter de 2 cases vers le haut et 3 de côté, grimper aux
 * échelles, prendre les tyroliennes.
 */
export function casesAccessibles(lu: NiveauLu, barriereOuverte = true): Set<string> {
  // la barrière du boss s'ouvre quand on le bat : elle ne coupe pas le chemin (sauf pour vérifier qu'on ne la contourne pas)
  const tuiles = Uint8Array.from(lu.tuiles, (t) => (barriereOuverte && t === T.BARRIERE ? T.VIDE : t));
  const c = new Carte(lu.largeur, lu.hauteur, tuiles, lu.fond);
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

  const vu = new Set<string>();
  const file: [number, number][] = [];
  const ajoute = (p: [number, number] | null) => {
    if (!p) return;
    const k = `${p[0]},${p[1]}`;
    if (vu.has(k)) return;
    vu.add(k);
    file.push(p);
  };
  ajoute(chute(lu.depart.tx, lu.depart.ty));

  while (file.length) {
    const [x, y] = file.shift()!;
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
