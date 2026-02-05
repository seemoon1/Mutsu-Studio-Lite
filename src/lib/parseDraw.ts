
export type DrawCommand = {
    trigger: boolean;
    description: string;
    negativePrompt?: string;
    parameters?: {
        width?: number; height?: number; steps?: number; cfg?: number; seed?: number; sampler?: string; denoise?: number;
    };
    charId?: string; 
    outfitId?: string; 
};

export const cleanDrawTag = (content: string) => {
    return content
        .replace(/<draw>[\s\S]*?<\/draw>/g, "")
        .replace(/<draw_log>[\s\S]*?<\/draw_log>/g, "")
        .trim();
};

export const parseDrawTag = (content: string): DrawCommand | null => {
    const match = content.match(/<draw>([\s\S]*?)<\/draw>/);
    if (!match) return null;

    const rawContent = match[1].trim();
    if (!rawContent) return null;

    try {
        const jsonString = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(jsonString);
        
        const desc = data.description || data.prompt || data.positive_prompt || data.tags || "";
        
        const neg = data.negativePrompt || data.negative_prompt || data.neg || "";
        
        const outfit = data.outfitId || data.outfit_id || data.outfit || data.costume || "";

        const rootParams = data.parameters || {};
        const params = {
            width: data.width || rootParams.width,
            height: data.height || rootParams.height,
            steps: data.steps || rootParams.steps,
            cfg: data.cfg || rootParams.cfg,
            seed: data.seed || rootParams.seed,
            sampler: data.sampler || rootParams.sampler || data.scheduler, 
            denoise: data.denoise || rootParams.denoise,
        };

        return {
            trigger: true,
            description: desc,
            negativePrompt: neg,
            parameters: params,
            charId: data.charId || data.char_id || data.character, 
            outfitId: outfit
        };

    } catch (e) {
        return {
            trigger: true,
            description: rawContent,
            parameters: {}
        };
    }
};