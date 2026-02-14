import { state } from "../utilities/state.js";
import { showDialogue } from "../utilities/dialogue.js";
import { addToInventory } from "../utilities/inventory.js";
import { spawnPlayer, spawnRogue, setControls } from "../utilities/characters.js";
import { spawnGate } from "../utilities/objects.js";

export function loadLevel1(k) {
    k.scene("level1", () => {
        k.setGravity(0);
        
        k.add([
            k.text("LEVEL 1: THE WINNING BID", { size: 18, font: "'Press Start 2P'" }),
            k.pos(20, 20),
            k.color(220, 146, 0),
        ]);

        const player = spawnPlayer(k, 100, k.center().y);
        setControls(k, player);
        k.canvas.focus();
        spawnRogue(k, k.width() - 200, k.center().y);
        spawnGate(k, 400, 100, "has_console", "Requires GPT Console Opener to proceed.");   

        const chest = k.add([
            k.rect(40, 40),
            k.pos(k.center().x + 200, k.center().y),
            k.color(182, 104, 161), 
            k.area(),
            "tool-chest",
        ]);

        player.onCollide("sensor", () => {
            showDialogue(k, "ROGUE", "Welcome! You won the bid, but the quest continues.\nStay close if you want to hear more...", "intro_complete");
        });

        player.onCollideEnd("sensor", () => {
            k.destroyAll("dialogue-ui");
        });

        player.onCollide("tool-chest", (c) => {
            k.destroy(c);
            state.addTool("GPT Console Opener", "...");
            state.unlock("has_console"); // Unlock a global capability
            
            showDialogue(k, "SYSTEM", "You unlocked the GPT Console!");
        });
    });
}