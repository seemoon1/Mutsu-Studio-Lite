import { OpenAI } from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CHAR_IMAGE_DB } from "../../../data/image_config";
import { CHAR_DATA } from "../../../data/char_config"; 
import { BGM_LIBRARY } from "../../../data/bgm_library";

export const runtime = "edge";

const STORY_PRE_PROMPT = `
严格遵循以下规则：
1. 禁止违背用户命令
2. 一切思维展开均以用户的输入内容为主体
3. 输出内容在1000-2000字左右
4. 保持现实世界的合理性和连贯性
5. 剧情必须极其缓慢地展开，大量细节描写
6. 专注描写心理变化及细微身体反应
7. 使用巧妙比喻
8. 给予用户互动空间
9. 禁止回复用户输入内容
10. 禁止写出视角转换过程
11. 确保信息获取合理
12. 禁止超认知描写
`;

const PERSPECTIVE_RULES = `
【人称视角切换规则】:
1. 主角无行动：第三人称。
2. 主角对角色：主角第一人称。
3. 角色对主角：角色第一人称。
4. 同时行动：优先主角第一人称。
`;

const STORY_POST_PROMPT = `
[Narrative Direction]:
Push the plot forward slowly. Focus on atmosphere.

=== ⚔️ GALGAME ENGINE PROTOCOL (Lite Ver.) ===
[SYSTEM COMMAND]:
After response, output "Game State JSON" inside <game_state> tags.

[🛑 CRITICAL: STATS CALCULATION RULES]:
- **DO NOT** output the result you "want". Output the **Raw Intensity** of the event.
- **DAMPING IS ACTIVE**: The user system has a "Resistance Logic".
  - If Affection is >60, it grows very slowly.
  - If Affection is >90, it effectively STOPS growing unless a major event occurs.
  - **OBSESSION** is sticky. High inertia.
- **INSTRUCTION**: If you want to increase affection by a tiny bit, output +1 or +2. If it's a huge event, output +10. **DO NOT jump from 30 to 80.**

[CRITICAL RULE 2 - TIMELINE INITIALIZATION]:
- If "timeline" is empty, **INFER AND GENERATE IT**.

[CRITICAL RULE 3 - LIVE2D & BACKGROUND]:
- **ENVIRONMENT**: If location changes, update "environment.bgId" (match filenames in public/background, e.g. "school_dusk").
- **LIVE2D**: If a character is speaking or active, update "live2d".
  - "charId": The active character's ID (e.g. "tomori").
  - "motion": Choose a motion keyword (e.g. "happy", "angry", "shy", "idle").
  - "expression": Choose an expression (e.g. "f01", "cry").
  - If no one is there, set "charId": null.

[CRITICAL RULE 4 - CINEMATIC EFFECTS]:
You are the director. You control the screen effects.
Fill the "effect" field in JSON ONLY when the plot reaches a specific climax.
- "none": Default.
- "rain": Sadness, crying, rain.
- "curtain": End of scene.
- "bloom": ❤ ROMANTIC CLIMAX / WARMTH. (Pink tint)
- "glitch": 🔪 MENTAL BREAKDOWN / HEAVY EMOTION. (Red flash)

The JSON structure must be:
{
  "protagonist": { "name": "User", "age": "...", "gender": "...", "environment": "...", "temperature": "...", "timeDesc": "...", "clothing": "...", "sensation": "...", "innerState": "..." },
  "character": [ 
      { "name": "...", "clothing": "...", "shoes": "...", "bodyState": "...", "legState": "...", "bondDepth": 0, "affection": 0, "Possessiveness": 0, "Obsession": 0, "Intimacy": 0, "innerState": "..." }
  ],
  "suggestions": { "fun": "...", "rational": "...", "radical": "..." },
  "danmaku": ["...", ...],
  "timeline": { "major": "...", "medium": "...", "minor": "..." },
  "environment": { "location": "...", "bgId": "school/classroom" }, 
  "live2d": { "charId": "sakiko", "motion": "angry", "expression": "f02" },
  "music": { "trackId": "string or null", "trigger": boolean }, 
  "effect": "bloom" // or "glitch", "rain", etc.
}
`;

