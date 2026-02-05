import { useState, useRef, useEffect } from "react";
import { CHARACTERS, Session } from "../types";
import { calculateNewStats } from "../lib/emotionalEngine";
import { uploadImageToCloud } from "../lib/cloudUtils";
import { parseDrawTag, cleanDrawTag } from "../lib/parseDraw"; 

export const useChatEngine = ({
    currentSession, currentSessionId, setSessions,
    activeCharacterId, voiceVariant,
    globalWorldInfo,
    config, 
    setTrackId, showToast, setIsGlobalGenerating,
    manualOutfitId,
    apiProvider 
}: any) => {
    
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<{ url: string, type: 'image' | 'video' | 'text', name: string } | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const stopGeneration = () => { 
        if (abortControllerRef.current) { 
            abortControllerRef.current.abort(); 
            setIsLoading(false); 
        } 
    };

    const handleSend = async (
        overrideInput?: string, 
        overrideMessages?: any[], 
        configOverride?: { 
            useMusicControl?: boolean; 
            novelConfig?: any;
            modelOverride?: string; 
        }
    ) => {
        if (isLoading || !currentSession) return;

        const isRegen = overrideMessages !== undefined;
        const txt = overrideInput !== undefined ? overrideInput : input.trim();
        if (!isRegen && !txt && !selectedFile) return;

        if (!isRegen) { setInput(""); setSelectedFile(null); }
        setIsLoading(true);

        let msgs = overrideMessages ? [...overrideMessages] : [...currentSession.messages];
        const modelToUse = configOverride?.modelOverride || config.selectedModel || "google/gemini-3-flash-preview";

        if (!isRegen) {
            let content: any = txt;
            if (selectedFile) {
                if (selectedFile.type === 'text') content = (txt ? txt + "\n\n" : "") + `[Attached File: ${selectedFile.name}]\n${selectedFile.url}`;
                else content = [{ type: "text", text: txt || "File" }, { type: "image_url", image_url: { url: selectedFile.url } }];
            }
            msgs.push({ role: "user", content, characterId: activeCharacterId });
        }

        setSessions((prev: any) => prev.map((s: any) => s.id === currentSessionId ? {
            ...s,
            messages: [...msgs, { role: "assistant", content: "", modelName: modelToUse, characterId: activeCharacterId }],
            updatedAt: Date.now(),
            voiceVariant 
        } : s));

        abortControllerRef.current = new AbortController();

        let payloadMessages = msgs;
        const MAX_CONTEXT_MSG = 20;
        if (msgs.length > MAX_CONTEXT_MSG) {
            payloadMessages = [msgs[0], ...msgs.slice(-MAX_CONTEXT_MSG)];
            console.log(`✂️ Context Trimmed: ${msgs.length} -> ${payloadMessages.length}`);
        }

        try {
            const res = await fetch("/api/chat", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: payloadMessages.map((m: any) => ({ role: m.role, content: m.content, characterId: m.characterId })),
                    model: modelToUse,
                    characterId: activeCharacterId,
                    variant: voiceVariant,
                    globalWorldInfo,
                    localWorldInfo: currentSession.localWorldInfo,
                    memoryMode: currentSession.memoryMode || 'sliding',
                    stm: currentSession.stm,
                    ltm: currentSession.ltm,
                    timeline: currentSession.timeline,
                    novelConfig: configOverride?.novelConfig, 
                    useWebSearch: config.webSearch,
                    useMusicControl: configOverride?.useMusicControl ?? config.musicControl,
                    useImageGen: config.imageGen,
                    charStatus: currentSession.charStatus,
                    codeRepository: currentSession.codeRepository,
                    provider: apiProvider, 
                }),
                signal: abortControllerRef.current.signal
            });

            if (res.headers.get('X-Using-Main-Key') === 'true') {
                showToast("⚠️ Warning: Using Main Account Quota!");
            }

            if (!res.ok) throw new Error((await res.json()).error);
            if (!res.body) throw new Error("No response body");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;

                setSessions((prev: any) => prev.map((s: any) => s.id === currentSessionId ? {
                    ...s, messages: [...msgs, { role: "assistant", content: fullText, modelName: modelToUse, characterId: activeCharacterId }]
                } : s));
            }

            
            let currentText = fullText; 
            let capturedState: any = null;
            let newFiles: Record<string, any> = {};

            const drawCmd = parseDrawTag(currentText);
            
            if (drawCmd && drawCmd.trigger && config.imageGen) {
                const targetDrawTag = `<draw>${currentText.match(/<draw>([\s\S]*?)<\/draw>/)?.[1] || ""}</draw>`;

                (async () => {
                    try {
                        setIsGlobalGenerating(true);
                        
                        const drawPayload = {
                            outfitId: drawCmd.outfitId || manualOutfitId || "casual", 
                            charId: drawCmd.charId || activeCharacterId,
                            description: drawCmd.description,
                            negativePrompt: drawCmd.negativePrompt,
                            isErotic: config.erotic,
                            ...drawCmd.parameters
                        };

                        const configRes = await fetch("/api/draw", {
                            method: "POST", headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(drawPayload)
                        });
                        
                        const drawData = await configRes.json();
                        
                        if (drawData.success && drawData.image) {
                            const url = await uploadImageToCloud(drawData.image, drawData.meta);
                            
                            if (url) {
                                setSessions((prev: any) => prev.map((s: any) => {
                                    if (s.id !== currentSessionId) return s;
                                    
                                    const newMessages = s.messages.map((m: any) => {
                                        if (typeof m.content === 'string' && m.content.includes(targetDrawTag)) {
                                            const logTag = targetDrawTag.replace('<draw>', '<draw_log>').replace('</draw>', '</draw_log>');
                                            
                                            const newContent = m.content.replace(
                                                targetDrawTag, 
                                                `${logTag}\n\n![Generated](${url})\n`
                                            );
                                            return { ...m, content: newContent };
                                        }
                                        return m;
                                    });

                                    return { ...s, messages: newMessages };
                                }));
                                showToast("🎨 Render Complete");
                            }
                        }
                    } catch (e) { 
                        console.error("Auto-Draw Failed:", e); 
                        showToast("❌ Render Failed");
                    } finally { 
                        setIsGlobalGenerating(false); 
                    }
                })();
            }

            const audioRegex = /<audio>(.*?)<\/audio>/;
            const audioMatch = currentText.match(audioRegex);
            if (audioMatch) {
                try {
                    const audioData = JSON.parse(audioMatch[1]);
                    if (audioData.trackId && setTrackId) setTrackId(audioData.trackId);
                    currentText = currentText.replace(audioRegex, "");
                } catch(e) { console.error("Audio Parse Error", e); }
            }

            const gameRegex = /<game_state>([\s\S]*?)<\/game_state>/;
            const gameMatch = currentText.match(gameRegex);
            if (gameMatch) {
                try {
                    capturedState = JSON.parse(gameMatch[1]);
                    currentText = currentText.replace(gameRegex, "").trim();

                    if (capturedState.character) {
                        const currentStatsRaw = Array.isArray(currentSession.charStatus) ? currentSession.charStatus[0] : currentSession.charStatus;
                        const currentStats = {
                            affection: currentStatsRaw?.affection || 0,
                            monopoly: currentStatsRaw?.monopoly || 0,
                            yandere: currentStatsRaw?.yandere || 0,
                            lust: currentStatsRaw?.lust || 0,
                            ...currentStatsRaw
                        };
                        const aiSuggestedRaw = Array.isArray(capturedState.character) ? capturedState.character[0] : capturedState.character;
                        const finalStats = calculateNewStats(currentStats, aiSuggestedRaw);
                        capturedState.character = [{ ...aiSuggestedRaw, ...finalStats }];
                    }

                    if (capturedState.imageGen?.trigger && config.imageGen) {
                        setIsGlobalGenerating(true);
                        showToast("🎨 Visualizer: Rendering...");
                        
                        (async () => {
                            try {
                                const drawPayload = {
                                    charId: capturedState.imageGen.charId || activeCharacterId,
                                    outfitId: capturedState.imageGen.outfitId || manualOutfitId || "casual",
                                    
                                    description: (capturedState.imageGen.emotion || "") + ", " + (capturedState.imageGen.description || ""),
                                    
                                    negativePrompt: capturedState.imageGen.negativePrompt, 
                                    ...capturedState.imageGen.parameters 
                                };

                                const configRes = await fetch("/api/draw", {
                                    method: "POST", headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(drawPayload)
                                });
                                const drawData = await configRes.json();
                                
                                if (drawData.success && drawData.image) {
                                    const url = await uploadImageToCloud(drawData.image, drawData.meta);
                                    if (url) {
                                        setSessions((prev: any) => prev.map((s: any) => s.id === currentSessionId ? {
                                            ...s, messages: s.messages.map((m: any, i: number) => i === s.messages.length - 1 ? { ...m, content: currentText + `\n\n![Visual](${url})` } : m)
                                        } : s));
                                        showToast("🎨 Scene Captured");
                                    }
                                }
                            } catch (e) { console.error(e); }
                            finally { setIsGlobalGenerating(false); }
                        })();
                    }

                    if (capturedState.music?.trigger && capturedState.music?.trackId && setTrackId) {
                        setTimeout(() => setTrackId(capturedState.music.trackId), 500);
                    }

                } catch (e) { console.error("Game State Error", e); }
            }


            const fileRegex = /<file name="(.*?)">([\s\S]*?)<\/file>/g;
            currentText = currentText.replace(fileRegex, (match, fileName, fileContent) => {
                const ext = fileName.split('.').pop()?.toLowerCase() || '';
                if (['txt', 'md', 'markdown', 'log'].includes(ext)) {
                    return `\n**[Document: ${fileName}]**\n\`\`\`${ext}\n${fileContent}\n\`\`\`\n`;
                }
                newFiles[fileName] = { name: fileName, language: ext || 'text', content: fileContent.trim() };
                return ""; 
            }).trim();


            setSessions((prev: any) => prev.map((s: any) => {
                if (s.id === currentSessionId) {
                    const oldRepo = s.codeRepository || {};
                    const updatedRepo = { ...oldRepo, ...newFiles };
                    
                    return {
                        ...s,
                        messages: [...msgs, { role: "assistant", content: currentText, modelName: modelToUse, characterId: activeCharacterId }],
                        codeRepository: updatedRepo,
                        ...(capturedState ? {
                            protagonist: capturedState.protagonist,
                            charStatus: capturedState.character,
                            plotSuggestions: capturedState.suggestions,
                            lastDanmaku: capturedState.danmaku,
                            timeline: capturedState.timeline,
                            
                            currentBackground: capturedState.environment?.bgId || s.currentBackground,
                            live2dCharId: capturedState.live2d?.charId || null,
                            currentEmotion: capturedState.live2d?.motion || "idle", 
                            
                            currentOutfitId: capturedState.imageGen?.outfitId || s.currentOutfitId 
                        } : {})
                    };
                }
                return s;
            }));

            if (currentSession.memoryMode === 'sliding' || currentSession.memoryMode === 'novel') {
                const textToSummarize = currentSession.memoryMode === 'novel' ? currentText : `User: ${txt}\nAI: ${currentText}\n`;
                const summarizeMode = currentSession.memoryMode === 'novel' ? 'novel_chapter' : 'micro';

                fetch("/api/summarize", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: textToSummarize, mode: summarizeMode })
                })
                .then(res => res.json())
                .then(microData => {
                    if (microData.summary) {
                        const prefix = currentSession.memoryMode === 'novel' ? `[Chapter]: ` : `• `;
                        const summaryLine = `${prefix}${microData.summary}\n`;
                        
                        setSessions((prev: any) => prev.map((s: any) => {
                            if (s.id === currentSessionId) {
                                const newStm = (s.stm || "") + summaryLine;
                                const newCount = (s.turnCount || 0) + 1;
                                
                                if (newCount >= 7) {
                                    fetch("/api/summarize", {
                                        method: "POST", headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ text: newStm, previousLtm: s.ltm, mode: 'macro' })
                                    }).then(r => r.json()).then(macroData => {
                                        if (macroData.summary) {
                                            setSessions((inner: any) => inner.map((innerS: any) => innerS.id === currentSessionId ? { ...innerS, ltm: macroData.summary, stm: "", turnCount: 0 } : innerS));
                                            showToast("✨ Memory Consolidated");
                                        }
                                    });
                                    return { ...s, stm: newStm, stmBackup: s.stm, turnCount: 0 };
                                }
                                return { ...s, stm: newStm, stmBackup: s.stm, turnCount: newCount };
                            }
                            return s;
                        }));
                    }
                });
            }

        } catch (e: any) {
            if (e.name !== 'AbortError') showToast(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegenerate = (idx: number) => {
        if (!currentSession) return;
        if (idx === currentSession.messages.length - 1) {
            setSessions((prev: any) => prev.map((s: any) => s.id === currentSessionId && s.stmBackup !== undefined ? { ...s, stm: s.stmBackup } : s));
            showToast("⏳ Timeline Reverted");
        }
        handleSend(undefined, currentSession.messages.slice(0, idx));
    };

    const handleDeleteMessage = (idx: number, role: string) => {
        if (!currentSession) return;
        if (!confirm("⚠️ Delete this message?")) return;
        
        let newMsgs = [...currentSession.messages];
        if (role === 'assistant') newMsgs.splice(idx, 1);
        else if (role === 'user') newMsgs.splice(idx, idx === newMsgs.length - 2 ? 2 : 1);
        
        setSessions((prev: any) => prev.map((s: any) => s.id === currentSessionId ? { ...s, messages: newMsgs } : s));
    };

    const handleRepoUpdate = (newRepo: any) => {
        setSessions((prev: any) => prev.map((s: any) => s.id === currentSessionId ? { ...s, codeRepository: newRepo } : s));
    };

    return {
        input, setInput,
        isLoading,
        selectedFile, setSelectedFile,
        handleSend,
        stopGeneration,
        handleRegenerate,
        handleDeleteMessage,
        handleRepoUpdate
    };
};