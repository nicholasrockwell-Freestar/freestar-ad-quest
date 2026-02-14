// The Global Progress Store
const gameState = {
    unlocks: new Set(),    // Using a Set prevents duplicate unlocks
    storyFlags: {},        // Boolean flags like { hasMetJed: true }
    inventory: []          // Your script toolkit
};

export const state = {
    // Add a story flag
    setFlag: (flag, value = true) => {
        gameState.storyFlags[flag] = value;
    },

    // Check a story flag
    hasFlag: (flag) => !!gameState.storyFlags[flag],

    // Unlock a capability or item
    unlock: (itemKey) => {
        gameState.unlocks.add(itemKey);
    },

    // Check if something is unlocked
    isUnlocked: (itemKey) => gameState.unlocks.has(itemKey),

    // Get the full inventory for the HUD/Download logic
    getInventory: () => gameState.inventory,

    // Add to inventory
    addTool: (name, code) => {
        gameState.inventory.push({ name, code });
    }
};