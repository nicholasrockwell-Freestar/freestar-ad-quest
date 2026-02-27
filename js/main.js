// --- INITIALIZATION ---
const k = kaplay({
    global: true,
    touchToMouse: true,
    background: [68, 28, 85], // Astronomy Purple
});

// --- ASSETS ---
k.loadSprite("rogue", "assets/rogue.png");
k.loadSprite("prebidWinner", "assets/prebid_winner.png");
k.loadSprite("scroll", "assets/scroll.png", {
    slice9: { left: 12, right: 12, top: 12, bottom: 12 }
});
k.loadSprite("main_tiles", "assets/tilemap.png", { sliceX: 12, sliceY: 11 });

k.loadSprite("crystals", "assets/Assets_texture_shadow_source.png", {
    frames: {
        "blue": { x: 0, y: 0, width: 32, height: 32 },
        "yellow": { x: 288, y: 0, width: 32, height: 32 },
        "white": { x: 160, y: 0, width: 32, height: 32 },
        "purple": { x: 192, y: 0, width: 32, height: 32 },
    }
});

// --- GLOBAL STATE ---
const gameState = {
    badges: new Set(),
    nextSpawn: null 
};

const state = {
    collectBadge: (name) => {
        gameState.badges.add(name);
        updateInventoryHUD();
    },
    hasBadge: (name) => gameState.badges.has(name),
    allBadgesCollected: () => gameState.badges.size >= 4,
};

// --- FINALE SEQUENCE ---
function triggerLevelUpSequence() {
    // 1. Visual Punch
    k.shake(20);

    // 2. Blackout Overlay
    const blackout = k.add([
        k.rect(k.width(), k.height()),
        k.color(0, 0, 0),
        k.fixed(),
        k.z(200),
        k.opacity(0)
    ]);

    // Animate fade
    blackout.onUpdate(() => {
        if (blackout.opacity < 1) blackout.opacity += k.dt() * 2;
    });

    // 3. Video Handling
    k.wait(0.8, () => {
        const videoElement = document.createElement("video");
        videoElement.src = "assets/Level-Up.mp4";
        videoElement.style.position = "fixed";
        videoElement.style.top = "50%";
        videoElement.style.left = "50%";
        videoElement.style.transform = "translate(-50%, -50%)";
        videoElement.style.width = "100vw";
        videoElement.style.height = "100vh";
        videoElement.style.zIndex = "1000";
        videoElement.style.backgroundColor = "black";
        document.body.appendChild(videoElement);

        videoElement.play();

        videoElement.onended = () => {
            document.body.removeChild(videoElement);
            gameState.badges.clear(); 
            gameState.nextSpawn = null;
            updateInventoryHUD();
            k.go("intro");
        };
    });
}

// --- IMPROVED PROXIMITY DIALOGUE ---
function showLoopingDialogue(speaker, messages, index) {
    k.destroyAll("dialogue-ui");
    
    const message = messages[index % messages.length]; 
    const FIXED_HEIGHT = 160;
    const boxY = k.height() - (FIXED_HEIGHT / 2) - 40;

    k.add([
        k.sprite("scroll", { width: k.width() - 80, height: FIXED_HEIGHT }),
        k.pos(k.center().x, boxY), k.anchor("center"), k.fixed(), k.z(100), "dialogue-ui"
    ]);

    k.add([
        k.text(speaker, { size: 18, font: "'Press Start 2P'" }),
        k.pos(80, boxY - (FIXED_HEIGHT / 2)), k.color(255, 223, 0), k.fixed(), k.z(101), "dialogue-ui"
    ]);

    k.add([
        k.text(message, { size: 14, width: k.width() - 160, lineSpacing: 8, font: "'Press Start 2P'" }),
        k.pos(k.center().x, boxY + 10), k.anchor("center"), k.color(46, 15, 58), k.fixed(), k.z(101), "dialogue-ui"
    ]);

    k.add([
        k.text("SPACE TO CYCLE >", { size: 10, font: "'Press Start 2P'" }),
        k.pos(k.width() - 100, boxY + (FIXED_HEIGHT / 2) - 25), k.anchor("right"), k.color(0,0,0), k.fixed(), k.z(101), "dialogue-ui"
    ]);
}

