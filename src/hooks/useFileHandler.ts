import { useRef } from "react";

export const useFileHandler = ({
    setSessions, setFolders, setGlobalWorldInfo, setBgImage, 
    setSelectedFile, showToast 
}: any) => {
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const importInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]; 
        if (!f) return;

        const r = new FileReader();
        r.onload = (ev) => {
            const result = ev.target?.result;
            if (typeof result === 'string') {
                setSelectedFile({
                    url: result,
                    type: f.type.startsWith('image') ? 'image' : 'text',
                    name: f.name
                });
            }
        };

        if (f.type.startsWith('image')) {
            r.readAsDataURL(f);
        } else {
            r.readAsText(f);
        }
        
        e.target.value = '';
    };

    const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;

        const r = new FileReader();
        r.onload = (ev) => {
            const content = ev.target?.result;
            if (typeof content === 'string') {
                try {
                    const d = JSON.parse(content);
                    if (d.sessions) setSessions(d.sessions);
                    if (d.folders) setFolders(d.folders);
                    if (d.globalWorldInfo || d.global_world_info) setGlobalWorldInfo(d.globalWorldInfo || d.global_world_info);
                    if (d.bgImage || d.bg_image) setBgImage(d.bgImage || d.bg_image);
                    
                    if (showToast) showToast("✅ Data Restored");
                } catch (err) {
                    console.error("Import Parse Error:", err);
                    if (showToast) showToast("❌ Corrupted File");
                }
            }
        };
        r.readAsText(f);
        e.target.value = '';
    };

    const handleBgDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f && f.type.startsWith('image/')) {
            const r = new FileReader();
            r.onload = (ev) => {
                const res = ev.target?.result;
                if (typeof res === 'string') {
                    setBgImage(res);
                    if (showToast) showToast("🖼️ Background Updated");
                }
            };
            r.readAsDataURL(f);
        }
    };

    return {
        fileInputRef,
        importInputRef,
        handleFileSelect,
        handleImportData,
        handleBgDrop
    };
};