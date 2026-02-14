// Correct paths based on your screenshot
import { downloadToolkit } from "./utilities/inventory.js"; 
import { loadIntro } from "./levels/intro.js";
import { loadLevel1 } from "./levels/level1.js";

const k = kaplay({
    global: true,
    touchToMouse: true,
    background: [68, 28, 85], // Astronomy Purple
});

// Assets
k.loadSprite("rogue", "assets/rogue.png");
k.loadSprite("prebidWinner", "assets/prebid_winner.png");
k.loadSprite("scroll", "assets/scroll.png", {
    slice9: { left: 12, right: 12, top: 12, bottom: 12 }
});

// Initialize Download Button
document.getElementById("download-btn").onclick = downloadToolkit;

// Load Scenes
loadIntro(k);
loadLevel1(k);

k.go("intro");