"use client";
import { useMusic } from "../context/MusicContext";
import { Play, Pause, SkipForward, SkipBack, Disc, ChevronUp, ChevronDown, X, Music } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export const MiniPlayer = ({
    onExpand,
    rightSidebarOpen,
    themeMode = 'light'
}: {
    onExpand: () => void,
    rightSidebarOpen?: boolean,
    themeMode?: 'light' | 'dark' | 'paper'
}) => {
    const { isPlaying, togglePlay, currentTrack, playNext, playPrev, progress, duration } = useMusic();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(window.innerWidth < 768);
    }, []);

    if (!currentTrack || currentTrack.id === 'silence') return null;

    const percent = duration > 0 ? (progress / duration) * 100 : 0;

    let containerStyle = "bg-white/80 border-gray-200 text-gray-800";
    if (themeMode === 'dark') containerStyle = "bg-[#1a1a20]/90 border-white/10 text-slate-300";
    if (themeMode === 'paper') containerStyle = "bg-[#f5eecf]/90 border-[#d0c8a0] text-[#5c5546]";

    let playBtnStyle = "bg-gray-100 text-rose-500 hover:bg-rose-50";
    if (themeMode === 'dark') playBtnStyle = "bg-white/10 text-white hover:bg-white/20";
    if (themeMode === 'paper') playBtnStyle = "bg-[#d0c8a0] text-[#2c2518] hover:bg-[#c0b890]";

    let progressColor = "bg-rose-500";
    if (themeMode === 'dark') progressColor = "bg-purple-500";
    if (themeMode === 'paper') progressColor = "bg-[#d97706]";

    return (
        <AnimatePresence mode="wait">
            {!isCollapsed && (
                <motion.div
                    key="expanded"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`w-full backdrop-blur-md border-b shadow-sm relative overflow-hidden group z-10 ${containerStyle}`}
                >
                    <div className={`absolute top-0 left-0 h-0.5 z-10 transition-all duration-300 ${progressColor}`} style={{ width: `${percent}%` }}></div>

                    <div className="flex items-center justify-between p-2 px-4 gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={onExpand}>
                            <div className={`w-8 h-8 rounded-full bg-black flex items-center justify-center shrink-0 border border-current/10 ${isPlaying ? 'animate-spin-slow' : ''}`} style={{ animationDuration: '5s' }}>
                                {currentTrack.cover ? <img src={currentTrack.cover} className="w-full h-full rounded-full object-cover opacity-80" /> : <Disc size={16} className="text-white/50" />}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <div className="text-xs font-bold truncate flex items-center gap-1 opacity-90">
                                    {currentTrack.name}
                                    <span className={`text-[9px] font-normal px-1 rounded border opacity-70 ${themeMode === 'paper' ? 'border-[#5c5546] text-[#5c5546]' : 'border-current text-current'}`}>{currentTrack.category === 'band' ? 'LIVE' : 'SOLO'}</span>
                                </div>
                                <div className="text-[10px] truncate opacity-60">{currentTrack.artist}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={playPrev} className="hover:opacity-60 transition-opacity"><SkipBack size={16} /></button>
                            <button onClick={togglePlay} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${playBtnStyle}`}>
                                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                            </button>
                            <button onClick={playNext} className="hover:opacity-60 transition-opacity"><SkipForward size={16} /></button>
                            <div className="w-px h-4 bg-current opacity-20 mx-1"></div>
                            <button onClick={() => setIsCollapsed(true)} className="hover:opacity-60 transition-opacity"><ChevronUp size={16} /></button>
                        </div>
                    </div>
                </motion.div>
            )}

            {isCollapsed && (
                <motion.div
                    key="collapsed"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                        opacity: 1, scale: 1,
                        left: isMobile ? "50%" : "auto",
                        x: isMobile ? "-50%" : 0,
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 250, damping: 20 }}
                    className={`
                    fixed z-[9999] cursor-pointer
                    top-[calc(env(safe-area-inset-top)+60px)]
                    md:top-[70px]
                `}
                    style={{
                        right: !isMobile ? (rightSidebarOpen ? '320px' : '20px') : 'auto'
                    }}

                    onClick={() => setIsCollapsed(false)}
                >
                    {isMobile ? (
                        <div className="flex items-center gap-3 bg-black text-white px-4 py-2.5 rounded-full shadow-2xl border border-white/10 min-w-[140px] justify-center">
                            <div className="flex gap-0.5 items-end h-3">
                                <motion.div animate={{ height: isPlaying ? [4, 10, 4] : 4 }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-rose-500 rounded-full" />
                                <motion.div animate={{ height: isPlaying ? [4, 14, 4] : 4 }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-1 bg-rose-500 rounded-full" />
                                <motion.div animate={{ height: isPlaying ? [4, 8, 4] : 4 }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-rose-500 rounded-full" />
                            </div>
                            <span className="text-xs font-bold truncate max-w-[120px]">{currentTrack.name}</span>
                        </div>
                    ) : (
                        <div className={`flex items-center gap-2 backdrop-blur-md border px-3 py-1.5 rounded-full shadow-lg text-xs font-bold hover:scale-105 transition-all ${containerStyle}`}>
                            <Music size={14} className={isPlaying ? "animate-spin-slow" : ""} />
                            <span>Now Playing</span>
                            <ChevronDown size={14} />
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};