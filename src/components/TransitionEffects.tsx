"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

export type EffectType = "none" | "curtain" | "rain" | "math" | "cyber";

const PC = dynamic(() => import("./TransitionEffectsPC"), { ssr: false });
const Mobile = dynamic(() => import("./TransitionEffectsMobile"), { ssr: false });

export const TransitionEffects = React.memo(({ effect, onComplete }: { effect: EffectType, onComplete: () => void }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768);
      setMounted(true);
    }
  }, []);

  if (!mounted) return null; 

  return isMobile ? (
    <Mobile effect={effect} onComplete={onComplete} />
  ) : (
    <PC effect={effect} onComplete={onComplete} />
  );
});

TransitionEffects.displayName = "TransitionEffects";