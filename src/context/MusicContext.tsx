"use client";
import React, { createContext, useContext, useState, useRef, useEffect, useMemo } from "react";
import { BGM_LIBRARY, BGMTrack } from "../data/bgm_library";

type MusicContextType = {
  isPlaying: boolean;
  togglePlay: () => void;
  currentTrack: BGMTrack;
  setTrackId: (id: string) => void;
  progress: number;
  duration: number;
  audioRef: React.RefObject<HTMLAudioElement | null>; 
  volume: number;
  setVolume: (v: number) => void;
  playMode: 'sequence' | 'reverse' | 'loop' | 'shuffle';
  setPlayMode: (m: 'sequence' | 'reverse' | 'loop' | 'shuffle') => void;
  playNext: () => void;
  playPrev: () => void;
  playQueue: BGMTrack[];
  activeTab: 'band' | 'solo';
  setActiveTab: (t: 'band' | 'solo') => void;
};

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider = ({ children }: { children: React.ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState<string>("silence"); 
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [playMode, setPlayMode] = useState<'sequence' | 'reverse' | 'loop' | 'shuffle'>('sequence');
  const [activeTab, setActiveTab] = useState<'band' | 'solo'>('band');

  const musicLibrary = useMemo(() => BGM_LIBRARY.filter(t => !t.is_bgm), []);
  const currentTrack = useMemo(() => 
    BGM_LIBRARY.find(t => t.id === currentTrackId) || musicLibrary[0] || BGM_LIBRARY[0], 
  [currentTrackId, musicLibrary]);

  const playQueue = useMemo(() => {
      let queue = [...musicLibrary];
      if (playMode === 'reverse') queue.reverse();
      if (playMode === 'shuffle') {
          queue = queue.sort(() => Math.random() - 0.5);
      }
      return queue;
  }, [musicLibrary, playMode]);

  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    const safeSrc = encodeURI(currentTrack.src);
    if (!decodeURI(audioRef.current.src).endsWith(encodeURI(currentTrack.src))) {
        audioRef.current.src = safeSrc;
        audioRef.current.load();
        if (currentTrackId !== "silence") {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
    }
  }, [currentTrackId]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
        setProgress(audioRef.current.currentTime);
        setDuration(audioRef.current.duration || 0);
    }
  };

  const handleEnded = () => {
      if (playMode === 'loop') {
          audioRef.current?.play();
      } else {
          playNext();
      }
  };

  const togglePlay = () => {
      if (audioRef.current) {
          if (isPlaying) audioRef.current.pause();
          else audioRef.current.play();
          setIsPlaying(!isPlaying);
      }
  };

  const playNext = () => {
      const idx = playQueue.findIndex(t => t.id === currentTrack.id);
      const next = playQueue[(idx + 1) % playQueue.length];
      setCurrentTrackId(next.id);
  };

  const playPrev = () => {
      const idx = playQueue.findIndex(t => t.id === currentTrack.id);
      const prev = playQueue[(idx - 1 + playQueue.length) % playQueue.length];
      setCurrentTrackId(prev.id);
  };

  useEffect(() => {
      if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  return (
    <MusicContext.Provider value={{
        isPlaying, togglePlay, currentTrack, setTrackId: setCurrentTrackId,
        progress, duration, audioRef, volume, setVolume,
        playMode, setPlayMode, playNext, playPrev, playQueue,
        activeTab, setActiveTab
    }}>
        <audio 
            ref={audioRef} 
            onTimeUpdate={handleTimeUpdate} 
            onEnded={handleEnded}
            onError={(e) => console.error("Audio Error:", e)}
        />
        {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error("useMusic must be used within a MusicProvider");
  return context;
};