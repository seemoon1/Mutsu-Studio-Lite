import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);
const writeFilePromise = promisify(fs.writeFile);
const unlinkPromise = promisify(fs.unlink);

export async function POST(req: Request) {
  try {
    const { code, language } = await req.json();

    if (language === 'python' || language === 'py') {
      const tempFileName = `temp_${Date.now()}.py`;
      const tempFilePath = path.join(process.cwd(), tempFileName);

      try {
        await writeFilePromise(tempFilePath, code);

        const { stdout, stderr } = await execPromise(`python "${tempFilePath}"`, { timeout: 5000 }); 

        return NextResponse.json({ output: stdout || stderr });
      } catch (error: any) {
        return NextResponse.json({ output: error.stderr || error.message });
      } finally {
        await unlinkPromise(tempFilePath).catch(() => {});
      }
    }

    return NextResponse.json({ output: "Running this language is not supported yet." });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}