import { useState, useEffect } from "react";
import { EffectType } from "../components/TransitionEffects";

export const useUI = () => {
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
    
    const [showModelPanel, setShowModelPanel] = useState(true);
    const [showChatPanel, setShowChatPanel] = useState(true);
    const [showCodeRepo, setShowCodeRepo] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [debugMode, setDebugMode] = useState(false);
    
    const [showGlobalWorld, setShowGlobalWorld] = useState(false);
    const [showLocalWorld, setShowLocalWorld] = useState(false);
    
    const [toast, setToast] = useState<string | null>(null);
    const [effect, setEffect] = useState<EffectType>("none");
    const [editModal, setEditModal] = useState<{ isOpen: boolean, text: string, index: number }>({ isOpen: false, text: "", index: -1 });

    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth > 768) {
            setLeftSidebarOpen(true);
        }
    }, []);

    const showToast = (msg: string) => { 
        setToast(msg); 
        setTimeout(() => setToast(null), 2000); 
    };

    return {
        leftSidebarOpen, setLeftSidebarOpen,
        rightSidebarOpen, setRightSidebarOpen,
        showModelPanel, setShowModelPanel,
        showChatPanel, setShowChatPanel,
        showCodeRepo, setShowCodeRepo,
        showSaveModal, setShowSaveModal,
        showGlobalWorld, setShowGlobalWorld,
        showLocalWorld, setShowLocalWorld,
        toast, showToast,
        effect, setEffect,
        editModal, setEditModal,
        debugMode, setDebugMode,
    };
};