import { OpenAI } from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { text, previousLtm, mode} = await req.json();
    
    if (!text) return new Response(JSON.stringify({ error: "No text provided" }), { status: 400 });

    const apiKey = process.env.OPENROUTER_API_KEY;
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: { "HTTP-Referer": "http://localhost:3000", "X-Title": "Mutsu Memory" },
    });

    let systemPrompt = "";
    let userPrompt = "";

    if (mode === 'novel_chapter') {
        systemPrompt = `
You are a 'Novel Plot Recorder'.
Your task is to summarize the EVENTS of the provided novel chapter into 1-3 concise sentences.
[Rules]:
1. Focus on WHAT happened and WHAT changed (e.g., "A and B entered the room and did X. B felt Y.").
2. Ignore flowery descriptions, focus on actions and psychological shifts.
3. Output language: Same as the text (Chinese).
`;
        userPrompt = `[Chapter Content to Summarize]:\n${text}`;
    } 
    else if (mode === 'micro') {
        systemPrompt = `
You are a 'Micro-Memory Encoder'. 
Your task is to compress a SINGLE turn of dialogue into a concise, 3rd-person summary sentence.
Rules:
1. Ignore pleasantries.
2. Focus on the core intent.
3. Output ONE or TWO sentences maximum.
4. Language: Same as the conversation (Chinese).
`;
        userPrompt = `[Dialogue to Compress]:\n${text}`;
    } 
    else {
        systemPrompt = `
You are a 'Long-Term Memory Engine'.
Your task is to merge "Recent Short-Term Memory" into "Previous Long-Term Memory".
Rules:
1. Keep the output organized (bullet points).
2. Update facts.
3. Output language: Chinese.
`;
        userPrompt = `[Previous LTM]:\n${previousLtm || "None"}\n\n[Recent STM]:\n${text}\n\nGenerate updated LTM:`;
    }

    const response = await client.chat.completions.create({
      model: "deepseek/deepseek-v3.2", 
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3, 
      max_tokens: 500,
    });

    const summary = response.choices[0]?.message?.content || "";
    return new Response(JSON.stringify({ summary }), { status: 200 });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}