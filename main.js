
import { initNavbar } from './src/components/navbar.js';
import { initBootstrapTooltips } from './src/components/status/badgeStatus.js';
import './route.js'; 

initNavbar();

// Active les tooltips Bootstrap (les contenus dynamiques peuvent aussi les ré-initialiser).
initBootstrapTooltips(document);
