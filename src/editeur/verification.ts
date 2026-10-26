import { accessibles } from '../niveaux/accessibilite';
import { litNiveau, type DefNiveau } from '../niveaux/format';

/**
 * Le niveau de l'éditeur se lit-il, et va-t-on du départ au van sans rien casser ? (le même test que les niveaux du jeu) Une
 * carte de battle royale (sans van) n'a pas de fin : on dit combien de ses départs de joueurs sont placés.
 */
export function verifieNiveau(def: DefNiveau): { ok: boolean; message: string } {
  let lu;
  try {
    lu = litNiveau(def);
  } catch (e) {
    return { ok: false, message: (e as Error).message.replace(/^verification : /, '') };
  }
  if (lu.def.arene) {
    const n = (lu.def.departs ?? []).filter(Boolean).length;
    return {
      ok: true,
      message: `Carte de battle royale (sans van) : elle se lit ; ${n} départ${n > 1 ? 's' : ''} de joueur placé${n > 1 ? 's' : ''} sur 8${n < 8 ? ' (les autres apparaissent au hasard)' : ''}.`,
    };
  }
  // la fin : le van, ou DJ Boucle (le club finit sur lui)
  const cible = lu.boss.find((b) => b.lettre === 'Z') ?? lu.fin;
  if (!cible) return { ok: false, message: 'Il manque le van (F) : le niveau ne finit jamais.' };
  const a = accessibles(lu);
  const L = lu.largeur;
  const { tx, ty } = cible;
  const atteint = a.some(
    (v, k) => v === 1 && Math.abs((k % L) - tx) <= 2 && Math.abs(Math.floor(k / L) - ty) <= 1,
  );
  if (!atteint)
    return { ok: false, message: 'La fin n’est pas atteignable sans rien casser depuis le départ.' };
  const perdus = lu.drapeaux.filter((d) => !a[d.ty * L + d.tx]).length;
  return {
    ok: true,
    message: perdus
      ? `La fin est atteignable, mais ${perdus} drapeau(x) ne le sont pas.`
      : 'Parfait : on va du départ à la fin sans rien casser.',
  };
}
