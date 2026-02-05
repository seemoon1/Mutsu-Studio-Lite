import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 💀 [留白]：此处应连接本地 Stable Diffusion WebUI (API)
  // 请自行实现：接收 prompt -> 调用 SD -> 返回 base64
  
  return NextResponse.json({ 
    success: false, 
    error: "Draw API Not Configured. Please implement src/app/api/draw/route.ts" 
  }, { status: 501 });
}