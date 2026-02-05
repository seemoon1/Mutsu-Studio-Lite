"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export type EffectType = "none" | "curtain" | "rain" | "math" | "cyber" | "bloom" | "glitch";

const HARD_MATH_EQUATIONS = [
  "f(x,y) = \\sin(x^2 + y^2)", "\\nabla \\cdot \\mathbf{F} = 0", "e^{i\\pi} + 1 = 0",
  "\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}", "H(w) = \\sum_{i=1}^{k} \\alpha_i y_i",
  "i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi", "\\mathcal{L} = T - V",
  "E = mc^2", "\\delta S = 0", "\\oint_C \\mathbf{E} \\cdot d\\mathbf{l} = -\\frac{d\\Phi_B}{dt}"
];

const DATA_STREAMS = [
  "COORDINATES_LOCKED", "GRID_DENSITY_100%", "CORE_TEMPERATURE_NORMAL",
  "LATITUDE_VISIBILITY_ENHANCED", "POLES_HIDDEN", "LINK_START"
];

const EKG_PATH = "M0,50 L20,50 L25,40 L30,60 L35,30 L45,80 L55,20 L65,50 L100,50";

const TransitionEffectsPC = ({ effect, onComplete }: { effect: EffectType, onComplete: () => void }) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [shards, setShards] = useState<any[]>([]);

  useEffect(() => {
    if (effect === "glitch") {
      const newShards = Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        width: Math.random() * 300 + 50,
        height: Math.random() * 300 + 50,
        top: Math.random() * 100,
        left: Math.random() * 100,
        clip: `polygon(${Math.random() * 100}% 0, 100% ${Math.random() * 100}%, 0 ${Math.random() * 100}%)`,
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 1000,
        z: Math.random() * 1000,
        rotateX: Math.random() * 720,
        rotateY: Math.random() * 720,
        bg: i % 3 === 0 ? '#450a0a' : i % 3 === 1 ? '#dc2626' : '#000000',
        delay: Math.random() * 0.2
      }));
      setShards(newShards);
    }
  }, [effect]);

  useEffect(() => {
    if (typeof window !== "undefined") setDimensions({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  useEffect(() => {
    if (effect !== "none") {
      const timer = setTimeout(() => onComplete(), 5000);
      return () => clearTimeout(timer);
    }
  }, [effect, onComplete]);

  const drops = Array.from({ length: 100 }).map((_, i) => ({ id: i, left: `${Math.random() * 100}%`, delay: Math.random() * 2, duration: 0.5 + Math.random() * 0.5 }));
  const equations = Array.from({ length: 30 }).map((_, i) => ({ id: i, text: HARD_MATH_EQUATIONS[i % HARD_MATH_EQUATIONS.length], x: Math.random() * 100, y: Math.random() * 100, scale: 0.5 + Math.random() * 1.5, delay: Math.random() * 2 }));

  return (
    <AnimatePresence>
      {effect === "curtain" && (
        <motion.div className="fixed inset-0 z-[9999] pointer-events-none flex flex-col justify-center items-center">
          <motion.div initial={{ x: "-100%" }} animate={{ x: "0%" }} exit={{ x: "-100%" }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="absolute left-0 top-0 w-1/2 h-full bg-[#1a0505] z-10 border-r-4 border-[#4a0e0e] shadow-2xl" />
          <motion.div initial={{ x: "100%" }} animate={{ x: "0%" }} exit={{ x: "100%" }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="absolute right-0 top-0 w-1/2 h-full bg-[#1a0505] z-10 border-l-4 border-[#4a0e0e] shadow-2xl" />
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.6, duration: 0.5 }} className="z-20 text-white font-serif text-3xl tracking-[0.5em] uppercase drop-shadow-lg">Acta Est Fabula</motion.div>
        </motion.div>
      )}

      {effect === "rain" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="fixed inset-0 z-[9999] pointer-events-none bg-slate-900/60 backdrop-blur-[2px] overflow-hidden">
          {drops.map(drop => (
            <motion.div key={drop.id} initial={{ y: -100, opacity: 0 }} animate={{ y: "100vh", opacity: 0.7 }} transition={{ duration: drop.duration, repeat: Infinity, ease: "linear", delay: drop.delay }} className="absolute w-[1px] h-20 bg-gradient-to-b from-transparent to-blue-200" style={{ left: drop.left }} />
          ))}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="absolute bottom-10 right-10 text-blue-100/50 font-serif italic text-xl">Memories of C...</motion.div>
        </motion.div>
      )}

      {effect === "math" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] pointer-events-none bg-black flex items-center justify-center overflow-hidden perspective-[1000px]">
          <motion.div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(#059669 1px, transparent 1px), linear-gradient(90deg, #059669 1px, transparent 1px)', backgroundSize: '50px 50px' }} animate={{ backgroundPosition: ["0px 0px", "50px 50px"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
          <svg className="absolute w-full h-full opacity-80" preserveAspectRatio="none">
            <motion.path d="M -100 200 Q 400 0, 900 200 T 1900 200 V 1000 H -100 Z" fill="none" stroke="#10b981" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1, d: ["M -100 500 Q 500 200, 1000 500 T 2100 500", "M -100 500 Q 500 800, 1000 500 T 2100 500", "M -100 500 Q 500 200, 1000 500 T 2100 500"] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} />
            <motion.path fill="none" stroke="#06b6d4" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1, opacity: [0.3, 0.8, 0.3], d: ["M -100 300 Q 600 600, 1200 300 T 2500 300", "M -100 300 Q 600 0, 1200 300 T 2500 300", "M -100 300 Q 600 600, 1200 300 T 2500 300"] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
            <motion.path fill="none" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="10 10" animate={{ d: ["M -100 800 Q 400 700, 900 800 T 2000 800", "M -100 800 Q 400 900, 900 800 T 2000 800", "M -100 800 Q 400 700, 900 800 T 2000 800"] }} transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }} />
          </svg>
          {equations.map((eq) => (<motion.div key={eq.id} className="absolute font-mono font-bold text-emerald-400/60 pointer-events-none whitespace-nowrap" style={{ left: `${eq.x}%`, fontSize: `${eq.scale}rem` }} initial={{ y: "110vh", opacity: 0 }} animate={{ y: "-10vh", opacity: [0, 1, 0] }} transition={{ duration: 5 + Math.random() * 3, repeat: Infinity, delay: eq.delay, ease: "linear" }}>{eq.text}</motion.div>))}
          <motion.div className="absolute w-[800px] h-[800px] border border-emerald-500/20 rounded-full" style={{ boxShadow: "0 0 50px rgba(16, 185, 129, 0.1)" }} animate={{ rotate: 360, scale: [0.8, 1, 0.8] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}><div className="absolute top-1/2 left-1/2 w-full h-[1px] bg-emerald-500/20 origin-left"></div><div className="absolute top-1/2 left-1/2 w-[1px] h-full bg-emerald-500/20 origin-top"></div></motion.div>
          <div className="z-50 bg-black/80 px-8 py-4 border-y-2 border-emerald-500 backdrop-blur-md text-emerald-400 font-mono font-bold tracking-widest text-center"><div>CALCULATING</div><div className="text-[10px] opacity-70 mt-1">OPTIMIZING NEURAL PATHWAYS</div></div>
        </motion.div>
      )}

      {effect === "cyber" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] pointer-events-none bg-[#02040a] flex items-center justify-center overflow-hidden perspective-[1000px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-950/30 via-[#000] to-[#000]"></div>
          <motion.div className="absolute inset-[-50%] opacity-20" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L37.32 10V30L20 40 2.68 30V10z' fill='none' stroke='%230ea5e9' stroke-width='1'/%3E%3C/svg%3E")`, transform: 'perspective(500px) rotateX(60deg)' }} animate={{ translateY: ["0px", "40px"] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
          <motion.div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px]" style={{ transformStyle: "preserve-3d" }} animate={{ rotateY: 360, rotateZ: 23.5, rotateX: 10 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }}>
            <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-[50px] shadow-[0_0_120px_rgba(59,130,246,0.6)]"></div>
            {[0, 30, 60, 90, 120, 150].map((deg, i) => (<div key={`long-${i}`} className="absolute inset-0 rounded-full border border-cyan-400/40" style={{ transform: `rotateY(${deg}deg)`, boxShadow: "0 0 5px rgba(6, 182, 212, 0.3)" }} />))}
            <div className="absolute inset-0 rounded-full border-2 border-cyan-300 shadow-[0_0_10px_cyan]" style={{ transform: "rotateX(90deg)" }}></div>
            <div className="absolute inset-[10%] rounded-full border border-cyan-400/80" style={{ transform: "rotateX(90deg) translateZ(80px)" }}></div>
            <div className="absolute inset-[10%] rounded-full border border-cyan-400/80" style={{ transform: "rotateX(90deg) translateZ(-80px)" }}></div>
            <div className="absolute inset-[25%] rounded-full border border-blue-400/80" style={{ transform: "rotateX(90deg) translateZ(140px)" }}></div>
            <div className="absolute inset-[25%] rounded-full border border-blue-400/80" style={{ transform: "rotateX(90deg) translateZ(-140px)" }}></div>
          </motion.div>
          <div className="absolute bottom-[10%] flex flex-col items-center z-50 pointer-events-none">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500 font-black text-4xl tracking-[0.5em] uppercase drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]">Link Start</motion.div>
            <div className="mt-4 flex gap-4 text-[10px] font-mono text-cyan-600/80">{DATA_STREAMS.map((s, i) => (<motion.span key={i} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }}>{s}</motion.span>))}</div>
          </div>
        </motion.div>
      )}

      {effect === "bloom" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center bg-pink-900/10"
        >
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle,transparent_20%,#fce7f3_80%,#ec4899_100%)] mix-blend-multiply opacity-80"
            animate={{ opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative w-full max-w-4xl h-80 flex items-center justify-center overflow-hidden z-20">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <motion.path
                d="M0,50 L20,50 L25,40 L30,60 L35,30 L45,80 L55,20 L65,50 L100,50"
                fill="none"
                stroke="#db2777" 
                strokeWidth="1.5" 
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: [0, 1, 1, 1],
                  opacity: [0, 1, 1, 0],
                  x: ["-100%", "0%", "0%", "100%"]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "linear",
                  times: [0, 0.4, 0.6, 1]
                }}
                style={{ filter: "drop-shadow(0 0 8px rgba(236, 72, 153, 0.8))" }} 
              />
            </svg>
          </div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: [1, 1.05, 1], opacity: 1 }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="absolute bottom-1/4 text-pink-500 font-serif italic text-3xl tracking-[0.5em] font-bold drop-shadow-md z-20"
          >
            HEARTBEAT
          </motion.div>
        </motion.div>
      )}

      {effect === "glitch" && (
        <motion.div
          className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden bg-black"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ perspective: "1000px" }} 
        >
          <motion.div
            className="absolute inset-0 bg-red-600"
            animate={{ opacity: [0, 0.4, 0, 0.4, 0] }}
            transition={{ duration: 0.2, repeat: Infinity }}
          />

          {shards.map((shard) => (
            <motion.div
              key={shard.id}
              className="absolute shadow-2xl"
              style={{
                top: `${shard.top}%`,
                left: `${shard.left}%`,
                width: shard.width,
                height: shard.height,
                backgroundColor: shard.bg,
                clipPath: shard.clip,
                backfaceVisibility: 'visible', 
              }}
              initial={{ scale: 0, opacity: 0, x: 0, y: 0, z: 0 }}
              animate={{
                scale: [0, 1.5],
                opacity: [1, 1, 0], 
                x: shard.x,
                y: shard.y,
                z: shard.z,
                rotateX: shard.rotateX,
                rotateY: shard.rotateY
              }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
                delay: shard.delay
              }}
            />
          ))}

          <div className="absolute inset-0 flex items-center justify-center perspective-[500px]">
            <motion.div
              className="text-red-600 font-black text-[150px] tracking-tighter text-center leading-none"
              style={{ textShadow: "10px 10px 0 #000" }}
              initial={{ scale: 5, opacity: 0, z: -1000 }}
              animate={{ scale: 1, opacity: 1, z: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              BROKEN<br />REALITY
            </motion.div>
          </div>

          <div className="absolute inset-0 z-50 mix-blend-overlay" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 4px)' }}></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TransitionEffectsPC;