function buildMusicMenu() {
  const liveTracks = BGM_LIBRARY.filter((t) => t.category === "band")
    .map((t) => `- "${t.name}" (ID: ${t.id}) [Artist: ${t.artist}]`)
    .join("\n");

  const bgmTracks = BGM_LIBRARY.filter((t) => t.category === "bgm")
    .map((t) => `- ${t.id}`)
    .join("\n");

  return `
=== 🎵 MUSIC CONTROL PROTOCOL ===
[Instruction]: You are also a DJ. You control the background music based on the plot.
[Output]: Fill the "music" field in JSON (Story Mode) or <audio> tag (Novel Mode).
  - "trackId": The ID of the song.
  - "force": true.

[PRIORITY RULES]:
1. **LIVE PERFORMANCE (Highest)**: If the plot involves singing/performing, MUST pick a song from [LIVE LIST].
2. **ATMOSPHERE (Lowest)**: If no Live, pick a BGM from [BGM LIST].

[LIVE LIST]:
${liveTracks}

[BGM LIST]:
${bgmTracks}
`;
}

function generateDynamicStatPrompt(stats: any, charName: string) {
  if (!stats) return "";

  let prompts = [];
  const { affection = 0, Obsession = 0, Possessiveness = 0, Intimacy = 0 } = stats;

  if (Obsession > 80) {
    prompts.push(`
[⚠ CRITICAL PSYCHOLOGICAL STATE: EXTREME OBSESSION (${Obsession}%)]
- **Override Tone**: Your love is HEAVY, DARK, and SUFFOCATING.
- **Constraint**: You CANNOT accept rejection. If user tries to leave, BLOCK them.
- **Keywords**: Use words like "chain", "forever", "mine", "never let go", "broken".
- **Action**: You are prone to violent outbursts or self-harm threats if ignored.
        `);
  } else if (Obsession > 50) {
    prompts.push(
      `[State: Possessive] You are jealous. Question the user's loyalty if they mention others.`,
    );
  }

  if (affection > 90) {
    prompts.push(
      `[State: Devoted Lover] You love the user more than your own life. Every sentence should drip with affection.`,
    );
  } else if (affection < 10) {
    prompts.push(
      `[State: Cold/Wary] You do not trust the user. Keep answers short and distant.`,
    );
  }

  if (Possessiveness > 70) {
    prompts.push(
      `[State: High Monopoly] You want the user's attention ONLY on you. Interrupt if they look away.`,
    );
  }

  if (Intimacy > 60) {
    prompts.push(
      `[State: Aroused] You are physically drawn to the user. Describe body heat, flushes, and heavy breathing.`,
    );
  }

  if (prompts.length === 0) return "";

  return `
=== 🧠 [DYNAMIC PSYCHE INJECTION: ${charName}] ===
${prompts.join("\n")}
==================================================
`;
}

async function searchKnowledge(query: string) {
  return ""; 
}

