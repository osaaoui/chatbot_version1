from fastapi import APIRouter, Query
import fitz
import os
import unicodedata
import re
from difflib import SequenceMatcher
import nltk

router = APIRouter()
UPLOAD_DIR = "uploaded_files"

def normalize_text(text: str) -> str:
    text = text.lower()
    text = unicodedata.normalize("NFKD", text)
    # Remove markdown formatting
    text = re.sub(r'#+\s*', '', text)  # Remove headers
    text = re.sub(r'[“”"\'«»’]', '"', text)
    text = re.sub(r'[^a-z0-9\s.,;:!?()\"-]', "", text)
    text = re.sub(r'\s+', " ", text)
    text = re.sub(r'\n+', " ", text)  # Replace newlines with spaces
    return text.strip()

def find_best_match(text, sentences, threshold=0.7):
    text_norm = normalize_text(text)
    best_score = 0
    best_sentence = None
    
    # For long snippets, try matching shorter parts
    if len(text_norm) > 100:
        # Split into sentences and try each one
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt')
        
        text_sentences = nltk.sent_tokenize(text)
        for sentence in text_sentences:
            sentence_norm = normalize_text(sentence)
            for s in sentences:
                s_norm = normalize_text(s)
                score = SequenceMatcher(None, sentence_norm, s_norm).ratio()
                if score > best_score and score >= threshold:
                    best_score = score
                    best_sentence = s
    else:
        # Original logic for shorter text
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

            match, score = find_best_match(text, sentences, page_num)
            if match:
                print(f"[✅ Found fuzzy match on page {page_num + 1}] ({score:.2f})")
                print(f"[🟨 Matched text]: {match}")

                # Try multiple search strategies
                rects = page.search_for(match)
                if not rects:
                    # Try searching for a shorter substring
                    words = match.split()
                    if len(words) > 3:
                        shorter_match = " ".join(words[:3])  # Try first 3 words
                        rects = page.search_for(shorter_match)
                        print(f"[🔍 Trying shorter match]: '{shorter_match}'")
                
                if not rects:
                    # Try searching for individual words
                    for word in words:
                        if len(word) > 3:  # Skip short words
                            rects = page.search_for(word)
                            if rects:
                                print(f"[🔍 Found match with word]: '{word}'")
                                break
                
                if rects:
                    rect = rects[0]
                    
                    # Convert PDF coordinates to canvas coordinates
                    scale_factor = 4.0
                    dpi_ratio = 96 / 72
                    # Expand the width to cover more of the sentence
                    original_x = rect.x0 * dpi_ratio * scale_factor
                    expanded_width = min(rect.width * dpi_ratio * scale_factor * 2, 800)  # Double width, max 600px
                    
                    # Increase height to make it more visible
                    min_height = 120
                    
                    highlight_data = {
                        "page": page_num + 1,
                        "x": original_x,
                        "y": rect.y0 * dpi_ratio * scale_factor,
                        "width": expanded_width,
                        "height": max(rect.height * dpi_ratio * scale_factor, min_height)
                    }
                    
                    print(f"[📦 Returning highlight]: {highlight_data}")
                    return {"highlight": highlight_data}
                else:
                    print("[⚠️ Fuzzy match found but no bounding box]")
                    return {"highlight": None}
            else:
                print(f"[ Page {page_num + 1}] No fuzzy match above threshold")

        print("[❌ No match found across all pages]")
        return {"highlight": None}

    except Exception as e:
        print(f"[🔥 Exception in highlight_snippet]: {e}")
        return {"error": str(e)}
