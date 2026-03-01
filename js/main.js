// --- INITIALIZATION ---
const k = kaplay({
    global: true,
    touchToMouse: true,
    background: [68, 28, 85], // Astronomy Purple
});

// --- ASSETS ---
k.loadSprite("rogue", "assets/rogue.png");
k.loadSprite("prebidWinner", "assets/prebid_winner.png");
k.loadSprite("cat", "assets/cat.png"); 
k.loadSprite("scroll", "assets/scroll.png", {
    slice9: { left: 12, right: 12, top: 12, bottom: 12 }
});
k.loadSprite("main_tiles", "assets/tilemap.png", { sliceX: 12, sliceY: 11 });

k.loadSprite("crystals", "assets/crystals.png", {
    sliceX: 10, 
});

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
    allBadgesCollected: () => gameState.badges.size >= 6, 
};

// --- VISION SYSTEM (CLICKABLE HYPERLINK & TEXT ONLY) ---
function showVision(data) {
    k.destroyAll("vision-overlay"); 

    const ui = k.add([k.fixed(), k.z(300), "vision-overlay"]);

    const boxWidth = 600;
    const boxHeight = 400; 

    // The Background Scroll
    ui.add([
        k.sprite("scroll", { width: boxWidth, height: boxHeight }),
        k.pos(k.center()),
        k.anchor("center"),
        k.z(301) 
    ]);

    // The Title
    ui.add([
        k.text(data.name.toUpperCase(), { size: 18, font: "'Press Start 2P'", width: boxWidth - 80, align: "center" }),
        k.pos(k.center().x, k.center().y - 140),
        k.anchor("center"),
        k.color(0, 183, 137),
        k.z(302) 
    ]);

    // The Description (Expanded for all crystals)
    ui.add([
        k.text(data.desc, { size: 12, font: "'Press Start 2P'", width: boxWidth - 100, lineSpacing: 10, align: "center" }),
        k.pos(k.center().x, k.center().y - 30),
        k.anchor("center"),
        k.color(46, 15, 58),
        k.z(302) 
    ]);

    // --- CLICKABLE LINK SYSTEM ---
    if (data.link && data.link !== "N/A") {
        const linkBtn = ui.add([
            k.text("CLICK HERE FOR RESOURCE ->", { size: 12, font: "'Press Start 2P'" }),
            k.pos(k.center().x, k.center().y + 80),
            k.anchor("center"),
            k.color(0, 0, 255),
            k.area(), // Gives the text a hitbox for clicking and hovering
            k.z(302),
            "resource-link"
        ]);

        // Hover Effects
        linkBtn.onHoverUpdate(() => {
            k.setCursor("pointer");
            linkBtn.color = k.rgb(0, 150, 255); // Lightens blue on hover
        });
        linkBtn.onHoverEnd(() => {
            k.setCursor("default");
            linkBtn.color = k.rgb(0, 0, 255); // Returns to dark blue
        });

        // Click Action
        linkBtn.onClick(() => {
            // Ensure the URL has https:// so the browser opens it externally
            let url = data.link.startsWith("http") ? data.link : "https://" + data.link;
            window.open(url, "_blank");
        });
    } else {
        ui.add([
            k.text("NO RESOURCE LINK AVAILABLE", { size: 10, font: "'Press Start 2P'" }),
            k.pos(k.center().x, k.center().y + 80),
            k.anchor("center"),
            k.color(150, 150, 150),
            k.z(302) 
        ]);
    }

    // The Helper Text
    ui.add([
        k.text("WALK AWAY TO CLOSE", { size: 10, font: "'Press Start 2P'" }),
        k.pos(k.center().x, k.center().y + 150),
        k.anchor("center"),
        k.color(100, 100, 100),
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

    k.add([
        k.sprite("scroll", { width: k.width() - 320, height: FIXED_HEIGHT }),
        k.pos(k.center().x - 125, boxY), 
        k.anchor("center"), 
        k.fixed(), 
        k.z(100), 
        "dialogue-ui"
    ]);

    k.add([
        k.text(speaker, { size: 18, font: "'Press Start 2P'" }),
        k.pos(80, boxY - (FIXED_HEIGHT / 2)), 
        k.color(255, 223, 0), 
        k.fixed(), 
        k.z(101), 
        "dialogue-ui"
    ]);

    k.add([
        k.text(message, { size: 14, width: k.width() - 250, lineSpacing: 8, font: "'Press Start 2P'" }),
        k.pos(k.center().x - 50, boxY + 10), 
        k.anchor("center"), 
        k.color(46, 15, 58), 
        k.fixed(), 
        k.z(101), 
        "dialogue-ui"
    ]);

    k.add([
        k.text("SPACE TO CYCLE >", { size: 10, font: "'Press Start 2P'" }),
        k.pos(k.width() - 300, boxY + (FIXED_HEIGHT / 2) - 25), 
        k.anchor("right"), 
        k.color(0,0,0), 
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

// Updated HUD to show Cats instead of text badges
function updateInventoryHUD() {
    const list = document.getElementById("tool-list");
    if (list) {
        list.innerHTML = Array.from(gameState.badges).map(b => 
            `<div class="tool-item" style="text-align: center;">
                <img src="assets/cat.png" style="width: 32px; height: 32px; display: block; margin: 0 auto;">
                <span style="font-size: 8px;">${b}</span>
            </div>`
        ).join("");
    }
}

function spawnPlayer(posX, posY) {
    const player = k.add([
        k.sprite("main_tiles", { frame: getFrame(1, 8) }), 
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
            showLoopingDialogue("SYSTEM", ["LEVELLING-UP IS NOT SO CHEAP, RETURN WITH 6 CATS OF KNOWLEDGE TO EARN YOUR KEEP."], 0);
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
            
            const shard = k.add([
                k.sprite("crystals", { frame: s.frame }),
                k.pos(pos.x, pos.y),
                k.scale(1),
                k.z(45), 
                k.area(), 
                k.body({ isStatic: true }), 
                "shard",
                { data: s }
            ]);
            
            const labelY = pos.y + 60; 
            const textSize = 10;
            const padding = 10;
            const txt = k.make([k.text(s.name, { size: textSize, font: "'Press Start 2P'" })]);

            k.add([
                k.rect(txt.width + padding, txt.height + padding),
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
                k.setCursor("default"); // Failsafe to ensure cursor returns to normal when walking away
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

    const doorY = 180;
    const startX = k.center().x - 350; 
    const spacing = 140; 
    const scale = 3.5;

    spawnPortal(startX, doorY, "inventory", "INVENTORY", scale);
    spawnPortal(startX + spacing, doorY, "delivery", "DELIVERY", scale);
    spawnPortal(startX + spacing * 2, doorY, "reporting", "INSIGHTS", scale);
    spawnPortal(startX + spacing * 3, doorY, "programmatic", "AD EXCHANGE", scale);
    spawnPortal(startX + spacing * 4, doorY, "privacy", "PRIVACY", scale);
    spawnPortal(startX + spacing * 5, doorY, "admin", "ADMIN", scale);

    spawnExitDoor(k.center().x, k.height() - 200);

    player.onCollide("portal", (p) => {
        if (p.dest === "final") { if (!p.locked) triggerLevelUpSequence(); }
        else { gameState.nextSpawn = { x: p.pos.x, y: p.pos.y + 80 }; k.go(p.dest); }
    });
});

// --- DATA (REVISED FOR TEXT & LINKS ONLY) ---

const inventoryShards = [
    { name: "Ad Units", frame: 0, desc: "The basic building block of inventory. It represents the space on your site where ads appear. Check sizes carefully to avoid mismatches.", link: "https://admanager.google.com/15184186#inventory/ad_unit/list" },
    { name: "Placements", frame: 1, desc: "Groups of ad units where an advertiser's content can be displayed. Used heavily to organize logical areas of a site.", link: "https://admanager.google.com/15184186#inventory/placement/list" },
    { name: "GPT", frame: 2, desc: "Google Publisher Tag. The tagging library for GAM used to dynamically build ad requests after the wrapper finishes its auction.", link: "https://developers.google.com/publisher-tag/guides/learn-basics" },
    { name: "Sites", frame: 3, desc: "Manage specific domains or apps where you intend to serve ads to maintain inventory quality.", link: "https://support.google.com/admanager/answer/10130765" },
    { name: "Key-Values", frame: 4, desc: "Custom targeting variables (e.g., article_id=123). Prebid injects winning bid data into GPT as KVP before the GAM auction.", link: "https://docs.prebid.org/adops/key-values.html" },
    { name: "Audiences", frame: 5, desc: "1st & 3rd party audience segments, custom audience segments, retargeting, and key-value audience targeting profiles.", link: "https://support.google.com/google-ads/answer/7538811" },
    { name: "Pricing Rules", frame: 6, desc: "Manage pricing rules and first look floors to ensure you never sell inventory programmatically for less than it's worth.", link: "https://support.google.com/admanager/answer/9298008" }
];

const deliveryShards = [
    { name: "Orders & Line Items", frame: 0, desc: "Create and manage orders, line items, and creatives. The Ad Decision Engine compiles and selects eligible campaigns based on these.", link: "https://support.google.com/admanager/answer/9405477" },
    { name: "Creatives", frame: 1, desc: "Manage a wide range of creative formats including standard display, HTML5, VAST support for video, and rich media.", link: "https://support.google.com/admanager/answer/3185155" },
    { name: "Targeting", frame: 2, desc: "Adjust line items with dayparting, device, geography, and specific audience targeting inclusions and exclusions.", link: "https://support.google.com/admanager/answer/9766929" },
    { name: "Prioritization", frame: 3, desc: "Prioritize line items for reserved vs. non-reserved delivery. Sponsorships (4) trump Standard (8) and Price Priority (12).", link: "https://support.google.com/admanager/answer/177279" },
    { name: "Forecasting", frame: 4, desc: "Forecast inventory availability for selling, or review the delivery forecast during an active campaign to optimize pacing.", link: "https://support.google.com/admanager/answer/7649125" },
    { name: "Freq Capping", frame: 5, desc: "Adjust line items with frequency caps to prevent budget waste and user ad-fatigue by limiting impressions per user.", link: "https://support.google.com/admanager/answer/7085745" },
    { name: "Delivery Tools", frame: 6, desc: "The GAM Delivery Inspector is a powerful troubleshooting console used to debug HTTP requests and discover why a line item lost an auction.", link: "N/A" }
];

const insightsShards = [
    { name: "Impressions & Fill", frame: 0, desc: "Track base metrics like impressions, clicks, CTR, revenue, and fill rate to diagnose overall site yield performance.", link: "https://www.pathlabs.com/blog/cpm-vs-cpc-vs-cpa" },
    { name: "Viewability", frame: 1, desc: "Measures whether an ad was actually seen by a human user using JavaScript tracking pixels and strict MRC viewability standards.", link: "https://www.pathlabs.com/blog/cpm-vs-cpc-vs-cpa" },
    { name: "Reach & VCR", frame: 2, desc: "Advanced reporting using dimensions like reach/frequency, audience insights, and Video Completion Rate.", link: "https://www.pathlabs.com/blog/cpm-vs-cpc-vs-cpa" },
    { name: "Buyers & Devices", frame: 3, desc: "Analyze revenue performance by specific buyer, device, or format to identify optimization opportunities across fragmented data.", link: "N/A" }
];

const programmaticShards = [
    { name: "Open Auction & AdX", frame: 0, desc: "The real-time marketplace where buyers bid on unreserved inventory. Understanding RTB protocols is key to optimizing bid density and latency.", link: "https://iabtechlab.com/standards/openrtb" },
    { name: "Header Bidding", frame: 1, desc: "The architecture of client-side vs. server-side bidding. Prebid enables concurrent auctions to evaluate demand before the ad server decides.", link: "https://docs.prebid.org/overview/intro.html" },
    { name: "PMP & PG Deals", frame: 2, desc: "The evolution of direct sales into automated logic. Manage fixed-price agreements and Deal IDs for premium, reserved inventory execution.", link: "https://support.google.com/admanager/answer/7510110" },
    { name: "Unified Auction", frame: 3, desc: "The transition to first-price auctions, ensuring AdX competes concurrently with Header Bidding and Yield Groups on a level playing field.", link: "https://support.google.com/admanager/answer/9266670" },
    { name: "Protections", frame: 4, desc: "Safeguard brand safety by setting strict rules for advertiser URL exclusions, sensitive categories, and preventing fraudulent ad activity.", link: "https://support.google.com/admanager/answer/7063071" }
];

const privacyShards = [
    { name: "GDPR, GPP, MSPA", frame: 0, desc: "The global frameworks dictating user consent. Learn how Consent Management Platforms (CMPs) interact with the IAB TCF parameters.", link: "https://support.google.com/admanager/answer/9805367" },
    { name: "LTD Ads", frame: 1, desc: "Navigating the shift away from third-party cookies by serving ads using contextual signals, the Privacy Sandbox, and Topics API.", link: "https://support.google.com/admanager/answer/11559288" },
    { name: "Data Controls", frame: 2, desc: "Network-level toggles restricting data usage, and the role of Data Clean Rooms (like Ads Data Hub) for privacy-centric attribution matching.", link: "https://developers.google.com/ads-data-hub" }
];

const adminShards = [
    { name: "Users & Roles", frame: 0, desc: "Establish governance with custom permission matrices to secure network access, restrict order visibility, and reduce human error.", link: "https://support.google.com/admanager/answer/60220" },
    { name: "Linked Accounts", frame: 1, desc: "Eliminate data silos by centralizing analytics. Connect Google Analytics 4, AdSense, and AdX directly to your GAM instance.", link: "https://support.google.com/admanager/answer/11186985" },
    { name: "API & CRM", frame: 2, desc: "Access settings for programmatic automation. Utilize server-to-server APIs to synchronize first-party data and external ops tools.", link: "https://developers.google.com/ad-manager/api/start" },
    { name: "Ads.txt & MCM", frame: 3, desc: "Prevent domain spoofing and manage parent/child publisher delegation through Multiple Customer Management and Authorized Digital Sellers.", link: "https://support.google.com/admanager/answer/9335447" },
    { name: "Policy Center", frame: 4, desc: "Monitor and resolve automated quality control flags. Keep inventory monetizable by staying compliant with Google's ad serving restrictions.", link: "https://support.google.com/admanager/answer/9206775" }
];

// Compile all rooms
createRoom("inventory", "KYLE", getFrame(2, 8), "Inventory Cat", [
    "Welcome! I'm Kyle, EVP of Operations!", 
    "Take this Cat of Knowledge to help build your foundation.", 
    "Touch the shards of inventory to see the blueprints of GAM."
], inventoryShards);

createRoom("delivery", "PATRICK", getFrame(4, 8), "Delivery Cat", [
    "I'm Patrick, VP of Publisher Support.", 
    "Here is a Cat of Knowledge to keep your delivery on track.", 
    "Touch the shards of delivery to ensure our ads reach their targets."
], deliveryShards);

createRoom("reporting", "CATHENA", getFrame(4, 9), "Insights Cat", [
    "I am Cathena, the Analyst.", 
    "Accept this Cat of Knowledge to help illuminate your path.", 
    "Touch the shards of insight to turn raw data into strategy."
], insightsShards);

createRoom("programmatic", "DAVID", getFrame(2, 9), "Programmatic Cat", [
    "I'm David, AD of Support Engineering.", 
    "Take this Cat of Knowledge to help you master the auction.", 
    "Touch the shards of programmatic to run the high-speed marketplace."
], programmaticShards);

createRoom("privacy", "RYAN", getFrame(4, 8), "Privacy Cat", [
    "I'm Ryan, Program Manager of Publisher Operations.", 
    "Here is a Cat of Knowledge to guide you safely forward.", 
    "Touch the shards of privacy to keep our data secure and legal."
], privacyShards);

createRoom("admin", "KURT", getFrame(1, 9), "Admin Cat", [
    "I'm Kurt, CEO.", 
    "I'll provide you with the last Cat Of Knowledge you need to complete your journey.", 
    "Touch the shards of administration to configure the network."
], adminShards);

k.go("intro");