export interface LyricLine {
  time: number;       
  text: string;       
  translation?: string; 
}

export const parseLrc = (lrcString: string): LyricLine[] => {
  const lines = lrcString.split('\n');
  const temp: { time: number; text: string }[] = [];
  
  const timeRegex = /\[(\d{2}):(\d{2}(?:\.\d+)?)\]/;

  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      const min = parseInt(match[1]);
      const sec = parseFloat(match[2]);
      const time = min * 60 + sec;
      const text = line.replace(timeRegex, '').trim();
      if (text) temp.push({ time, text });
    }
  }

  temp.sort((a, b) => a.time - b.time);

  const result: LyricLine[] = [];
  
  for (let i = 0; i < temp.length; i++) {
    const current = temp[i];
    const next = temp[i + 1];

    if (next && Math.abs(next.time - current.time) < 0.1) {
      result.push({
        time: current.time,
        text: current.text,
        translation: next.text 
      });
      i++; 
    } else {
      result.push({
        time: current.time,
        text: current.text
      });
    }
  }

  return result;
};