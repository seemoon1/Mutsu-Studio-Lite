"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Download, Trash2, X, Camera, HardDrive, Loader2 } from "lucide-react";
import { toJpeg } from 'html-to-image';

export const SaveLoadModal = ({ isOpen, onClose, currentSession, onLoadSession }: any) => {
    const [slots, setSlots] = useState<Record<number, any>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);

    const fetchSlots = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/local/slots");
            const data = await res.json();
            
            const map: Record<number, any> = {};
            if (data.slots) {
                data.slots.forEach((meta: any) => {
                    map[meta.slotIndex] = meta;
                });
            }
            setSlots(map);
        } catch (e) {
            console.error("Fetch slots failed", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) fetchSlots();
    }, [isOpen]);

    const captureScreen = async () => {
        setIsCapturing(true); 
        
        await new Promise(r => setTimeout(r, 800)); 

        try {
            const dataUrl = await toJpeg(document.body, {
                quality: 0.6,
                pixelRatio: 0.5,
                filter: (node) => {
                    if (node instanceof HTMLElement) {
                        const style = window.getComputedStyle(node);
                        if (style.position === 'fixed' && style.zIndex && parseInt(style.zIndex) > 100) {
                            return false; 
                        }
                    }
                    return true;
                }
            });
            return dataUrl;
        } catch (e) {
            console.error("Capture failed", e);
            return null; 
        } finally {
            setIsCapturing(false); 
        }
    };

    const handleSave = async (index: number) => {
        if (!currentSession) return;
        if (slots[index] && !confirm(`⚠️ 覆盖 Slot ${index + 1}？`)) return;

        const base64 = await captureScreen();
        setIsLoading(true);

        const lastMsg = currentSession.messages[currentSession.messages.length - 1];
        let preview = "New Memory";
        if (lastMsg) preview = typeof lastMsg.content === 'string' ? lastMsg.content.slice(0, 30) + "..." : "[Image]";

        try {
            const res = await fetch("/api/local/slots", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    slotIndex: index,
                    session: currentSession,
                    meta: {
                        slotIndex: index,
                        name: `Save ${index + 1}`,
                        previewText: preview,
                    },
                    thumbnailBase64: base64
                })
            });

            if (!res.ok) throw new Error("Save failed");
            await fetchSlots();
        } catch (e) {
            alert("Save failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoad = async (index: number) => {
        if (!confirm(`读取 Slot ${index + 1}？\n当前未保存的进度将丢失。`)) return;
        
        setIsLoading(true);
        try {
            const res = await fetch("/api/local/slots/read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slotIndex: index })
            });
            const data = await res.json();
            
            if (data.session) {
                onLoadSession(data.session);
                onClose();
            }
        } catch (e) {
            alert("Load failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (e: any, index: number) => {
        e.stopPropagation();
        if (!confirm("永久删除此存档？")) return;
        setIsLoading(true);
        await fetch("/api/local/slots", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slotIndex: index })
        });
        await fetchSlots();
        setIsLoading(false);
    };

    if (isCapturing) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[#1a1a1a] w-full max-w-5xl h-[80vh] rounded-2xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
                        
                        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#202020]">
                            <div className="flex items-center gap-3 text-white">
                                <HardDrive className="text-emerald-500" size={24}/>
                                <div className="font-bold tracking-widest text-lg">LOCAL STORAGE</div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400"><X size={24}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-[#121212]">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Array.from({ length: 12 }).map((_, i) => {
                                    const slot = slots[i];
                                    return (
                                        <div key={i} onClick={() => !isLoading && handleSave(i)} className={`relative group aspect-video rounded-xl border-2 transition-all cursor-pointer overflow-hidden flex flex-col ${slot ? 'border-emerald-500/30 bg-black' : 'border-white/5 bg-white/5 hover:border-white/20'}`}>
                                            <div className="flex-1 relative bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
                                                {slot?.thumbnail ? (
                                                    <img src={slot.thumbnail} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"/>
                                                ) : (
                                                    <span className="text-white/10 font-bold text-4xl">{i + 1}</span>
                                                )}
                                                
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                                                    <button onClick={(e)=>{e.stopPropagation(); handleSave(i)}} className="flex flex-col items-center text-white hover:text-emerald-400"><Save size={24}/><span className="text-[10px] font-bold mt-1">SAVE</span></button>
                                                    {slot && <button onClick={(e)=>{e.stopPropagation(); handleLoad(i)}} className="flex flex-col items-center text-white hover:text-blue-400"><Download size={24}/><span className="text-[10px] font-bold mt-1">LOAD</span></button>}
                                                    {slot && <button onClick={(e)=>{e.stopPropagation(); handleDelete(e, i)}} className="flex flex-col items-center text-white hover:text-red-400"><Trash2 size={24}/><span className="text-[10px] font-bold mt-1">DEL</span></button>}
                                                </div>
                                            </div>

                                            <div className="h-12 bg-[#1a1a1a] border-t border-white/5 px-3 flex flex-col justify-center">
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-xs font-bold font-mono ${slot ? 'text-emerald-400' : 'text-gray-600'}`}>SLOT {i+1}</span>
                                                    {slot && <span className="text-[10px] text-gray-500">{new Date(slot.timestamp).toLocaleDateString()}</span>}
                                                </div>
                                                {slot && <div className="text-[10px] text-gray-400 truncate mt-0.5">{slot.previewText}</div>}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};