import { FORCE_VOILE_MAX, regleVoile, reglageVoile } from '../rendu/feuilles-images';

/**
 * Pour régler à l'œil le voile du plan de fond (les sprites du décor, teintés de la couleur du lointain) :
 *   ?voile=0.45  fixe la force au lancement ;
 *   ?curseur     affiche en plus un curseur en haut de l'écran, qui agit en direct (sans recharger).
 * Une fois la bonne valeur trouvée, on la reporte dans `reglageVoile.force` (rendu/feuilles-images.ts).
 */
export function installeCurseurVoile(): void {
  const params = new URLSearchParams(window.location.search);
  const fixee = Number(params.get('voile'));
  if (params.has('voile') && Number.isFinite(fixee)) regleVoile(fixee);
  if (!params.has('curseur')) return;

  const boite = document.createElement('label');
  Object.assign(boite.style, {
    position: 'fixed',
    top: '4px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '50',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    padding: '4px 10px',
    background: 'rgba(0,0,0,0.65)',
    color: '#fff',
    font: '12px Silkscreen, monospace',
    borderRadius: '6px',
  });
  const valeur = document.createElement('span');
  const curseur = document.createElement('input');
  curseur.type = 'range';
  curseur.min = '0';
  curseur.max = String(FORCE_VOILE_MAX);
  curseur.step = '0.02';
  curseur.value = String(reglageVoile.force);
  const affiche = () => (valeur.textContent = `voile ${reglageVoile.force.toFixed(2)}`);
  curseur.addEventListener('input', () => {
    regleVoile(Number(curseur.value));
    affiche();
  });
  affiche();
  boite.append(valeur, curseur);
  document.body.append(boite);
}
