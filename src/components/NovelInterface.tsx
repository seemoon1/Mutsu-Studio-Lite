"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Book, Sparkles, Settings2, AlignLeft,
    LogOut, RefreshCw, X, Edit2, Trash2, Check, 
    Disc, Save, ArrowUp, Sun, Moon, FileText, Square,
    AlertTriangle, CloudRain, 
} from "lucide-react";
import { CHARACTERS, MODEL_DATA } from "../types";
import { MiniPlayer } from "./MiniPlayer";
import { MusicPlayerModal } from "./MusicPlayerModal";
import { useMusic } from "../context/MusicContext";
import { smartColorize } from "../lib/textFormatter";
import { parseDrawTag } from "../lib/parseDraw"; 
import { cleanDrawTag } from "../lib/parseDraw"; 

const THEMES = {
    dark: {
        bg: "bg-[#0a0a0c]",
        sidebar: "bg-[#111116]",
        accent: "text-[#8b5cf6]",
        border: "border-white/10",
        text: "text-slate-300",
        title: "text-white",
        inputBg: "bg-[#1a1a20]/90",
        placeholder: "placeholder-white/20",
        hover: "hover:bg-white/5",
        prose: "prose-invert",
        button: "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-purple-900/30",
        subButton: "bg-white/5 text-white/20 hover:text-white",
        selectBorder: "border-purple-500",
        selectBg: "bg-purple-500/20",
        selectDot: "bg-purple-400",
        focus: "focus:border-purple-500"
    },
    paper: {
        bg: "bg-[#fdf6e3]",
        sidebar: "bg-[#f5eecf]",
        accent: "text-[#d97706]",
        border: "border-[#d0c8a0]",
        text: "text-[#5c5546]",
        title: "text-[#2c2518]",
        inputBg: "bg-[#fffef8]/90",
        placeholder: "placeholder-[#5c5546]/40",
        hover: "hover:bg-[#e6dfc0]",
        prose: "",
        button: "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-[#fffef8] shadow-orange-900/20",
        subButton: "bg-[#5c5546]/10 text-[#5c5546]/40 hover:text-[#2c2518]",
        selectBorder: "border-[#d97706]",
        selectBg: "bg-[#d97706]/10",
        selectDot: "bg-[#d97706]",
        focus: "focus:border-[#d97706]"
    }
};

const PRESETS = [
        { name: "日常 (Daily)", scenario: "放学后的教室", action: "练习吉他 & 闲聊", style: "轻松, 有趣, 互动多" },
        { name: "重逢 (Drama)", scenario: "雨中的天桥", action: "互相倾诉 & 和解", style: "感动, 细腻, 氛围感强" },
        { name: "梦境 (Fantasy)", scenario: "漂浮在空中的花园", action: "探险 & 寻找出口", style: "奇幻, 唯美, 意识流" },
    ];

const MemoryCard = ({ title, value, onSave, theme }: any) => {
    const [isEd, setIsEd] = useState(false);
    const [localVal, setLocalVal] = useState(value || "");
    useEffect(() => { if (!isEd) setLocalVal(value || ""); }, [value, isEd]);
    return (
        <div className={`${theme.inputBg} border ${theme.border} p-3 rounded-xl space-y-2`}>
            <div className="flex justify-between items-center">
                <span className={`text-[10px] font-bold ${theme.text} opacity-70 uppercase tracking-wider`}>{title}</span>
                <div className="flex gap-2">
                    {isEd && <button onClick={() => { setLocalVal(value || ""); setIsEd(false) }} className="text-red-400 hover:text-red-300"><X size={12} /></button>}
                    <button onClick={() => { if (isEd) { if (confirm(`确定要更新 [${title}] 吗？`)) { onSave(localVal); setIsEd(false); } } else { setIsEd(true); } }} className={isEd ? "text-emerald-400 animate-pulse" : `${theme.text} hover:${theme.accent}`}>{isEd ? <Check size={12} /> : <Edit2 size={12} />}</button>
                </div>
            </div>
            <textarea disabled={!isEd} value={localVal} onChange={e => setLocalVal(e.target.value)} className={`w-full bg-transparent text-xs font-mono leading-relaxed outline-none resize-none ${theme.text} ${isEd ? 'opacity-100' : 'opacity-60'}`} rows={4} />
        </div>
    );
};

