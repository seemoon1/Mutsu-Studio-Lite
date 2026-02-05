"use client";
import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send, Paperclip, Menu, BookOpen, Users, StickyNote,
    RotateCcw, Check, Square, Pencil, Trash2, RefreshCw, Copy, Cpu, FileText,
    Volume2, Loader2, Sparkles, Moon,
    Save, Terminal, ClipboardList, Guitar, Image as ImageIcon, Shirt,
    Disc, ChevronUp, MoreHorizontal, Settings,
    ToggleLeft, ToggleRight, Skull, Binary, CloudRain, AlertTriangle
} from "lucide-react";
import { ThinkingBlock } from "./Common";
import { CHARACTERS } from "../types";
import { WardrobeModal } from "./WardrobeModal";
import { MiniPlayer } from "./MiniPlayer";
import { MusicPlayerModal } from "./MusicPlayerModal";
import { useMusic } from "../context/MusicContext"; 
import ReactMarkdown from "react-markdown";
import { smartColorize } from "../lib/textFormatter";
import { cleanDrawTag } from "../lib/parseDraw";

const DrawPlaceholder = () => (
    <div className="flex items-center gap-3 p-3 my-4 bg-gray-50/50 border border-purple-200/50 rounded-xl animate-pulse backdrop-blur-sm">
        <div className="p-2 bg-purple-100 rounded-full">
            <Sparkles size={16} className="text-purple-500 animate-spin-slow" />
        </div>
        <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-purple-700 tracking-wide">AI ARCHITECT</span>
            <span className="text-[10px] text-purple-400 font-mono">Constructing visual memory...</span>
        </div>
    </div>
);

