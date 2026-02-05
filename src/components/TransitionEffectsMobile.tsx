"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { EffectType } from "./TransitionEffectsPC"; 

const EKG_PATH = "M0,50 L20,50 L25,40 L30,60 L35,30 L45,80 L55,20 L65,50 L100,50";

const TransitionEffectsMobile = ({ effect, onComplete }: { effect: EffectType, onComplete: () => void }) => {

  useEffect(() => {
    if (effect !== "none") {
      const duration = effect === "glitch" ? 4000 : 3000;
      const timer = setTimeout(() => onComplete(), duration);
      return () => clearTimeout(timer);
    }
  }, [effect, onComplete]);

  const drops = Array.from({ length: 8 }).map((_, i) => ({
    id: i, left: `${Math.random() * 100}%`, delay: Math.random() * 1, duration: 0.5 + Math.random() * 0.5
  }));

  return (
    <AnimatePresence>
      {effect === "curtain" && (
        <motion.div className="fixed inset-0 z-[9999] pointer-events-none flex flex-col justify-center items-center bg-black">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-white font-serif text-xl tracking-[0.2em]"
          >
            ACTA EST FABULA
          </motion.div>
        </motion.div>
      )}

      {effect === "rain" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] pointer-events-none bg-black/50">
          {drops.map(drop => (
            <motion.div key={drop.id} initial={{ y: -50, opacity: 0 }} animate={{ y: "100vh", opacity: 0.4 }} transition={{ duration: drop.duration, repeat: Infinity, ease: "linear", delay: drop.delay }} className="absolute w-[1px] h-24 bg-blue-300" style={{ left: drop.left }} />
          ))}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="absolute bottom-10 right-6 text-blue-100/60 font-serif italic text-sm">Memories...</motion.div>
        </motion.div>
      )}

      {(effect === "math" || effect === "cyber") && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] pointer-events-none bg-black/80 flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-emerald-500 font-mono text-xs tracking-widest blink">
              {effect === "math" ? "CALCULATING..." : "LINK START..."}
            </div>
          </div>
        </motion.div>
      )}

      {effect === "bloom" && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center bg-pink-900/20"
        >
          <motion.div
            className="absolute inset-0 bg-pink-500/10"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <div className="w-full px-4">
            <svg viewBox="0 0 100 50" className="w-full overflow-visible">
              <motion.path
                d="M0,25 L30,25 L35,10 L45,40 L50,25 L100,25"
                fill="none"
                stroke="#ec4899"
                strokeWidth="1.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: [0, 1, 1],
                  opacity: [0, 1, 0],
                  x: ["-10%", "0%", "10%"] 
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </svg>
            <div className="text-center mt-4 text-pink-300 font-serif italic tracking-widest">
              HEARTBEAT
            </div>
          </div>
        </motion.div>
      )}

      {effect === "glitch" && (
        <motion.div
          className="fixed inset-0 z-[9999] pointer-events-none bg-black overflow-hidden flex items-center justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-red-900/60"
            animate={{ opacity: [0, 0.8, 0, 0.5, 0] }}
            transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 0.5 }}
          />

          <motion.div
            className="absolute top-0 left-0 w-full h-1/2 bg-black/20 border-b-2 border-red-600/50"
            animate={{ x: [-2, 2, -1, 1, 0] }}
            transition={{ duration: 0.1, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-full h-1/2 bg-black/20"
            animate={{ x: [2, -2, 1, -1, 0] }} 
            transition={{ duration: 0.1, repeat: Infinity }}
          />

          <motion.div
            className="text-red-500 font-black text-5xl tracking-tighter text-center z-10"
            style={{ textShadow: "2px 2px 0 #000" }}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: [1.2, 1], opacity: 1 }}
          >
            BROKEN
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TransitionEffectsMobile;