const NovelContent = ({ content, onOptionClick, theme }: any) => {
    let clean = cleanDrawTag(content) 
        .replace(/<meta.*?\/>/g, "")
        .replace(/<audio>.*?<\/audio>/g, "")
        .trim();

    const optionRegex = /> \*\*Option (\d+)\*\*: (.*)/g;
    const options: string[] = [];
    let match;
    while ((match = optionRegex.exec(clean)) !== null) {
        options.push(match[2]);
    }

    const parts = clean.split(/(!\[.*?\]\(.*?\))/g);

    const renderedText = (
        <span className="whitespace-pre-wrap">
            {parts.map((part: string, i: number) => {
                const imgMatch = part.match(/!\[(.*?)\]\((.*?)\)/);
                if (imgMatch) {
                    const src = imgMatch[2];
                    return (
                        <span key={i} className="block my-6 w-full flex justify-center animate-fade-in">
                            <img
                                src={src}
                                alt="Illustration"
                                className="max-w-full md:max-w-[85%] rounded-lg shadow-lg border border-white/10 transition-transform hover:scale-[1.01] duration-500"
                                loading="lazy"
                            />
                        </span>
                    );
                }

                const coloredSegments = smartColorize(part);

                return (
                    <span key={i}>
                        {coloredSegments.map((seg, j) => (
                            <span
                                key={j}
                                style={seg.type === 'colored' ? {
                                    color: seg.color,
                                    fontWeight: seg.bold ? 'bold' : 'normal'
                                } : {}}
                            >
                                {seg.text}
                            </span>
                        ))}
                    </span>
                );
            })}
        </span>
    );

    return (
        <div className="space-y-6">
            <div className="leading-loose text-justify text-base md:text-lg">
                {renderedText}
            </div>

            {options.length > 0 && (
                <div className={`grid grid-cols-1 gap-3 mt-10 pt-8 border-t ${theme.border}`}>
                    <div className={`text-xs font-mono ${theme.accent} tracking-widest uppercase mb-2 opacity-70`}>
                        Decision Point
                    </div>
                    {options.map((opt, i) => (
                        <button
                            key={i}
                            onClick={() => onOptionClick(opt)}
                            className={`text-left p-4 rounded-xl ${theme.inputBg} border ${theme.border} hover:border-purple-500/50 transition-all group flex gap-4 active:scale-[0.98]`}
                        >
                            <span className={`font-bold ${theme.accent} shrink-0`}>0{i + 1}</span>
                            <span className={`text-sm ${theme.text} font-bold leading-relaxed`}>{opt}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export const NovelInterface = ({
    currentSession, handleSend,
    isLoading, onExit,
    dbChars, updateSessionTitle,
    deleteMessage, updateSessionInfo,
    handleRegenerate, createNewSession,
    stopGeneration, setIsGlobalGenerating,
    onImageGenerated, setSessions,
    syncStatus, onManualSync,
}: any) => {
    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [themeMode, setThemeMode] = useState<'dark' | 'paper'>('dark');
    const theme = THEMES[themeMode];

    const [showFullPlayer, setShowFullPlayer] = useState(false);
    const [useMusicControl, setUseMusicControl] = useState(true);

    const [directorInput, setDirectorInput] = useState("");
    const [selectedCharIds, setSelectedCharIds] = useState<string[]>(["sakiko"]);
    const [selectedModel, setSelectedModel] = useState("google/gemini-3-flash-preview");
    const [scenario, setScenario] = useState("午后的红茶店"); 
    const [action, setAction] = useState("谈心");
    const [style, setStyle] = useState("温馨, 治愈, 心理描写细腻, 2000字");

    const [outline, setOutline] = useState(currentSession.localWorldInfo || "");
    const { currentTrack } = useMusic();
    const lastDrawPromptRef = useRef("");

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chars = dbChars && dbChars.length > 0 ? dbChars : CHARACTERS;

    const [dynamicBg, setDynamicBg] = useState<string | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const generateImage = async (cmdOrPrompt: any) => {
        const cmd = typeof cmdOrPrompt === 'string' ? { description: cmdOrPrompt } : cmdOrPrompt;
        setIsDrawing(true);
        if (setIsGlobalGenerating) setIsGlobalGenerating(true);

        let anchorIndex = -1;
        if (currentSession && currentSession.messages) {
            for (let i = currentSession.messages.length - 1; i >= 0; i--) {
                if (currentSession.messages[i].role === 'assistant') {
                    anchorIndex = i;
                    break;
                }
            }
        }
        console.log(`⚓ Image anchored to message index: ${anchorIndex}`);

        try {
            const configRes = await fetch("/api/draw", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    charId: cmd.charId || selectedCharIds[0], 
                    outfitId: "casual", 
                    description: cmd.description,
                    negativePrompt: cmd.negativePrompt,
                    ...cmd.parameters
                })
            });
            const { payload } = await configRes.json();

            const sdUrl = process.env.NEXT_PUBLIC_SD_API_URL; 

            if (sdUrl) {
                const drawRes = await fetch(`${sdUrl}/sdapi/v1/txt2img`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "69420" },
                    body: JSON.stringify(payload)
                });
                const drawData = await drawRes.json();

                if (drawData.images?.length > 0) {
                    const base64Img = `data:image/jpeg;base64,${drawData.images[0]}`;

                    setDynamicBg(base64Img);

                    if (onImageGenerated) {
                        const meta = {
                            charId: selectedCharIds[0] || 'unknown',
                            outfitId: 'novel_generated',
                            isNSFW: true
                        };

                        onImageGenerated(base64Img, meta).then((url: string) => {
                            console.log("☁️ Novel Image Saved:", url);

                            if (setSessions && currentSession && anchorIndex !== -1) {
                                const sessionId = currentSession.id;
                                const drawTag = `<draw>${prompt}</draw>`;

                                setSessions((prevSessions: any[]) => {
                                    return prevSessions.map(s => {
                                        if (s.id !== sessionId) return s;

                                        const newMessages = [...s.messages];

                                        if (newMessages[anchorIndex]) {
                                            const targetContent = newMessages[anchorIndex].content;

                                            if (!targetContent.includes(url)) {
                                                if (targetContent.includes(drawTag)) {
                                                    newMessages[anchorIndex] = {
                                                        ...newMessages[anchorIndex],
                                                        content: targetContent.replace(
                                                            drawTag,
                                                            `\n\n![Illustration](${url})\n\n`
                                                        )
                                                    };
                                                } else {
                                                    newMessages[anchorIndex] = {
                                                        ...newMessages[anchorIndex],
                                                        content: targetContent + `\n\n![Illustration](${url})\n\n`
                                                    };
                                                }
                                            }
                                        }
                                        return { ...s, messages: newMessages };
                                    });
                                });
                            }
                        });
                    }
                }
            }
        } catch (e) {
            console.error("Auto-Draw Error:", e);
        } finally {
            setIsDrawing(false);
            if (setIsGlobalGenerating) setIsGlobalGenerating(false);
        }
    };

    useEffect(() => {
        const color = themeMode === 'paper' ? '#fdf6e3' : '#0a0a0c';

        document.body.style.backgroundColor = color;
        document.documentElement.style.backgroundColor = color;

        return () => {
            document.body.style.backgroundColor = '#0a0a0c';
            document.documentElement.style.backgroundColor = '#0a0a0c';
        };
    }, [themeMode]);

    const handleOutlineChange = (val: string) => {
        setOutline(val);
        if (updateSessionInfo) updateSessionInfo(currentSession.id, { localWorldInfo: val });
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

        const lastMsg = currentSession?.messages[currentSession.messages.length - 1];

        if (lastMsg?.role === 'assistant' && !isLoading) { 

            const metaRegex = /<meta title="(.*?)" chapter="(.*?)" \/>/;
            const match = lastMsg.content.match(metaRegex);
            if (match && updateSessionTitle && currentSession.title === "New Dream") {
                updateSessionTitle(currentSession.id, match[1]);
            }

            const drawCmd = parseDrawTag(lastMsg.content);

            if (drawCmd && drawCmd.trigger && !isDrawing) {
                if (drawCmd.description !== lastDrawPromptRef.current) {
                    lastDrawPromptRef.current = drawCmd.description;

                    console.log("🎨 Novel Auto-Draw Triggered:", drawCmd);
                    generateImage(drawCmd); 
                }
            }
        }
    }, [currentSession?.messages, isLoading]);

    const handleGenerate = (type: 'new' | 'continue', optionText?: string) => {
        if (isLoading) return;
        const targetNames = chars.filter((c: any) => selectedCharIds.includes(c.id)).map((c: any) => c.name).join(", ");
        const novelConfig = { charNames: targetNames, scenario, action, style, outline };

        if (type === 'new') {
            const chapterCount = currentSession.messages.filter((m: any) => m.role === 'assistant' && !m.content.includes("（...正在")).length;

            if (chapterCount > 0) {
                if (confirm("⚠️ 当前梦境已有剧情，是否保存并开启一段【全新的梦境】？\n(这会创建一个新的会话)")) {
                    createNewSession(selectedCharIds[0], 'novel');
                    return;
                } else {
                    return; 
                }
            } else {
                const prompt = `[Action]: Start Chapter 1 based on the [Dream Outline]. Introduce the scene and start the action immediately.`;
                handleSend(prompt, undefined, {
                    useMusicControl: true,
                    novelConfig,
                    modelOverride: selectedModel 
                });
            }
        }
        else {
            let prompt = "";
            if (optionText) prompt = `[User Choice]: ${optionText}\n[Instruction]: Continue story.`;
            else if (directorInput.trim()) prompt = `[Director Instruction]: ${directorInput}`;
            else prompt = `[SYSTEM]: Continue the novel. Next Chapter.`;

            handleSend(prompt, undefined, {
                useMusicControl: true,
                novelConfig,
                modelOverride: selectedModel 
            });
        }

        setDirectorInput("");
        if (isMobile) { setLeftOpen(false); setRightOpen(false); }
    };

    const toggleChar = (id: string) => {
        setSelectedCharIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const chapters = currentSession?.messages.map((m: any, i: number) => ({ ...m, realIndex: i })).filter((m: any) => m.role === 'assistant' && !m.content.includes("（...正在")) || [];

    return (
        <div
            className={`fixed inset-0 z-[500] ${theme.bg} ${theme.text} flex overflow-hidden font-serif transition-colors duration-500 h-[100dvh] w-screen overscroll-none`}
            style={{ backgroundColor: themeMode === 'paper' ? '#fdf6e3' : '#0a0a0c' }}
        >
            <div className="fixed inset-0 z-0 pointer-events-none">
                <AnimatePresence>
                    {(dynamicBg || currentTrack?.cover) && (
                        <motion.div
                            key={dynamicBg || currentTrack?.cover}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.3 }} 
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5 }}
                            className="absolute inset-[-20px] bg-cover bg-center blur-[50px] scale-110" 
                            style={{ backgroundImage: `url(${dynamicBg || currentTrack?.cover})` }}
                        />
                    )}
                </AnimatePresence>
                <div className={`absolute inset-0 ${themeMode === 'dark' ? 'bg-black/60' : 'bg-white/60'}`}></div>
            </div>
            <AnimatePresence>
                {leftOpen && (
                    <motion.div
                        key="novel-left-sidebar"
                        initial={isMobile ? { x: "-100%" } : { width: 0, opacity: 0 }}
                        animate={isMobile ? { x: 0 } : { width: 280, opacity: 1 }}
                        exit={isMobile ? { x: "-100%" } : { width: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        className={`
                flex flex-col shrink-0 border-r ${theme.border} ${theme.sidebar}
                ${isMobile
                                ? "fixed inset-y-0 left-0 z-[100] w-[280px] shadow-[10px_0_30px_rgba(0,0,0,0.5)]" // 手机：加重阴影，覆盖在最上层
                                : "relative z-10 shadow-xl" 
                            }
            `}
                    >
                        <div className="w-[280px] h-full flex flex-col">
                            <div className={`
                            border-b ${theme.border} flex items-center justify-between
                            pt-[calc(1.5rem+env(safe-area-inset-top))] pb-6 px-6 
                        `}>
                                <div className="flex items-center gap-3 overflow-hidden"><Book className={theme.accent} size={20} /><span className={`font-bold text-lg tracking-widest ${theme.title} truncate`}>{currentSession.title}</span></div>
                                <button onClick={() => setLeftOpen(false)} className={`${theme.text} hover:${theme.accent}`}><X size={18} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
                                <div className={`text-[10px] font-bold ${theme.text} opacity-60 uppercase mb-2`}>Chapters</div>
                                {chapters.map((msg: any, i: number) => {
                                    const match = msg.content.match(/chapter="(.*?)"/);
                                    const title = match ? match[1] : `Chapter ${i + 1}`;
                                    return (
                                        <div key={i} className="group relative">
                                            <button className={`w-full text-left p-3 rounded-lg ${theme.hover} transition-all border border-transparent`} onClick={() => document.getElementById(`chapter-${i}`)?.scrollIntoView({ behavior: 'smooth' })}>
                                                <div className={`text-xs ${theme.accent} mb-1 font-mono flex justify-between`}><span>Chapter {i + 1}</span><div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 flex gap-1"><div onClick={(e) => { e.stopPropagation(); deleteMessage && deleteMessage(msg.realIndex, 'assistant'); }} className={`opacity-60 hover:opacity-100 hover:text-red-400 cursor-pointer p-1`}><Trash2 size={12} /></div></div></div>
                                                <div className={`text-sm ${theme.title} font-bold truncate`}>{title}</div>
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className={`p-4 border-t ${theme.border}`}><button onClick={onExit} className={`flex items-center gap-2 opacity-60 hover:opacity-100 hover:text-red-400 transition-colors w-full p-2 rounded ${theme.hover} justify-center`}><LogOut size={16} /> <span className="text-xs font-bold">WAKE UP</span></button></div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={` relative z-10  flex-1 flex flex-col relative min-w-0 ${theme.bg} transition-colors duration-500`}>
                <div className={`
                    flex items-center justify-between px-4 border-b ${theme.border} shrink-0
                    pt-[calc(0.5rem+env(safe-area-inset-top))] pb-2 h-auto
                    min-h-[3.5rem]
                `}>
                    <button onClick={() => setLeftOpen(!leftOpen)} className={`p-2 transition-colors opacity-60 hover:opacity-100 ${theme.text}`}><AlignLeft size={20} /></button>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 opacity-50"><Sparkles size={16} className={theme.accent} /><span className="text-xs font-mono tracking-[0.2em] hidden md:inline">DREAM WEAVER</span></div>
                        <button onClick={() => setThemeMode(themeMode === 'dark' ? 'paper' : 'dark')} className={`p-2 rounded-full ${theme.hover} transition-all ${theme.accent}`} title="Theme">{themeMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
                    </div>
                    <button onClick={() => setRightOpen(!rightOpen)} className={`p-2 transition-colors opacity-60 hover:opacity-100 ${theme.text}`}><Settings2 size={20} /></button>
                </div>

                <div className="z-10"><MiniPlayer onExpand={() => setShowFullPlayer(true)} rightSidebarOpen={rightOpen} themeMode={themeMode} /></div>

                <div className="flex-1 overflow-y-auto p-6 md:p-16 scroll-smooth pb-32">
                    <div className="max-w-3xl mx-auto space-y-16">
                        {chapters.map((msg: any, i: number) => {
                            const cleanContent = msg.content.replace(/<meta.*?\/>/, '').trim();
                            const match = msg.content.match(/chapter="(.*?)"/);
                            const title = match ? match[1] : `Chapter ${i + 1}`;
                            return (
                                <div key={i} id={`chapter-${i}`} className="animate-fade-in-up">
                                    <div className="flex items-center gap-4 mb-8 opacity-30 justify-center"><div className={`h-px ${theme.text} w-12`}></div><span className="font-mono text-xs tracking-widest uppercase">{title}</span><div className={`h-px ${theme.text} w-12`}></div></div>
                                    <div className={`prose ${theme.prose} prose-lg md:prose-xl leading-loose ${theme.text} font-serif whitespace-pre-wrap`}>
                                        <NovelContent content={msg.content} onOptionClick={(opt: string) => handleGenerate('continue', opt)} theme={theme} />
                                    </div>
                                </div>
                            )
                        })}
                        {isLoading && <div className="flex justify-center py-10"><Sparkles className={`animate-spin ${theme.accent}`} size={32} /></div>}
                        <div ref={messagesEndRef} className="h-10"></div>
                    </div>
                </div>

                <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[${themeMode === 'dark' ? '#0a0a0c' : '#fdf6e3'}] via-[${themeMode === 'dark' ? '#0a0a0c' : '#fdf6e3'}] to-transparent p-4 pb-6 z-20`}>
                    <div className="max-w-2xl mx-auto flex items-end gap-2">
                        <button onClick={() => { if (!confirm("确定要重写本章吗？")) return; const lastAssistIdx = currentSession.messages.map((m: any, i: number) => ({ ...m, i })).filter((m: any) => m.role === 'assistant').pop()?.i; if (lastAssistIdx) handleRegenerate(lastAssistIdx); }} disabled={isLoading} className={`p-3 mb-1 rounded-full ${theme.inputBg} backdrop-blur border ${theme.border} opacity-60 hover:opacity-100 hover:text-red-400 transition-all shadow-lg ${theme.subButton}`}><RefreshCw size={18} className={isLoading ? "animate-spin" : ""} /></button>

                        <div className={`flex-1 ${theme.inputBg} backdrop-blur-md border ${theme.border} rounded-2xl flex items-center p-2 shadow-2xl transition-all`}>
                            <input value={directorInput} onChange={(e) => setDirectorInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleGenerate('continue')} placeholder="导演指令..." className={`flex-1 bg-transparent border-none outline-none text-sm ${theme.title} px-3 font-sans ${theme.placeholder}`} disabled={isLoading} />

                            {isLoading ? (
                                <button
                                    onClick={stopGeneration}
                                    className={`p-2 rounded-xl transition-all shadow-lg bg-red-600 text-white hover:bg-red-500 animate-pulse`}
                                    title="Stop Generation"
                                >
                                    <Square size={18} fill="currentColor" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleGenerate('continue')}
                                    className={`p-2 rounded-xl transition-all shadow-lg ${theme.button}`}
                                    title="Continue"
                                >
                                    <ArrowUp size={18} />
                                </button>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {rightOpen && (
                    <motion.div
                        key="novel-right-sidebar"
                        initial={isMobile ? { x: "100%" } : { width: 0, opacity: 0 }}
                        animate={isMobile ? { x: 0 } : { width: 320, opacity: 1 }}
                        exit={isMobile ? { x: "100%" } : { width: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        className={`
                flex flex-col shrink-0 border-l ${theme.border} ${theme.sidebar}
                ${isMobile
                                ? "fixed inset-y-0 right-0 z-[100] w-[320px] shadow-[-10px_0_30px_rgba(0,0,0,0.5)]" // 手机：覆盖层
                                : "relative z-10 shadow-xl"
                            }
                pt-safe
            `}
                    >
                        <div className="w-[320px] h-full flex flex-col">
                            <div className={`
                            border-b ${theme.border} flex justify-between items-center
                            pt-[calc(1.5rem+env(safe-area-inset-top))] pb-6 px-6
                        `}>
                                <div><div className={`text-[10px] font-bold ${theme.text} opacity-50 uppercase tracking-widest mb-1`}>Weaver Control</div><h2 className={`text-xl font-serif ${theme.title}`}>设定面板</h2></div>{isMobile && <button onClick={() => setRightOpen(false)} className={`${theme.text} hover:${theme.accent}`}><X /></button>}</div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
                                <div className="space-y-3">
                                    <MemoryCard title="STM (Short Term)" value={currentSession.stm} onSave={(v: string) => updateSessionInfo(currentSession.id, { stm: v })} theme={theme} />
                                    <MemoryCard title="LTM (Long Term)" value={currentSession.ltm} onSave={(v: string) => updateSessionInfo(currentSession.id, { ltm: v })} theme={theme} />
                                </div>

                                <div>
                                    <label className={`text-xs ${theme.accent} font-bold mb-2 block flex items-center gap-2`}><FileText size={14} /> DREAM OUTLINE</label>
                                    <textarea
                                        value={outline}
                                        onChange={e => handleOutlineChange(e.target.value)}
                                        placeholder="绝对准则..."
                                        className={`w-full h-32 ${theme.inputBg} border ${theme.border} rounded p-3 text-xs ${theme.text} ${theme.focus} outline-none resize-none font-mono ${theme.placeholder}`}
                                    />
                                </div>

                                <div className={`${theme.inputBg} p-4 rounded-2xl border ${theme.border} space-y-5 shadow-sm`}>

                                    <div>
                                        <label className={`text-[10px] ${theme.text} opacity-50 font-black uppercase tracking-widest mb-2 block`}>
                                            AI Architect
                                        </label>
                                        <select
                                            value={selectedModel}
                                            onChange={e => setSelectedModel(e.target.value)}
                                            className={`w-full ${theme.bg} border ${theme.border} rounded-lg px-3 py-2 text-xs ${theme.text} outline-none ${theme.focus} transition-all`}
                                        >
                                            {MODEL_DATA.flatMap(g => g.models).map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <button
                                            onClick={onManualSync}
                                            disabled={syncStatus === 'syncing'}
                                            className={`
                                            w-full py-2.5 rounded-xl text-[11px] font-black tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.97]
                                                ${syncStatus === 'syncing'
                                                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 cursor-wait'
                                                    : syncStatus === 'error'
                                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                        : syncStatus === 'success'
                                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                            : `${theme.subButton} border border-transparent hover:border-purple-500/30`}
                                            `}
                                        >
                                            {syncStatus === 'syncing' ? <RefreshCw size={14} className="animate-spin" /> :
                                                syncStatus === 'success' ? <Check size={14} /> :
                                                    syncStatus === 'error' ? <AlertTriangle size={14} /> :
                                                        <CloudRain size={14} />}

                                            <span>{syncStatus === 'idle' ? 'COMMIT TO CLOUD' : syncStatus.toUpperCase()}</span>
                                        </button>

                                        <p className={`text-[9px] text-center mt-2 ${theme.text} opacity-30 font-mono italic`}>
                                            {syncStatus === 'saving' ? 'Auto-saving memory...' : 'Ready for next dream.'}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className={`text-xs ${theme.accent} font-bold mb-3 block uppercase tracking-wider`}>Cast Selection</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {chars.map((c: any) => {
                                            const isSelected = selectedCharIds.includes(c.id);
                                            return (
                                                <button
                                                    key={c.id}
                                                    onClick={() => toggleChar(c.id)}
                                                    className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-all border-2 relative overflow-hidden ${isSelected
                                                        ? `${theme.selectBorder} ${theme.selectBg} shadow-sm`
                                                        : `${theme.border} ${theme.hover} opacity-60 hover:opacity-100`
                                                        }`}
                                                    title={c.name}
                                                >
                                                    {c.avatar}
                                                    {isSelected && (
                                                        <div className={`absolute top-1 right-1 w-2 h-2 rounded-full shadow ${theme.selectDot}`}></div>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div><label className={`text-xs ${theme.text} opacity-50 font-bold mb-2 block uppercase`}>Quick Presets</label><div className="flex flex-wrap gap-2">{PRESETS.map((p, i) => (<button key={i} onClick={() => { setScenario(p.scenario); setAction(p.action); setStyle(p.style); }} className={`px-3 py-1.5 rounded-lg ${theme.inputBg} border ${theme.border} text-[10px] ${theme.text} hover:border-purple-500/50 transition-all`}>{p.name}</button>))}</div></div>

                                <div className="space-y-4">
                                    <div><label className={`text-xs ${theme.text} opacity-70 font-bold mb-1 block`}>Scenario</label><input value={scenario} onChange={e => setScenario(e.target.value)} className={`w-full ${theme.inputBg} border ${theme.border} rounded p-2 text-xs ${theme.text} ${theme.focus} outline-none`} /></div>
                                    <div><label className={`text-xs ${theme.text} opacity-70 font-bold mb-1 block`}>Action / Play</label><textarea value={action} onChange={e => setAction(e.target.value)} className={`w-full h-20 ${theme.inputBg} border ${theme.border} rounded p-2 text-xs ${theme.text} ${theme.focus} outline-none resize-none`} /></div>
                                    <div><label className={`text-xs ${theme.text} opacity-70 font-bold mb-1 block`}>Style</label><input value={style} onChange={e => setStyle(e.target.value)} className={`w-full ${theme.inputBg} border ${theme.border} rounded p-2 text-xs ${theme.text} ${theme.focus} outline-none`} /></div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setUseMusicControl(!useMusicControl)}
                                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${useMusicControl ? 'bg-rose-900/20 border-rose-500/50 text-rose-400' : 'bg-black/20 border-white/5 text-gray-600'}`}
                                    >
                                        <Disc size={14} />
                                        <span className="text-[10px] font-bold">Auto DJ</span>
                                        <span className="text-xs">{useMusicControl ? "ON" : "OFF"}</span>
                                    </button>
                                </div>

                                <button onClick={() => handleGenerate('new')} className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg ${theme.button}`}><Sparkles size={16} /> 生成新梦境 (New)</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Mobile Overlay Mask */}
            {(leftOpen || rightOpen) && isMobile && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 z-[90] backdrop-blur-sm"
                    onClick={() => { setLeftOpen(false); setRightOpen(false) }}
                />
            )}
            <div className="z-[200]">
                <MusicPlayerModal isOpen={showFullPlayer} onClose={() => setShowFullPlayer(false)} />
            </div>
        </div>
    );
};