"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, SkipBack, SkipForward, ListMusic, Volume2, Disc, Minimize2, Shuffle, ArrowDownUp, ChevronDown, ChevronRight, Repeat1 } from "lucide-react";
import { useMusic } from "../context/MusicContext"; 
import { parseLrc, LyricLine } from "../lib/lrcParser";

export const MusicPlayerModal = ({ isOpen, onClose }: any) => {
    const {
        isPlaying, togglePlay,
        currentTrack,        
        setTrackId,          
        progress, duration,
        audioRef,            
        volume, setVolume,
        playMode, setPlayMode, playNext, playPrev, playQueue,
        activeTab, setActiveTab
    } = useMusic();

    const scrollRef = useRef<HTMLDivElement>(null);
    const [lyrics, setLyrics] = useState<LyricLine[]>([]);
    const [currentLineIndex, setCurrentLineIndex] = useState(-1);
    const [noLyrics, setNoLyrics] = useState(false);
    const [showPlaylist, setShowPlaylist] = useState(false);
    const [showMobileLyrics, setShowMobileLyrics] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<string[]>(["Ave Mujica"]);

    useEffect(() => {
        if (!currentTrack || currentTrack.id === 'silence') return;
        setLyrics([]); setCurrentLineIndex(-1); setNoLyrics(false);

        if (currentTrack.lrc) {
            fetch(encodeURI(currentTrack.lrc))
                .then(res => res.ok ? res.text() : Promise.reject())
                .then(text => {
                    const parsed = parseLrc(text);
                    parsed.length > 0 ? setLyrics(parsed) : setNoLyrics(true);
                }).catch(() => setNoLyrics(true));
        } else {
            setNoLyrics(true);
        }
    }, [currentTrack.id]);

    useEffect(() => {
        if (lyrics.length > 0) {
            const idx = lyrics.findIndex((line, i) => {
                const nextLine = lyrics[i + 1];
                return progress >= line.time && (!nextLine || progress < nextLine.time);
            });
            if (idx !== -1 && idx !== currentLineIndex) {
                setCurrentLineIndex(idx);
                document.getElementById(`lyric-line-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [progress, lyrics]);

    const groupedPlaylist = useMemo(() => {
        const groups: Record<string, any[]> = {};
        const list = playQueue.filter(t => t.category === activeTab); 
        list.forEach(track => {
            (track.groups || []).forEach(g => {
                if (!groups[g]) groups[g] = [];
                groups[g].push(track);
            });
        });
        return groups;
    }, [playQueue, activeTab]);

    const fmtTime = (s: number) => {
        const m = Math.floor(s / 60); const sec = Math.floor(s % 60);
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const cycleMode = () => {
        const modes: any[] = ['sequence', 'reverse', 'loop', 'shuffle'];
        setPlayMode(modes[(modes.indexOf(playMode) + 1) % modes.length]);
    };

    const toggleGroup = (g: string) => setExpandedGroups(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-[200] bg-[#161616] text-white/90 flex flex-col overflow-hidden font-sans select-none"
                >
                    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                        {currentTrack.cover && (
                            <div
                                className="absolute inset-[-50%] bg-cover bg-center opacity-30 blur-[80px] scale-125 transition-all duration-[2000ms]"
                                style={{ backgroundImage: `url(${currentTrack.cover})` }}
                            />
                        )}
                        <div className="absolute inset-0 bg-black/60"></div>
                    </div>

                    <div className="relative z-10 flex justify-between items-center px-6 pb-6 pt-[calc(1.5rem+env(safe-area-inset-top))] text-white/80 shrink-0">
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80">
                            <ChevronDown size={28} className="md:hidden" />
                            <Minimize2 size={24} className="hidden md:block" />
                        </button>
                        <div className="flex flex-col items-center max-w-[60%]">
                            <div className="text-sm md:text-base font-bold truncate text-white">{currentTrack.name}</div>
                            <div className="text-xs text-white/50 truncate">{currentTrack.artist}</div>
                        </div>
                        <div className="w-10"></div>
                    </div>

                    <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center min-h-0 px-0 md:px-12 pb-4 overflow-hidden md:gap-8">

                        <div
                            className="flex-1 w-full h-full flex flex-col md:flex-row relative cursor-pointer md:cursor-default"
                            onClick={() => window.innerWidth < 768 && setShowMobileLyrics(!showMobileLyrics)}
                        >
                            <div className={`flex-1 w-full h-full flex flex-col items-center justify-center relative transition-opacity duration-500
                        ${showMobileLyrics ? 'hidden md:flex' : 'flex'} 
                    `}>
                                <div
                                    className="absolute top-[5%] right-[15%] lg:right-[25%] w-20 h-32 md:w-24 md:h-40 z-30 origin-[16px_16px] transition-transform duration-500 ease-in-out"
                                    style={{ transform: isPlaying ? 'rotate(25deg)' : 'rotate(0deg)' }}
                                >
                                    <div className="absolute -top-4 -left-4 w-10 h-10 bg-[#dcdcdc] rounded-full shadow-lg border border-gray-400 z-20"></div>
                                    <div className="absolute top-2 left-2 w-1.5 h-24 bg-[#f0f0f0] shadow-md origin-top transform rotate-[-10deg] rounded-full z-10"></div>
                                    <div className="absolute top-[90px] left-[-5px] w-1.5 h-16 bg-[#f0f0f0] shadow-md origin-top transform rotate-[20deg] rounded-full z-10"></div>
                                    <div className="absolute top-[145px] left-[18px] w-8 h-12 bg-[#fff] rounded-md shadow-xl border border-gray-300 transform rotate-[20deg] z-20"></div>
                                </div>

                                <div
                                    className="w-[70vw] h-[70vw] max-w-[300px] max-h-[300px] md:w-[450px] md:h-[450px] md:max-w-none md:max-h-none rounded-full bg-[#111] border-[8px] md:border-[10px] border-[#000] shadow-2xl flex items-center justify-center relative animate-spin-slow"
                                    style={{ animationPlayState: isPlaying ? 'running' : 'paused' } as React.CSSProperties}
                                >
                                    <div className="absolute inset-0 rounded-full" style={{ background: 'repeating-radial-gradient(#1a1a1a 0, #1a1a1a 2px, #2a2a2a 3px, #2a2a2a 4px)' }}></div>
                                    <div className="w-[65%] h-[65%] rounded-full overflow-hidden border-[6px] border-[#111] z-10 relative bg-black">
                                        {currentTrack.cover ? (
                                            <img src={currentTrack.cover} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center"><Disc size={80} className="text-white/20" /></div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className={`flex-1 w-full md:max-w-xl h-full flex flex-col items-center justify-center relative transition-opacity duration-500
                        ${!showMobileLyrics ? 'hidden md:flex' : 'flex'}
                    `}>
                                <div
                                    ref={scrollRef}
                                    className="h-[60vh] w-full relative overflow-y-auto scrollbar-hide mask-gradient pr-0 md:pr-48"
                                    style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)' }}
                                >
                                    {noLyrics ? (
                                        <div className="h-full flex items-center justify-center text-white/30 text-sm font-mono tracking-widest">
                                            PURE INSTRUMENTAL
                                        </div>
                                    ) : (
                                        <div ref={scrollRef} className="py-[50vh] space-y-6 text-center px-6">
                                            {lyrics.map((line, i) => (
                                                <div
                                                    key={i}
                                                    id={`lyric-line-${i}`}
                                                    className={`transition-all duration-500 cursor-pointer ${i === currentLineIndex ? 'opacity-100 scale-105' : 'opacity-40 scale-100 hover:opacity-70'}`}

                                                    onClick={(e) => {
                                                        const isMobile = window.innerWidth < 768;

                                                        if (isMobile) {
                                                            return;
                                                        }

                                                        e.stopPropagation();
                                                        if (audioRef.current) audioRef.current.currentTime = line.time;
                                                    }}
                                                >
                                                    <div className={`text-base md:text-xl ${i === currentLineIndex ? 'font-bold text-white' : 'font-medium text-gray-300'}`}>{line.text}</div>
                                                    {line.translation && <div className={`text-xs md:text-sm mt-1 ${i === currentLineIndex ? 'text-white/80' : 'text-gray-500'}`}>{line.translation}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-32 md:h-28 bg-[#121212] border-t border-white/5 px-6 md:px-16 flex flex-col justify-center gap-4 z-[70] shrink-0 relative pb-6 md:pb-0">
                        <div className="w-full max-w-4xl mx-auto flex items-center gap-4 text-[10px] font-mono text-white/40">
                            <span>{fmtTime(progress)}</span>
                            <div className="flex-1 h-1 bg-white/10 rounded-full relative group cursor-pointer">
                                <div className="absolute inset-y-0 left-0 bg-rose-600 rounded-full shadow-[0_0_10px_#e11d48]" style={{ width: `${(progress / (duration || 100)) * 100}%` }}></div>
                                <input type="range" min={0} max={duration || 100} value={progress} onChange={(e) => { if (audioRef.current) audioRef.current.currentTime = Number(e.target.value); }} className="absolute inset-y-[-10px] w-full h-6 opacity-0 cursor-pointer" />
                            </div>
                            <span>{fmtTime(duration)}</span>
                        </div>

                        <div className="flex justify-between items-center w-full max-w-6xl mx-auto">
                            <div className="w-1/4 flex justify-start">
                                <button onClick={cycleMode} className="text-white/50 hover:text-white transition-colors p-2" title={`Mode: ${playMode}`}>
                                    {playMode === 'sequence' && <ListMusic size={22} />}
                                    {playMode === 'reverse' && <ArrowDownUp size={22} />}
                                    {playMode === 'loop' && <Repeat1 size={22} />}
                                    {playMode === 'shuffle' && <Shuffle size={22} />}
                                </button>
                            </div>
                            <div className="flex items-center gap-6 md:gap-10">
                                <button onClick={playPrev} className="text-white/80 hover:text-white hover:scale-110 transition-transform p-2"><SkipBack size={32} /></button>
                                <button onClick={togglePlay} className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                    {isPlaying ? <Pause fill="currentColor" size={28} /> : <Play fill="currentColor" size={28} className="ml-1" />}
                                </button>
                                <button onClick={playNext} className="text-white/80 hover:text-white hover:scale-110 transition-transform p-2"><SkipForward size={32} /></button>
                            </div>
                            <div className="w-1/4 flex justify-end">
                                <button
                                    onClick={() => setShowPlaylist(!showPlaylist)}
                                    className={`text-white/60 hover:text-white transition-colors p-2 relative ${showPlaylist ? 'text-emerald-400' : ''}`}
                                    title="Playlist"
                                >
                                    <ListMusic size={26} />
                                    {showPlaylist && <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-bounce"></span>}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`hidden md:flex fixed top-0 right-0 bottom-28 w-[380px] bg-[#1a1a1a] border-l border-white/10 z-[60] flex-col transition-transform duration-300 ease-in-out shadow-2xl ${showPlaylist ? 'translate-x-0' : 'translate-x-full'}`}
                    >
                        <div className="relative z-50 p-4 border-b border-white/10 flex justify-between items-center bg-[#1a1a1a] shadow-lg shrink-0">
                            <div className="flex gap-2 bg-black/40 p-1 rounded-lg">
                                <button onClick={() => setActiveTab('band')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'band' ? 'bg-white/20 text-white' : 'text-white/40'}`}>Band</button>
                                <button onClick={() => setActiveTab('solo')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'solo' ? 'bg-white/20 text-white' : 'text-white/40'}`}>Solo</button>
                            </div>
                            <button onClick={() => setShowPlaylist(false)} className="p-1.5 hover:bg-white/10 rounded text-white/50 hover:text-white"><X size={18} /></button>
                        </div>
                        <div className="relative z-0 flex-1 overflow-y-auto scrollbar-thin p-0 bg-[#1a1a1a] min-h-0">
                            {Object.entries(groupedPlaylist).map(([groupName, tracks]) => (
                                <div key={groupName} className="mb-2 relative">
                                    <button onClick={() => toggleGroup(groupName)} className="sticky top-0 z-40 w-full flex justify-between items-center p-3 px-4 text-xs font-bold text-white/50 hover:bg-white/5 rounded-none uppercase tracking-wider bg-[#1a1a1a] border-b border-white/5 shadow-sm">
                                        <span>{groupName}</span>
                                        {expandedGroups.includes(groupName) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                    {expandedGroups.includes(groupName) && (
                                        <div className="relative z-0 mt-1 space-y-0.5 pl-0">
                                            {tracks.map((track, i) => (
                                                <button key={`${groupName}-${track.id}`} onClick={() => setTrackId(track.id)} className={`w-full flex items-center p-2.5 px-4 rounded-none hover:bg-white/10 transition-colors text-left gap-3 group ${currentTrack.id === track.id ? 'bg-white/10 border-l-4 border-emerald-500' : ''}`}>
                                                    {currentTrack.id === track.id && isPlaying ? <Volume2 size={14} className="text-emerald-400 shrink-0 animate-pulse" /> : <span className="text-[10px] text-white/20 font-mono w-4 text-center shrink-0">{i + 1}</span>}
                                                    <div className="flex-1 min-w-0">
                                                        <div className={`text-xs truncate font-medium ${currentTrack.id === track.id ? 'text-emerald-400' : 'text-white/80'}`}>{track.name}</div>
                                                        <div className="text-[9px] text-white/30 truncate">{track.artist}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div className="h-10"></div>
                        </div>
                    </div>

                    <div
                        className={`
                    fixed z-[110] bg-[#1e1e1e] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] transition-transform duration-300 ease-in-out
                    bottom-0 left-0 right-0 h-[70vh] rounded-t-2xl border-t border-white/10 flex flex-col md:hidden
                    ${showPlaylist ? 'translate-y-0' : 'translate-y-full'}
                `}
                    >
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#1e1e1e] rounded-t-2xl shrink-0">
                            <div className="text-sm font-bold text-white/90">Play Queue <span className="text-white/40 text-xs ml-1">({playQueue.length})</span></div>
                            <div className="flex gap-2 bg-black/40 p-1 rounded-lg">
                                <button onClick={() => setActiveTab('band')} className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${activeTab === 'band' ? 'bg-white/20 text-white' : 'text-white/40'}`}>Band</button>
                                <button onClick={() => setActiveTab('solo')} className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${activeTab === 'solo' ? 'bg-white/20 text-white' : 'text-white/40'}`}>Solo</button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto scrollbar-thin p-0 bg-[#1e1e1e] min-h-0 pb-safe">
                            {Object.entries(groupedPlaylist).map(([groupName, tracks]) => (
                                <div key={groupName} className="relative">
                                    <button onClick={() => toggleGroup(groupName)} className="sticky top-0 z-10 w-full flex justify-between items-center p-3 px-4 text-xs font-bold text-white/50 bg-[#252525] border-b border-white/5 shadow-sm">
                                        <span>{groupName}</span>
                                        {expandedGroups.includes(groupName) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                    {expandedGroups.includes(groupName) && (
                                        <div className="bg-[#1e1e1e]">
                                            {tracks.map((track, i) => (
                                                <button
                                                    key={`${groupName}-${track.id}`}
                                                    onClick={() => setTrackId(track.id)}
                                                    className={`w-full flex items-center p-3 px-4 transition-colors text-left gap-3 border-b border-white/5 ${currentTrack.id === track.id ? 'bg-white/5' : ''}`}
                                                >
                                                    {currentTrack.id === track.id && isPlaying ? <Volume2 size={16} className="text-rose-500 shrink-0 animate-pulse" /> : <span className="text-xs text-white/20 font-mono w-4 text-center shrink-0">{i + 1}</span>}
                                                    <div className="flex-1 min-w-0">
                                                        <div className={`text-sm truncate font-medium ${currentTrack.id === track.id ? 'text-rose-500' : 'text-white/90'}`}>{track.name}</div>
                                                        <div className="text-xs text-white/40 truncate mt-0.5">{track.artist}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div className="h-20"></div>
                        </div>
                    </div>

                    {showPlaylist && window.innerWidth < 768 && (
                        <div className="fixed inset-0 z-[105] bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setShowPlaylist(false)}></div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};