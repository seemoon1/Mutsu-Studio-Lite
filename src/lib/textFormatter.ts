import { CHAR_DATA } from "../data/char_config";

const COLOR_MAP: Record<string, string> = {};

CHAR_DATA.forEach(char => {
    COLOR_MAP[char.name] = char.hex;
    COLOR_MAP[char.id] = char.hex; 
    
    char.keys.forEach(key => {
        COLOR_MAP[key] = char.hex;
    });
});

COLOR_MAP["User"] = "#6A5ACD"; 
COLOR_MAP["Me"] = "#6A5ACD";

export const smartColorize = (text: string) => {
    if (!text) return [];

    const sortedKeys = Object.keys(COLOR_MAP).sort((a, b) => b.length - a.length);
    const nameRegex = new RegExp(`^(${sortedKeys.join('|')})[：:]\\s*(.*)`, 'gm');
    
    let processedText = text.replace(nameRegex, (match, name, content) => {
        return `{{${name}|${content}}}`;
    });

    const parts = processedText.split(/(\{\{(.*?)\|(.*?)\}\})/g);
    
    const result = [];
    
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        const match = part.match(/^\{\{(.*?)\|(.*?)\}\}$/);
        
        if (match) {
            let key = match[1].trim();
            const content = match[2];
            
            let finalColor = "#000000"; 
            let isBold = true;

            if (/^#?[0-9a-fA-F]{6}$/.test(key)) {
                finalColor = key.startsWith('#') ? key : '#' + key;
            }
            else if (COLOR_MAP[key]) {
                finalColor = COLOR_MAP[key];
            }
            else {
                finalColor = "#666"; 
            }

            if (content.startsWith("（") || content.startsWith("(")) {
                isBold = false;
            }

            result.push({
                type: 'colored',
                text: content,
                color: finalColor,
                bold: isBold
            });
            
            i += 2; 
        } else if (part.trim() !== "") {
            if (!part.includes("{{") && !part.includes("}}")) {
                 result.push({ type: 'normal', text: part });
            }
        }
    }

    return result;
};