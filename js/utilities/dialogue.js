import { state } from "../utilities/state.js";

export function showDialogue(k, speaker, message, autoFlag = null) {
    if (autoFlag && state.hasFlag(autoFlag)) return;
    if (k.get("dialogue-ui").length > 0) return;

    // 1. First, create the text object "off-screen" to measure its height
    const textOptions = {
        size: 16,
        width: k.width() - 100,
        lineSpacing: 10,
        font: "'Press Start 2P'"
    };

    // We use k.make to create the object without adding it to the scene yet
    const messageContent = k.make([
        k.text(message, textOptions)
    ]);

    // 2. Calculate dynamic height (Padding + Text Height)
    const padding = 60;
    const dynamicHeight = messageContent.height + padding;
    const boxY = k.height() - (dynamicHeight / 2) - 20; // Positioned near bottom

    // 3. Add the Scroll Box
    const dialogueBox = k.add([
        k.sprite("scroll", { width: k.width() - 40, height: dynamicHeight }), 
        k.pos(k.center().x, boxY),
        k.anchor("center"),
        k.fixed(),
        k.z(100),
        "dialogue-ui"
    ]);

    // 4. Add the Speaker Text ABOVE the box
    // Calculated as: Box Center - (Half Height) - Extra Offset
    k.add([
        k.text(speaker, { size: 18, font: "'Press Start 2P'" }),
        k.pos(40, boxY - (dynamicHeight / 2) - 30), 
        k.color(220, 146, 0), // Harvest Gold
        k.fixed(),
        k.z(101),
        "dialogue-ui"
    ]);

    // 5. Add the actual message text
    k.add([
        k.text(message, textOptions),
        k.pos(k.center().x, boxY), 
        k.anchor("center"),
        k.color(46, 15, 58), // Midnight Velvet
        k.fixed(),
        k.z(101),
        "dialogue-ui"
    ]);

    if (autoFlag) {
        state.setFlag(autoFlag);
    }
}