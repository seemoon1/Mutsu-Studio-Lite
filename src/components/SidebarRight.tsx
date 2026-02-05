"use client";
import React, { useState, useEffect } from "react"; 
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, User, Heart, Zap, Skull, Thermometer, Shirt, Footprints, Sparkles, Radio, ChevronLeft, Send, Copy, Lock, Check, Brain, Activity, Moon, Ghost, Bot, ToggleLeft, ToggleRight, X } from "lucide-react";
import { CHAR_DATA } from "../data/char_config";
import { SuggestionModal } from "./Modals";
import { TimelinePanel } from "./TimelinePanel";

const MemoryCard = ({ title, value, onSave, icon: Icon, colorClass }: any) => {
    const [isEd, setIsEd] = useState(false);
    const [localVal, setLocalVal] = useState(value || "");

    useEffect(() => {
        if (!isEd) setLocalVal(value || "");
    }, [value, isEd]);

    const handleSave = () => {
        if (confirm(`⚠️ 确定要修改 [${title}] 吗？`)) {
            onSave(localVal);
            setIsEd(false);
        }
    };

    const handleCancel = () => {
        setLocalVal(value || ""); 
        setIsEd(false);           
    };

    return (
        <div className={`p-2 rounded border transition-all ${isEd ? 'bg-white border-blue-400 ring-2 ring-blue-100 shadow-md' : 'bg-gray-50/50 border-gray-200'}`}>
            <div className="flex justify-between items-center mb-1.5">
                <div className={`text-[10px] font-bold flex items-center gap-1 ${colorClass}`}>
                    <Icon size={10} /> {title}
                </div>
                <div className="flex gap-1">
                    {isEd && (
                        <button onClick={handleCancel} className="text-gray-400 hover:text-red-500 p-0.5" title="Cancel & Re-lock">
                            <X size={10} strokeWidth={3} />
                        </button>
                    )}
                    <button
                        onClick={() => isEd ? handleSave() : setIsEd(true)}
                        className={isEd ? "text-blue-600 animate-pulse p-0.5" : "text-gray-400 hover:text-blue-500 p-0.5"}
                        title={isEd ? "Confirm Save" : "Unlock"}
                    >
                        {isEd ? <Check size={10} strokeWidth={3} /> : <Lock size={10} />}
                    </button>
                </div>
            </div>
            <textarea
                disabled={!isEd}
                value={localVal}
                onChange={(e) => setLocalVal(e.target.value)}
                className={`w-full text-xs bg-transparent outline-none resize-none font-mono leading-relaxed ${isEd ? 'text-gray-800' : 'text-gray-500'}`}
                rows={isEd ? 6 : 3}
                placeholder="Empty..."
            />
        </div>
    );
};

