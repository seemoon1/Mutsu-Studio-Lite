export const uploadImageToCloud = async (base64Data: string, meta: any) => {
    try {
        console.log("💾 Saving to Local Storage...");

        const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ base64: base64Data }) 
        });

        if (!res.ok) {
            throw new Error(`Upload API Error: ${res.statusText}`);
        }

        const data = await res.json();
        console.log("✅ Local Save Success:", data.url);
        
        return data.url; 

    } catch (e) {
        console.error("Local Upload Failed:", e);
        return null;
    }
};