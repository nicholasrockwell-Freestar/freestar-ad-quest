// --- INITIALIZATION ---
const k = kaplay({
    global: true,
    touchToMouse: true,
    background: [68, 28, 85], // Astronomy Purple
});

// --- ASSETS ---
k.loadSprite("rogue", "assets/rogue.png");
k.loadSprite("prebidWinner", "assets/prebid_winner.png");
k.loadSprite("main_tiles", "assets/tilemap.png", { sliceX: 12, sliceY: 11 });

// --- NEW CAT ASSETS ---
// Array of all your cat filenames (ensuring precise spelling matches)
const catList = [
    "BatmanCat", "BlackCat", "BlackCollorCat", "BrownCat", "DarkCat", 
    "EgyptCat", "MultiCat", "PinkCollorCat", "PirateCat", "SiameseCat", 
    "TigerCat", "VampireCat", "WhiteCat", "WizardCat"
];

// Dynamically load all cats and slice them by 3 to isolate the frames
catList.forEach(cat => {
    k.loadSprite(cat, `assets/cats/${cat}.png`, { sliceX: 3 });
});

// Map specific cats to the specific Badges/Rooms for the Inventory HUD
const badgeToCat = {
    "Inventory Cat": "WizardCat",
    "Delivery Cat": "PirateCat",
    "Insights Cat": "SiameseCat",
    "Programmatic Cat": "BatmanCat",
    "Privacy Cat": "VampireCat",
    "Admin Cat": "EgyptCat",
    "Ad Servers Cat": "TigerCat" 
};

// --- GLOBAL STATE ---
const gameState = {
    badges: new Set(),
    nextSpawn: null,
    isVisionOpen: false,
    lastVisionTime: 0
};

const state = {
    collectBadge: (name) => {
        gameState.badges.add(name);
        updateInventoryHUD();
    },
    hasBadge: (name) => gameState.badges.has(name),
    allBadgesCollected: () => gameState.badges.size >= 7, // Updated to 7 Cats
};

// --- VISION SYSTEM (POLISHED UI BOX & LINKS) ---
function showVision(data) {
    k.destroyAll("vision-overlay"); 

    const ui = k.add([k.fixed(), k.z(300), "vision-overlay"]);

    const boxWidth = 600;
    const boxHeight = 400; 

    // The Background UI Box (Replaces scroll.png with a clean, artifact-free rect)
    ui.add([
        k.rect(boxWidth, boxHeight),
        k.pos(k.center()),
        k.anchor("center"),
        k.color(46, 15, 58), // Deep Purple matching the HTML HUD (#2E0F3A)
        k.outline(4, k.rgb(220, 146, 0)), // Gold border matching the HTML HUD (#DC9200)
        k.z(301) 
    ]);

    // The Title
    ui.add([
        k.text(data.name.toUpperCase(), { size: 18, font: "'Press Start 2P'", width: boxWidth - 80, align: "center" }),
        k.pos(k.center().x, k.center().y - 140),
        k.anchor("center"),
        k.color(255, 223, 0), // Gold text to pop against purple
        k.z(302) 
    ]);

    // The Description
    ui.add([
        k.text(data.desc, { size: 12, font: "'Press Start 2P'", width: boxWidth - 100, lineSpacing: 10, align: "center" }),
        k.pos(k.center().x, k.center().y - 30),
        k.anchor("center"),
        k.color(255, 255, 255), // White text for readability
        k.z(302) 
    ]);

    // --- CLICKABLE LINK SYSTEM ---
    if (data.link && data.link !== "N/A") {
        const linkBtn = ui.add([
            k.text("CLICK HERE FOR RESOURCE ->", { size: 12, font: "'Press Start 2P'" }),
            k.pos(k.center().x, k.center().y + 80),
            k.anchor("center"),
            k.color(0, 183, 137), // Teal blue for interactive link
            k.area(), 
            k.z(302),
            "resource-link"
        ]);

        linkBtn.onHoverUpdate(() => {
            k.setCursor("pointer");
            linkBtn.color = k.rgb(0, 255, 200); // Lighter teal on hover
        });
        linkBtn.onHoverEnd(() => {
            k.setCursor("default");
            linkBtn.color = k.rgb(0, 183, 137); 
        });

        linkBtn.onClick(() => {
            let url = data.link.startsWith("http") ? data.link : "https://" + data.link;
            window.open(url, "_blank");
        });
    } else {
        ui.add([
            k.text("NO RESOURCE LINK AVAILABLE", { size: 10, font: "'Press Start 2P'" }),
            k.pos(k.center().x, k.center().y + 80),
            k.anchor("center"),
            k.color(150, 150, 150), // Gray if not available
            k.z(302) 
        ]);
    }

    // The Helper Text
    ui.add([
        k.text("WALK AWAY TO CLOSE", { size: 10, font: "'Press Start 2P'" }),
        k.pos(k.center().x, k.center().y + 150),
        k.anchor("center"),
        k.color(150, 150, 150),
        k.z(302) 
    ]);
}

