"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { CHARACTERS, Session } from "../types";
import { CHAR_DATA } from "../data/char_config";
import LOCAL_LIVE2D_CONFIG from "../data/live2d_config.json";
import { WorldInfoModal, EditModal } from "../components/Modals";
import { SidebarLeft } from "../components/SidebarLeft";
import { SidebarRight } from "../components/SidebarRight";
import { DanmakuOverlay } from "../components/DanmakuOverlay";
import { ChatInterface } from "../components/ChatInterface";
import { Background } from "../components/Background";
import { TransitionEffects } from "../components/TransitionEffects";
import { SaveLoadModal } from "../components/SaveLoadModal";
import { CodeRepositoryModal } from "../components/CodeRepositoryPanel";
import { TachieStage } from "../components/TachieStage";
import { NovelInterface } from "../components/NovelInterface";
import { EffectType } from "../components/TransitionEffects";

import { useMusic } from "../context/MusicContext";
import { useLocalFileSync } from "../hooks/useLocalFileSync";
import { useChatEngine } from "../hooks/useChatEngine";
import { useUI } from "../hooks/useUI";
import { useFileHandler } from "../hooks/useFileHandler";

const Live2DStage = dynamic(() => import("../components/Live2DStage").then(m => m.Live2DStage), { ssr: false });

