import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), 'data_storage');
const MAIN_FILE = path.join(STORAGE_DIR, 'mutsu_save.json');

const ensureDir = () => {
    if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
};

export async function GET() {
    try {
        ensureDir();
        if (fs.existsSync(MAIN_FILE)) {
            const data = fs.readFileSync(MAIN_FILE, 'utf-8');
            const stat = fs.statSync(MAIN_FILE);
            return NextResponse.json({ 
                data: JSON.parse(data), 
                lastModified: stat.mtimeMs 
            });
        }
        return NextResponse.json({ data: null, lastModified: 0 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        ensureDir();
        const { data } = await req.json();
        
        if (fs.existsSync(MAIN_FILE)) {
            const bak1 = path.join(STORAGE_DIR, 'mutsu_save.bak.1.json');
            const bak2 = path.join(STORAGE_DIR, 'mutsu_save.bak.2.json');
            const bak3 = path.join(STORAGE_DIR, 'mutsu_save.bak.3.json');

            if (fs.existsSync(bak2)) fs.copyFileSync(bak2, bak3); 
            if (fs.existsSync(bak1)) fs.copyFileSync(bak1, bak2); 
            fs.copyFileSync(MAIN_FILE, bak1); 
        }

        fs.writeFileSync(MAIN_FILE, JSON.stringify(data, null, 2), 'utf-8');
        
        const stat = fs.statSync(MAIN_FILE);
        return NextResponse.json({ success: true, lastModified: stat.mtimeMs });

    } catch (e: any) {
        console.error("Local Save Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}