export type BGMTrack = {
  id: string; name: string; artist: string; src: string; 
  cover?: string; lrc?: string; is_bgm: boolean; category: 'band' | 'solo' | 'bgm';
  groups?: string[]; 
};

export const BGM_LIBRARY: BGMTrack[] = [
  {
    id: "demo_music",
    name: "Music (Demo)",
    artist: "System",
    src: "/music/demo.mp3", 
    is_bgm: true,
    category: "bgm"
  }
];