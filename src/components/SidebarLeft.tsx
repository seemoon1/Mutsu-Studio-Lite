"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    PanelLeftClose, Package, LayoutList, ChevronDown, ChevronRight,
    FolderPlus, Plus, Search, Folder, Trash2, Download, Upload,
    Globe, Infinity, History, Image as ImageIcon,
    ListChecks, CheckSquare, Square, Sparkles, Terminal, Disc,
    CloudRain, AlertTriangle, Mic,
    Cloud, RefreshCw, Check
} from "lucide-react";
import { MODEL_DATA } from "../types";
import { SessionItem } from "./Common";
import { BatchDeleteModal } from "./BatchDeleteModal";

const checkEnv = async (feature: 'openrouter' | 'google' | 'tavily' | 'sd' | 'tts' | 'music') => {
    try {
        const res = await fetch("/api/check_env");
        const data = await res.json();

        let isValid = false;
        let errorMsg = "";

        switch (feature) {
            case 'openrouter':
                isValid = data.hasOpenRouter;
                errorMsg = "⚠️ OPENROUTER_API_KEY 未配置！\n请在 .env.local 中填入密钥。\n(详见 README)";
                break;
            case 'google':
                isValid = data.hasGoogle;
                errorMsg = "⚠️ GOOGLE_API_KEY 未配置！\n请在 .env.local 中填入密钥。\n(详见 README)";
                break;
            case 'tavily':
                isValid = data.hasTavily;
                errorMsg = "⚠️ TAVILY_API_KEY (联网) 未配置！\n请在 .env.local 中填入密钥。";
                break;
            case 'sd':
                isValid = data.hasSdUrl;
                errorMsg = "⚠️ 生图后端 (SD_URL) 未连接！\n请确保本地 SD 已启动并在 .env.local 配置地址。";
                break;
            case 'tts':
                isValid = data.hasTtsUrl;
                errorMsg = "⚠️ TTS 后端未连接！\n请配置 GPT-SoVITS 接口地址。";
                break;
            case 'music':
                isValid = data.hasMusic;
                errorMsg = "⚠️ 音乐库为空！\n请在 public/music 放入歌曲并在 data/bgm_library.ts 注册。";
                break;
        }

        if (!isValid) {
            alert(errorMsg); 
            return false;
        }
        return true;
    } catch (e) {
        console.error("Env check failed", e);
        return true; 
    }
};

