"use client";
import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useState } from "react";

export const Background = React.memo(({ hex, bgImage, bgName }: { hex: string, bgImage?: string | null, bgName?: string }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') setIsMobile(window.innerWidth < 768);
  }, []);

  let finalBgUrl = null;

  if (bgImage) {
    finalBgUrl = `url(${bgImage})`;
  } else if (bgName) {
    if (bgName.startsWith("http") || bgName.startsWith("data:")) {
        finalBgUrl = `url(${bgName})`;
    } else {
        finalBgUrl = `url(/backgrounds/${bgName})`;
    }
  }

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-white">
      <div className="absolute inset-0 transition-colors duration-1000" style={{ backgroundColor: `${hex}15` }} />

      {!isMobile && (
        <>
          <motion.div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[120px]"
            animate={{ backgroundColor: hex, x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
            style={{ opacity: bgImage ? 0.05 : 0.2 }}
            transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
          />
          <motion.div className="absolute top-[40%] right-[0%] w-[40%] h-[60%] rounded-full blur-[100px]"
            animate={{ backgroundColor: hex, x: [0, -30, 0], y: [0, 50, 0] }}
            style={{ opacity: bgImage ? 0.05 : 0.15 }}
            transition={{ duration: 15, repeat: Infinity, repeatType: "reverse" }}
          />
        </>
      )}

      <AnimatePresence mode="wait">
        {finalBgUrl && (
          <motion.div
            key={bgImage || bgName}
            initial={{ opacity: 0 }}
            animate={{ opacity: bgImage ? 0.15 : 1 }} 
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat`}
            style={{ backgroundImage: finalBgUrl }}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

Background.displayName = "Background";