"use client";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, HardDrive, Monitor, Save, Clock, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

export const SyncConflictModal = ({ isOpen, cloudData, localData, onResolve, reason }: any) => {
    const [timeLeft, setTimeLeft] = useState(60);

    useEffect(() => {
        if (isOpen) {
            setTimeLeft(60);
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        onResolve('local'); 
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isOpen, onResolve]);

    if (!isOpen) return null;

    const diskTime = cloudData?._ts ? new Date(cloudData._ts).toLocaleTimeString() : "Unknown";
    const memoryTime = localData?._ts ? new Date(localData._ts).toLocaleTimeString() : "Now";
    
    const diskCount = cloudData?.sessions?.length || 0;
    const memoryCount = localData?.sessions?.length || 0;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border-4 border-red-50"
            >
                <div className="bg-red-50 p-6 border-b border-red-100 flex flex-col items-center text-center">
                    <div className="p-3 bg-red-100 text-red-600 rounded-full mb-3 animate-pulse">
                        <AlertTriangle size={32} />
                    </div>
                    
                    <h3 className="text-xl font-black text-red-900 uppercase tracking-widest">
                        {reason === 'mass_loss' ? "MASS DATA LOSS DETECTED" : "DATA CONFLICT DETECTED"}
                    </h3>
                    
                    <p className="text-sm text-red-600/80 mt-2 font-medium">
                        {reason === 'mass_loss' 
                            ? "本地数据比硬盘数据少了很多。您确定要覆盖吗？"
                            : "外部文件发生了变动。我们要听谁的？"}
                    </p>
                </div>

                <div className="p-8 grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                    
                    <div className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500 border-2 border-gray-200">
                            <HardDrive size={32} />
                        </div>
                        <div className="text-xs font-bold text-gray-500 uppercase">Disk Save</div>
                        <div className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500 font-mono">{diskTime}</div>
                        <div className="text-sm font-bold text-gray-700">{diskCount} Chats</div>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-gray-200 italic">VS</span>
                    </div>

                    <div className="flex flex-col items-center gap-2 relative">
                        <div className="absolute -top-3 right-0 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            CURRENT
                        </div>
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 border-2 border-emerald-200 ring-4 ring-emerald-50">
                            <Monitor size={32} />
                        </div>
                        <div className="text-xs font-bold text-emerald-600 uppercase">Memory</div>
                        <div className="text-[10px] bg-emerald-100 px-2 py-1 rounded text-emerald-600 font-mono">{memoryTime}</div>
                        <div className="text-sm font-bold text-emerald-700">{memoryCount} Chats</div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => onResolve('cloud')} 
                        className="py-3 rounded-xl border border-gray-300 text-gray-600 font-bold text-sm hover:bg-white hover:border-gray-400 transition-all flex items-center justify-center gap-2 group"
                    >
                        <HardDrive size={16} className="group-hover:-translate-y-0.5 transition-transform"/> 
                        <span>Reload Disk</span>
                    </button>
                    <button 
                        onClick={() => onResolve('local')}
                        className="py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 group"
                    >
                        <Save size={16} className="group-hover:-translate-y-0.5 transition-transform"/> 
                        <span>Overwrite Disk</span>
                    </button>
                </div>
                
                <div className="bg-gray-100 py-1 text-center">
                    <span className="text-[9px] text-gray-400 font-mono flex items-center justify-center gap-1">
                        <Clock size={8} /> Auto-picking Memory in {timeLeft}s
                    </span>
                </div>
            </motion.div>
        </div>
    );
};