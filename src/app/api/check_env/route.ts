import { NextResponse } from "next/server";
import { BGM_LIBRARY } from "../../../data/bgm_library";

export const dynamic = 'force-dynamic'; 

export async function GET() {
  const hasValidMusic = BGM_LIBRARY.length > 1 || (BGM_LIBRARY.length === 1 && BGM_LIBRARY[0].id !== "demo_silence");

  return NextResponse.json({
    hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
    hasGoogle: !!process.env.GOOGLE_API_KEY,
    hasTavily: !!process.env.TAVILY_API_KEY,
    
    hasSdUrl: !!process.env.NEXT_PUBLIC_SD_API_URL, 
    hasTtsUrl: !!process.env.GPT_SOVITS_API_URL,

    hasMusic: hasValidMusic
  });
}