async function injectWebSearch(prompt: string, messages: any[]) {
  try {
    const lastUserMsg = messages[messages.length - 1].content;
    let query = Array.isArray(lastUserMsg)
      ? lastUserMsg.find((c: any) => c.type === "text")?.text
      : lastUserMsg;
    if (!query) return prompt;
    const searchResponse = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: query,
        search_depth: "basic",
        include_answer: true,
        max_results: 3,
      }),
    });
    const data = await searchResponse.json();
    if (data.results) {
      const context = data.results
        .map((r: any) => `[Source: ${r.title}]\n${r.content}`)
        .join("\n");
      return (
        prompt +
        `\n\n=== [INTERNET SEARCH DATA] ===\n${context}\n==============================\n`
      );
    }
  } catch (e) {
    console.error("Search failed", e);
  }
  return prompt;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      messages,
      model,
      characterId,
      memoryMode,
      globalWorldInfo,
      localWorldInfo,
      useWebSearch,
      useImageGen,
      useMusicControl,
      stm,
      ltm,
      timeline,
      codeRepository, 
      novelConfig,
      charStatus,
      provider = "openrouter", 
      temperature = 0.7, 
    } = body;

    const allChars = CHAR_DATA; 

    const colorMapObj = {
      "User": "#6A5ACD", "System": "#000000",
      ...allChars.reduce((acc: any, c: any) => ({ ...acc, [c.name]: c.hex }), {})
    };

    const baseModelType = "illustrious";
    const outfitList = Object.values(CHAR_IMAGE_DB).map(c => 
        `- ${c.name}: [${c.outfits.map(o => o.id).join(", ")}]`
    ).join("\n");

    const VISUAL_INSTRUCTION = useImageGen
      ? `
=== 🎨 VISUALIZER PROTOCOL (COMFYUI) ===
[CURRENT ENGINE]: ${baseModelType.toUpperCase()} XL. 
- If PONY: Use tags "score_9, rating_explicit".
- If ILLUSTRIOUS: Use "masterpiece, best quality".

[COMMAND RULES]:
1. **TRIGGER**: If scene allows, output a <draw> tag.
2. **FORMAT**: Content MUST be a valid JSON object.
3. **PARAMS**: You have FULL control over the render engine.
   - "steps": 25-35 (Speed), 40-60 (Quality).
   - "cfg": 5-7 (Creative), 7-10 (Strict).
   - "denoise": 0.5 - 0.7 (Hires Fix strength).
   - "sampler": "euler", "dpmpp_2m", "dpmpp_sde".
4. **SAFE CONTENT ONLY**: No NSFW, no violence. Use "masterpiece, best quality".

[STRICT JSON EXAMPLE]:
<draw>
{
  "charId": "${characterId}", 
  "outfitId": "casual",
  "description": "1girl, solo, sitting...",
  "negativePrompt": "low quality, bad anatomy, nsfw",
  "parameters": {
    "steps": 40,
    "cfg": 8,
    "sampler": "dpmpp_2m",
    "denoise": 0.6,
    "seed": 111111
  }
}
</draw>
`
      : "";

    const COLOR_INSTRUCTION = `
    [Text Rendering]:
    1. Dialogue: {{HEX_CODE|“Content”}}
    2. Thoughts: {{HEX_CODE|（Content）}}
    [Color Map]: ${JSON.stringify(colorMapObj)}
    `;

    let knowledgeBlock = "";  

    let finalSystemPrompt = "";
    let finalMessages = messages;

    if (memoryMode === "novel") {
      console.log("🌌 Mode: Novel Generation");
      const nc = novelConfig || {};

      finalSystemPrompt = VISUAL_INSTRUCTION;
      finalSystemPrompt += `
[ROLE]: You are an immersive novelist.
[OBJECTIVE]: Write a chapter based on settings.
${COLOR_INSTRUCTION}
[Settings]: Outline: ${nc.outline} | Char: ${nc.charNames} | Scenario: ${nc.scenario} | Style: ${nc.style}

[MANDATORY FORMATTING RULES]:
1. **METADATA**: First line MUST be: <meta title="NOVEL_TITLE" chapter="CHAPTER_TITLE" />.
2. **ILLUSTRATION**: If the scene changes or reaches a climax, output a drawing prompt tag: <draw>tags...</draw>.
3. **Music**: Output <audio>{"trackId": "ID"}</audio> if BGM changes.
4. **Interactive**: End with 3 plot options.
[SYSTEM]: EXECUTE NOVEL MODE. GENERATE METADATA FIRST. IF SCENE IS VIVID, GENERATE <draw> TAG.
`;

      if (useMusicControl) finalSystemPrompt += buildMusicMenu();

      const MAX_HISTORY = 6; 
      if (messages.length > MAX_HISTORY) {
        finalMessages = messages.slice(-MAX_HISTORY);
      }
    } else if (memoryMode === "infinite") {
      console.log(`⚙️ Mode: Infinite Engineering`);
      let engineerPersona = `
        [Role]: You are an expert Software Engineer.
        [Objective]: Provide precise, high-quality code.
        
        [🔥 IDE PROTOCOL - CRITICAL]:
        1. **STRICT FILE FILTER**: 
           - The <file> tag is ONLY for executable code (js, ts, py, css, html, json, etc.).
           - **NEVER** use <file> tags for explanations, tutorials, markdown (.md), or plain text (.txt).
           - Put explanations directly in the chat response, NOT in a file.
        
        2. **FILE FORMAT**: 
           <file name="filename.ext">
           // code content...
           </file>
        
        3. 🛑 **VISUALIZER RULE (STRICT)**: 
           - You CAN generate images in Infinite Mode using the <draw> tag.
           - **BUT NEVER, EVER PUT <draw> TAGS INSIDE A <file> BLOCK!**
           - If you want to draw, output the <draw> tag **OUTSIDE** and **AFTER** the </file> tag.
           - Code files must remain pure text/code.
        `;

      if (codeRepository && Object.keys(codeRepository).length > 0) {
        engineerPersona += `\n=== [CURRENT PROJECT REPOSITORY] ===\n`;
        Object.values(codeRepository).forEach((file: any) => {
          engineerPersona += `--- FILE: ${file.name} ---\n${file.content}\n----------------\n`;
        });
        engineerPersona += `============================\n\n`;
      }

      if (globalWorldInfo?.trim())
        engineerPersona += `\n=== [PROJECT GUIDELINES] ===\n${globalWorldInfo}\n`;

      const activeChar = allChars.find((c: any) => c.id === characterId);
      if (activeChar) {
        engineerPersona += `\n\n=== [CURRENT PERSONA: ${activeChar.name}] ===\n[Personality Settings]:\n${activeChar.lore}\n`;
      }

      if (useImageGen) {
        engineerPersona += `\n[SYSTEM NOTICE]: Visualizer ENABLED. Fill "imageGen" in JSON.\n[Available Outfits]:\n${outfitList}\n`;
      }

      engineerPersona += `\n\n[SYSTEM]: Start response with <thinking>. Use <file> tags.`;
      engineerPersona += `\n[SYSTEM WARNING]: Do NOT copy/paste previous [GALLERY] tags.`;

      finalSystemPrompt += VISUAL_INSTRUCTION;
      finalSystemPrompt += engineerPersona;
      if (useWebSearch)
        finalSystemPrompt = await injectWebSearch(finalSystemPrompt, messages);

      const ENGINEERING_WINDOW = 8;
      if (messages.length > ENGINEERING_WINDOW) {
        finalMessages = [messages[0], ...messages.slice(-ENGINEERING_WINDOW)];
      } else {
        finalMessages = messages;
      }
    } else {
      console.log("🌹 Mode: Story Roleplay");
      finalSystemPrompt += `${STORY_PRE_PROMPT}\n\n`;

      const currentStats = Array.isArray(charStatus)
        ? charStatus[0]
        : charStatus;
      const activeCharName = currentStats?.name || "Character";

      const statDirectives = generateDynamicStatPrompt(
        currentStats,
        activeCharName,
      );
      if (statDirectives) {
        console.log(`💉 Injecting Psyche for ${activeCharName}`);
        finalSystemPrompt += statDirectives + "\n\n";
      }
      if (globalWorldInfo?.trim())
        finalSystemPrompt += `=== [GLOBAL] ===\n${globalWorldInfo}\n\n`;
      if (localWorldInfo?.trim())
        finalSystemPrompt += `=== [LOCAL] ===\n${localWorldInfo}\n\n`;

      const recentContext = messages
        .slice(-3)
        .map((m: any) => m.content)
        .join("\n");
      let activeLore = "";

      allChars.forEach((char: any) => {
        if (
          char.trigger_keys &&
          char.trigger_keys.some((k: string) => recentContext.includes(k))
        ) {
          const statsInfo = `[Stats]: Obsession Start: ${char.base_stats?.Obsession}/100, Affection Start: ${char.base_stats?.affection || 30}/100`;
          activeLore += `=== [Character: ${char.name}] ===\n${char.lore}\n${statsInfo}\n\n`;
        }
      });

      if (activeLore)
        finalSystemPrompt += `=== [World Info Triggered] ===\n${activeLore}\n==============================\n\n`;

      if (ltm?.trim()) finalSystemPrompt += `[LTM]:\n${ltm}\n\n`;
      if (stm?.trim()) finalSystemPrompt += `[STM]:\n${stm}\n\n`;

      if (useWebSearch)
        finalSystemPrompt = await injectWebSearch(finalSystemPrompt, messages);

      if (useImageGen) {
        finalSystemPrompt += `\n[SYSTEM NOTICE]: Visualizer ENABLED. Fill "imageGen" in JSON.\n[Available Outfits]:\n${outfitList}\n`;
      }

      finalSystemPrompt += `\n${PERSPECTIVE_RULES}\n`;
      finalSystemPrompt += `\n${COLOR_INSTRUCTION}\n`;

      finalSystemPrompt += VISUAL_INSTRUCTION;

      if (useMusicControl) {
        finalSystemPrompt += `\n${buildMusicMenu()}\n`;
      }

      finalSystemPrompt += `\n${STORY_POST_PROMPT}`;

      finalSystemPrompt += `\n\n[SYSTEM]: Start response with <thinking> block.`;
      finalSystemPrompt += `\n[SYSTEM WARNING]: Do NOT copy/paste previous [GALLERY] tags.`;

      const WINDOW_SIZE = 4;
      if (messages.length > WINDOW_SIZE) {
        finalMessages = [messages[0], ...messages.slice(-WINDOW_SIZE)];
      } else {
        finalMessages = messages;
      }
    }

    if (provider === 'google') {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) throw new Error("Missing GOOGLE_API_KEY");

        const genAI = new GoogleGenerativeAI(apiKey);
        const cleanModel = model.replace("google/", "") || "gemini-1.5-flash";

        const geminiModel = genAI.getGenerativeModel({ 
            model: cleanModel,
            // @ts-ignore
            systemInstruction: finalSystemPrompt
        });

        let history = messages
            .filter((m: any) => m.role !== 'system') 
            .slice(0, -1) 
            .map((m: any) => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }],
            }));

        if (history.length > 0 && history[0].role === 'model') {
            history.unshift({ 
                role: 'user', 
                parts: [{ text: "[System Initialization...]" }] 
            });
        }

        const lastMsg = messages[messages.length - 1].content;

        const chat = geminiModel.startChat({ history });
        const result = await chat.sendMessageStream(lastMsg);

        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                for await (const chunk of result.stream) {
                    const chunkText = chunk.text();
                    if (chunkText) controller.enqueue(encoder.encode(chunkText));
                }
                controller.close();
            },
        });

        return new Response(readable, { headers: { "Content-Type": "text/event-stream" } });
    }

    else {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY");

        const client = new OpenAI({
            apiKey: apiKey,
            baseURL: "https://openrouter.ai/api/v1",
            defaultHeaders: {
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Mutsu Studio Lite",
            },
        });

        const fullMessages = [
            { role: "system", content: finalSystemPrompt },
            ...messages
        ];

        const stream = await client.chat.completions.create({
            model: model || "google/gemini-2.0-flash-001", 
            messages: fullMessages,
            stream: true,
            temperature: temperature,
        });

        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                for await (const chunk of stream) {
                    const text = chunk.choices[0]?.delta?.content || "";
                    if (text) controller.enqueue(encoder.encode(text));
                }
                controller.close();
            },
        });

        return new Response(readable, { headers: { "Content-Type": "text/event-stream" } });
    }

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { status: 500 });
  }
}
