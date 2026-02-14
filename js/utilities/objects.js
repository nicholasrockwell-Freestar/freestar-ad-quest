import { state } from "./state.js";
import { showDialogue } from "./dialogue.js";

export function spawnGate(k, posX, posY, requiredFlag, message) {
    // 1. The Physical Gate
    const gate = k.add([
        k.rect(80, 20),
        k.pos(posX, posY),
        k.anchor("center"),
        k.color(116, 50, 130), // Luxury Purple
        k.area(),
        k.body({ isStatic: true }),
        "gate"
    ]);

    // 2. The Proximity Sensor (slightly larger than the gate)
    const sensor = k.add([
        k.rect(100, 60),
        k.pos(posX, posY),
        k.anchor("center"),
        k.area(),
        k.opacity(0),
        "gate-sensor"
    ]);

    // Check if it should be open on load
    if (state.hasFlag(requiredFlag)) {
        k.destroy(gate);
        k.destroy(sensor);
    }

    // 3. Proximity Logic: Enter
    sensor.onCollide("player", () => {
        if (state.hasFlag(requiredFlag)) {
            // Unlocked: Gate vanishes
            k.destroy(gate);
            k.destroy(sensor);
            showDialogue(k, "SYSTEM", "Security cleared. GPT Console detected.");
        } else {
            // Locked: Show warning
            showDialogue(k, "SECURE GATE", message || "Access Denied.");
        }
    });

    // 4. Proximity Logic: Exit
    sensor.onCollideEnd("player", () => {
        k.destroyAll("dialogue-ui");
    });

    return gate;
}