export default function Home() {
    const [currentSessionId, setCurrentSessionId] = useState<string>("");
    const [activeCharacterId, setActiveCharacterId] = useState("sakiko");
    const [voiceVariant, setVoiceVariant] = useState("black");
    const [manualOutfitId, setManualOutfitId] = useState<string | undefined>(undefined);
    const [isGlobalGenerating, setIsGlobalGenerating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [tempTitle, setTempTitle] = useState("");
    const [activeMenuSessionId, setActiveMenuSessionId] = useState<string | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [playingIndex, setPlayingIndex] = useState<number | null>(null); 
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const ui = useUI();

    useEffect(() => {
        console.log("🔍 [Page Debug] Current Char:", activeCharacterId);
        console.log("🔍 [Page Debug] Live2D Config:", LOCAL_LIVE2D_CONFIG);
        
        const config = (LOCAL_LIVE2D_CONFIG as any)[activeCharacterId];
        console.log("🔍 [Page Debug] Effective Config:", config);
        
        if (!config) console.warn("⚠️ Config is missing! Live2DStage will NOT render.");
    }, [activeCharacterId]);

    const cloud = useLocalFileSync(isGlobalGenerating, ui.showToast);

    const music = useMusic();

    const [config, setConfig] = useState({
        webSearch: false,
        imageGen: false,
        tts: false,
        musicControl: false,
        selectedModel: "google/gemini-3-flash-preview",
        customModelId: "",
        expandedGroups: ["Gemini (Google)"] as string[]
    });

    const [apiProvider, setApiProvider] = useState<'openrouter' | 'google'>('openrouter');

    const currentSession = cloud.sessions.find(s => s.id === currentSessionId);

    const engine = useChatEngine({
        currentSession, currentSessionId, setSessions: cloud.setSessions,
        activeCharacterId, voiceVariant,
        globalWorldInfo: cloud.globalWorldInfo,
        config: config,
        setTrackId: music.setTrackId,
        showToast: ui.showToast,
        setIsGlobalGenerating,
        manualOutfitId,
        apiProvider,
    });

    const fileHandler = useFileHandler({
        setSessions: cloud.setSessions,
        setFolders: cloud.setFolders,
        setGlobalWorldInfo: cloud.setGlobalWorldInfo,
        setBgImage: cloud.setBgImage,
        setSelectedFile: engine.setSelectedFile,
        showToast: ui.showToast
    });

    useEffect(() => {
        if (cloud.initLoaded && cloud.sessions.length === 0 && !currentSessionId) {
            console.log("🌱 Creating Genesis Session...");
            const newId = Date.now().toString();
            const genesisSession: Session = {
                id: newId,
                title: "Mutsu Studio", 
                folderId: null,
                characterId: "mutsu", 
                voiceVariant: "default",
                memoryMode: "infinite",
                messages: [{
                    role: "assistant",
                    content: "Mutsu Studio Lite. Ready for input.\n我是若叶睦。请下达指令。", 
                    modelName: "System"
                }],
                updatedAt: Date.now()
            };
            cloud.setSessions([genesisSession]);
            setCurrentSessionId(newId);
            setActiveCharacterId("mutsu");
            ui.setEffect("math"); 
        }
        else if (cloud.sessions.length > 0 && (!currentSessionId || !cloud.sessions.find(s => s.id === currentSessionId))) {
            setCurrentSessionId(cloud.sessions[0].id);
            if (cloud.sessions[0].characterId) setActiveCharacterId(cloud.sessions[0].characterId);
        }
    }, [cloud.sessions, currentSessionId, cloud.initLoaded]);

    const dynamicCharacter = useMemo(() => {
        const base = CHAR_DATA.find(c => c.id === activeCharacterId) || CHAR_DATA[0];

        let finalChar = { ...base };

        if (activeCharacterId === 'sakiko') {
            if (voiceVariant === 'black' || voiceVariant === 'oblivionis') {
                finalChar.name = "Oblivionis";
                finalChar.avatar = "🎭"; 
                finalChar.hex = "#483d8b"; 
            } else {
                finalChar.name = "丰川 祥子";
                finalChar.avatar = "🎹";
                finalChar.hex = "#7799CC"; 
            }
        }
        else if (activeCharacterId === 'mutsu') {
            if (voiceVariant === 'mortis') {
                finalChar.name = "Mortis";
                finalChar.avatar = "💀";
                finalChar.hex = "#2f4f4f"; 
            } else {
                finalChar.name = "若叶 睦";
                finalChar.avatar = "🥒";
                finalChar.hex = "#779977";
            }
        }
        else if (activeCharacterId === 'soyo') {
            if (voiceVariant === 'down') {
                finalChar.name = "长崎 素世 (Broken)";
                finalChar.avatar = "💔"; 
                finalChar.hex = "#5c5c5c"; 
            } else {
                finalChar.name = "长崎 素世";
                finalChar.avatar = "🥐";
                finalChar.hex = "#FFDD88";
            }
        }

        return finalChar;
    }, [activeCharacterId, voiceVariant]);

    const createNewSession = (charId: string = activeCharacterId, targetMode?: 'sliding' | 'infinite' | 'novel') => {
        const newId = Date.now().toString();
        const currentMode = currentSession?.memoryMode || 'sliding';
        const nextMode = targetMode || currentMode; 

        const charName = CHARACTERS.find(c => c.id === charId)?.name;

        let initContent = "";
        if (nextMode === 'infinite') initContent = `我是${charName}。欢迎来到 Mutsu Studio。请下达指令。`;

        const initialMessages: any[] = [];
        if (initContent) {
            initialMessages.push({ 
                role: "assistant", 
                content: initContent, 
                modelName: "System" 
            });
        }

        const newSession: Session = {
            id: newId,
            title: nextMode === 'novel' ? "New Dream" : "New Chat",
            folderId: null,
            characterId: charId,
            voiceVariant: "default",
            messages: initialMessages,
            updatedAt: Date.now(),
            memoryMode: nextMode as any
        };

        cloud.setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newId);
        setActiveCharacterId(charId);

        if (targetMode) {
            if (targetMode === 'infinite') ui.setEffect("math");
            else if (targetMode === 'novel') ui.setEffect("curtain");
        }
    };

    const deleteSession = (e: any, id: string) => {
        e.stopPropagation();
        if (!confirm("⚠️ Delete this timeline?")) return;

        const remainingSessions = cloud.sessions.filter(s => s.id !== id);

        const realitySessions = remainingSessions.filter(s => s.memoryMode !== 'novel');

        let finalSessions = remainingSessions;
        let nextSessionId = currentSessionId; 
        let nextCharId = activeCharacterId;   

        if (id === currentSessionId) {
            if (realitySessions.length > 0) {
                const next = realitySessions[0];
                nextSessionId = next.id;
                nextCharId = next.characterId;
            } else if (remainingSessions.length > 0) {
                const next = remainingSessions[0];
                nextSessionId = next.id;
                nextCharId = next.characterId;
            } else {
                nextSessionId = "GENESIS";
            }
        }

        if (nextSessionId === "GENESIS") {
            const genesisId = Date.now().toString();
            const genesisSession: Session = {
                id: genesisId,
                title: "Mutsu Studio",
                folderId: null,
                characterId: "mutsu",
                voiceVariant: "default",
                memoryMode: "infinite",
                messages: [{
                    role: "assistant",
                    content: "Mutsu Studio Lite. Ready.\n我是若叶睦。所有旧世界已归零。",
                    modelName: "System"
                }],
                updatedAt: Date.now()
            };

            finalSessions = [genesisSession];
            nextSessionId = genesisId;
            nextCharId = "mutsu";

            ui.setEffect("math");
            ui.showToast("♻️ System Reset");
        } else {
            ui.showToast("🗑️ Timeline Deleted");
        }

        if (nextSessionId !== currentSessionId) {
            setCurrentSessionId(nextSessionId);
            if (nextCharId) setActiveCharacterId(nextCharId);
        }

        cloud.setSessions(finalSessions);
    };

    const stageCharId = currentSession?.memoryMode === 'infinite'
        ? activeCharacterId
        : (currentSession?.live2dCharId || activeCharacterId); 

    const effectiveConfig = useMemo(() => {
        const rawConfig = LOCAL_LIVE2D_CONFIG as Record<string, any>;
        
        if (rawConfig[stageCharId]) {
            console.log(`🎯 [Smart Match] Exact: ${stageCharId}`);
            return rawConfig[stageCharId];
        }

        const fuzzyKey = Object.keys(rawConfig).find(key => 
            key.toLowerCase().includes(stageCharId.toLowerCase()) || 
            stageCharId.toLowerCase().includes(key.toLowerCase())
        );

        if (fuzzyKey) {
            console.log(`🎯 [Smart Match] Fuzzy: ${stageCharId} -> ${fuzzyKey}`);
            return rawConfig[fuzzyKey];
        }

        console.warn(`⚠️ [Smart Match] Failed to find config for: ${stageCharId}`);
        return null;
    }, [stageCharId]);

    const stageMotion = currentSession?.currentEmotion || "idle";
    const stageOutfit = currentSession?.currentOutfitId || manualOutfitId || "default";
    const stageDbChar = useMemo(() =>
        CHAR_DATA.find(c => c.id === stageCharId),
        [stageCharId]);

    const showLive2D = effectiveConfig && (
        effectiveConfig.modelUrl ||
        (effectiveConfig.outfits && Object.keys(effectiveConfig.outfits).length > 0)
    );

    if (currentSession?.memoryMode === 'novel') {
        return (
            <NovelInterface
                currentSession={currentSession}
                handleSend={engine.handleSend}
                isLoading={engine.isLoading}
                createNewSession={createNewSession}
                dbChars={CHAR_DATA}
                stopGeneration={engine.stopGeneration}
                handleRegenerate={engine.handleRegenerate}
                setIsGlobalGenerating={setIsGlobalGenerating}
                onImageGenerated={async (base64: string, meta: any) => {
                    const res = await fetch("/api/upload", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ base64 })
                    });
                    const data = await res.json();
                    if (data.url) {
                        ui.showToast("💾 Image Saved Locally");
                        return data.url;
                    }
                    return "";
                }}
                onManualSync={() => cloud.triggerSync('manual')}
                syncStatus={cloud.status}

                setSessions={cloud.setSessions}
                onExit={() => {
                    const lastReality = cloud.sessions.find(s => s.id !== currentSessionId && s.memoryMode !== 'novel');

                    if (lastReality) {
                        setCurrentSessionId(lastReality.id);
                        if (lastReality.characterId) setActiveCharacterId(lastReality.characterId);
                        ui.showToast("Return to Reality...");
                    } else {
                        createNewSession(undefined, 'sliding'); 
                        ui.showToast("Waking up...");
                    }
                }}
                updateSessionTitle={(id: string, t: string) => cloud.setSessions(p => p.map(s => s.id === id ? { ...s, title: t } : s))}
                deleteMessage={engine.handleDeleteMessage}
                updateSessionInfo={(id: string, up: any) => cloud.setSessions(p => p.map(s => s.id === id ? { ...s, ...up } : s))}
            />
        );
    }

    if (!cloud.initLoaded) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0a0a0c] text-white flex-col gap-4 font-mono">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
                <div className="text-xs tracking-[0.3em] opacity-50 animate-pulse">INITIALIZING LOCAL MEMORY...</div>
            </div>
        );
    }

    return (
        <div
            className="flex h-screen text-slate-800 font-sans overflow-hidden relative"
            onDrop={fileHandler.handleBgDrop}
            onDragOver={(e) => e.preventDefault()}
        >
            <Background hex={currentSession?.memoryMode === 'sliding' ? "#e0f2fe" : dynamicCharacter.hex} bgImage={cloud.bgImage} bgName={currentSession?.currentBackground} />

            {stageDbChar && (
                showLive2D ? (
                    <Live2DStage
                        key={stageCharId}
                        characterId={stageCharId}
                        config={effectiveConfig}
                        emotion={stageMotion}
                        outfitId={stageOutfit}
                        rightSidebarOpen={ui.rightSidebarOpen}
                        leftSidebarOpen={ui.leftSidebarOpen}
                    />
                ) : (
                    <TachieStage
                        characters={[{
                            name: stageDbChar.name, 
                            id: stageDbChar.id,     
                            current_sprite: stageMotion
                        }]}
                        dbChars={CHAR_DATA} 
                    />
                )
            )}

            <div className="relative z-10 flex w-full h-full">
                <AnimatePresence>
                    {ui.toast && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, x: "-50%" }} 
                            animate={{ opacity: 1, y: 0, x: "-50%" }}
                            exit={{ opacity: 0 }}
                            className="fixed left-1/2 z-[9999] bg-zinc-900/90 text-emerald-400 px-6 py-3 rounded-xl text-sm font-bold shadow-2xl flex gap-3 items-center border border-zinc-700/50 backdrop-blur-md"
                            style={{ top: "80px" }} 
                        >
                            <Check size={18} className="animate-bounce" /> {ui.toast}
                        </motion.div>
                    )}
                </AnimatePresence>

                <SidebarLeft
                    isOpen={ui.leftSidebarOpen} onClose={() => ui.setLeftSidebarOpen(false)}
                    showModelPanel={ui.showModelPanel} setShowModelPanel={ui.setShowModelPanel}
                    showChatPanel={ui.showChatPanel} setShowChatPanel={ui.setShowChatPanel}

                    expandedGroups={Array.isArray(config.expandedGroups) ? config.expandedGroups : []}
                    setExpandedGroups={(action: any) => {
                        setConfig(prev => {
                            const currentList = Array.isArray(prev.expandedGroups) ? prev.expandedGroups : [];
                            const nextList = typeof action === 'function' ? action(currentList) : action;
                            return { ...prev, expandedGroups: nextList };
                        });
                    }}
                    selectedModel={config.selectedModel}
                    setSelectedModel={(v: string) => setConfig(prev => ({ ...prev, selectedModel: v }))}
                    customModelId={config.customModelId}
                    setCustomModelId={(v: string) => setConfig(prev => ({ ...prev, customModelId: v }))}

                    folders={cloud.folders} setFolders={cloud.setFolders}
                    sessions={cloud.sessions} currentSessionId={currentSessionId} setCurrentSessionId={setCurrentSessionId}
                    createFolder={() => cloud.setFolders(prev => [...prev, { id: Date.now().toString(), name: "New Folder", isExpanded: true }])}
                    toggleFolder={(id: string) => cloud.setFolders(prev => prev.map(f => f.id === id ? { ...f, isExpanded: !f.isExpanded } : f))}
                    deleteFolder={(e: any, id: string) => { e.stopPropagation(); if (confirm("Delete?")) cloud.setFolders(prev => prev.filter(f => f.id !== id)) }}
                    createNewSession={createNewSession}
                    deleteSession={deleteSession}

                    searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                    editingSessionId={editingSessionId} setEditingSessionId={setEditingSessionId}
                    tempTitle={tempTitle} setTempTitle={setTempTitle}
                    activeMenuSessionId={activeMenuSessionId} setActiveMenuSessionId={setActiveMenuSessionId}
                    updateSessionTitle={(id: string, t: string) => { cloud.setSessions(prev => prev.map(s => s.id === id ? { ...s, title: t } : s)); setEditingSessionId(null) }}
                    moveSessionToFolder={(sid: string, fid: string | null) => { cloud.setSessions(prev => prev.map(s => s.id === sid ? { ...s, folderId: fid } : s)); setActiveMenuSessionId(null) }}

                    handleExportData={() => { const d = { sessions: cloud.sessions, folders: cloud.folders, globalWorldInfo: cloud.globalWorldInfo, bgImage: cloud.bgImage }; const b = new Blob([JSON.stringify(d)], { type: "application/json" }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = "backup.json"; a.click(); }}
                    handleImportData={fileHandler.handleImportData}
                    importInputRef={fileHandler.importInputRef}

                    toggleMemoryMode={() => { cloud.setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, memoryMode: s.memoryMode === 'infinite' ? 'sliding' : 'infinite' } : s)); ui.setEffect("math") }}

                    apiProvider={apiProvider}
                    setApiProvider={setApiProvider}
                    memoryMode={currentSession?.memoryMode} 
                    isMobile={false} 

                    useWebSearch={config.webSearch}
                    toggleWebSearch={() => {
                        setConfig(prev => {
                            const next = !prev.webSearch;
                            if (next) ui.setEffect("cyber");
                            ui.showToast(next ? "🌐 Link Start" : "🔌 Offline");
                            return { ...prev, webSearch: next };
                        });
                    }}

                    useImageGen={config.imageGen}
                    toggleImageGen={() => {
                        setConfig(prev => {
                            const next = !prev.imageGen;
                            ui.showToast(next ? "🎨 Art: ON" : "🚫 Art: OFF");
                            return { ...prev, imageGen: next, tts: next ? false : prev.tts };
                        });
                    }}

                    useTTS={config.tts}
                    toggleTTS={() => {
                        setConfig(prev => {
                            const next = !prev.tts;
                            ui.showToast(next ? "🗣️ TTS: ON" : "🔇 TTS: OFF");
                            return { ...prev, tts: next, imageGen: next ? false : prev.imageGen };
                        });
                    }}

                    onManualSync={() => cloud.triggerSync('manual')}
                    syncStatus={cloud.status}

                    useMusicControl={config.musicControl}
                    toggleMusicControl={() => setConfig(prev => ({ ...prev, musicControl: !prev.musicControl }))}

                    triggerEffect={ui.setEffect}
                    batchDelete={(ids: string[]) => cloud.setSessions(prev => prev.filter(s => !ids.includes(s.id)))}
                />

                <ChatInterface
                    leftSidebarOpen={ui.leftSidebarOpen} setLeftSidebarOpen={ui.setLeftSidebarOpen}
                    rightSidebarOpen={ui.rightSidebarOpen} setRightSidebarOpen={ui.setRightSidebarOpen}
                    setShowLocalWorld={ui.setShowLocalWorld} setShowGlobalWorld={ui.setShowGlobalWorld}
                    debugMode={ui.debugMode} setDebugMode={ui.setDebugMode}

                    currentCharacter={dynamicCharacter} currentSession={currentSession}
                    input={engine.input} setInput={engine.setInput}
                    isLoading={engine.isLoading}
                    showToast={ui.showToast} outfits={effectiveConfig?.outfits || {}}

                    selectedModel={config.selectedModel} customModelId={config.customModelId} isMultimodal={true}
                    useTTS={config.tts} 

                    selectedFile={engine.selectedFile} setSelectedFile={engine.setSelectedFile}
                    fileInputRef={fileHandler.fileInputRef} handleFileSelect={fileHandler.handleFileSelect}

                    dbChars={CHAR_DATA} currentOutfitId={manualOutfitId} setManualOutfitId={setManualOutfitId}
                    isGlobalGenerating={isGlobalGenerating}

                    apiProvider={apiProvider}
                    setApiProvider={setApiProvider}

                    handleSend={engine.handleSend} stopGeneration={engine.stopGeneration}
                    handleRegenerate={engine.handleRegenerate} handleDeleteMessage={engine.handleDeleteMessage}
                    handleCopy={(t: string, i: number) => {
                        navigator.clipboard.writeText(t);
                        setCopiedIndex(i); 
                        setTimeout(() => setCopiedIndex(null), 2000);
                    }}
                    copiedIndex={copiedIndex}
                    triggerEffect={ui.setEffect}

                    openEditModal={(i: number, c: any) => {
                        ui.setEditModal({ isOpen: true, text: typeof c === 'string' ? c : c[0].text, index: i });
                    }}
                    toggleSaveModal={() => ui.setShowSaveModal(true)}
                    toggleCodeRepo={() => ui.setShowCodeRepo(true)}

                    playingIndex={playingIndex}
                    handlePlayAudio={async (text: string, index: number, charId?: string) => {
                        setPlayingIndex(index); 
                        try {
                            const res = await fetch("/api/tts", {
                                method: "POST",
                                body: JSON.stringify({ text, characterId: charId || activeCharacterId, variant: voiceVariant })
                            });
                            if (!res.ok) throw new Error();
                            const url = URL.createObjectURL(await res.blob());
                            const audio = new Audio(url);
                            audioRef.current = audio; 
                            audio.play();

                            audio.onended = () => setPlayingIndex(null);
                            audio.onerror = () => setPlayingIndex(null);
                        } catch {
                            setPlayingIndex(null);
                        }
                    }}
                    createNewSession={createNewSession}
                />

                <DanmakuOverlay danmakuList={currentSession?.lastDanmaku} />
                <AnimatePresence>{(ui.leftSidebarOpen || ui.rightSidebarOpen) && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { ui.setLeftSidebarOpen(false); ui.setRightSidebarOpen(false) }} className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm" />}</AnimatePresence>

                <SidebarRight
                    isOpen={ui.rightSidebarOpen} onClose={() => ui.setRightSidebarOpen(false)}
                    currentCharacter={dynamicCharacter} currentSession={currentSession}
                    activeCharacterId={activeCharacterId} setActiveCharacterId={setActiveCharacterId}
                    createNewSession={createNewSession} handleSend={engine.handleSend} setSessions={cloud.setSessions} currentSessionId={currentSessionId}
                    handleToggleVariant={() => {
                        let n = "default", e: EffectType = "none";
                        if (activeCharacterId === "sakiko") { n = voiceVariant === "black" ? "white" : "black"; e = n === "white" ? "rain" : "curtain"; }
                        else if (activeCharacterId === "mutsu") { n = voiceVariant === "normal" ? "mortis" : "normal"; e = n === "mortis" ? "curtain" : "math"; }
                        else if (activeCharacterId === "soyo") { n = voiceVariant === "up" ? "down" : "up"; }
                        setVoiceVariant(n); ui.setEffect(e);
                    }}
                    voiceVariant={voiceVariant} onRepoUpdate={engine.handleRepoUpdate}
                    onCharSwitch={(id: string) => { setActiveCharacterId(id); setVoiceVariant("default"); cloud.setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, characterId: id } : s)) }}
                    dbChars={CHAR_DATA}
                />
            </div>

            <TransitionEffects effect={ui.effect} onComplete={() => ui.setEffect("none")} />

            <CodeRepositoryModal isOpen={ui.showCodeRepo} onClose={() => ui.setShowCodeRepo(false)} repository={currentSession?.codeRepository || {}} onUpdate={engine.handleRepoUpdate} />
            <WorldInfoModal isOpen={ui.showGlobalWorld} onClose={() => ui.setShowGlobalWorld(false)} title="Global" content={cloud.globalWorldInfo} setContent={cloud.setGlobalWorldInfo} onSave={() => localStorage.setItem("mutsu_global_world", cloud.globalWorldInfo)} />
            <WorldInfoModal isOpen={ui.showLocalWorld} onClose={() => ui.setShowLocalWorld(false)} title="Local" content={currentSession?.localWorldInfo || ""} setContent={(v: string) => cloud.setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, localWorldInfo: v } : s))} onSave={() => { }} />

            <EditModal
                isOpen={ui.editModal.isOpen}
                onClose={() => ui.setEditModal({ ...ui.editModal, isOpen: false })}
                content={ui.editModal.text}
                setContent={(v: string) => ui.setEditModal({ ...ui.editModal, text: v })}
                onConfirm={() => {
                    if (!currentSession) return;
                    ui.setEditModal({ ...ui.editModal, isOpen: false });
                    engine.handleSend(undefined, [...currentSession.messages.slice(0, ui.editModal.index), { role: 'user', content: ui.editModal.text }])
                }}
            />

            <SaveLoadModal
                isOpen={ui.showSaveModal}
                onClose={() => ui.setShowSaveModal(false)}
                currentSession={currentSession}
                onLoadSession={(sess: any) => {
                    cloud.setSessions(prev => {
                        const idx = prev.findIndex(s => s.id === sess.id);
                        return idx !== -1 ? prev.map((s, i) => i === idx ? sess : s) : [sess, ...prev];
                    });
                    setCurrentSessionId(sess.id);
                    ui.showToast(`Loaded: ${sess.title}`);
                }}
            />
        </div>
    );
}