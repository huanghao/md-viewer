#!/usr/bin/env python3
"""
本地翻译服务 — Helsinki-NLP/opus-mt-en-zh
启动后常驻，提供 POST http://127.0.0.1:17823/translate
请求体: {"text": "...", "sourceLang": "en", "targetLang": "zh"}
响应体: {"translatedText": "..."}  或  {"error": "..."}
"""

import json
import sys
import os

# 强制离线，避免启动时联网检查更新导致 hang
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

from http.server import BaseHTTPRequestHandler, HTTPServer

PORT = 17823

def load_model():
    from transformers import MarianMTModel, MarianTokenizer
    model_name = "Helsinki-NLP/opus-mt-en-zh"
    print(f"[translate] loading {model_name}...", flush=True)
    tokenizer = MarianTokenizer.from_pretrained(model_name)
    model = MarianMTModel.from_pretrained(model_name)
    print("[translate] ready", flush=True)
    return tokenizer, model

tokenizer, model = load_model()

def translate(text: str) -> str:
    inputs = tokenizer([text], return_tensors="pt", padding=True, truncation=True, max_length=512)
    out = model.generate(**inputs)
    return tokenizer.decode(out[0], skip_special_tokens=True)

class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # 静默访问日志

    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"ok":true}')
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path != "/translate":
            self.send_response(404)
            self.end_headers()
            return

        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        try:
            data = json.loads(body)
            text = data.get("text", "").strip()
            if not text:
                raise ValueError("missing text")
            result = translate(text)
            resp = json.dumps({"translatedText": result}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(resp)))
            self.end_headers()
            self.wfile.write(resp)
        except Exception as e:
            err = json.dumps({"error": str(e)}).encode()
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(err)))
            self.end_headers()
            self.wfile.write(err)

if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", PORT), Handler)
    print(f"[translate] listening on 127.0.0.1:{PORT}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
