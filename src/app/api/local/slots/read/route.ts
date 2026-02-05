import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const { slotIndex } = await req.json();
        const filePath = path.join(process.cwd(), 'data_storage', 'slots', `slot_${slotIndex}.json`);
        
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: "Slot empty" }, { status: 404 });
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        return NextResponse.json({ session: data.sessionSnapshot });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}