import { TUILE } from '../config';
import { Carte } from '../monde/carte';
import { T } from '../monde/tuiles';
import type { NiveauLu } from './format';
import { chainesDeTyroliennes } from './tyroliennes';

/**
 * Peut-on aller du départ à une case, sans rien détruire et sans saut contre les murs ? Modèle prudent du héros (une case de
 * large, deux de haut) : marcher, tomber, sauter de 2 cases vers le haut et 3 de côté, grimper aux échelles, prendre les
 * tyroliennes. Le résultat : 1 pour chaque case (y × largeur + x) où les pieds du héros peuvent se poser.
 *
 * Il sert aux tests (on atteint la fin, chaque drapeau) et aux cachettes des cartes Sibylle (cachettes.ts) : une carte
 * cachée doit pouvoir se prendre sans rien casser.
 */
export function accessibles(lu: NiveauLu, barriereOuverte = true): Uint8Array {
  return Uint8Array.from(parcoursAcces(lu, barriereOuverte).dist, (d) => (d >= 0 ? 1 : 0));
}

/** Le parcours en largeur des cases accessibles : le nombre de gestes depuis les sources (-1 : inaccessible), et la case d'où l'on vient. */
export interface ParcoursAcces {
  dist: Int32Array;
  parent: Int32Array;
}

/**
 * Le parcours en largeur des cases accessibles (les mêmes règles qu'`accessibles`), depuis `sources` (des cases y × largeur + x ;
 * par défaut, le départ du niveau). `dist` est le nombre de gestes (un pas, un saut, un barreau...) qu'il faut pour y arriver : avec
 * pour sources le chemin direct, c'est la mesure du détour d'une case.
 */
export function parcoursAcces(
  lu: NiveauLu,
  barriereOuverte = true,
  sources?: readonly number[],
): ParcoursAcces {
  // la barrière du boss s'ouvre quand on le bat : elle ne coupe pas le chemin (sauf pour vérifier qu'on ne la contourne pas)
  const tuiles = Uint8Array.from(lu.tuiles, (t) => (barriereOuverte && t === T.BARRIERE ? T.VIDE : t));
  // un baril explosif est plein : on bute contre lui et on monte dessus, comme sur une caisse (le casser, c'est détruire)
  for (const b of lu.barils) tuiles[b.ty * lu.largeur + b.tx] = T.CAISSE;
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

  const dist = new Int32Array(L * lu.hauteur).fill(-1);
  const parent = new Int32Array(L * lu.hauteur).fill(-1);
  const file: [number, number][] = [];
  let de = -1;
  const chaines = chainesDeTyroliennes(lu.tyroliennes);
  const ajoute = (p: [number, number] | null) => {
    if (!p || p[0] < 0 || p[0] >= L) return;
    const k = p[1] * L + p[0];
    if (dist[k]! >= 0) return;
    dist[k] = de < 0 ? 0 : dist[de]! + 1;
    parent[k] = de;
    file.push(p);
  };
  if (sources)
    for (const k of sources) {
      dist[k] = 0;
      file.push([k % L, Math.floor(k / L)]);
    }
  else ajoute(chute(lu.depart.tx, lu.depart.ty));

  for (let tete = 0; tete < file.length; tete++) {
    const [x, y] = file[tete]!;
    de = y * L + x;
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
    // une tyrolienne se prend près de n'importe lequel de ses poteaux, dans un sens ou dans l'autre (le joystick choisit), et se
    // lâche à n'importe quel autre : on retombe à côté de lui
    for (const poteaux of chaines)
      for (const [i, p] of poteaux.entries()) {
        const [px, py] = [Math.floor(p.x / TUILE), Math.floor(p.y / TUILE)];
        if (Math.abs(px - x) > 3 || y - py < 0 || y - py > 3) continue;
        for (const [j, q] of poteaux.entries()) {
          if (j === i) continue;
          const qx = Math.floor(q.x / TUILE) + (j === 0 ? 1 : j === poteaux.length - 1 ? -1 : 0);
          ajoute(chute(qx, Math.floor(q.y / TUILE) + 1));
        }
      }
  }
  return { dist, parent };
}
