export function loadIntro(k) {
    k.scene("intro", () => {
        // 1. Define the title first
        const title = k.add([
            k.text("LEVELLING UP", { 
                size: 58, 
                font: "'Press Start 2P'" // Corrected with internal quotes
            }),
            k.pos(k.center().x, k.center().y - 80),
            k.anchor("center"),
            k.color(255, 223, 0),
        ]);

        // 2. Add the underline (Harvest Gold) using title.width
        k.add([
            k.rect(title.width, 4), 
            k.pos(title.pos.x, title.pos.y + 40), 
            k.anchor("center"),
            k.color(255, 223, 0),
        ]);

        // 3. Subtitle logic
        k.add([
            k.text("AD SERVER OPERATIONS\n&\nANATOMY", { 
                size: 32, 
                font: "'Press Start 2P'", 
                align: "center" 
            }),
            k.pos(k.center().x, k.center().y + 50),
            k.anchor("center"),
            k.color(255, 223, 0),
        ]);

        const startText = k.add([
            k.text("PRESS START", { size: 24, font: "'Press Start 2P'" }),
            k.pos(k.center().x, k.center().y + 180),
            k.anchor("center"),
            k.color(226, 164, 198),
        ]);

        k.onUpdate(() => { 
            startText.hidden = k.time() % 1 < 0.5; 
        });

        k.onClick(() => {
            document.getElementById("inventory-hud").style.display = "block";
            k.go("level1"); 
        });
    });
}