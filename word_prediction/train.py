import json
import re
import os
from collections import Counter
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_FILE = os.path.join(SCRIPT_DIR, 'sherlock.txt') 
OUTPUT_FILE = os.path.join(SCRIPT_DIR, '../../backend/data/datasets/sherlock_learned.json')
def clean_text(text):
    text = text.lower()
    text = re.sub(r'[^a-z\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text
def train_model():
    print(f"📖 Reading {INPUT_FILE}...")
    if not os.path.exists(INPUT_FILE):
        print(f"❌ Error: File not found at {INPUT_FILE}")
        return
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        raw_text = f.read()
    print("🧹 Cleaning and Tokenizing text...")
    cleaned_text = clean_text(raw_text)
    words = cleaned_text.split()
    print(f"🧠 Training on {len(words)} words...")
    phrases = []
    for i in range(len(words) - 1):
        phrases.append(f"{words[i]} {words[i+1]}")
    for i in range(len(words) - 2):
        phrases.append(f"{words[i]} {words[i+1]} {words[i+2]}")
    phrase_counts = Counter(phrases)
    top_phrases = phrase_counts.most_common(5000)
    export_data = []
    for phrase, count in top_phrases:
        if len(phrase) > 5: 
            export_data.append({
                "phrase": phrase,
                "frequency": count,
                "category": "literature",
                "mode": "normal" 
            })
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2)
    print(f"✅ SUCCESS: Trained model saved to {OUTPUT_FILE}")
    print(f"📊 Extracted {len(export_data)} predictive phrases.")
if __name__ == "__main__":
    train_model()