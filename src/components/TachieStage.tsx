"use client";
import { motion, AnimatePresence } from "framer-motion";
import TACHIE_CONFIG from "../data/tachie_config.json";

export const TachieStage = ({ characters }: any) => {

  if (!characters || !Array.isArray(characters) || characters.length === 0) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {characters.map((charState: any, index: number) => {
        const charImages = (TACHIE_CONFIG as any)[charState.id];

        if (!charImages) return null;

        const emotionKey = charState.current_sprite || "default";
        const spriteUrl = charImages[emotionKey] || charImages["default"];

        if (!spriteUrl) return null;

        return (
          <AnimatePresence key={index} mode="wait">
            <motion.img
              key={spriteUrl}
              src={spriteUrl}
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute bottom-0 right-0 md:right-10 h-[80vh] md:h-[90vh] object-contain object-bottom drop-shadow-2xl filter brightness-95"
              style={{ zIndex: 10 - index }}
            />
          </AnimatePresence>
        );
      })}
    </div>
  );
};