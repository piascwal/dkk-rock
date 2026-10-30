import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/700.css';
import '@fontsource/silkscreen/400.css';
import '@fontsource/silkscreen/700.css';
import './style.css';
import { App } from './app';
import { installeAntiZoom } from './entrees/anti-zoom';
import { installeCurseurVoile } from './ui/curseur-voile';
import { choisitVersions } from './niveaux';
import { afficheBandeauEssai, modeEssai } from './ui/essai';

/** Point d'entrée : DKK : Rock Never Dies. */
// le mode essai d'abord : les niveaux refaits remplacent les originaux avant que rien ne soit lu
choisitVersions(modeEssai());
if (modeEssai()) afficheBandeauEssai();
const app = new App();
app.demarre();
installeCurseurVoile();
installeAntiZoom();
// le jeu a démarré : le filet de secours (public/secours.js) n'a rien à faire
document.documentElement.dataset.demarre = '1';

// en développement, la console donne accès à l'application (window.dkk.partie...)
if (import.meta.env.DEV) Object.assign(window, { dkk: app });
