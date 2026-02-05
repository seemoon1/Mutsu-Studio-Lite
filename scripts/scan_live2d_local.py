import os
import json

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
TARGET_ROOT = os.path.join(ROOT_DIR, "public", "live2d")
OUTPUT_FILE = os.path.join(ROOT_DIR, "src", "data", "live2d_config.json")
WEB_BASE_PATH = "/live2d"

IGNORE_FOLDERS = {".mtn_exp", "motions", "expressions", "__base__", "PARAM_IMPORT"}

def scan_local_models():
    print(f"🥒 Mutsu Scanner (Local Mode)")
    print(f"📂 Root:   {ROOT_DIR}")
    print(f"🎯 Target: {TARGET_ROOT}")
    
    if not os.path.exists(TARGET_ROOT):
        print(f"❌ Error: Folder not found at: {TARGET_ROOT}")
        return

    db = {}
    total_outfits = 0

    for char_id in os.listdir(TARGET_ROOT):
        char_path = os.path.join(TARGET_ROOT, char_id)
        if not os.path.isdir(char_path) or char_id.startswith("."): continue

        print(f"🔍 Scanning: [{char_id}]...", end="")
        outfits = {}
        model_url = ""

        for item in os.listdir(char_path):
            item_path = os.path.join(char_path, item)
            
            if item in IGNORE_FOLDERS or item.startswith("."): 
                continue

            if os.path.isdir(item_path):
                found_model = None
                for f in os.listdir(item_path):
                    if f.endswith(".model3.json"):
                        found_model = f
                        break
                if not found_model:
                    if "model.json" in os.listdir(item_path):
                        found_model = "model.json"
                
                if found_model:
                    web_path = f"{WEB_BASE_PATH}/{char_id}/{item}/{found_model}"
                    outfits[item] = web_path
                    if not model_url or "casual" in item.lower():
                        model_url = web_path

        if not outfits:
             for f in os.listdir(char_path):
                if f == "model.json" or f.endswith(".model3.json"):
                    web_path = f"{WEB_BASE_PATH}/{char_id}/{f}"
                    outfits["default"] = web_path
                    model_url = web_path
                    break

        if outfits:
            if not model_url:
                first_key = list(outfits.keys())[0]
                model_url = outfits[first_key]

            db[char_id] = {
                "id": char_id,
                "modelUrl": model_url,
                "outfits": outfits,
                "motions": {}, 
                "expressions": []
            }
            print(f" OK ({len(outfits)} outfits)")
            total_outfits += len(outfits)
        else:
            print(" No models.")

    try:
        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(db, f, indent=2, ensure_ascii=False)
        print(f"\n✅ Scan Complete! Config saved.")
    except Exception as e:
        print(f"\n❌ Write failed: {e}")

if __name__ == "__main__":
    scan_local_models()