const getFrame = (col, row) => (row - 1) * 12 + (col - 1);

function putFloor(x, y) {
    k.add([k.sprite("main_tiles", { frame: getFrame(3, 2) }), k.pos(x, y), k.scale(3), k.z(-1)]);
}

function putWallTile(x, y, frame) {
    k.add([k.sprite("main_tiles", { frame: frame }), k.pos(x, y), k.scale(3), k.area(), k.body({ isStatic: true })]);
}

function addLargeEnvironment(k) {
    const TILE_SIZE = 48;
    const roomWidth = 20; 
    const roomHeight = 15; 
    const offsetX = (k.width() - roomWidth * TILE_SIZE) / 2;
    const offsetY = (k.height() - roomHeight * TILE_SIZE) / 2;

    for (let i = 0; i < roomWidth; i++) {
        for (let j = 0; j < roomHeight; j++) {
            const x = offsetX + i * TILE_SIZE;
            const y = offsetY + j * TILE_SIZE;
            if (i === 0 && j === 0) putWallTile(x, y, getFrame(2, 1));
            else if (i === roomWidth - 1 && j === 0) putWallTile(x, y, getFrame(4, 1));
            else if (i === 0 && j === roomHeight - 1) putWallTile(x, y, getFrame(2, 3));
            else if (i === roomWidth - 1 && j === roomHeight - 1) putWallTile(x, y, getFrame(4, 3));
            else if (j === 0) putWallTile(x, y, getFrame(3, 1)); 
            else if (j === roomHeight - 1) putWallTile(x, y, getFrame(3, 3)); 
            else if (i === 0) putWallTile(x, y, getFrame(2, 2)); 
            else if (i === roomWidth - 1) putWallTile(x, y, getFrame(4, 2)); 
            else putFloor(x, y);
        }
    }
}

function updateInventoryHUD() {
    const list = document.getElementById("tool-list");
    if (list) {
        list.innerHTML = Array.from(gameState.badges).map(b => `<div class="tool-item">💎 ${b}</div>`).join("");
    }
}

function spawnPlayer(posX, posY) {
    const player = k.add([
        k.sprite("main_tiles", { frame: getFrame(1, 8) }), 
        k.pos(posX ?? k.center().x, posY ?? k.center().y),
        k.anchor("center"), k.scale(3), k.area(), k.body(), "player"
    ]);
    player.onUpdate(() => {
        player.angle = (Math.abs(player.vel.x) > 0.1 || Math.abs(player.vel.y) > 0.1) ? Math.sin(k.time() * 15) * 8 : 0;
    });
    return player;
}

function setControls(player) {
    const SPEED = 350;
    k.onKeyDown("left", () => player.move(-SPEED, 0));
    k.onKeyDown("a", () => player.move(-SPEED, 0));
    k.onKeyDown("right", () => player.move(SPEED, 0));
    k.onKeyDown("d", () => player.move(SPEED, 0));
    k.onKeyDown("up", () => player.move(0, -SPEED));
    k.onKeyDown("w", () => player.move(0, -SPEED));
    k.onKeyDown("down", () => player.move(0, SPEED));
    k.onKeyDown("s", () => player.move(0, SPEED));
}

function spawnPortal(x, y, destination, label, customScale = 4) {
    k.add([ k.sprite("main_tiles", { frame: 33 }), k.pos(x, y), k.scale(customScale), k.anchor("center") ]);
    k.add([ k.rect(16 * customScale, 16 * customScale), k.pos(x, y), k.opacity(0), k.anchor("center"), k.area(), "portal", { dest: destination, locked: false } ]);

    if(label) {
        const labelSize = 10 * (customScale/4);
        const labelY = y - (12 * customScale); 
        const txt = k.make([k.text(label, { size: labelSize, font: "'Press Start 2P'", align: "center" })]);
        k.add([k.rect(txt.width + 12, txt.height + 12), k.pos(x, labelY), k.anchor("center"), k.color(0, 0, 0), k.z(50)]);
        k.add([k.text(label, { size: labelSize, font: "'Press Start 2P'", align: "center" }), k.pos(x, labelY), k.anchor("center"), k.color(0, 183, 137), k.z(51)]);
    }
}

