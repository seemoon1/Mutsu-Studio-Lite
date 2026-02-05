import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SLOT_DIR = path.join(process.cwd(), 'data_storage', 'slots');
const THUMB_DIR = path.join(process.cwd(), 'public', 'saves');

const ensureDirs = () => {
    if (!fs.existsSync(SLOT_DIR)) fs.mkdirSync(SLOT_DIR, { recursive: true });
    if (!fs.existsSync(THUMB_DIR)) fs.mkdirSync(THUMB_DIR, { recursive: true });
};

export async function GET() {
    try {
        ensureDirs();
        const files = fs.readdirSync(SLOT_DIR).filter(f => f.startsWith('slot_') && f.endsWith('.json'));
        
        const slots = files.map(file => {
            const content = fs.readFileSync(path.join(SLOT_DIR, file), 'utf-8');
            const data = JSON.parse(content);
            return data.meta; 
        });

        return NextResponse.json({ slots });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        ensureDirs();
        const { slotIndex, session, meta, thumbnailBase64 } = await req.json();

        let publicThumbUrl = null;
        if (thumbnailBase64) {
            const base64Data = thumbnailBase64.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');
            const thumbName = `slot_${slotIndex}.jpg`; 
            
            fs.writeFileSync(path.join(THUMB_DIR, thumbName), buffer);
            publicThumbUrl = `/saves/${thumbName}?t=${Date.now()}`;
        }

        const saveData = {
            meta: {
                ...meta,
                thumbnail: publicThumbUrl, 
                timestamp: Date.now()
            },
            sessionSnapshot: session
        };

        fs.writeFileSync(path.join(SLOT_DIR, `slot_${slotIndex}.json`), JSON.stringify(saveData, null, 2));

        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error("Slot Save Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { slotIndex } = await req.json();
        const jsonPath = path.join(SLOT_DIR, `slot_${slotIndex}.json`);
        const imgPath = path.join(THUMB_DIR, `slot_${slotIndex}.jpg`);

        if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath);
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}