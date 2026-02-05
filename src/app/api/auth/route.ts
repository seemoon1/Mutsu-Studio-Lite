import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    const correctCode = process.env.ACCESS_CODE || "123456"; 

    if (code === correctCode) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Invalid code" }, { status: 401 });
    }
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}