function spawnExitDoor(centerX, exitY) {
    const isUnlocked = state.allBadgesCollected();
    
    const leftFrame = isUnlocked ? 34 : 46;
    k.add([ k.sprite("main_tiles", { frame: leftFrame }), k.pos(centerX - 48, exitY), k.scale(6), k.anchor("center") ]);

    const rightFrame = isUnlocked ? 35 : 47;
    k.add([ k.sprite("main_tiles", { frame: rightFrame }), k.pos(centerX + 48, exitY), k.scale(6), k.anchor("center") ]);

    k.add([ 
        k.rect(96, 96), 
        k.pos(centerX, exitY), 
        k.opacity(0), 
        k.anchor("center"), 
        k.area(), 
        "portal", 
        { dest: "final", locked: !isUnlocked } 
    ]);

    const exitTxtSize = 10 * (6 / 4);
    const exitTxt = k.make([k.text("LEVEL-UP", { size: exitTxtSize, font: "'Press Start 2P'", align: "center" })]);
    const exitLabelY = exitY - 60; 
    k.add([k.rect(exitTxt.width + 16, exitTxt.height + 16), k.pos(centerX, exitLabelY), k.anchor("center"), k.color(0, 0, 0), k.z(50)]);
    k.add([k.text("LEVEL-UP", { size: exitTxtSize, font: "'Press Start 2P'", align: "center" }), k.pos(centerX, exitLabelY), k.anchor("center"), k.color(0, 183, 137), k.z(51)]);

    const exitSensor = k.add([ k.rect(200, 200), k.pos(centerX, exitY), k.anchor("center"), k.area(), k.opacity(0) ]);
    exitSensor.onCollide("player", () => {
        if (!isUnlocked) {
            showLoopingDialogue("SYSTEM", ["LEVELLING-UP IS NOT SO CHEAP, RETURN WITH BADGES OF KNOWLEDGE TO EARN YOUR KEEP.", "Collect all 4 Badges to Level-Up!"], 0);
        }
    });
    exitSensor.onCollideEnd("player", () => k.destroyAll("dialogue-ui"));
}

function spawnExpert(x, y, name, frame, badgeType, topicLines) {
    const expert = k.add([ 
        k.sprite("main_tiles", { frame: frame }), 
        k.pos(x, y), 
        k.anchor("center"), 
        k.scale(3), 
        k.area(), 
        k.body({ isStatic: true }), 
        "expert",
        { 
            curIndex: 0,
            messages: Array.isArray(topicLines) ? topicLines : [topicLines] 
        } 
    ]);
    
    const nameSize = 14;
    const labelY = y - 70;
    const txt = k.make([k.text(name, { size: nameSize, font: "'Press Start 2P'" })]);

    k.add([
        k.rect(txt.width + 12, txt.height + 12),
        k.pos(x, labelY),
        k.anchor("center"),
        k.color(0, 0, 0),
        k.z(50)
    ]);

    k.add([ 
        k.text(name, { size: nameSize, font: "'Press Start 2P'" }), 
        k.pos(x, labelY), 
        k.anchor("center"), 
        k.color(226, 164, 198),
        k.z(51) 
    ]);

    const sensor = k.add([ k.rect(180, 180), k.pos(x, y), k.anchor("center"), k.area(), k.opacity(0), "sensor" ]);
    
    sensor.onCollide("player", () => {
        showLoopingDialogue(name, expert.messages, expert.curIndex);
        state.collectBadge(badgeType);
    });

    sensor.onUpdate(() => {
        if (sensor.isColliding(k.get("player")[0])) {
            if (k.isKeyPressed("space") || k.isMousePressed()) {
                expert.curIndex++;
                showLoopingDialogue(name, expert.messages, expert.curIndex);
            }
        }
    });
    
    sensor.onCollideEnd("player", () => {
        k.destroyAll("dialogue-ui");
    });
}

