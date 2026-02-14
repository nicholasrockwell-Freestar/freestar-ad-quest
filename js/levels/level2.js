export function loadLevel2(k) {
    k.scene("level2", () => {
        // Start the player at the bottom door
        const player = spawnPlayer(k, k.center().x, k.height() - 100);
        
        // Place the Rogue at the top desk
        spawnRogue(k, k.center().x, 150);
        
        setControls(k, player);
    });
}