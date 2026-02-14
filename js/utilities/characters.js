export function spawnPlayer(k, posX, posY) {
    const player = k.add([
        k.sprite("prebidWinner"),
        // Use passed variables, or default to center if not provided
        k.pos(posX ?? k.center().x, posY ?? k.center().y),
        k.anchor("center"),
        k.scale(3),
        k.area(),
        k.body(),
        "player"
    ]);
    
    return player;
}

export function setControls(k, player) {
    const SPEED = 350;

    // Left Movement
    k.onKeyDown("left", () => player.move(-SPEED, 0));
    k.onKeyDown("a", () => player.move(-SPEED, 0));

    // Right Movement
    k.onKeyDown("right", () => player.move(SPEED, 0));
    k.onKeyDown("d", () => player.move(SPEED, 0));

    // Up Movement
    k.onKeyDown("up", () => player.move(0, -SPEED));
    k.onKeyDown("w", () => player.move(0, -SPEED));

    // Down Movement
    k.onKeyDown("down", () => player.move(0, SPEED));
    k.onKeyDown("s", () => player.move(0, SPEED));
}

export function spawnRogue(k, posX, posY) {
    k.add([
        k.sprite("rogue"),
        k.pos(posX, posY),
        k.anchor("center"),
        k.scale(3),
        k.area(),
        k.body({ isStatic: true }),
        "guide"
    ]);

    k.add([
        k.text("ROGUE (JED)", { 
            size: 14, 
            font: "'Press Start 2P'" 
        }),
        // Positioned 50px above the sprite
        k.pos(posX, posY - 50), 
        k.anchor("center"),
        k.color(226, 164, 198),
    ]);

    // The Sensor Zone for dialogue
    return k.add([
        k.rect(120, 120),
        k.pos(posX, posY),
        k.anchor("center"),
        k.area(),
        k.opacity(0),
        "sensor"
    ]);
}