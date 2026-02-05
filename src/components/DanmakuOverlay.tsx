"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export const DanmakuOverlay = ({ danmakuList }: { danmakuList: string[] | undefined }) => {
  const [items, setItems] = useState<{ id: number, text: string, top: number, color: string, duration: number }[]>([]);

  useEffect(() => {
    if (danmakuList && danmakuList.length > 0) {
      const newItems = danmakuList.map((text, i) => ({
        id: Date.now() + i,
        text,
        top: 10 + Math.random() * 60, 
        color: ['#FF6B6B', '#4ECDC4', '#FFEAA7', '#FFF', '#74b9ff'][Math.floor(Math.random() * 5)],
        duration: 8 + Math.random() * 5 
      }));
      setItems(prev => [...prev, ...newItems]);
    }
  }, [danmakuList]);

  return (
    <div className="fixed inset-0 z-[50] pointer-events-none overflow-hidden">
      <AnimatePresence>
        {items.map(item => (
          <motion.div
            key={item.id}
            initial={{ x: "100vw" }}
            animate={{ x: "-100%" }}
            transition={{ duration: item.duration, ease: "linear" }}
            onAnimationComplete={() => setItems(prev => prev.filter(i => i.id !== item.id))} 
            className="absolute whitespace-nowrap text-xl font-bold drop-shadow-md opacity-80"
            style={{
              top: `${item.top}%`,
              color: item.color,
              fontFamily: '"SimHei", "Microsoft YaHei", sans-serif',
              textShadow: '1px 1px 0 #000'
            }}
          >
            {item.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};