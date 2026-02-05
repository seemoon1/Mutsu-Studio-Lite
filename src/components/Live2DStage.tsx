"use client";
import { useEffect, useRef, useState } from "react";

export const Live2DStage = ({ 
    characterId, 
    config, 
    emotion, 
    outfitId, 
    rightSidebarOpen, 
    leftSidebarOpen 
}: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false); 
  
  const isInitialized = useRef(false);
  const appRef = useRef<any>(null);

  const [debugMode, setDebugMode] = useState(false);
  const [motionGroups, setMotionGroups] = useState<string[]>([]);
  const targetState = useRef({ x: 0, y: 0, scale: 0.25 });

  useEffect(() => {
      console.log(`🧩 [Live2DStage] Component Mounted for: ${characterId}`);
      if (typeof window !== 'undefined') {
          const mobile = window.innerWidth < 768;
          setIsMobile(mobile);
          console.log(`📱 Mobile Check: ${mobile}`);
      }
  }, [characterId]);

  useEffect(() => {
      const handleKey = (e: KeyboardEvent) => {
          if (e.shiftKey && e.altKey && e.key.toLowerCase() === 'd') {
              e.preventDefault(); 
              setDebugMode(prev => !prev);
          }
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !canvasRef.current || isMobile) return;
    if (isInitialized.current) return;

    const initEngine = async () => {
        try {
            console.log("🟢 [Live2D] Engine Init Start...");
            isInitialized.current = true;

            const PIXI = await import("pixi.js");
            (window as any).PIXI = PIXI;
            const { Live2DModel } = await import("pixi-live2d-display");
            Live2DModel.registerTicker(PIXI.Ticker);

            const _app = new PIXI.Application({
                view: canvasRef.current as HTMLCanvasElement,
                autoStart: true,
                backgroundAlpha: 0,
                resizeTo: window,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true
            });

            _app.stage.interactive = true;
            appRef.current = _app;
            console.log("✅ [Live2D] App Created");

            if (config) loadModel(_app, config, outfitId);

        } catch (err) {
            console.error("❌ [Live2D] Init Error:", err);
            isInitialized.current = false;
        }
    };

    initEngine();

    return () => {
        if (appRef.current) {
            appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
            appRef.current = null;
            isInitialized.current = false;
        }
    };
  }, [isMobile]);

  const loadModel = async (app: any, rawCfg: any, outfit: string) => {
      if (!app || !rawCfg) return;

      try {
          const { Live2DModel } = await import("pixi-live2d-display");

          let effectiveConfig = rawCfg;
          if (rawCfg[characterId] && rawCfg[characterId].modelUrl) {
              console.log(`📦 [Live2D] Detected nested config, unwrapping "${characterId}"...`);
              effectiveConfig = rawCfg[characterId];
          } else if (rawCfg[characterId] && rawCfg[characterId].outfits) {
              effectiveConfig = rawCfg[characterId];
          }

          let targetUrl = effectiveConfig.modelUrl;
          if (effectiveConfig.outfits) {
               const keys = Object.keys(effectiveConfig.outfits);
               const key = outfit && effectiveConfig.outfits[outfit] ? outfit : keys[0];
               targetUrl = effectiveConfig.outfits[key];
               console.log(`👗 [Live2D] Outfit Selected: ${key}`);
          }

          if (!targetUrl) {
              console.error("❌ [Live2D] No Valid Model URL found in config:", effectiveConfig);
              return;
          }

          console.log("🎭 [Live2D] Loading:", targetUrl);

          if (app.stage.children.length > 0) app.stage.removeChildren();

          const _model = await Live2DModel.from(targetUrl);
          
          _model.interactive = true;
          _model.buttonMode = true;
          
          _model.on("hit", (hitAreas: string[]) => {
              if (hitAreas.includes("Head")) _model.motion("TapHead");
              else if (hitAreas.includes("Body")) _model.motion("TapBody");
          });

          _model.scale.set(0.2);
          _model.y = 2000; 
          
          app.stage.addChild(_model);
          setModel(_model);

          const internal = _model.internalModel;
          let groups: string[] = [];
          if (internal.motionManager.definitions) {
              groups = Object.keys(internal.motionManager.definitions);
          } else if (internal.motionManager.motionGroups) {
              groups = Object.keys(internal.motionManager.motionGroups);
          }
          setMotionGroups(groups);
          console.log("📂 [Live2D] Motions Loaded:", groups.length);

      } catch (e) {
          console.error("❌ [Live2D] Load Failed:", e);
      }
  };

  useEffect(() => {
      if (appRef.current && config) {
          loadModel(appRef.current, config, outfitId);
      }
  }, [config, outfitId, characterId]); 

  useEffect(() => {
      if (!model || !appRef.current) return;
      const app = appRef.current;

      const originalWidth = model.width / model.scale.x;
      const originalHeight = model.height / model.scale.y;

      let nextScale = 0.3; 
      let offsetX = 0;     
      
      if (rightSidebarOpen && leftSidebarOpen) {
          nextScale = 0.22; offsetX = 260;    
      } else if (rightSidebarOpen) {
          nextScale = 0.25; offsetX = 300;    
      } else if (leftSidebarOpen) {
          nextScale = 0.25; offsetX = -20;
      } else {
          nextScale = 0.3; offsetX = 0;     
      }

      const finalX = window.innerWidth - (originalWidth * nextScale) - offsetX;
      const finalY = window.innerHeight - (originalHeight * nextScale);

      targetState.current = { x: finalX, y: finalY, scale: nextScale };

      const ticker = () => {
          const ease = 0.1;
          if (Math.abs(model.scale.x - targetState.current.scale) > 0.001) 
              model.scale.set(model.scale.x + (targetState.current.scale - model.scale.x) * ease);
          if (Math.abs(model.x - targetState.current.x) > 0.5) 
              model.x += (targetState.current.x - model.x) * ease;
          if (Math.abs(model.y - targetState.current.y) > 0.5) 
              model.y += (targetState.current.y - model.y) * ease;
      };
      
      if (app.ticker) {
          app.ticker.remove(ticker);
          app.ticker.add(ticker);
      }

      return () => { 
          if (app && app.ticker) {
              try {
                  app.ticker.remove(ticker);
              } catch (e) {
              }
          }
      };
  }, [rightSidebarOpen, leftSidebarOpen, model, window.innerWidth]);

  useEffect(() => {
      if(model && emotion && emotion !== 'idle') {
          try { model.motion(emotion); } catch(e) {}
      }
  }, [model, emotion]);

  if (isMobile) return null;

  return (
        <>
            <canvas ref={canvasRef} className="fixed inset-0 z-[1]" style={{ pointerEvents: 'auto' }} />

            {debugMode && model && (
                <div className="fixed bottom-4 right-4 z-[9999] bg-black/90 text-white p-4 rounded-lg shadow-xl max-h-[60vh] overflow-y-auto border border-emerald-500/30 w-72 backdrop-blur-md font-mono">
                    <div className="flex justify-between items-center border-b border-white/20 pb-2 mb-2">
                        <span className="text-xs font-bold text-emerald-400">⚡ LIVE2D DEBUGGER</span>
                        <button onClick={() => setDebugMode(false)} className="text-gray-400 hover:text-white">✕</button>
                    </div>

                    <div className="space-y-2">
                        {motionGroups.length === 0 && <div className="text-xs text-gray-500 text-center">No Motions Found</div>}

                        {motionGroups.map(group => {
                            const mgr = model.internalModel.motionManager;
                            const defs = mgr.definitions || mgr.motionGroups;
                            const motions = defs[group] || [];

                            return (
                                <div key={group} className="mb-2 border-b border-white/10 pb-2 last:border-0">
                                    <div className="text-xs font-bold text-blue-300 mb-1 flex items-center gap-2">
                                        {group}
                                        <span className="text-[9px] bg-blue-900 px-1 rounded text-blue-200">{motions.length}</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-1">
                                        {motions.map((_: any, index: number) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    console.log(`⚡ Testing: ${group} [${index}]`);
                                                    model.motion(group, index, 3);
                                                }}
                                                className="text-[10px] bg-white/5 hover:bg-emerald-600 border border-white/10 hover:border-emerald-400 px-1 py-1 rounded transition-all text-center"
                                            >
                                                {index}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/10 text-[9px] text-gray-500">
                        Model: {config?.modelUrl?.split('/').pop() || "Unknown"}
                    </div>
                </div>
            )}
        </>
    );
};