const renderContent = (text: string) => {
    if (!text) return null;
    let workingText = cleanDrawTag(text);

    try {
        const galleryMatch = workingText.match(/\[GALLERY::([\s\S]*?)\]/);
        let extraImages: string[] = [];
        if (galleryMatch) {
            extraImages = galleryMatch[1].split("::").filter(u => u.trim());
            workingText = workingText.replace(galleryMatch[0], ""); 
        }

        const segments = workingText.split(/(<draw>[\s\S]*?<\/draw>)/g);

        return (
            <div className="flex flex-col gap-2">
                <span className="whitespace-pre-wrap leading-relaxed">
                    {segments.map((segment, i) => {
                        if (segment.startsWith("<draw>")) return <DrawPlaceholder key={i} />;

                        const textParts = smartColorize(segment);
                        return (
                            <span key={i}>
                                {textParts.map((part, j) => {
                                    if (part.type === 'colored') {
                                        return <span key={j} style={{ color: part.color, fontWeight: part.bold ? 'bold' : 'normal' }}>{part.text}</span>;
                                    } else {
                                        const imgParts = part.text.split(/(!\[.*?\]\(.*?\))/g);
                                        return (
                                            <span key={j}>
                                                {imgParts.map((subPart, k) => {
                                                    const imgMatch = subPart.match(/!\[(.*?)\]\((.*?)\)/);
                                                    if (imgMatch) {
                                                        const url = imgMatch[2];
                                                        return (
                                                            <img
                                                                key={k} src={url} alt="generated"
                                                                className="max-w-full rounded-lg my-2 shadow-sm border border-black/5 cursor-pointer hover:opacity-90 transition-opacity"
                                                                style={{ maxHeight: '400px' }}
                                                                onClick={() => window.open(url, '_blank')} 
                                                            />
                                                        );
                                                    }
                                                    return <span key={k}>{subPart}</span>;
                                                })}
                                            </span>
                                        );
                                    }
                                })}
                            </span>
                        );
                    })}
                </span>

                {extraImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {extraImages.map((url, idx) => (
                            <img
                                key={idx} src={url}
                                className="h-32 rounded-lg border shadow-sm object-cover cursor-pointer"
                                onClick={() => window.open(url, '_blank')}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    } catch (error) {
        return <span className="text-gray-800 whitespace-pre-wrap">{text}</span>;
    }
};

const COLOR_MAP: Record<string, string> = {};
CHARACTERS.forEach(c => {
    const key = c.hex.toLowerCase();
    COLOR_MAP[key] = c.id;
});

type DialogueLine = {
    charId: string;   
    charName: string; 
    text: string;     
    color: string;    
};

const parseDialogue = (fullText: string, defaultCharId: string): DialogueLine[] => {
    const lines: DialogueLine[] = [];

    const parts = fullText.split(/(\{\{\s*#?[a-fA-F0-9]{6}\s*\|\s*[\s\S]*?\s*\}\})/g);

    parts.forEach(part => {
        const match = part.match(/\{\{\s*(#?[a-fA-F0-9]{6})\s*\|\s*([\s\S]*?)\s*\}\}/);
        if (match) {
            let color = match[1].toLowerCase();
            if (!color.startsWith("#")) color = "#" + color;
            const content = match[2].trim();

            const charId = COLOR_MAP[color];
            const charInfo = CHARACTERS.find(c => c.id === charId);

            if (charId && charInfo) {
                lines.push({
                    charId: charId,
                    charName: charInfo.name,
                    text: content,
                    color: color
                });
            } else {
            }
        } else {
        }
    });

    if (lines.length === 0 && fullText.trim()) {
        const charInfo = CHARACTERS.find(c => c.id === defaultCharId);
        lines.push({
            charId: defaultCharId,
            charName: charInfo?.name || "AI",
            text: fullText.trim(),
            color: charInfo?.hex || "#000"
        });
    }

    return lines;
};

const DialoguePlayer = ({ content, defaultCharId, onPlay, msgIndex, currentLock }: any) => {
    const lines = parseDialogue(content, defaultCharId);

    if (lines.length === 0) return <span className="text-[10px] text-gray-300 px-2">No Dialogue</span>;

    const handleClick = (text: string, charId: string, idx: number) => {
        if (currentLock) return;

        const charName = CHARACTERS.find(c => c.id === charId)?.name || charId;
        if (!window.confirm(`确定要生成 [${charName}] 的语音吗？`)) {
            return;
        }

        onPlay(text, charId, msgIndex, idx);
    };

    return (
        <div className="flex flex-col gap-1 p-2 bg-white/95 backdrop-blur-md rounded-xl border border-gray-100 shadow-xl min-w-[220px] max-w-[300px]">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1 mb-1 px-1 flex justify-between items-center">
                <span>Voice Deck</span>
                <span className={`text-[9px] px-1 rounded transition-colors ${currentLock ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-500'}`}>
                    {currentLock ? 'GPU BUSY' : 'GPU READY'}
                </span>
            </div>

            {lines.map((line, idx) => {
                const isThisLineLoading = currentLock?.msgId === msgIndex && currentLock?.lineIdx === idx;
                const isDisabled = currentLock !== null;

                return (
                    <button
                        key={idx}
                        disabled={isDisabled}
                        onClick={(e) => { e.stopPropagation(); handleClick(line.text, line.charId, idx); }}
                        className={`
                            flex items-center gap-2.5 text-left p-2 rounded-lg transition-all duration-200 group
                            ${isThisLineLoading ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'hover:bg-gray-50 hover:shadow-sm'}
                            ${isDisabled && !isThisLineLoading ? 'opacity-40 cursor-not-allowed grayscale' : ''}
                        `}
                    >
                        <div
                            className="w-1.5 h-8 rounded-full shrink-0 transition-all group-hover:scale-y-110"
                            style={{ backgroundColor: line.color }}
                        />

                        <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-black leading-none mb-1 opacity-80" style={{ color: line.color }}>
                                {line.charName}
                            </div>
                            <div className="text-xs truncate text-slate-600 font-medium group-hover:text-slate-900">
                                {line.text}
                            </div>
                        </div>

                        <div className="text-gray-300 group-hover:text-emerald-500 shrink-0 transition-colors">
                            {isThisLineLoading ? (
                                <Loader2 size={14} className="animate-spin text-emerald-500" />
                            ) : (
                                <Volume2 size={14} />
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

const Portal = ({ children }: { children: React.ReactNode }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;
    return createPortal(children, document.body);
};

export const ChatInterface = ({
    leftSidebarOpen, setLeftSidebarOpen,
    rightSidebarOpen, setRightSidebarOpen,
    setShowLocalWorld, setShowGlobalWorld,

    currentCharacter, currentSession,
    input, setInput, isLoading,

    selectedModel, customModelId, isMultimodal,

    selectedFile, setSelectedFile,
    fileInputRef, handleFileSelect,

    handleSend, stopGeneration,
    handleRegenerate, handleDeleteMessage,
    handleCopy, copiedIndex, openEditModal,

    voiceVariant, setVoiceVariant,
    handlePlayAudio, playingIndex,

    toggleMemoryMode, setSessions,
    useWebSearch, toggleWebSearch,
    toggleSaveModal,
    toggleCodeRepo,
    dbChars,
    useTTS,
    showToast,
    isGlobalGenerating,
    toggleWardrobe,
    apiProvider, setApiProvider,
    debugMode, setDebugMode,
    triggerEffect,

    currentOutfitId,
    setManualOutfitId,
    createNewSession,
    effectiveConfig,
    charName, outfits,
}: any) => {

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showFullPlayer, setShowFullPlayer] = useState(false);
    const { isPlaying } = useMusic();

    const [showWardrobe, setShowWardrobe] = useState(false);

    const [showMobileTopMenu, setShowMobileTopMenu] = useState(false);

    const [showSettings, setShowSettings] = useState(false);
    const [consoleVisible, setConsoleVisible] = useState(true); 

    const toggleDebugConsole = () => {
        const vcSwitch = document.querySelector('.vc-switch') as HTMLElement;
        if (vcSwitch) {
            const nextState = vcSwitch.style.display === 'none' ? 'block' : 'none';
            vcSwitch.style.display = nextState;
            setConsoleVisible(nextState === 'block');
        } else {
            showToast("Console not found (Mobile Only)");
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentSession?.messages, currentSession?.id, isLoading]);

    const parseResponse = (text: string) => {
        const pattern = /<thinking>([\s\S]*?)<\/thinking>/;
        const match = text.match(pattern);
        if (match) return { thought: match[1].trim(), answer: text.replace(pattern, "").trim() };
        return { thought: null, answer: text };
    };

    const [ttsMenu, setTtsMenu] = useState<{ id: number; top: number; left: number } | null>(null);

    const [generatingLock, setGeneratingLock] = useState<{ msgId: number, lineIdx: number } | null>(null);

    const toggleTTSMenu = (e: React.MouseEvent, index: number) => {
        if (ttsMenu?.id === index) {
            setTtsMenu(null);
            return;
        }

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

        setTtsMenu({
            id: index,
            top: rect.top - 10,
            left: rect.right + 10
        });
    };

    useEffect(() => {
        const closeMenu = () => setTtsMenu(null);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);

    const executeTTS = async (text: string, charId: string, msgId: number, lineIdx: number) => {
        if (generatingLock) return;

        setGeneratingLock({ msgId, lineIdx });

        let targetId = charId;
        if (targetId === "soyo") targetId = voiceVariant === "down" ? "soyo_down" : "soyo_up";
        if (targetId === "sakiko") targetId = voiceVariant === "white" ? "sakiko" : "oblivionis";
        if (targetId === "mutsu") targetId = voiceVariant === "mortis" ? "mortis" : "mutsu";

        if (showToast) showToast(`🎵 Requesting audio for ${targetId}...`);

        try {
            await handlePlayAudio(text, -1, targetId);
        } catch (e) {
            console.error(e);
        } finally {
            setGeneratingLock(null);
        }
    };

    const ToolButtons = ({ isMobile = false }) => (
        <>
            {currentSession?.memoryMode === 'sliding' && (
                <>
                    <button onClick={toggleSaveModal} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold border bg-fuchsia-50 border-fuchsia-200 text-fuchsia-600 hover:bg-fuchsia-100 ${isMobile ? 'w-full justify-center' : ''}`}><Save size={16} /> <span className={isMobile ? "inline" : "hidden md:inline"}>Save</span></button>
                    <div className={`flex gap-1 ${isMobile ? 'w-full justify-center' : ''}`}>
                        <button onClick={() => setShowLocalWorld(true)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 flex items-center gap-1 text-xs"><StickyNote size={16} /> <span className={isMobile ? "inline" : "hidden lg:inline"}>Local</span></button>
                        <button onClick={() => setShowGlobalWorld(true)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 flex items-center gap-1 text-xs"><BookOpen size={16} /> <span className={isMobile ? "inline" : "hidden lg:inline"}>Global</span></button>
                    </div>
                </>
            )}

            {currentSession?.memoryMode === 'infinite' && (
                <>
                    <button onClick={toggleCodeRepo} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold border bg-slate-800 text-blue-400 hover:bg-slate-700 shadow-sm ${isMobile ? 'w-full justify-center' : ''}`}><Terminal size={16} /> <span className={isMobile ? "inline" : "hidden md:inline"}>IDE</span></button>
                    {!isMobile && (
                        <div className="relative">

                            <button
                                onClick={() => setShowWardrobe(prev => !prev)}
                                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold border shadow-sm transition-all
                                        ${showWardrobe
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600 ring-2 ring-emerald-100 ring-offset-1' // 激活状态：加个 ring 更明显
                                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'} // 平时状态
                                     `}
                                title="Toggle Fitting Room"
                            >
                                <Shirt size={16} />
                                <span className="hidden lg:inline">Outfit</span>
                            </button>

                            <WardrobeModal
                                isOpen={showWardrobe}
                                onClose={() => setShowWardrobe(false)}
                                charName={currentCharacter.name}
                                outfits={outfits}
                                currentOutfit={currentOutfitId}
                                onSelect={(id: string) => setManualOutfitId(id)}
                            />
                        </div>
                    )}
                    <button onClick={() => setShowGlobalWorld(true)} className={`p-1.5 hover:bg-gray-100 rounded text-gray-500 flex items-center gap-1 text-xs ${isMobile ? 'w-full justify-center' : ''}`}><ClipboardList size={16} /> <span className={isMobile ? "inline" : "hidden md:inline"}>Guide</span></button>
                </>
            )}
        </>
    );

    return (
        <div className="flex-1 flex flex-col relative min-w-0" style={{ backgroundColor: currentCharacter.hex + "08" }}>

            <header className={`
          flex items-center justify-between px-3 md:px-4 bg-white/95 md:bg-white/80 md:backdrop-blur z-20 border-b border-gray-100/50 shrink-0 relative
          pt-safe h-[calc(3.5rem+env(safe-area-inset-top))]
      `}>

                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                    {!leftSidebarOpen && (
                        <button onClick={() => setLeftSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded text-gray-500 transition-colors"><Menu size={18} /></button>
                    )}
                    <div className="flex flex-col min-w-0 justify-center">
                        <span className="text-sm font-bold flex items-center gap-2 truncate">
                            {currentSession?.memoryMode === 'sliding' ? (
                                <span className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#e11e54] to-[#ff477e] flex items-center gap-2">
                                    <span className="text-xl">🎸</span>
                                    <span>BanG Dream!</span>
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 truncate" style={{ color: currentCharacter.hex }}>
                                    <span className="text-lg">{currentCharacter.avatar}</span>
                                    <span>{currentCharacter.name}</span>
                                </span>
                            )}
                        </span>

                        <span className="text-[10px] text-gray-400 truncate max-w-[120px] md:max-w-xs block">
                            {customModelId || selectedModel.split('/').pop()}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1 md:gap-2">

                    <div className="relative">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            <Settings size={20} />
                        </button>

                        <AnimatePresence>
                            {showSettings && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full right-0 mt-2 w-48 bg-white/95 backdrop-blur border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden p-1"
                                >
                                    <div className="md:hidden">
                                        <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mobile Tools</div>
                                        <button
                                            onClick={toggleDebugConsole}
                                            className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                        >
                                            <span>Debug Console</span>
                                            {consoleVisible ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} className="text-gray-300" />}
                                        </button>
                                    </div>

                                    <div className="hidden md:block">
                                        <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">System</div>
                                        <div className="px-3 py-2 text-xs text-gray-500 flex justify-between">
                                            <span>Ver.</span>
                                            <span className="font-mono">Mutsu v7.0</span>
                                        </div>
                                        <div className="px-3 py-2 text-xs text-gray-500 flex justify-between">
                                            <span>Engine</span>
                                            <span className="font-mono">Next.js 15</span>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100 mt-1 pt-1 px-3 py-2">
                                        <button
                                            onClick={() => setDebugMode(!debugMode)}
                                            className={`w-full flex items-center justify-between text-xs font-bold p-2 rounded-lg transition-all ${debugMode
                                                ? 'bg-red-50 text-red-600 border border-red-200'
                                                : 'bg-gray-50 text-gray-500 border border-transparent hover:bg-gray-100'
                                                }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <Terminal size={14} /> 
                                                <span>DEBUG_MODE</span>
                                            </span>
                                            <div className={`w-2 h-2 rounded-full ${debugMode ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
                                        </button>
                                        <p className="text-[9px] text-gray-300 mt-1 text-center">
                                            Reveal hidden &lt;tags&gt; & logic
                                        </p>
                                    </div>

                                    <div className="border-t border-gray-100 mt-1 pt-1 px-3 py-2">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Dev Tools</div>
                                        <div className="grid grid-cols-4 gap-2">
                                            <button onClick={() => triggerEffect("rain")} className="aspect-square bg-blue-50 text-blue-500 rounded flex items-center justify-center hover:bg-blue-100" title="Rain">
                                                <CloudRain size={14} />
                                            </button>
                                            <button onClick={() => triggerEffect("curtain")} className="aspect-square bg-red-50 text-red-500 rounded flex items-center justify-center hover:bg-red-100" title="Curtain">
                                                <AlertTriangle size={14} />
                                            </button>
                                            <button onClick={() => triggerEffect("math")} className="aspect-square bg-emerald-50 text-emerald-500 rounded flex items-center justify-center hover:bg-emerald-100" title="Math">
                                                <Binary size={14} />
                                            </button>
                                            <button onClick={() => triggerEffect("glitch")} className="aspect-square bg-black text-red-500 rounded flex items-center justify-center hover:bg-zinc-800" title="Glitch">
                                                <Skull size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative"> 
                        <button
                            onClick={() => setShowFullPlayer(true)}
                            className={`relative p-2 hover:bg-gray-100 rounded-full transition-colors ${isPlaying ? 'text-rose-500' : 'text-gray-400'}`}
                            title="Music Player"
                        >
                            <Disc size={20} className={isPlaying ? "animate-spin-slow" : ""} style={{ animationDuration: '3s' }} />

                            {isPlaying && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border border-white z-10"></span>
                            )}
                        </button>
                    </div>

                    <button
                        onClick={() => createNewSession(currentCharacter.id, 'novel')}
                        className="p-2 hover:bg-rose-50 rounded text-rose-400 hover:text-rose-600 transition-colors"
                        title="Enter Novel Mode"
                    >
                        <Moon size={18} />
                    </button>

                    <div className="hidden md:flex items-center gap-1">
                        <ToolButtons isMobile={false} />
                    </div>

                    <div className="md:hidden">
                        <button
                            onClick={() => setShowMobileTopMenu(!showMobileTopMenu)}
                            className={`p-2 rounded-full transition-colors ${showMobileTopMenu ? 'bg-gray-100 text-gray-800' : 'text-gray-400'}`}
                        >
                            {showMobileTopMenu ? <ChevronUp size={20} /> : <MoreHorizontal size={20} />}
                        </button>
                    </div>

                    <button onClick={() => setRightSidebarOpen(!rightSidebarOpen)} className="p-2 hover:bg-gray-100 rounded text-gray-500"><Users size={18} /></button>
                </div>
            </header>

            <AnimatePresence>
                {showMobileTopMenu && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="md:hidden bg-white/90 backdrop-blur border-b border-gray-100 overflow-hidden z-10 shadow-sm"
                    >
                        <div className="p-3 grid grid-cols-4 gap-2">
                            <ToolButtons isMobile={true} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="z-10">
                <MiniPlayer
                    onExpand={() => setShowFullPlayer(true)}
                    rightSidebarOpen={rightSidebarOpen} 
                />
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 md:pr-[350px] space-y-8 scroll-smooth">
                {currentSession?.messages.map((msg: any, i: number) => {
                    let txt = "";
                    let files: any[] = [];
                    if (Array.isArray(msg.content)) {
                        msg.content.forEach((x: any) => {
                            if (x.type === 'text') txt += x.text;
                            if (x.type === 'image_url') files.push(x.image_url.url)
                        })
                    } else {
                        txt = msg.content;
                    }

                    const { thought, answer } = msg.role === 'assistant' ? parseResponse(txt) : { thought: null, answer: txt };

                    const activeDrawMatch = txt.match(/<draw>([\s\S]*?)<\/draw>/);
                    const logDrawMatch = txt.match(/<draw_log>([\s\S]*?)<\/draw_log>/);

                    const rawDrawContent = (activeDrawMatch ? activeDrawMatch[1] : (logDrawMatch ? logDrawMatch[1] : null))?.trim();

                    const msgCharId = msg.characterId || currentSession.characterId;
                    const msgChar = (dbChars?.length ? dbChars : CHARACTERS).find((c: any) => c.id === msgCharId) || currentCharacter;

                    const isLast = i === currentSession.messages.length - 1;
                    const isSecondLast = i === currentSession.messages.length - 2;
                    const isLastUserMsg = msg.role === 'user' && (isLast || isSecondLast);

                    if (msg.role === 'assistant' && !answer && !thought && !files.length) return null;

                    return (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} key={i} className={`group flex gap-4 max-w-3xl md:max-w-4xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs border-2 border-white flex-shrink-0 shadow-sm relative group/avatar"
                                    style={{ backgroundColor: currentSession?.memoryMode === 'sliding' ? '#e11e54' : msgChar.hex }}>
                                    {currentSession?.memoryMode === 'sliding' ? <Guitar size={14} /> : msgChar.avatar}
                                </div>
                            )}

                            <div className="flex flex-col gap-1.5 max-w-[85%] items-start w-full">

                                {files.length > 0 && <div className="flex gap-2 justify-end w-full flex-wrap">{files.map((f: any, idx: number) => <img key={idx} src={f} className="h-32 rounded border shadow-sm object-cover" />)}</div>}

                                {thought && currentSession.memoryMode === 'infinite' && <ThinkingBlock thought={thought} />}

                                {answer && (
                                    <div className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm w-fit ${msg.role === 'user' ? 'bg-slate-800 text-white rounded-br-none ml-auto' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}>
                                        {msg.role === 'assistant' ? renderContent(answer) : <div className="whitespace-pre-wrap">{answer}</div>}
                                        {msg.role === 'assistant' && msg.modelName && <div className="mt-2 pt-2 border-t border-gray-50 flex items-center gap-1.5 text-[9px] font-bold tracking-wider opacity-40 uppercase"><Cpu size={10} /> {msg.modelName.split('/').pop()}</div>}
                                    </div>
                                )}

                                {debugMode && rawDrawContent && msg.role === 'assistant' && (
                                    <div className="w-full mt-2 p-3 bg-[#1e1e1e] rounded-lg border border-yellow-500/30 text-left font-mono text-[10px] shadow-inner overflow-hidden select-text">
                                        <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/10 text-yellow-500">
                                            <span className="flex items-center gap-2 font-bold tracking-wider">
                                                <Terminal size={12} /> AI VISUAL INSTRUCTION
                                            </span>
                                            <span className="text-[9px] opacity-50">RAW JSON</span>
                                        </div>
                                        <pre className="whitespace-pre-wrap break-all text-gray-300">
                                            {(() => {
                                                try { return JSON.stringify(JSON.parse(rawDrawContent), null, 2); }
                                                catch { return rawDrawContent; }
                                            })()}
                                        </pre>
                                    </div>
                                )}

                                <div className={`flex items-center gap-2 transition-opacity text-gray-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 ${msg.role === 'user' ? 'justify-end w-full' : ''}`}>
                                    {msg.role === 'user' ? (
                                        isLastUserMsg && (
                                            <>
                                                <button onClick={() => openEditModal(i, msg.content)} className="p-1 hover:text-emerald-500 rounded"><Pencil size={12} /></button>
                                                <button onClick={() => handleDeleteMessage(i, 'user')} className="p-1 hover:text-red-500 rounded"><Trash2 size={12} /></button>
                                            </>
                                        )
                                    ) : (
                                        <>
                                            {useTTS && (
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); 
                                                            toggleTTSMenu(e, i);
                                                        }}
                                                        className={`p-1 rounded transition-colors ${ttsMenu?.id === i ? 'bg-emerald-100 text-emerald-600' : 'hover:text-emerald-500 text-gray-400'}`}
                                                        title="Voice Selector"
                                                    >
                                                        <Volume2 size={12} />
                                                    </button>

                                                    {ttsMenu?.id === i && (
                                                        <Portal>
                                                            <div
                                                                className="fixed inset-0 z-[9998] cursor-default"
                                                                onClick={() => setTtsMenu(null)}
                                                            />

                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                                style={{
                                                                    position: 'fixed',
                                                                    top: ttsMenu.top,
                                                                    left: ttsMenu.left,
                                                                    transform: 'translateY(-100%)', 
                                                                }}
                                                                className="z-[9999]" 
                                                                onClick={(e) => e.stopPropagation()} 
                                                            >
                                                                <DialoguePlayer
                                                                    content={Array.isArray(msg.content)
                                                                        ? msg.content.find((c: any) => c.type === 'text')?.text || ""
                                                                        : msg.content}
                                                                    defaultCharId={msgCharId}
                                                                    onPlay={executeTTS}
                                                                    msgIndex={i}             
                                                                    currentLock={generatingLock || (isGlobalGenerating ? { msgId: -1, lineIdx: -1 } : null)}
                                                                />
                                                            </motion.div>
                                                        </Portal>
                                                    )}
                                                </div>
                                            )}
                                            <button onClick={() => handleRegenerate(i)} className="p-1 hover:text-emerald-500 rounded"><RefreshCw size={12} /></button>
                                            <button onClick={() => handleCopy(answer, i)} className="p-1 hover:text-emerald-500 rounded">{copiedIndex === i ? <Check size={12} /> : <Copy size={12} />}</button>
                                            {isLast && <button onClick={() => handleDeleteMessage(i, 'assistant')} className="p-1 hover:text-red-500 rounded"><Trash2 size={12} /></button>}
                                        </>
                                    )}
                                </div>
                            </div>
                            {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-gray-500 flex-shrink-0"><Moon size={14} /></div>}
                        </motion.div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white/50 backdrop-blur-sm shrink-0">
                <div
                    className="max-w-3xl mx-auto relative bg-white rounded-2xl border flex items-end focus-within:ring-1 transition-all shadow-sm"
                    style={{
                        borderColor: currentSession?.memoryMode === 'sliding'
                            ? '#e11e54'
                            : (isLoading ? currentCharacter.hex : '#e5e7eb'),

                        boxShadow: isLoading ? `0 0 10px ${currentCharacter.hex}20` : 'none'
                    }}
                >
                    <textarea value={input} style={{ caretColor: currentCharacter.hex }} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }} placeholder={currentSession?.memoryMode === 'sliding' ? "Start your dream..." : `Speak to ${currentCharacter.name}...`} className="w-full bg-transparent border-none outline-none py-3 pl-4 pr-20 resize-none min-h-[50px] max-h-32 text-sm" />
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,video/*,text/plain,.txt" />
                    <div className="absolute bottom-2 right-2 flex gap-1">
                        {isMultimodal && <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-gray-400 hover:text-emerald-500"><Paperclip size={18} /></button>}
                        {isLoading ? <button onClick={stopGeneration} className="p-1.5 bg-red-500 text-white rounded animate-pulse"><Square size={18} fill="currentColor" /></button> : (!input.trim() && !selectedFile && currentSession && currentSession.messages.length > 1) ? <button onClick={() => handleRegenerate(currentSession.messages.length - 1)} className="p-1.5 text-white rounded hover:brightness-110 transition-all" style={{ backgroundColor: currentSession?.memoryMode === 'sliding' ? '#e11e54' : currentCharacter.hex }}><RotateCcw size={18} /></button> : <button onClick={() => handleSend()} disabled={!input.trim() && !selectedFile} className="p-1.5 text-white rounded disabled:opacity-30 hover:brightness-110 transition-all" style={{ backgroundColor: currentSession?.memoryMode === 'sliding' ? '#e11e54' : currentCharacter.hex }}><Send size={18} /></button>}
                    </div>
                </div>
                {selectedFile && <div className="text-xs text-gray-400 mt-1 ml-2 flex items-center gap-2">{selectedFile.type === 'text' ? <FileText size={12} /> : <Paperclip size={12} />} <span>{selectedFile.name}</span><button onClick={() => setSelectedFile(null)} className="text-red-400">×</button></div>}
            </div>

            <MusicPlayerModal isOpen={showFullPlayer} onClose={() => setShowFullPlayer(false)}
            />
        </div>
    );
};