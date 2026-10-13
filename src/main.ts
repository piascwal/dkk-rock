import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/700.css';
import '@fontsource/silkscreen/400.css';
import '@fontsource/silkscreen/700.css';
import './style.css';
import { App } from './app';

/** Point d'entrée : DKK : Rock Never Dies. */
const app = new App();
app.demarre();

// en développement, la console donne accès à l'application (window.dkk.partie...)
if (import.meta.env.DEV) Object.assign(window, { dkk: app });
