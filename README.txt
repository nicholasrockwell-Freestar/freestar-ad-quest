===========================================================
      FREESTAR: AD SERVER QUEST - DEVELOPER MANUAL
===========================================================

This guide explains how to use the "Foundations" modular 
engine to build new levels and interactions.

-----------------------------------------------------------
1. ADDING DIALOGUE (js/utilities/dialogue.js)
-----------------------------------------------------------
The showDialogue function handles the dynamic scroll box.

- REPEATABLE: Leave the autoFlag empty.
  showDialogue(k, "ROGUE", "I say this every time!");

- NON-REPEATABLE: Provide a unique string for autoFlag.
  showDialogue(k, "JED", "Welcome to the quest!", "met_jed");
  // Once 'met_jed' is true in state.js, this won't trigger again.

-----------------------------------------------------------
2. SPAWNING CHARACTERS (js/utilities/characters.js)
-----------------------------------------------------------
Always pass k and the coordinates (posX, posY).

- PLAYER:
  const player = spawnPlayer(k, 100, 200);
  setControls(k, player); // Essential for WASD/Arrows + Wiggle

- ROGUE (GUIDE):
  spawnRogue(k, 500, 300);

-----------------------------------------------------------
3. SPAWNING OBJECTS & GATES (js/utilities/objects.js)
-----------------------------------------------------------
Gates use proximity logic to check for progress.

- SECURE GATE:
  spawnGate(k, 400, 100, "has_console", "Requires GPT Console Opener.");
  // Parameters: k, x, y, requiredStateFlag, lockoutMessage

- TOOL CHESTS (Example Interaction):
  player.onCollide("tool-chest", (c) => {
      k.destroy(c);
      state.addTool("GPT Console Opener", "console.log('Open');");
      state.setFlag("has_console"); // Now all 'has_console' gates will open
  });

-----------------------------------------------------------
4. GLOBAL STATE (js/utilities/state.js)
-----------------------------------------------------------
The state.js file is the "Source of Truth" for all unlocks.

- state.setFlag("name")    -> Mark an event as happened.
- state.hasFlag("name")    -> Check if an event happened.
- state.addTool("n", "c")  -> Add item to Inventory HUD.
- state.isUnlocked("id")   -> Check if a capability is active.

-----------------------------------------------------------
5. REUSABILITY FOLDER STRUCTURE
-----------------------------------------------------------
/index.html        <- Script type="module" src="js/main.js"
/js/main.js        <- Asset loading & Level routing
/js/levels/        <- Individual level logic (level1.js, level2.js)
/js/utilities/     <- The "Plug & Play" tools:
   |-- state.js       (Progress memory)
   |-- dialogue.js    (UI & Text logic)
   |-- characters.js  (Character blueprints)
   |-- objects.js     (Gates and environmental props)

===========================================================