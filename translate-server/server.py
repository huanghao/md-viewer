import hashlib
import sqlite3
import time
import argparse
import os
import argostranslate.package
import argostranslate.translate
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), "cache.db")
_translator = None

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS cache (
            hash TEXT PRIMARY KEY,
            source TEXT NOT NULL,
            translation TEXT NOT NULL,
            created_at INTEGER NOT NULL
        )
    """)
    conn.commit()
    return conn

def ensure_model():
    global _translator
    if _translator is not None:
        return
    installed = argostranslate.package.get_installed_packages()
    has_pkg = any(p.from_code == "en" and p.to_code == "zh" for p in installed)
    if not has_pkg:
        print("Downloading en->zh language package (~100MB)...")
        argostranslate.package.update_package_index()
        available = argostranslate.package.get_available_packages()
        pkg = next(p for p in available if p.from_code == "en" and p.to_code == "zh")
        argostranslate.package.install_from_path(pkg.download())
        print("Download complete.")
    installed_langs = argostranslate.translate.get_installed_languages()
    from_lang = next(l for l in installed_langs if l.code == "en")
    to_lang = next(l for l in installed_langs if l.code == "zh")
    _translator = from_lang.get_translation(to_lang)

class Segment(BaseModel):
    id: str
    text: str

class TranslateRequest(BaseModel):
    segments: list[Segment]

class TranslateResult(BaseModel):
    id: str
    translation: str

class TranslateResponse(BaseModel):
    results: list[TranslateResult]

@app.on_event("startup")
def startup():
    get_db().close()
    ensure_model()

@app.post("/translate", response_model=TranslateResponse)
def translate(req: TranslateRequest):
    ensure_model()
    db = get_db()
    results = []
    for seg in req.segments:
        h = hashlib.sha256(seg.text.encode()).hexdigest()
        row = db.execute("SELECT translation FROM cache WHERE hash=?", (h,)).fetchone()
        if row:
            results.append(TranslateResult(id=seg.id, translation=row[0]))
        else:
            translation = _translator.translate(seg.text)
            db.execute(
                "INSERT OR REPLACE INTO cache (hash, source, translation, created_at) VALUES (?,?,?,?)",
                (h, seg.text, translation, int(time.time()))
            )
            db.commit()
            results.append(TranslateResult(id=seg.id, translation=translation))
    db.close()
    return TranslateResponse(results=results)

@app.get("/health")
def health():
    return {"ok": True}

if __name__ == "__main__":
    import uvicorn
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=5050)
    parser.add_argument("--clear-before", type=int, default=None,
                        help="Delete cache entries older than N days, then exit")
    args = parser.parse_args()

    if args.clear_before is not None:
        cutoff = int(time.time()) - args.clear_before * 86400
        db = get_db()
        deleted = db.execute("DELETE FROM cache WHERE created_at < ?", (cutoff,)).rowcount
        db.commit()
        db.close()
        print(f"Deleted {deleted} cache entries older than {args.clear_before} days.")
    else:
        uvicorn.run(app, host="127.0.0.1", port=args.port)
