// --- INITIALIZATION ---
const k = kaplay({
    global: true,
    touchToMouse: true,
    background: [68, 28, 85], // Astronomy Purple
});

// --- ASSETS ---
k.loadSprite("rogue", "assets/rogue.png");
k.loadSprite("prebidWinner", "assets/prebid_winner.png");
k.loadSprite("cat", "assets/cat.png"); // Load the new cat sprite
k.loadSprite("scroll", "assets/scroll.png", {
    slice9: { left: 12, right: 12, top: 12, bottom: 12 }
});
k.loadSprite("main_tiles", "assets/tilemap.png", { sliceX: 12, sliceY: 11 });

k.loadSprite("crystals", "assets/crystals.png", {
    sliceX: 10 // 10 different crystal types in one sprite
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

// --- VISION SYSTEM (PROXIMITY BASED) ---
function showVision(title, description, link) {
    k.destroyAll("vision-overlay"); 

    const ui = k.add([k.fixed(), k.z(300), "vision-overlay"]);

    const boxWidth = 600;
    const boxHeight = 350;

    ui.add([
        k.sprite("scroll", { width: boxWidth, height: boxHeight }),
        k.pos(k.center()),
        k.anchor("center"),
    ]);

    ui.add([
        k.text(title.toUpperCase(), { size: 18, font: "'Press Start 2P'", width: boxWidth - 80, align: "center" }),
        k.pos(k.center().x, k.center().y - 100),
        k.anchor("center"),
        k.color(0, 183, 137)
    ]);

    ui.add([
        k.text(description, { size: 12, font: "'Press Start 2P'", width: boxWidth - 100, lineSpacing: 10, align: "center" }),
        k.pos(k.center().x, k.center().y - 10),
        k.anchor("center"),
        k.color(46, 15, 58)
    ]);

    ui.add([
        k.text("RESOURCES: " + link, { size: 10, font: "'Press Start 2P'", width: boxWidth - 100, align: "center" }),
        k.pos(k.center().x, k.center().y + 80),
        k.anchor("center"),
        k.color(0, 0, 255)
    ]);

    ui.add([
        k.text("WALK AWAY TO CLOSE", { size: 10, font: "'Press Start 2P'" }),
        k.pos(k.center().x, k.center().y + 120),
        k.anchor("center"),
        k.color(100, 100, 100)
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

    // Check if player has already collected all cats upon spawning into the room
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
        k.color(isGamGam ? k.rgb(255, 223, 0) : k.rgb(255, 255, 255)), // Gold if GamGam, white if Sophia
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

            // Shifted X position by 50px to the right for the Background Box
            k.add([
                k.rect(txt.width + padding, txt.height + padding),
                k.pos(pos.x + 30, labelY),
                k.anchor("center"),
                k.color(0, 0, 0),
                k.z(49) 
            ]);

            // Shifted X position by 50px to the right for the Foreground Text
            k.add([
                k.text(s.name, { size: textSize, font: "'Press Start 2P'", align: "center" }),
                k.pos(pos.x + 30, labelY),
                k.anchor("center"),
                k.color(255, 255, 255),
                k.z(50) 
            ]);

            shard.onCollide("player", () => showVision(s.name, s.desc, s.link));
            shard.onCollideEnd("player", () => k.destroyAll("vision-overlay"));
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

// --- DATA & ROOM CREATION ---

const inventoryShards = [
    { name: "Ad Units", frame: 0, desc: "The basic building block of inventory. Represents the space on a site where ads appear.", link: "goo.gle/gam-ad-units" },
    { name: "Placements", frame: 1, desc: "A collection of one or more ad units where an advertiser's content can be displayed.", link: "goo.gle/gam-placements" },
    { name: "GPT", frame: 2, desc: "Google Publisher Tag. The tagging library for GAM to dynamically build ad requests.", link: "goo.gle/gam-gpt" },
    { name: "Sites", frame: 3, desc: "Manage specific domains or apps where you intend to serve ads.", link: "goo.gle/gam-sites" },
    { name: "Apps", frame: 4, desc: "Configure mobile app inventory to enable SDK-based ad rendering.", link: "goo.gle/gam-apps" },
    { name: "URLs", frame: 5, desc: "Target specific content paths or deep-links within your web properties.", link: "goo.gle/gam-urls" },
    { name: "Key-Values", frame: 6, desc: "Custom targeting variables like 'category=sports' for surgical targeting.", link: "goo.gle/gam-key-values" },
    { name: "Audiences", frame: 7, desc: "Groups of users based on interests or behavior across properties.", link: "goo.gle/gam-audiences" },
    { name: "Pricing Rules", frame: 8, desc: "Floor prices ensure you never sell inventory for less than it's worth.", link: "goo.gle/gam-pricing" },
    { name: "Inventory Rules", frame: 9, desc: "Define exclusions and overrides to control what demand fills your space.", link: "goo.gle/gam-rules" }
];

const deliveryShards = [
    { name: "Orders", frame: 0, desc: "An agreement between a publisher and advertiser to run a campaign.", link: "goo.gle/gam-orders" },
    { name: "Line Items", frame: 1, desc: "Defines specific dates, targeting, and pricing for ad delivery.", link: "goo.gle/gam-line-items" },
    { name: "Creatives", frame: 2, desc: "The actual ad media (image, video, HTML5) served to users.", link: "goo.gle/gam-creatives" },
    { name: "Targeting", frame: 3, desc: "Criteria like geo, device, or audience to ensure ads reach the right users.", link: "goo.gle/gam-targeting" },
    { name: "Delivery Settings", frame: 4, desc: "Controls for pacing and display adjustments across campaigns.", link: "goo.gle/gam-delivery-settings" },
    { name: "Prioritization", frame: 5, desc: "Determines which line item serves first based on assigned tiers.", link: "goo.gle/gam-prioritization" },
    { name: "Forecasting", frame: 6, desc: "Predicts future inventory availability to prevent overselling.", link: "goo.gle/gam-forecasting" },
    { name: "Freq Capping", frame: 7, desc: "Limits how many times a user sees the same ad to prevent fatigue.", link: "goo.gle/gam-freq-cap" },
    { name: "Delivery Tools", frame: 8, desc: "Troubleshooting utilities to inspect why an ad did or didn't deliver.", link: "goo.gle/gam-delivery-tools" }
];

const insightsShards = [
    { name: "Impressions", frame: 0, desc: "The number of times an ad is fetched and displayed to a user.", link: "goo.gle/gam-impressions" },
    { name: "CTR", frame: 1, desc: "Click-Through Rate; percentage of impressions that resulted in a click.", link: "goo.gle/gam-ctr" },
    { name: "Fill Rate", frame: 2, desc: "The percentage of ad requests that successfully returned an ad.", link: "goo.gle/gam-fill-rate" },
    { name: "Viewability", frame: 3, desc: "Measures whether an ad was actually seen by a human user.", link: "goo.gle/gam-viewability" },
    { name: "Reach", frame: 4, desc: "The number of unique visitors or devices exposed to a campaign.", link: "goo.gle/gam-reach" },
    { name: "VCR", frame: 5, desc: "Video Completion Rate; percentage of users who watched to the end.", link: "goo.gle/gam-vcr" },
    { name: "Revenue", frame: 6, desc: "Total earnings generated from ad placements across channels.", link: "goo.gle/gam-revenue" },
    { name: "Buyers", frame: 7, desc: "Dimension to analyze performance by specific advertisers or DSPs.", link: "goo.gle/gam-buyers" },
    { name: "Formats", frame: 8, desc: "Tracks performance across display, video, native, and other types.", link: "goo.gle/gam-formats" },
    { name: "Devices", frame: 9, desc: "Analyzes metrics split by desktop, mobile, tablet, and CTV.", link: "goo.gle/gam-devices" }
];

const programmaticShards = [
    { name: "Open Auction", frame: 0, desc: "The marketplace where buyers bid on inventory in real-time.", link: "goo.gle/gam-open-auction" },
    { name: "AdX", frame: 1, desc: "Google Ad Exchange, a premium programmatic marketplace.", link: "goo.gle/gam-adx" },
    { name: "Open Bidding", frame: 2, desc: "Server-side header bidding solution native within GAM.", link: "goo.gle/gam-open-bidding" },
    { name: "PMP", frame: 3, desc: "Private Marketplace; invite-only auctions for premium inventory.", link: "goo.gle/gam-pmp" },
    { name: "Preferred Deal", frame: 4, desc: "A bypassed auction where a buyer gets first look at a fixed price.", link: "goo.gle/gam-preferred-deals" },
    { name: "PG", frame: 5, desc: "Programmatic Guaranteed; automated direct buys with reserved inventory.", link: "goo.gle/gam-pg" },
    { name: "Unified Auction", frame: 6, desc: "Simultaneous competition between AdX and Open Bidding.", link: "goo.gle/gam-unified-auction" },
    { name: "Header Bidding", frame: 7, desc: "Client-side pre-bidding to increase demand competition.", link: "goo.gle/gam-header-bidding" },
    { name: "Yield Groups", frame: 8, desc: "Groups of ad networks and exchanges competing for inventory.", link: "goo.gle/gam-yield-groups" },
    { name: "Protections", frame: 9, desc: "Rules to prevent specific ads or categories from showing on your site.", link: "goo.gle/gam-protections" },
    { name: "Blocking", frame: 0, desc: "Excluding specific advertiser URLs or brands for brand safety.", link: "goo.gle/gam-blocking" }
];

const privacyShards = [
    { name: "GDPR", frame: 0, desc: "General Data Protection Regulation compliance tools for EU users.", link: "goo.gle/gam-gdpr" },
    { name: "GPP", frame: 1, desc: "Global Privacy Platform framework for standardizing consent.", link: "goo.gle/gam-gpp" },
    { name: "MSPA", frame: 2, desc: "Multi-State Privacy Agreement tools for US state regulations.", link: "goo.gle/gam-mspa" },
    { name: "LTD Ads", frame: 3, desc: "Serving non-personalized ads when user consent is restricted.", link: "goo.gle/gam-ltd-ads" },
    { name: "Data Controls", frame: 4, desc: "Settings to restrict how GAM uses data for ad personalization.", link: "goo.gle/gam-data-controls" }
];

const adminShards = [
    { name: "Users", frame: 0, desc: "Manage individual access to the GAM network.", link: "goo.gle/gam-users" },
    { name: "Roles", frame: 1, desc: "Define permissions and access levels for specific user groups.", link: "goo.gle/gam-roles" },
    { name: "Teams", frame: 2, desc: "Restrict access to specific orders or inventory by grouping users.", link: "goo.gle/gam-teams" },
    { name: "Network Settings", frame: 3, desc: "Global configurations for your entire GAM instance.", link: "goo.gle/gam-network" },
    { name: "Linked Accounts", frame: 4, desc: "Connect AdSense, Ad Exchange, or Analytics directly to GAM.", link: "goo.gle/gam-linked-accounts" },
    { name: "API", frame: 5, desc: "Access settings for programmatic integrations and external tools.", link: "goo.gle/gam-api" },
    { name: "Billing", frame: 6, desc: "Manage invoices, payments, and financial reporting.", link: "goo.gle/gam-billing" },
    { name: "CRM/DMP", frame: 7, desc: "Integrate first-party data and customer data platforms.", link: "goo.gle/gam-crm" },
    { name: "Ads.txt", frame: 8, desc: "Authorized Digital Sellers file to prevent domain spoofing and fraud.", link: "goo.gle/gam-ads-txt" },
    { name: "MCM", frame: 9, desc: "Multiple Customer Management for delegated network access.", link: "goo.gle/gam-mcm" },
    { name: "Policy Center", frame: 0, desc: "Monitor and resolve ad serving policy violations.", link: "goo.gle/gam-policy" }
];

// Compile all rooms
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

createRoom("privacy", "RYAN", getFrame(8, 3), "Privacy Cat", [
    "I'm Ryan, Program Manager of Publisher Operations.", 
    "Here is a Cat of Knowledge to guide you safely forward.", 
    "Touch the shards of privacy to keep our data secure and legal."
], privacyShards);

createRoom("admin", "KURT", getFrame(9, 1), "Admin Cat", [
    "I'm Kurt, CEO.", 
    "I'll provide you with the last Cat Of Knowledge you need to complete your journey.", 
    "Touch the shards of administration to configure the network."
], adminShards);


k.go("intro");