const SidebarRightComponent = ({
    isOpen, onClose,
    activeCharacterId, setActiveCharacterId,
    createNewSession,
    currentSession,
    handleSend,
    setSessions,
    currentSessionId,
    handleToggleVariant, 
    voiceVariant,
    onRepoUpdate, 
    onCharSwitch,
    dbChars,
    currentBgmId, setBgmId
}: any) => {

    const isStoryMode = currentSession?.memoryMode === 'sliding';

    const rawStats = currentSession?.charStatus;
    const charList = Array.isArray(rawStats) ? rawStats : (rawStats ? [rawStats] : []);

    const prota = currentSession?.protagonist;
    const suggestions = currentSession?.plotSuggestions;

    const [pageIndex, setPageIndex] = useState(0);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, text: string }>({ isOpen: false, text: "" });

    useEffect(() => {
        if (pageIndex >= charList.length) setPageIndex(0);
    }, [charList.length]);

    const currentChar = charList[pageIndex];

    const themeColor = currentChar ? (
        (dbChars?.length ? dbChars : CHAR_DATA).find((c: any) => {
            if (c.name === currentChar.name) return true;

            const keywords = c.keys || c.trigger_keys || [];
            return keywords.includes(currentChar.name);
        })?.hex
        || "#9ca3af"
    ) : "#9ca3af";

    const handleTimelineUpdate = (newData: any) => {
        if (!setSessions || !currentSessionId) return;
        setSessions((prev: any) => prev.map((s: any) =>
            s.id === currentSessionId ? { ...s, timeline: newData } : s
        ));
    };

    const StatBar = ({ label, value, color, max = 100, icon: Icon }: any) => {
        let difficultyColor = "bg-gray-200"; 
        if (value >= 90) difficultyColor = "bg-red-900/20"; 

        return (
            <div className="mb-2">
                <div className="flex justify-between text-[10px] mb-1 font-bold text-gray-600">
                    <span className="flex items-center gap-1">
                        {Icon && typeof Icon === 'function' && <Icon size={10} />}
                        {label}
                    </span>
                    <span className={value >= 100 ? "text-red-500 animate-pulse" : ""}>
                        {value >= 100 ? "MAX" : `${value}/${max}`}
                    </span>
                </div>
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${difficultyColor}`}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
                        className="h-full relative"
                        style={{ backgroundColor: color }}
                    >
                        <div className="absolute top-0 right-0 bottom-0 w-[2px] bg-white/50 shadow-[0_0_5px_white]"></div>
                    </motion.div>
                </div>
            </div>
        );
    };

    const SuggestionItem = ({ type, content, colorBg, colorText, colorBorder, icon }: any) => (
        <div
            onClick={() => setConfirmModal({ isOpen: true, text: content })}
            className={`group relative p-2.5 rounded border ${colorBg} ${colorBorder} ${colorText} text-xs cursor-pointer transition-all hover:brightness-95 hover:shadow-sm active:scale-[0.98]`}
        >
            <div className="font-bold flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1">{icon} {type}</span>
                <Send size={10} className="opacity-0 group-hover:opacity-50" />
            </div>
            <div className="leading-relaxed opacity-90">{content}</div>
            <button
                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(content); alert("已复制"); }}
                className="absolute top-2 right-2 p-1.5 bg-white/50 hover:bg-white rounded text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Copy size={10} />
            </button>
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="sidebar-right-panel"
                    initial={{ width: 0 }} animate={{ width: 280 }} exit={{ width: 0 }}
                    className="h-full bg-white flex flex-col shadow-xl z-30 border-l-0 overflow-hidden"
                >
                    <div className="p-3 flex justify-between items-center font-bold text-xs text-gray-500 border-b bg-gray-50/50  pt-[calc(0.75rem+env(safe-area-inset-top))]">
                        <span>{isStoryMode ? "TACTICAL DASHBOARD" : "CAST LIST"}</span>
                        <button onClick={onClose}><ChevronRight size={16} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-thin">
                        {isStoryMode ? (
                            <div className="p-3 space-y-4">
                                {!prota && charList.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-3 opacity-60">
                                        <Radio size={40} className="animate-pulse" />
                                        <div className="text-xs font-mono text-center">WAITING FOR<br />NEURAL LINK...</div>
                                    </div>
                                )}

                                {(currentSession?.timeline || prota) && (
                                    <TimelinePanel timelineData={currentSession?.timeline} onUpdate={handleTimelineUpdate} />
                                )}

                                <div className="space-y-2">
                                    <MemoryCard
                                        title="STM (Short-Term)" value={currentSession?.stm} icon={Activity} colorClass="text-emerald-600"
                                        onSave={(val: string) => { if (setSessions && currentSessionId) setSessions((prev: any) => prev.map((s: any) => s.id === currentSessionId ? { ...s, stm: val } : s)); }}
                                    />
                                    <MemoryCard
                                        title="LTM (Long-Term)" value={currentSession?.ltm} icon={Brain} colorClass="text-blue-600"
                                        onSave={(val: string) => { if (setSessions && currentSessionId) setSessions((prev: any) => prev.map((s: any) => s.id === currentSessionId ? { ...s, ltm: val } : s)); }}
                                    />
                                </div>

                                {prota && (
                                    <div className="rounded-lg border shadow-sm relative overflow-hidden" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-[#E0E0FF]/30 rounded-bl-full -mr-4 -mt-4"></div>
                                        <div className="p-3 relative z-10">
                                            <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wider flex items-center gap-1"><User size={10} /> Protagonist</div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="text-gray-500">Name: <span className="font-bold text-[#6A5ACD]">月 (Yue)</span></div>
                                                <div className="text-gray-500">Time: <span className="text-gray-800">{prota.timeDesc}</span></div>
                                                <div className="text-gray-500 col-span-2">Env: <span className="text-gray-800">{prota.environment}</span></div>
                                                <div className="text-gray-500 col-span-2 flex items-center gap-1"><Thermometer size={10} /> {prota.temperature} | {prota.sensation}</div>
                                                <div className="text-gray-500 col-span-2 italic text-[10px] border-t pt-1 mt-1 border-slate-200">"{prota.innerState}"</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {currentChar && (
                                    <div className="rounded-lg border shadow-sm transition-colors duration-500" style={{ backgroundColor: `${themeColor}10`, borderColor: `${themeColor}40` }}>
                                        <div className="p-3">
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: themeColor }}><Heart size={10} /> Target: {currentChar.name}</div>
                                                {charList.length > 1 && (
                                                    <div className="flex gap-1">
                                                        <button onClick={() => setPageIndex(p => p > 0 ? p - 1 : charList.length - 1)} className="p-1 hover:bg-white rounded shadow-sm"><ChevronLeft size={10} /></button>
                                                        <span className="text-[9px] text-gray-400 self-center">{pageIndex + 1}/{charList.length}</span>
                                                        <button onClick={() => setPageIndex(p => p < charList.length - 1 ? p + 1 : 0)} className="p-1 hover:bg-white rounded shadow-sm"><ChevronRight size={10} /></button>
                                                    </div>
                                                )}
                                            </div>

                                            <StatBar label="Affection" value={currentChar.affection} color={themeColor} icon={Heart} />
                                            <StatBar label="Possessiveness" value={currentChar.Possessiveness} color="#9333ea" icon={Zap} />
                                            <StatBar label="Obsession" value={currentChar.Obsession} color="#dc2626" icon={Skull} />
                                            <StatBar label="Intimacy" value={currentChar.Intimacy} color="#fb7185" icon={Sparkles} />

                                            <div className="mt-3 text-[10px] space-y-2 text-gray-600 border-t pt-2" style={{ borderColor: `${themeColor}30` }}>
                                                {currentChar.innerState && (
                                                    <div className="bg-white/60 p-2 rounded border border-black/5 italic relative">
                                                        <span className="absolute -top-2 left-1 bg-white px-1 text-[9px] text-gray-400 font-bold not-italic">💭 Inner</span>
                                                        "{currentChar.innerState}"
                                                    </div>
                                                )}
                                                <div><div className="font-bold text-gray-400 flex items-center gap-1 mb-0.5"><Shirt size={10} /> Clothing:</div><div className="leading-relaxed pl-1">{currentChar.clothing}</div></div>
                                                <div><div className="font-bold text-gray-400 flex items-center gap-1 mb-0.5"><Footprints size={10} /> Legs/Shoes:</div><div className="leading-relaxed pl-1">{currentChar.shoes} {currentChar.legState}</div></div>
                                                <div>
                                                    <div className="font-bold text-gray-400 flex items-center gap-1 mb-0.5">
                                                        <Activity size={10} /> Deep Link:
                                                    </div>
                                                    <div className="font-mono text-purple-600 pl-1">
                                                        {currentChar.bondDepth || "0"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {suggestions && (
                                    <div className="space-y-3 pb-4">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><Sparkles size={10} /> Plot Guidance</div>
                                        <SuggestionItem type="Fun / Chaos" content={suggestions.fun} colorBg="bg-yellow-50" colorBorder="border-yellow-200" colorText="text-yellow-800" icon="🤪" />
                                        <SuggestionItem type="Rational" content={suggestions.rational} colorBg="bg-blue-50" colorBorder="border-blue-200" colorText="text-blue-800" icon="🧠" />
                                        <SuggestionItem type="Radical" content={suggestions.radical} colorBg="bg-red-50" colorBorder="border-red-200" colorText="text-red-800" icon="🔥" />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-2 space-y-4">
                                <div className="space-y-2">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Engineer Persona</div>
                                    {(dbChars.length > 0 ? dbChars : CHAR_DATA).map((char: any, index: number) => (
                                        <div
                                            key={char.id || index}
                                            onClick={() => {
                                                if (activeCharacterId === char.id) return;
                                                onCharSwitch(char.id);
                                            }}
                                            className="w-full flex items-center gap-3 p-2 rounded-lg transition-all border relative overflow-hidden group cursor-pointer"
                                            style={{
                                                backgroundColor: activeCharacterId === char.id ? char.hex : `${char.hex}08`,
                                                borderColor: activeCharacterId === char.id ? char.hex : 'transparent',
                                                color: activeCharacterId === char.id ? 'white' : '#374151'
                                            }}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-lg shadow-sm z-10 flex-shrink-0">
                                                {char.avatar}
                                            </div>

                                            <div className="text-left z-10 flex-1 min-w-0">
                                                <div className="text-xs font-bold truncate">{char.name}</div>
                                                <div className={`text-[9px] truncate ${activeCharacterId === char.id ? 'text-white/80' : 'text-gray-400'}`}>
                                                    {char.sub}
                                                </div>
                                            </div>

                                            {activeCharacterId === char.id && (
                                                <div className="z-20 flex gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                                                    {char.id === 'sakiko' && <button onClick={handleToggleVariant} className="p-1.5 bg-white/20 rounded-full hover:bg-white/40 text-white transition-all">{voiceVariant === 'white' ? <Sparkles size={12} /> : <Moon size={12} />}</button>}
                                                    {char.id === 'mutsu' && <button onClick={handleToggleVariant} className="p-1.5 bg-white/20 rounded-full hover:bg-white/40 text-white transition-all">{voiceVariant === 'mortis' ? <Ghost size={12} /> : <Bot size={12} />}</button>}
                                                    {char.id === 'soyo' && <button onClick={handleToggleVariant} className="p-1.5 bg-white/20 rounded-full hover:bg-white/40 text-white transition-all">{voiceVariant === 'down' ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}</button>}
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 border-t border-gray-100 text-center">
                                    <div className="text-[9px] text-gray-300 font-mono">IDE MOVED TO TOP BAR ↗</div>
                                </div>
                            </div>
                        )}
                    </div>

                    <SuggestionModal
                        isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                        content={confirmModal.text}
                        onConfirm={() => { handleSend(confirmModal.text); setConfirmModal({ ...confirmModal, isOpen: false }); }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};
export const SidebarRight = React.memo(SidebarRightComponent);