// --- FINALE SEQUENCE ---
function triggerLevelUpSequence() {
    k.shake(20);
    const blackout = k.add([
        k.rect(k.width(), k.height()),
        k.color(0, 0, 0),
        k.fixed(),
        k.z(200),
        k.opacity(0)
    ]);

    blackout.onUpdate(() => {
        if (blackout.opacity < 1) blackout.opacity += k.dt() * 2;
    });

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

// --- DIALOGUE SYSTEM ---
function showLoopingDialogue(speaker, messages, index) {
    k.destroyAll("dialogue-ui");
    const message = messages[index % messages.length]; 
    const FIXED_HEIGHT = 160;
    const boxY = k.height() - (FIXED_HEIGHT / 2) - 40;

    // Cleaned up Dialogue Background matching the HUD
    k.add([
        k.rect(k.width() - 320, FIXED_HEIGHT),
        k.pos(k.center().x - 125, boxY), 
        k.anchor("center"), 
        k.color(46, 15, 58), // Deep purple
        k.outline(4, k.rgb(220, 146, 0)), // Gold border
        k.fixed(), 
        k.z(100), 
        "dialogue-ui"
    ]);

    k.add([
        k.text(speaker, { size: 18, font: "'Press Start 2P'" }),
        k.pos(80, boxY - (FIXED_HEIGHT / 2) + 20), 
        k.color(255, 223, 0), // Gold name
        k.fixed(), 
        k.z(101), 
        "dialogue-ui"
    ]);

    k.add([
        k.text(message, { size: 14, width: k.width() - 250, lineSpacing: 8, font: "'Press Start 2P'" }),
        k.pos(k.center().x - 50, boxY + 15), 
        k.anchor("center"), 
        k.color(255, 255, 255), // White text
        k.fixed(), 
        k.z(101), 
        "dialogue-ui"
    ]);

    k.add([
        k.text("SPACE TO CYCLE >", { size: 10, font: "'Press Start 2P'" }),
        k.pos(k.width() - 300, boxY + (FIXED_HEIGHT / 2) - 25), 
        k.anchor("right"), 
        k.color(150, 150, 150), // Light gray instruction
        k.fixed(), 
        k.z(101), 
        "dialogue-ui"
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

// Updated HUD to render dynamically mapped Cats for each specific room
function updateInventoryHUD() {
    const list = document.getElementById("tool-list");
    if (list) {
        list.innerHTML = Array.from(gameState.badges).map(b => {
            const catImg = badgeToCat[b] || "BlackCat"; // Fallback to BlackCat if not mapped
            return `
            <div class="tool-item" style="text-align: center;">
                <div style="width: 64px; height: 64px; overflow: hidden; margin: 0 auto; position: relative;">
                    <img src="assets/cats/${catImg}.png" style="height: 100%; width: auto; position: absolute; left: 0; image-rendering: pixelated;">
                </div>
                <span style="font-size: 8px;">${b}</span>
            </div>`;
        }).join("");
    }
}

function spawnPlayer(posX, posY) {
    const player = k.add([
        k.sprite("main_tiles", { frame: getFrame(5, 9) }), 
        k.pos(posX ?? k.center().x, posY ?? k.center().y),
        k.anchor("center"), 
        k.scale(3), 
        k.z(60), 
        k.area(), 
        k.body(), 
        "player"
    ]);

    const isGamGam = state.allBadgesCollected();
    const nameStr = isGamGam ? "Gam-Gam" : "Sophia Petrillo";
    const textSize = 12;
    const padding = 8;
    const txt = k.make([k.text(nameStr, { size: textSize, font: "'Press Start 2P'" })]);

    const labelYOffset = -35; 

    const labelBg = k.add([
        k.rect(txt.width + padding, txt.height + padding),
        k.pos(player.pos.x, player.pos.y + labelYOffset),
        k.anchor("center"),
        k.color(0, 0, 0),
        k.z(61)
    ]);

    const labelText = k.add([
        k.text(nameStr, { size: textSize, font: "'Press Start 2P'" }),
        k.pos(player.pos.x, player.pos.y + labelYOffset),
        k.anchor("center"),
        k.color(isGamGam ? k.rgb(255, 223, 0) : k.rgb(255, 255, 255)), 
        k.z(62)
    ]);

    player.onUpdate(() => {
        player.angle = (Math.abs(player.vel.x) > 0.1 || Math.abs(player.vel.y) > 0.1) ? Math.sin(k.time() * 15) * 8 : 0;
        
        labelBg.pos.x = player.pos.x;
        labelBg.pos.y = player.pos.y + labelYOffset;
        labelText.pos.x = player.pos.x;
        labelText.pos.y = player.pos.y + labelYOffset;
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

    const exitSensor = k.add([ k.rect(225, 225), k.pos(centerX, exitY), k.anchor("center"), k.area(), k.opacity(0) ]);
    exitSensor.onCollide("player", () => {
        if (!isUnlocked) {
            showLoopingDialogue("SYSTEM", ["LEVELLING-UP IS NOT SO CHEAP, RETURN WITH 7 CATS OF KNOWLEDGE TO EARN YOUR KEEP."], 0);
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
        { curIndex: 0, messages: Array.isArray(topicLines) ? topicLines : [topicLines] } 
    ]);
    
    const txt = k.make([k.text(name, { size: 14, font: "'Press Start 2P'" })]);
    k.add([k.rect(txt.width + 12, txt.height + 12), k.pos(x, y - 35), k.anchor("center"), k.color(0, 0, 0), k.z(50)]);
    k.add([k.text(name, { size: 14, font: "'Press Start 2P'" }), k.pos(x, y - 35), k.anchor("center"), k.color(226, 164, 198), k.z(51)]);

    const sensor = k.add([ k.rect(96, 96), k.pos(x, y), k.anchor("center"), k.area(), k.opacity(0), "sensor" ]);
    sensor.onCollide("player", () => {
        showLoopingDialogue(name, expert.messages, expert.curIndex);
        state.collectBadge(badgeType);
    });
    sensor.onUpdate(() => {
        if (sensor.isColliding(k.get("player")[0]) && (k.isKeyPressed("space") || k.isMousePressed())) {
            expert.curIndex++;
            showLoopingDialogue(name, expert.messages, expert.curIndex);
        }
    });
    sensor.onCollideEnd("player", () => k.destroyAll("dialogue-ui"));
}

// --- DYNAMIC ROOM GENERATOR ---
const createRoom = (name, expertName, frame, badge, lines, shardsData) => {
    k.scene(name, () => {
        addLargeEnvironment(k);
        const player = spawnPlayer(k.center().x, k.height() - 300);
        setControls(player);
        spawnExpert(k.center().x, k.center().y - 40, expertName, frame, badge, lines);

        const TILE_SIZE = 48;
        const roomWidth = 20 * TILE_SIZE; 
        const roomHeight = 15 * TILE_SIZE; 
        const leftWallX = (k.width() - roomWidth) / 2 + (TILE_SIZE * 1.5);
        const rightWallX = (k.width() + roomWidth) / 2 - (TILE_SIZE * 1.5);
        const topWallY = (k.height() - roomHeight) / 2 + (TILE_SIZE * 1.5);
        const bottomWallY = (k.height() + roomHeight) / 2 - (TILE_SIZE * 1.5);

        const positions = [
            { x: leftWallX + 150, y: topWallY },            
            { x: k.center().x, y: topWallY },               
            { x: rightWallX - 150, y: topWallY },           
            { x: rightWallX - 50, y: topWallY + 150 },      
            { x: rightWallX - 50, y: k.center().y },        
            { x: rightWallX - 50, y: bottomWallY - 150 },   
            { x: rightWallX - 250, y: bottomWallY - 75},    
            { x: leftWallX + 250, y: bottomWallY - 75},     
            { x: leftWallX + 50, y: bottomWallY - 150 },    
            { x: leftWallX + 50, y: k.center().y },         
            { x: leftWallX + 50, y: topWallY + 150 }        
        ];

        shardsData.forEach((s, i) => {
            if(i >= positions.length) return; 
            const pos = positions[i];
            
            // Randomly select one of the cats from the array
            const randomCat = catList[Math.floor(Math.random() * catList.length)];
            
            const shard = k.add([
                k.sprite(randomCat, { frame: 0 }), 
                k.pos(pos.x, pos.y),
                k.scale(2.5), 
                k.z(45), 
                k.area(), 
                k.body({ isStatic: true }), 
                "shard",
                { data: s }
            ]);
            
            const labelY = pos.y + 90; 
            const textSize = 10;
            const padding = 10;
            const txt = k.make([k.text(s.name, { size: textSize, font: "'Press Start 2P'" })]);

            k.add([
                k.rect(txt.width + 20 + padding, txt.height + padding),
                k.pos(pos.x + 30, labelY),
                k.anchor("center"),
                k.color(0, 0, 0),
                k.z(49) 
            ]);

            k.add([
                k.text(s.name, { size: textSize, font: "'Press Start 2P'", align: "center" }),
                k.pos(pos.x + 30, labelY),
                k.anchor("center"),
                k.color(255, 255, 255),
                k.z(50) 
            ]);

            shard.onCollide("player", () => showVision(s));
            shard.onCollideEnd("player", () => {
                k.setCursor("default"); 
                k.destroyAll("vision-overlay");
            });
        });

        spawnPortal(k.center().x, k.height() - 200, "hub", "HUB");
        player.onCollide("portal", (p) => k.go(p.dest));
    });
};

// --- SCENES ---
k.scene("intro", () => {
    k.add([ k.text("LEVELLING UP", { size: 58, font: "'Press Start 2P'" }), k.pos(k.center().x, k.center().y - 80), k.anchor("center"), k.color(255, 223, 0) ]);
    k.add([ k.text("AD SERVER OPERATIONS\nANATOMY", { size: 32, font: "'Press Start 2P'", align: "center" }), k.pos(k.center().x, k.center().y + 50), k.anchor("center"), k.color(255, 223, 0) ]);
    const startBtn = k.add([ k.text("CLICK TO START", { size: 24, font: "'Press Start 2P'" }), k.pos(k.center().x, k.center().y + 180), k.anchor("center"), k.color(226, 164, 198) ]);
    k.onClick(() => { 
        document.getElementById("inventory-hud").style.display = "block";
        k.go("hub"); 
    });
});

k.scene("hub", () => {
    addLargeEnvironment(k);
    k.add([ k.text("THE GAM MASTER TRIAL", { size: 30, font: "'Press Start 2P'" }), k.pos(k.center().x, 30), k.anchor("center"), k.color(255, 223, 0) ]);
    const spawnX = gameState.nextSpawn ? gameState.nextSpawn.x : k.center().x;
    const spawnY = gameState.nextSpawn ? gameState.nextSpawn.y : k.center().y;
    const player = spawnPlayer(spawnX, spawnY);
    setControls(player);

    const doorY = 220;
    const startX = k.center().x - 350; 
    const spacing = 140; 
    const scale = 3.5;

    // Original Top Wall Doors
    spawnPortal(startX, doorY, "inventory", "INVENTORY", scale);
    spawnPortal(startX + spacing, doorY, "delivery", "DELIVERY", scale);
    spawnPortal(startX + spacing * 2, doorY, "reporting", "INSIGHTS", scale);
    spawnPortal(startX + spacing * 3, doorY, "programmatic", "Programmatic", scale);
    spawnPortal(startX + spacing * 4, doorY, "privacy", "PRIVACY", scale);
    spawnPortal(startX + spacing * 5, doorY, "admin", "ADMIN", scale);

    // New Left Wall Door for Ad Servers
    spawnPortal(k.center().x - 380, k.center().y, "adservers", "AD SERVERS", scale);

    spawnExitDoor(k.center().x, k.height() - 200);

    player.onCollide("portal", (p) => {
        if (p.dest === "final") { if (!p.locked) triggerLevelUpSequence(); }
        else { gameState.nextSpawn = { x: p.pos.x, y: p.pos.y + 80 }; k.go(p.dest); }
    });
});

// --- DATA (FREESTAR SPECIFIC FOCUS) ---
const inventoryShards = [
    { name: "Ad Units", frame: 0, desc: "The foundation of inventory. In GAM, these must precisely match the Pubfig configurations (e.g., lipsumcom_right_siderail_2) or bids will drop.", link: "https://admanager.google.com/15184186#inventory/ad_unit/list" },
    { name: "Placements", frame: 1, desc: "When a Pub would group a collection of ad units logically for targeting or reporting purposes.", link: "https://admanager.google.com/15184186#inventory/placement/list" },
    { name: "GPT", frame: 2, desc: "The Google Publisher Tag. Pubfig pauses GPT, runs the Prebid auction, injects the winning Key-Values, and then finally lets GPT call GAM with the winner.", link: "https://developers.google.com/publisher-tag/guides/learn-basics" },
    { name: "Sites", frame: 3, desc: "Domain management. Before a Pub goes live, we must ensure the site is approved in GAM and MCM is fully established to maintain inventory quality.", link: "https://support.google.com/admanager/answer/10130765" },
    { name: "Key-Values", frame: 4, desc: "How Prebid talks to GAM. Pubfig injects winning bid data (like hb_pb=2.10 or hb_bidder=rubicon) so GAM can decision against AdX.", link: "https://docs.prebid.org/adops/key-values.html" },
    { name: "Audiences", frame: 5, desc: "Audiences are segments of users grouped by shared behaviors or demographics used for precise campaign targeting. We enhance this by integrating with DMPs like Lotame, a 3rd-party identity provider, leveraging purchased data to build highly valuable, custom audience profiles.", link: "https://support.google.com/google-ads/answer/7538811" },
    { name: "Pricing Rules", frame: 6, desc: "Unified Pricing Rules (UPRs). Freestar Yield Ops actively manages these to balance overall fill rate against premium CPMs across AdX and Header Bidding.", link: "https://support.google.com/admanager/answer/9298008" }
];

const deliveryShards = [
    { name: "Orders & Line Items", frame: 0, desc: "We rely heavily on automation and APIs to build and manage the thousands of Prebid line items required to catch every price bucket.", link: "https://support.google.com/admanager/answer/9405477" },
    { name: "Creatives", frame: 1, desc: "Beyond standard display, this is where we manage our highly custom outstream, sticky video players, and high-impact rich media templates.", link: "https://support.google.com/admanager/answer/3185155" },
    { name: "Targeting", frame: 2, desc: "Used heavily by Yield to restrict direct-sold campaigns to specific wrapper setups, geographics, or premium Freestar inventory.", link: "https://support.google.com/admanager/answer/9766929" },
    { name: "Prioritization", frame: 3, desc: "The yield waterfall. Direct-Sold sits high at \nSponsorship (4) \nor \nStandard (8) \nwhile our programmatic Header Bidding sits at: \nPrice Priority (12).", link: "https://support.google.com/admanager/answer/177279" },
    { name: "Forecasting", frame: 4, desc: "Predicting if a publisher's specific placement has enough projected volume to fulfill a custom PMP deal without underdelivering.", link: "https://support.google.com/admanager/answer/7649125" },
    { name: "Freq Capping", frame: 5, desc: "Protecting the user experience. We use capping to ensure high-impact units don't aggressively fatigue the publisher's audience.", link: "https://support.google.com/admanager/answer/7085745" },
    { name: "Delivery Tools", frame: 6, desc: "Troubleshooting lifesavers. This tool can help us figure out exactly why an ad unit isn't winning or serving as expected.", link: "https://admanager.google.com/15184186#troubleshooting/websd" }
];

const insightsShards = [
    { name: "Impressions & Fill", frame: 0, desc: "The core yield metrics. We constantly monitor these to hunt down reporting discrepancies between Pubfig, GAM, upstream analytics, and publisher analytics.", link: "https://www.pathlabs.com/blog/cpm-vs-cpc-vs-cpa" },
    { name: "Viewability", frame: 1, desc: "A massive KPI for premium buyers. We optimize lazy loading and smart refresh logic in Pubfig to boost Active View percentages.", link: "https://www.pathlabs.com/blog/cpm-vs-cpc-vs-cpa" },
    { name: "Reach & VCR", frame: 2, desc: "Video Completion Rate. Essential for our outstream and instream demand partners to ensure users are actually watching the creatives.", link: "https://www.pathlabs.com/blog/cpm-vs-cpc-vs-cpa" },
    { name: "Buyers & Devices", frame: 3, desc: "Used to diagnose granular issues, like why a specific SSP (e.g., Magnite or Index Exchange) is underperforming on Mobile Web vs Desktop.", link: "N/A" }
];

const programmaticShards = [
    { name: "Open Auction & AdX", frame: 0, desc: "The baseline marketplace. Through MCM, Freestar provides smaller publishers access to premium Google AdX demand they couldn't get alone.", link: "https://iabtechlab.com/standards/openrtb" },
    { name: "Header Bidding", frame: 1, desc: "The secret sauce. Orchestrating Prebid.js to maximize auction density without slowing down the page.", link: "https://docs.prebid.org/overview/intro.html" },
    { name: "PMP & PG Deals", frame: 2, desc: "Programmatic Direct. Executing high-CPM fixed-price agreements and Deal IDs we've secured.", link: "https://support.google.com/admanager/answer/7510110" },
    { name: "Unified Auction", frame: 3, desc: "The first-price battleground. Prebid partners must successfully pass their bids to GAM in time to compete directly against AdX's dynamic flooring.", link: "https://support.google.com/admanager/answer/9266670" },
    { name: "Protections", frame: 4, desc: "Brand safety. Alongside GAM rules, we use The Media Trust to actively block malvertising, redirects, and bad actors.", link: "https://support.google.com/admanager/answer/7063071" }
];

const privacyShards = [
    { name: "GDPR, GPP, MSPA", frame: 0, desc: "Global consent. We integrate CMPs (like SourcePoint or OneTrust) directly with the Pubfig to ensure we only fire legal bid requests.", link: "https://support.google.com/admanager/answer/9805367" },
    { name: "LTD Ads", frame: 1, desc: "The cookieless concept. Testing the Privacy Sandbox, Topics API, and contextual setups to keep CPMs high when third-party data is restricted.", link: "https://support.google.com/admanager/answer/11559288" },
    { name: "Data Controls", frame: 2, desc: "Ensuring publisher audience data remains secure and isn't leaked into the bidstream or to SSPs without proper authorization agreements.", link: "https://developers.google.com/ads-data-hub" }
];

const adminShards = [
    { name: "Users & Roles", frame: 0, desc: "Access control...", link: "https://support.google.com/admanager/answer/60220" },
    { name: "Linked Accounts", frame: 1, desc: "Bridging the gap...", link: "https://support.google.com/admanager/answer/11186985" },
    { name: "API & CRM", frame: 2, desc: "The backbone of our reporting. We utilize GAM APIs to pull raw delivery data.", link: "https://developers.google.com/ad-manager/api/start" },
    { name: "Ads.txt & MCM", frame: 3, desc: "A constant struggle. Ensuring Freestar's authorized seller list is properly accessible from the Publishers domain.", link: "https://support.google.com/admanager/answer/9335447" },
    { name: "Policy Center", frame: 4, desc: "The red alert screen. Yield Ops monitors this to resolve sudden 'Two-Click Penalties' or content violations that demonetize Pubs.", link: "https://support.google.com/admanager/answer/9206775" }
];

// --- NEW SHARDS FOR AD SERVERS ---
const adServerShards = [
    { name: "Publisher Ad Server", frame: 0, desc: "Used by publishers to manage yield, host creatives, and decision ads across owned and operated properties. \n\nExamples: Google Ad Manager, Xandr, Magnite, Primis, TAM, Connatix, etc...", link: "N/A" },
    { name: "3rd-Party Ad Server", frame: 1, desc: "Used to manage, track, and serve creatives across multiple different publisher sites. \n\nExamples: Campaign Manager 360, Sizmek, Flashtalking, AdButler", link: "N/A" },
    { name: "DSPs", frame: 2, desc: "Demand Side Platforms. The interface advertisers use to buy inventory across the ecosystem programmatically. \n\nExamples: DV360, The TradeDesk, MediaMath", link: "N/A" },
    { name: "SSPs", frame: 3, desc: "Supply Side Platforms. The technology publishers use to offer their inventory to multiple DSPs simultaneously. \n\nExamples: Pubmatic, OpenX, Yahoo", link: "N/A" }
];

// Compile all rooms
createRoom("inventory", "KYLE", getFrame(2, 8), "Inventory Cat", [
    "Welcome! I'm Kyle, EVP of Operations!", 
    "Take this Cat of Knowledge to help build your foundation.", 
    "Pet the cats of inventory to see the blueprints of GAM."
], inventoryShards);

createRoom("delivery", "PATRICK", getFrame(4, 8), "Delivery Cat", [
    "I'm Patrick, VP of Publisher Support.", 
    "Here is a Cat of Knowledge to keep your delivery on track.", 
    "Pet the cats of delivery to ensure our ads reach their targets."
], deliveryShards);

createRoom("reporting", "CATHENA", getFrame(4, 9), "Insights Cat", [
    "I am Cathena, the Analyst.", 
    "Accept this Cat of Knowledge to help illuminate your path.", 
    "Pet the cats of insight to turn raw data into strategy."
], insightsShards);

createRoom("programmatic", "DAVID", getFrame(2, 9), "Programmatic Cat", [
    "I'm David, AD of Support Engineering.", 
    "Take this Cat of Knowledge to help you master the auction.", 
    "Pet the cats of programmatic to run the high-speed marketplace."
], programmaticShards);

createRoom("privacy", "MARTIN H.", getFrame(2, 10), "Privacy Cat", [
    "I'm Martin H., The Godfather.", 
    "Here is a Cat of Knowledge to guide you safely forward.", 
    "Pet the cats of privacy to keep our data secure and legal."
], privacyShards);

createRoom("admin", "KURT", getFrame(1, 9), "Admin Cat", [
    "I'm Kurt, CEO.", 
    "I'll provide you with the last Cat Of Knowledge you need to complete your journey.", 
    "Pet the cats of administration to configure the network."
], adminShards);

createRoom("adservers", "Ryan", getFrame(4, 8), "Ad Servers Cat", [
    "Welcome! I'm Ryan, Program Manager of Publisher Operations \nAd Servers are one of my personal favorite topics! \n\nSo, Don't Screw This Up!!", 
    "Take this Cat of Knowledge to navigate the ecosystem.", 
    "Pet the cats to learn about the different types of ad servers."
], adServerShards);

k.go("intro");