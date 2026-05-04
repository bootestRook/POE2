from __future__ import annotations

import argparse
import json
import mimetypes
import sys
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.web_api import V1WebAppApi, encode_json


class V1RequestHandler(BaseHTTPRequestHandler):
    api = V1WebAppApi(ROOT / "configs")
    dist_dir = ROOT / "dist"
    index_file = dist_dir / "index.html"

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        try:
            if parsed.path == "/api/state":
                self._send_json(self.api.state())
                return
            self._serve_static(parsed.path)
        except Exception as exc:
            self._send_json({"error": str(exc)}, status=400)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        try:
            body = self._read_json()
            if parsed.path == "/api/mount":
                payload = self.api.mount(str(body["instance_id"]), int(body["row"]), int(body["column"]))
            elif parsed.path == "/api/unmount":
                payload = self.api.unmount(str(body["instance_id"]))
            elif parsed.path == "/api/combat/start":
                payload = self.api.start_combat()
            elif parsed.path == "/api/pickup":
                payload = self.api.pickup(str(body["drop_id"]))
            elif parsed.path == "/api/skill-editor/save":
                payload = self.api.save_skill_package(str(body["skill_id"]), body["package"])
            elif parsed.path == "/api/skill-editor/modifier-preview":
                payload = self.api.preview_skill_modifier_stack(body)
            elif parsed.path == "/api/skill-editor/test-arena/run":
                payload = self.api.run_skill_test_arena(body)
            else:
                self._send_json({"error": "未知接口。"}, status=404)
                return
            self._send_json(payload)
        except Exception as exc:
            self._send_json({"error": str(exc)}, status=400)

    def log_message(self, format: str, *args: object) -> None:
        return

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def _send_json(self, payload: dict, status: int = 200) -> None:
        body = encode_json(payload)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._send_no_cache_headers()
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _serve_static(self, path: str) -> None:
        if not self.index_file.exists():
            self._send_html(
                "请先运行 npm install 和 npm run build，然后重新启动 WebApp。",
                status=503,
            )
            return

        relative = path.lstrip("/") or "index.html"
        dist = self.dist_dir.resolve()
        target = (dist / relative).resolve()
        if dist not in target.parents and target != dist:
            self._send_html("请求路径不合法。", status=400)
            return
        if not target.is_file():
            target = self.index_file

        content_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        body = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self._send_no_cache_headers()
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_html(self, text: str, status: int = 200) -> None:
        body = f"<!doctype html><meta charset=\"utf-8\"><title>数独宝石流放like V1</title><body>{text}</body>".encode(
            "utf-8"
        )
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self._send_no_cache_headers()
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_no_cache_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8000, type=int)
    parser.add_argument("--dist-dir", default="dist")
    parser.add_argument("--open", action="store_true")
    args = parser.parse_args()

    dist_dir = Path(args.dist_dir)
    if not dist_dir.is_absolute():
        dist_dir = ROOT / dist_dir
    V1RequestHandler.dist_dir = dist_dir.resolve()
    V1RequestHandler.index_file = V1RequestHandler.dist_dir / "index.html"

    server = ThreadingHTTPServer((args.host, args.port), V1RequestHandler)
    url = f"http://{args.host}:{args.port}"
    print(f"WebApp 已启动：{url}")
    if args.open:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("WebApp 已停止。")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
