let inventory = [];

export function addToInventory(toolName, scriptContent) {
    inventory.push({ name: toolName, code: scriptContent });
    const list = document.getElementById("tool-list");
    list.innerHTML = inventory.map(item => `<div class="tool-item">📜 ${item.name}</div>`).join("");
}

export function downloadToolkit() {
    const header = "--- FREESTAR AD OPS TOOLKIT ---\n\n";
    const text = inventory.map(i => `// ${i.name}\n${i.code}\n`).join("\n\n");
    const blob = new Blob([header + text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "freestar_toolkit.txt";
    a.click();
}