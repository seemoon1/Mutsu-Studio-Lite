const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../src/data');
const TACHIE_FILE = path.join(DATA_DIR, 'tachie_config.json');
const LIVE2D_FILE = path.join(DATA_DIR, 'live2d_config.json');

const EMPTY_TACHIE = {
    "sakiko": { "default": "/tachie/sakiko_placeholder.png" },
    "note": "This is a placeholder. Please put images in /public/tachie and update this file."
};

const EMPTY_LIVE2D = {
    "sakiko": {
        "id": "sakiko",
        "modelUrl": "", 
        "outfits": {},
        "note": "This is a placeholder. Please put models in /public/live2d and run the python scanner."
    }
};

function ensureFile(filePath, defaultContent) {
    if (!fs.existsSync(filePath)) {
        console.log(`[INIT] Missing ${path.basename(filePath)}, creating placeholder...`);
        fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2), 'utf-8');
    } else {
        console.log(`[INIT] Found ${path.basename(filePath)}.`);
    }
}

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

ensureFile(TACHIE_FILE, EMPTY_TACHIE);
ensureFile(LIVE2D_FILE, EMPTY_LIVE2D);

console.log("[INIT] Config check complete.");