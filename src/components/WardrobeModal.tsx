"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shirt, Check, AlertCircle } from "lucide-react";

export const WardrobeModal = ({ isOpen, onClose, charName, outfits, currentOutfit, onSelect }: any) => {
  if (!isOpen) return null;

  const safeOutfits = outfits || {};
  const outfitKeys = Object.keys(safeOutfits);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: -5, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        exit={{ opacity: 0, y: -5, scale: 0.98 }}
        className="absolute top-[calc(100%+8px)] right-0 z-[100] w-64 bg-white/95 backdrop-blur-2xl border border-gray-200/80 shadow-2xl rounded-xl overflow-hidden origin-top-right ring-1 ring-black/5"       
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 select-none">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                <Shirt size={14} className="text-emerald-500"/>
                <span>FITTING ROOM</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 transition-all"><X size={14}/></button>
        </div>

        <div className="p-2 max-h-[400px] overflow-y-auto scrollbar-thin">
            <div className="flex justify-between items-center px-2 py-1 mb-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{charName}</span>
                <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{outfitKeys.length}</span>
            </div>

            {outfitKeys.length === 0 ? (
                <div className="p-6 flex flex-col items-center justify-center text-gray-400 gap-2">
                    <AlertCircle size={24} className="opacity-20"/>
                    <span className="text-xs italic">No outfits found.</span>
                </div>
            ) : (
                <div className="space-y-1">
                    {outfitKeys.map((key) => (
                        <button
                            key={key}
                            onClick={() => onSelect(key)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center justify-between transition-all group ${
                                currentOutfit === key 
                                ? 'bg-emerald-50 text-emerald-700 font-bold shadow-sm ring-1 ring-emerald-100' 
                                : 'text-gray-600 hover:bg-gray-100 hover:pl-4'
                            }`}
                        >
                            <span className="capitalize truncate pr-2" title={key}>
                                {key.replace(/_/g, " ").replace(/-/g, " ")}
                            </span>
                            {currentOutfit === key && <Check size={12} className="shrink-0"/>}
                        </button>
                    ))}
                </div>
            )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};