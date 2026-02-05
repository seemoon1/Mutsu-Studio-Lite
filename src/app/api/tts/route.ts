import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 💀 [留白]：此处应连接 GPT-SoVITS 或其他 TTS 后端
  // 请自行实现：接收 text/charId -> 调用 TTS -> 返回 AudioBuffer
  
  return NextResponse.json({ 
    error: "TTS API Not Configured. Please implement src/app/api/tts/route.ts" 
  }, { status: 501 });
}