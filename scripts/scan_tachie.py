import os
import json

TACHIE_ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "tachie")
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "data", "tachie_config.json")
WEB_PREFIX = "/tachie"

def main():
    print(f"🎨 Tachie Scanner running in: {TACHIE_ROOT}")
    
    if not os.path.exists(TACHIE_ROOT):
        print("❌ Error: public/tachie directory not found.")
        return

    db = {}

    for char_id in os.listdir(TACHIE_ROOT):
        char_dir = os.path.join(TACHIE_ROOT, char_id)
        if not os.path.isdir(char_dir): continue

        print(f"🔍 Found: {char_id}")
        db[char_id] = {}

        for img in os.listdir(char_dir):
            if img.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                emotion_key = os.path.splitext(img)[0] 
                web_path = f"{WEB_PREFIX}/{char_id}/{img}"
                db[char_id][emotion_key] = web_path

    try:
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(db, f, indent=2, ensure_ascii=False)
        print(f"✅ Config saved to: {OUTPUT_FILE}")
    except Exception as e:
        print(f"❌ Save failed: {e}")

if __name__ == "__main__":
    main()