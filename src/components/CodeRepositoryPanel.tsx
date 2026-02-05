"use client";
import { useState, useEffect } from "react";
import {
    Lock, Check, FileCode, Plus, Trash2, Copy,
    Search, Terminal, X, Maximize2, Minimize2,
    Sidebar, Play, RefreshCw, Layers
} from "lucide-react";
import { CodeFile } from "../types";
import { motion, AnimatePresence } from "framer-motion";

const CodeEditor = ({ repository, onUpdate, onClose, isFullScreen, toggleFullScreen }: any) => {
    const [files, setFiles] = useState<Record<string, CodeFile>>({});
    const [activeFile, setActiveFile] = useState<string>("");
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [showSidebar, setShowSidebar] = useState(true);

    useEffect(() => {
        if (repository) {
            setFiles(repository);
            if (!activeFile && Object.keys(repository).length > 0) setActiveFile(Object.keys(repository)[0]);
        }

        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setShowSidebar(false);
        }
    }, [repository]);

    const [isRunning, setIsRunning] = useState(false);
    const [consoleOutput, setConsoleOutput] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false); 

    const handleRun = async () => {
        if (!activeFile) return;
        const file = files[activeFile];

        if (file.language === 'html' || file.name.endsWith('.html')) {
            setShowPreview(true);
            setConsoleOutput(null); 
            return;
        }

        if (file.language === 'python' || file.name.endsWith('.py')) {
            setIsRunning(true);
            setShowPreview(false);
            setConsoleOutput("Running..."); 

            try {
                const res = await fetch('/api/run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: file.content, language: 'python' })
                });
                const data = await res.json();
                setConsoleOutput(data.output || data.error || "No Output");
            } catch (e: any) {
                setConsoleOutput(`Error: ${e.message}`);
            } finally {
                setIsRunning(false);
            }
            return;
        }

        alert("目前仅支持预览 HTML 或运行 Python 哦~");
    };

    const handleSave = () => {
        if (confirm("⚠️ Commit Changes to Repository?")) {
            onUpdate(files);
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setFiles(repository || {});
        setIsEditing(false);
    };

    const handleNewFile = () => {
        const name = prompt("Filename (e.g. main.py):");
        if (name) {
            setFiles(prev => ({ ...prev, [name]: { name, language: "text", content: "# New File" } }));
            setActiveFile(name);
            setIsEditing(true);
            setShowSidebar(true); 
        }
    };

    const handleDelete = (e: any, name: string) => {
        e.stopPropagation();
        if (confirm(`Delete ${name}?`)) {
            const newFiles = { ...files };
            delete newFiles[name];
            setFiles(newFiles);
            if (activeFile === name) setActiveFile(Object.keys(newFiles)[0] || "");
        }
    };

    return (
        <div className={`bg-[#1e1e1e] flex flex-col text-slate-300 font-mono text-xs overflow-hidden shadow-2xl border-slate-700 ${isFullScreen ? 'fixed inset-0 z-[100]' : 'w-full h-[600px] rounded-xl border'}`}>

            <div className="bg-[#2d2d2d] px-3 py-2 border-b border-black flex justify-between items-center select-none shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className={`p-1 rounded hover:bg-white/10 ${showSidebar ? 'text-blue-400' : 'text-slate-500'}`}
                        title="Toggle Sidebar"
                    >
                        <Sidebar size={14} />
                    </button>

                    <div className="flex items-center gap-2 font-bold text-slate-200">
                        <Terminal size={14} className="text-emerald-500" />
                        <span className="hidden md:inline">MUTSU IDE</span>
                        <span className="md:hidden text-emerald-500 truncate max-w-[100px]">{activeFile}</span>
                    </div>
                </div>

                <div className="flex gap-2 items-center">

                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className={`p-1.5 rounded transition-colors ${isRunning ? 'text-emerald-600 bg-emerald-100' : 'hover:bg-white/10 text-emerald-500'}`}
                        title="Run Code"
                    >
                        {isRunning ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                    </button>

                    <div className="w-px h-4 bg-gray-600 mx-1"></div>

                    {isEditing && (
                        <button onClick={handleCancel} className="p-1.5 hover:bg-white/10 rounded text-red-400" title="Discard">
                            <X size={14} />
                        </button>
                    )}
                    <button
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        className={`p-1.5 rounded transition-colors ${isEditing ? 'bg-green-900/50 text-green-400 animate-pulse' : 'hover:bg-white/10 text-slate-400'}`}
                        title={isEditing ? "Commit" : "Edit"}
                    >
                        {isEditing ? <Check size={14} /> : <Lock size={14} />}
                    </button>

                    <button onClick={handleNewFile} className="p-1.5 hover:bg-white/10 rounded text-slate-300" title="New File"><Plus size={14} /></button>
                    <button onClick={toggleFullScreen} className="p-1.5 hover:bg-white/10 rounded text-slate-300" title="Fullscreen">
                        {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                    <button onClick={onClose} className="p-1.5 hover:bg-red-900/50 rounded text-slate-300 hover:text-red-400" title="Close">
                        <X size={14} />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 min-h-0 relative">
                {showSidebar && (
                    <div className="w-1/3 md:w-56 bg-[#252526] border-r border-black flex flex-col absolute inset-y-0 left-0 z-10 md:static">
                        <div className="p-2 border-b border-black/50">
                            <div className="relative">
                                <Search size={10} className="absolute left-2 top-1.5 text-slate-500" />
                                <input className="w-full bg-[#3c3c3c] rounded px-6 py-1 outline-none text-slate-200 placeholder-slate-500" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
                            {Object.keys(files).filter(f => f.toLowerCase().includes(searchTerm.toLowerCase())).map(fileName => (
                                <div
                                    key={fileName}
                                    onClick={() => { setActiveFile(fileName); if (window.innerWidth < 768) setShowSidebar(false); }} // 手机上选完文件自动收起
                                    className={`flex justify-between items-center px-2 py-1.5 rounded cursor-pointer group ${activeFile === fileName ? 'bg-[#37373d] text-white' : 'hover:bg-[#2a2d2e]'}`}
                                >
                                    <span className="flex items-center gap-2 truncate text-[11px]">
                                        <FileCode size={12} className="text-blue-400 flex-shrink-0" />
                                        <span className="truncate">{fileName}</span>
                                    </span>
                                    {isEditing && <button onClick={(e) => handleDelete(e, fileName)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"><Trash2 size={10} /></button>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className={`flex-1 flex flex-col bg-[#1e1e1e] relative transition-all ${showSidebar ? 'ml-[33.33%] md:ml-0' : 'ml-0'}`}>

                    {activeFile ? (
                        <div className="relative flex-1 min-h-0 flex flex-col h-full">

                            <div
                                className="absolute top-2 right-4 z-10 opacity-30 hover:opacity-100 cursor-pointer transition-opacity p-1 bg-black/50 rounded"
                                onClick={() => { navigator.clipboard.writeText(files[activeFile].content); alert("Copied!"); }}
                                title="Copy Content"
                            >
                                <Copy size={14} />
                            </div>

                            <textarea
                                value={files[activeFile]?.content || ""}
                                onChange={(e) => setFiles({ ...files, [activeFile]: { ...files[activeFile], content: e.target.value } })}
                                disabled={!isEditing}
                                spellCheck={false}
                                className={`w-full flex-1 bg-transparent p-4 outline-none resize-none font-mono leading-relaxed ${isEditing ? 'text-white' : 'text-slate-400'}`}
                                style={{ fontFamily: '"Fira Code", "Consolas", monospace', fontSize: isFullScreen ? '14px' : '12px' }}
                            />

                            <AnimatePresence>
                                {(consoleOutput !== null || showPreview) && (
                                    <motion.div
                                        initial={{ height: 0 }} animate={{ height: "40%" }} exit={{ height: 0 }}
                                        className="border-t border-slate-700 bg-[#111] flex flex-col shrink-0"
                                    >
                                        <div className="flex justify-between items-center px-4 py-1 bg-[#252526] border-b border-black">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                                                <Layers size={12} /> {showPreview ? "Web Preview" : "Console Output"}
                                            </span>
                                            <button onClick={() => { setConsoleOutput(null); setShowPreview(false) }} className="text-gray-500 hover:text-white transition-colors">
                                                <X size={12} />
                                            </button>
                                        </div>

                                        <div className="flex-1 overflow-auto relative p-0">
                                            {showPreview && files[activeFile] ? (
                                                <iframe
                                                    srcDoc={files[activeFile].content}
                                                    className="w-full h-full bg-white"
                                                    sandbox="allow-scripts" 
                                                    title="preview"
                                                />
                                            ) : (
                                                <pre className="p-4 text-xs font-mono text-emerald-400 whitespace-pre-wrap select-text font-bold">
                                                    {consoleOutput}
                                                </pre>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-600 flex-col gap-2 select-none">
                            <Terminal size={32} className="opacity-20" />
                            <span>No File Selected</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const CodeRepositoryModal = ({ isOpen, onClose, repository, onUpdate }: any) => {
    const [isFullScreen, setIsFullScreen] = useState(false);
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className={`fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center ${isFullScreen ? 'p-0' : 'p-4 md:p-10'}`}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                        className={isFullScreen ? "w-full h-full" : "w-full max-w-5xl"}
                    >
                        <CodeEditor
                            repository={repository}
                            onUpdate={onUpdate}
                            onClose={onClose}
                            isFullScreen={isFullScreen}
                            toggleFullScreen={() => setIsFullScreen(!isFullScreen)}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};