export const SidebarLeft = ({
    isOpen, onClose,
    showModelPanel, setShowModelPanel,
    showChatPanel, setShowChatPanel,
    expandedGroups, setExpandedGroups,
    selectedModel, setSelectedModel,
    customModelId, setCustomModelId,
    folders, setFolders,
    sessions, currentSessionId, setCurrentSessionId,
    createFolder, toggleFolder, deleteFolder,
    createNewSession, deleteSession,
    searchQuery, setSearchQuery,
    editingSessionId, setEditingSessionId,
    tempTitle, setTempTitle,
    activeMenuSessionId, setActiveMenuSessionId,
    updateSessionTitle, moveSessionToFolder,
    handleExportData, handleImportData,
    toggleMemoryMode, useWebSearch, toggleWebSearch,
    useImageGen, toggleImageGen,
    batchDelete,
    useMusicControl,
    toggleMusicControl,
    triggerEffect,
    useTTS, toggleTTS,
    syncStatus, onManualSync,
    apiProvider, setApiProvider, memoryMode,
}: any) => {
    const importInputRef = useRef<HTMLInputElement>(null);

    const [showNewChatMenu, setShowNewChatMenu] = useState(false);
    const [isBatchMode, setIsBatchMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBatchConfirm, setShowBatchConfirm] = useState(false);
    const [showDebug, setShowDebug] = useState(false);

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const currentSession = sessions.find((s: any) => s.id === currentSessionId);
    const isStory = currentSession?.memoryMode === 'sliding';

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 300, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="h-full bg-white flex flex-col shadow-xl z-40 border-r border-gray-200 md:border-r-0 fixed inset-y-0 left-0 md:relative overflow-hidden"
                >
                    <div className="p-3 flex items-center justify-between pt-[calc(0.75rem+env(safe-area-inset-top))]">
                        <div className="flex items-center gap-2 font-bold text-gray-800">
                            <span className="text-xl">🥒</span>
                            <span className="text-xs uppercase tracking-widest">Studio</span>
                        </div>
                        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                            <button onClick={onClose} className="p-1.5 rounded text-gray-400 hover:text-gray-600" title="Hide Sidebar"><PanelLeftClose size={14} /></button>
                            <div className="w-px h-3 bg-gray-300 mx-1"></div>
                            <button onClick={() => setShowModelPanel(!showModelPanel)} className={`p-1.5 rounded transition-colors ${showModelPanel ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400'}`}><Package size={14} /></button>
                            <button onClick={() => setShowChatPanel(!showChatPanel)} className={`p-1.5 rounded transition-colors ${showChatPanel ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400'}`}><LayoutList size={14} /></button>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                        {showModelPanel && (
                            <div className={`p-2 overflow-y-auto scrollbar-thin ${showChatPanel ? 'max-h-[35%]' : 'h-full'}`}>

                                <div className="mb-3 bg-gray-100 p-1 rounded-lg flex text-xs font-bold">
                                    <button
                                        onClick={async () => {
                                            if (await checkEnv('openrouter')) setApiProvider('openrouter');
                                        }}
                                        className={`flex-1 py-1.5 rounded transition-all ${apiProvider === 'openrouter' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        OpenRouter
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (await checkEnv('google')) setApiProvider('google');
                                        }}
                                        className={`flex-1 py-1.5 rounded transition-all ${apiProvider === 'google' ? 'bg-white shadow text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        Google
                                    </button>
                                </div>

                                {MODEL_DATA.filter((g: any) => {
                                    if (apiProvider === 'google') {
                                        return g.groupName.toLowerCase().includes("google");
                                    }
                                    return true; 
                                }).map((g: any) => (
                                    <div key={g.groupName} className="mb-1">
                                        <button onClick={() => setExpandedGroups((prev: any) => prev.includes(g.groupName) ? prev.filter((x: any) => x !== g.groupName) : [...prev, g.groupName])} className="w-full flex justify-between p-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded">
                                            <span>{g.groupName}</span>
                                            {expandedGroups.includes(g.groupName) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                        </button>
                                        {expandedGroups.includes(g.groupName) && (
                                            <div className="pl-2 border-l border-gray-100 ml-1">
                                                {g.models.map((m: any) => (
                                                    <button key={m.id} onClick={() => { setSelectedModel(m.id); setCustomModelId("") }} className={`block w-full text-left text-[11px] py-1 truncate ${selectedModel === m.id && !customModelId ? 'text-emerald-600 font-bold' : 'text-gray-400 hover:text-gray-900'}`}>
                                                        {m.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <input value={customModelId} onChange={(e: any) => setCustomModelId(e.target.value)} placeholder="Custom Model ID" className="w-full mt-2 text-xs border rounded px-2 py-1 bg-gray-50 outline-none" />
                            </div>
                        )}

                        {showChatPanel && (
                            <div className="flex-1 flex flex-col min-h-0 p-2">
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Explorer</span>
                                    <div className="flex gap-1">
                                        <button onClick={createFolder} className="p-1 hover:bg-gray-50 rounded text-gray-400" title="New Folder"><FolderPlus size={14} /></button>
                                        <button onClick={() => { setIsBatchMode(!isBatchMode); setSelectedIds(new Set()); }} className={`p-1 rounded transition-colors ${isBatchMode ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'text-gray-400 hover:bg-gray-50'}`} title="Batch Manage"><ListChecks size={14} /></button>
                                        <div className="relative">
                                            <button onClick={() => setShowNewChatMenu(!showNewChatMenu)} className="p-1 hover:bg-emerald-50 rounded text-emerald-600 flex items-center gap-0.5"><Plus size={14} /><ChevronDown size={10} /></button>
                                            <AnimatePresence>
                                                {showNewChatMenu && (
                                                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
                                                        <button onClick={() => { createNewSession(undefined, 'sliding'); setShowNewChatMenu(false) }} className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 text-emerald-700 flex items-center gap-2"><Sparkles size={12} /> Story</button>
                                                        <button onClick={() => { createNewSession(undefined, 'infinite'); setShowNewChatMenu(false) }} className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 text-blue-700 flex items-center gap-2"><Terminal size={12} /> Infinite</button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative mb-2"><Search size={12} className="absolute left-2 top-2 text-gray-400" /><input className="w-full bg-gray-50 border rounded-lg py-1 pl-7 pr-2 text-xs outline-none focus:ring-1 focus:ring-gray-200" placeholder="Search..." value={searchQuery} onChange={(e: any) => setSearchQuery(e.target.value)} /></div>

                                <div className="flex-1 overflow-y-auto scrollbar-thin">
                                    {folders.map((f: any) => (
                                        <div key={f.id} className="mb-1">
                                            <div className="flex items-center justify-between px-2 py-1 hover:bg-gray-50 rounded cursor-pointer group" onClick={() => toggleFolder(f.id)}>
                                                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                                                    <Folder size={12} className="text-yellow-400 fill-yellow-400" />
                                                    {f.name}
                                                </div>
                                                <button onClick={(e) => { deleteFolder(e, f.id) }} className="opacity-0 group-hover:opacity-100"><Trash2 size={10} /></button>
                                            </div>
                                            {f.isExpanded && (
                                                <div className="ml-3 pl-2 border-l border-gray-100">
                                                    {sessions.filter((s: any) => s.folderId === f.id && s.title.toLowerCase().includes(searchQuery)).map((s: any) => (
                                                        <div key={s.id} className="flex items-center gap-1">
                                                            {isBatchMode && (
                                                                <button onClick={() => toggleSelect(s.id)} className="p-1">
                                                                    {selectedIds.has(s.id) ? <CheckSquare size={16} className="text-indigo-500" /> : <Square size={16} className="text-gray-300" />}
                                                                </button>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <SessionItem session={s} isActive={currentSessionId === s.id} isEditing={editingSessionId === s.id} tempTitle={tempTitle} showMenu={activeMenuSessionId === s.id} folders={folders} onSelect={() => setCurrentSessionId(s.id)} onEditStart={() => { setEditingSessionId(s.id); setTempTitle(s.title); setActiveMenuSessionId(null) }} onEditSave={() => updateSessionTitle(s.id, tempTitle)} onDelete={(e: any) => deleteSession(e, s.id)} onMenuToggle={(e: any) => { e.stopPropagation(); setActiveMenuSessionId(activeMenuSessionId === s.id ? null : s.id) }} onMoveTo={(fid: any) => moveSessionToFolder(s.id, fid)} setTempTitle={setTempTitle} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {sessions.filter((s: any) => !s.folderId && s.title.toLowerCase().includes(searchQuery)).map((s: any) => (
                                        <div key={s.id} className="flex items-center gap-1 mb-0.5">
                                            {isBatchMode && (
                                                <button onClick={() => toggleSelect(s.id)} className="p-1">
                                                    {selectedIds.has(s.id) ? <CheckSquare size={16} className="text-indigo-500" /> : <Square size={16} className="text-gray-300" />}
                                                </button>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <SessionItem session={s} isActive={currentSessionId === s.id} isEditing={editingSessionId === s.id} tempTitle={tempTitle} showMenu={activeMenuSessionId === s.id} folders={folders} onSelect={() => setCurrentSessionId(s.id)} onEditStart={() => { setEditingSessionId(s.id); setTempTitle(s.title); setActiveMenuSessionId(null) }} onEditSave={() => updateSessionTitle(s.id, tempTitle)} onDelete={(e: any) => deleteSession(e, s.id)} onMenuToggle={(e: any) => { e.stopPropagation(); setActiveMenuSessionId(activeMenuSessionId === s.id ? null : s.id) }} onMoveTo={(fid: any) => moveSessionToFolder(s.id, fid)} setTempTitle={setTempTitle} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-gray-100 bg-gray-50/30">
                        <div className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">System Control</div>
                        <div className="flex flex-col gap-1.5">
                            <button
                                onClick={toggleMemoryMode}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold border transition-all ${isStory ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-blue-50 border-blue-200 text-blue-600'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    {isStory ? <History size={14} /> : <Infinity size={14} />}
                                    <span>{isStory ? 'Story Mode' : 'Infinite Mode'}</span>
                                </div>
                            </button>

                            <button onClick={async () => {
                                if (!useWebSearch) { 
                                    if (await checkEnv('tavily')) toggleWebSearch();
                                } else {
                                    toggleWebSearch(); 
                                }
                            }} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold border transition-all ${useWebSearch ? 'bg-sky-50 border-sky-200 text-sky-600' : 'bg-white text-gray-400'}`}>
                                <div className="flex items-center gap-2"><Globe size={14} /><span>Web Search</span></div>
                                <span className="text-[9px]">{useWebSearch ? 'ON' : 'OFF'}</span>
                            </button>

                            <button onClick={async () => {
                                if (!useImageGen) {
                                    if (await checkEnv('sd')) toggleImageGen();
                                } else {
                                    toggleImageGen();
                                }
                            }} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold border transition-all ${useImageGen ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-white text-gray-400'}`}>
                                <div className="flex items-center gap-2"><ImageIcon size={14} /><span>Visualizer</span></div>
                                <span className="text-[9px]">{useImageGen ? 'ON' : 'OFF'}</span>
                            </button>

                            <button onClick={async () => {
                                if (!useTTS) {
                                    if (await checkEnv('tts')) toggleTTS();
                                } else {
                                    toggleTTS();
                                }
                            }} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold border transition-all ${useTTS ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white text-gray-400'}`}>
                                <div className="flex items-center gap-2"><Mic size={14} /><span>Voice Module</span></div>
                                <span className="text-[9px]">{useTTS ? 'ACTIVE' : 'OFF'}</span>
                            </button>

                            <button onClick={async () => {
                                if (!useMusicControl) {
                                    if (await checkEnv('music')) toggleMusicControl();
                                } else {
                                    toggleMusicControl();
                                }
                            }} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold border transition-all ${useMusicControl ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white text-gray-400'}`}>
                                <div className="flex items-center gap-2">
                                    <Disc size={14} />
                                    <span>Auto DJ</span>
                                </div>
                                <span className="text-[9px]">{useMusicControl ? 'ON' : 'OFF'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-3">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                                <Cloud size={10} /> Cloud Sync
                            </span>

                            <div className="flex gap-1 opacity-50 hover:opacity-100 transition-opacity">
                                <button onClick={handleExportData} className="p-1 hover:bg-gray-200 rounded text-gray-500" title="Local Backup (JSON)">
                                    <Download size={12} />
                                </button>
                                <button onClick={() => importInputRef.current?.click()} className="p-1 hover:bg-gray-200 rounded text-gray-500" title="Restore from JSON">
                                    <Upload size={12} />
                                </button>
                                <input type="file" ref={importInputRef} onChange={handleImportData} className="hidden" accept=".json" />
                            </div>
                        </div>

                        <button
                            onClick={onManualSync}
                            disabled={syncStatus === 'syncing'}
                            className={`
                            w-full py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm
                                ${syncStatus === 'syncing'
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-500 cursor-wait'
                                    : syncStatus === 'error'
                                        ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                                        : syncStatus === 'success'
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md active:scale-[0.98]'
                                }
                            `}
                        >
                            {syncStatus === 'syncing' ? (
                                <>
                                    <RefreshCw size={14} className="animate-spin" />
                                    <span>SYNCING...</span>
                                </>
                            ) : syncStatus === 'error' ? (
                                <>
                                    <AlertTriangle size={14} />
                                    <span>SYNC FAILED</span>
                                </>
                            ) : syncStatus === 'success' ? (
                                <>
                                    <Check size={14} />
                                    <span>ALL SYNCED</span>
                                </>
                            ) : (
                                <>
                                    <CloudRain size={14} /> 
                                    <span>SYNC NOW</span>
                                </>
                            )}
                        </button>

                        <div className="text-[9px] text-center mt-1.5 text-gray-300 font-mono">
                            {syncStatus === 'idle' ? 'Auto-sync active' : syncStatus === 'success' ? 'Data is safe' : 'Check connection'}
                        </div>
                    </div>

                    <AnimatePresence>
                        {isBatchMode && (
                            <motion.div
                                initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                                className="absolute bottom-16 left-4 right-4 bg-white border border-indigo-200 shadow-2xl rounded-xl p-3 z-50 flex items-center justify-between"
                            >
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-indigo-400 uppercase">Selected</span>
                                    <span className="text-lg font-black text-indigo-600 leading-tight">{selectedIds.size}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { setIsBatchMode(false); setSelectedIds(new Set()); }} className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:bg-gray-100 rounded-lg">CANCEL</button>
                                    <button onClick={() => setShowBatchConfirm(true)} disabled={selectedIds.size === 0} className="px-4 py-1.5 text-xs font-bold bg-red-600 text-white rounded-lg shadow-md disabled:opacity-50">DELETE</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <BatchDeleteModal
                        isOpen={showBatchConfirm}
                        onClose={() => setShowBatchConfirm(false)}
                        count={selectedIds.size}
                        onConfirm={() => {
                            batchDelete(Array.from(selectedIds));
                            setIsBatchMode(false);
                            setSelectedIds(new Set());
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};