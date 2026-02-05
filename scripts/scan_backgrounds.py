import os
import json

BG_ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "backgrounds")
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "data", "bg_config.json")
WEB_PREFIX = "/backgrounds" 

def main():
    print(f"🖼️ Background Scanner running in: {BG_ROOT}")
    
    if not os.path.exists(BG_ROOT):
        print("❌ Error: public/backgrounds not found.")
        return

    bg_list = []

    for root, dirs, files in os.walk(BG_ROOT):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                rel_path = os.path.relpath(os.path.join(root, file), BG_ROOT)
                web_path = f"{WEB_PREFIX}/{rel_path.replace(os.sep, '/')}"
                
                bg_list.append({
                    "id": rel_path.replace("\\", "/"), 
                    "url": web_path
                })

    try:
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(bg_list, f, indent=2, ensure_ascii=False)
        print(f"✅ Found {len(bg_list)} backgrounds. Saved to {OUTPUT_FILE}")
    except Exception as e:
        print(f"❌ Save failed: {e}")

if __name__ == "__main__":
    main()