// --- SCENES ---
k.scene("intro", () => {
    k.add([ k.text("LEVELLING UP", { size: 58, font: "'Press Start 2P'" }), k.pos(k.center().x, k.center().y - 80), k.anchor("center"), k.color(255, 223, 0) ]);
    k.add([ k.text("AD SERVER OPERATIONS\nANATOMY", { size: 32, font: "'Press Start 2P'", align: "center" }), k.pos(k.center().x, k.center().y + 50), k.anchor("center"), k.color(255, 223, 0) ]);
    const startBtn = k.add([ k.text("CLICK TO START", { size: 24, font: "'Press Start 2P'" }), k.pos(k.center().x, k.center().y + 180), k.anchor("center"), k.color(226, 164, 198) ]);
    k.onClick(() => { 
        const hud = document.getElementById("inventory-hud");
        if(hud) hud.style.display = "block";
        k.go("hub"); 
    });
});

k.scene("hub", () => {
    k.setGravity(0);
    addLargeEnvironment(k);
    k.add([ k.text("THE GAM MASTER TRIAL", { size: 30, font: "'Press Start 2P'" }), k.pos(k.center().x, 30), k.anchor("center"), k.color(255, 223, 0) ]);
    
    const spawnX = gameState.nextSpawn ? gameState.nextSpawn.x : k.center().x;
    const spawnY = gameState.nextSpawn ? gameState.nextSpawn.y : k.center().y;
    const player = spawnPlayer(spawnX, spawnY);
    setControls(player);

    const doorY = 180;
    const startX = k.center().x - 225;
    const spacing = 150;
    spawnPortal(startX, doorY, "inventory", "INVENTORY", 4);
    spawnPortal(startX + spacing, doorY, "delivery", "DELIVERY", 4);
    spawnPortal(startX + spacing * 2, doorY, "reporting", "INSIGHTS", 4);
    spawnPortal(startX + spacing * 3, doorY, "programmatic", "AD EXCHANGE", 4);

    spawnExitDoor(k.center().x, k.height() - 150);

    player.onCollide("portal", (p) => {
        // Explicit check for the "final" gate to trigger video instead of scene
        if (p.dest === "final") {
            if (!p.locked) triggerLevelUpSequence();
        } else {
            gameState.nextSpawn = { x: p.pos.x, y: p.pos.y + 80 }; 
            k.go(p.dest);
        }
    });
});

// Category Rooms
const createRoom = (name, expertName, frame, badge, lines) => {
    k.scene(name, () => {
        addLargeEnvironment(k);
        const player = spawnPlayer(k.center().x, k.height() - 200);
        setControls(player);
        spawnExpert(k.center().x, k.center().y - 40, expertName, frame, badge, lines);
        spawnPortal(k.center().x, k.height() - 100, "hub", "HUB");
        player.onCollide("portal", (p) => k.go(p.dest));
    });
};

createRoom("inventory", "ARCHITECT", getFrame(2, 8), "Blue Badge", [
    "Inventory allows creation of ad units and tags.",
    "We also manage key-values for targeting and pricing floors."
]);
createRoom("delivery", "DISPATCHER", getFrame(4, 8), "Yellow Badge", [
    "I manage Orders and Line Items to ensure delivery.",
    "Forecasting helps us optimize inventory availability."
]);
createRoom("reporting", "ANALYST", getFrame(5, 8), "White Badge", [
    "We track Impressions, CTR, Revenue, and Viewability.",
    "Advanced reporting analyzes revenue by buyer and device."
]);
createRoom("programmatic", "AUCTIONEER", getFrame(6, 8), "Purple Badge", [
    "Demand channels include Open Auction and Open Bidding.",
    "We use yield groups to maximize revenue yield."
]);

k.go("intro");