from fastapi import APIRouter, Query
import fitz
import os
import unicodedata
import re
from difflib import SequenceMatcher

router = APIRouter()
UPLOAD_DIR = "uploaded_files"

def normalize_text(text: str) -> str:
    text = text.lower()
    text = unicodedata.normalize("NFKD", text)
    text = re.sub(r"[“”\"'«»’]", '"', text)
    text = re.sub(r"[^a-z0-9\s.,;:!?()\"-]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def find_best_match(text, sentences, threshold=0.7):
    text_norm = normalize_text(text)
    best_score = 0
    best_sentence = None
    for s in sentences:
        s_norm = normalize_text(s)
        score = SequenceMatcher(None, text_norm, s_norm).ratio()
        if score > best_score and score >= threshold:
            best_score = score
            best_sentence = s
    print(f"[🧪 Best fuzzy score]: {best_score:.2f}")

    return best_sentence, best_score

@router.get("/api/highlight-snippet")
def highlight_snippet(file: str = Query(...), text: str = Query(...)):
    filepath = os.path.join(UPLOAD_DIR, file)
    if not os.path.exists(filepath):
        print(f"❌ File not found: {filepath}")
        return {"highlight": None}

    try:
        doc = fitz.open(filepath)

        for page_num, page in enumerate(doc):
            blocks = page.get_text("dict")["blocks"]
            sentences = []
            for b in blocks:
                for l in b.get("lines", []):
                    line_text = " ".join([s["text"] for s in l.get("spans", [])])
                    sentences.append(line_text)

            match, score = find_best_match(text, sentences)
            if match:
                print(f"[✅ Found fuzzy match on page {page_num + 1}] ({score:.2f})")
                print(f"[🟨 Matched text]: {match}")

                # Now search for the matched line to get coordinates
                rects = page.search_for(match)
                if rects:
                    rect = rects[0]
                    return {
                        "highlight": {
                            "page": page_num + 1,
                            "x": rect.x0,
                            "y": rect.y0,
                            "width": rect.width,
                            "height": rect.height
                        }
                    }
                else:
                    print("[⚠️ Fuzzy match found but no bounding box]")
            else:
                print(f"[🔎 Page {page_num + 1}] No fuzzy match above threshold")

        print("[❌ No match found across all pages]")
        return {"highlight": None}

    except Exception as e:
        print(f"[🔥 Exception in highlight_snippet]: {e}")
        return {"error": str(e)}
