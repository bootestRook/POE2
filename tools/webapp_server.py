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

DISABLED_SKILL_EDITOR_PORT = 8765
DISABLED_SKILL_EDITOR_DIST_DIR = "dist-skill-editor"


def _is_skill_editor_path(path: str) -> bool:
    return path == "/skill-editor" or path.startswith("/skill-editor/")


def _is_skill_editor_api_path(path: str) -> bool:
    return path == "/api/skill-editor" or path.startswith("/api/skill-editor/")


class V1RequestHandler(BaseHTTPRequestHandler):
    api = V1WebAppApi(ROOT / "configs", autosave_enabled=False)
    dist_dir = ROOT / "dist"
    index_file = dist_dir / "index.html"

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        try:
            if _is_skill_editor_path(parsed.path):
                self._send_html("SkillEditor is disabled.", status=404)
                return
            if parsed.path == "/api/state":
                self._send_json(self.api.state())
                return
            if parsed.path == "/api/gm/equipment-affix-effect-status":
                self._send_json(self.api.equipment_affix_effect_status())
                return
            if parsed.path == "/api/gm/options":
                self._send_json(self.api.gm_options())
                return
            self._serve_static(parsed.path)
        except Exception as exc:
            self._send_json({"error": str(exc)}, status=400)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        try:
            body = self._read_json()
            if _is_skill_editor_api_path(parsed.path):
                self._send_json({"error": "SkillEditor is disabled."}, status=404)
                return
            if parsed.path == "/api/mount":
                payload = self.api.mount(str(body["instance_id"]), int(body["row"]), int(body["column"]))
            elif parsed.path == "/api/unmount":
                payload = self.api.unmount(str(body["instance_id"]))
            elif parsed.path == "/api/combat/start":
                payload = self.api.start_combat()
            elif parsed.path == "/api/map/start":
                payload = self.api.start_map(str(body.get("stage_id", "")), body.get("spawn_monsters"))
            elif parsed.path == "/api/combat/tick":
                payload = self.api.combat_tick(int(body.get("delta_ms", 250)))
            elif parsed.path == "/api/save/new":
                payload = self.api.new_game()
            elif parsed.path == "/api/save/continue":
                payload = self.api.continue_game()
            elif parsed.path == "/api/save/restore":
                payload = self.api.restore_frontend_save(dict(body.get("save", {})))
            elif parsed.path == "/api/pickup":
                payload = self.api.pickup(str(body["drop_id"]))
            elif parsed.path == "/api/equip":
                payload = self.api.equip_item(str(body["instance_id"]), body.get("slot_indices", []))
            elif parsed.path == "/api/unequip-equipment":
                payload = self.api.unequip_item(str(body["instance_id"]))
            elif parsed.path == "/api/runtime/skill-events":
                payload = self.api.runtime_skill_events(body)
            elif parsed.path == "/api/gm/equipment-affixes":
                payload = self.api.gm_equipment_affixes(str(body["source"]), int(body.get("level", 86)))
            elif parsed.path == "/api/gm/add-gem":
                payload = self.api.gm_add_gem(str(body["base_gem_id"]), int(body.get("level", 1)), int(body.get("quantity", 1)))
            elif parsed.path == "/api/gm/add-equipment":
                payload = self.api.gm_add_equipment(
                    str(body["source"]),
                    int(body.get("level", 86)),
                    body.get("affix_ids", []),
                    random_rarity=body.get("random_rarity"),
                )
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

    if args.port == DISABLED_SKILL_EDITOR_PORT:
        print("SkillEditor port 8765 is disabled.")
        return 2

    dist_dir = Path(args.dist_dir)
    if not dist_dir.is_absolute():
        dist_dir = ROOT / dist_dir
    if dist_dir.name == DISABLED_SKILL_EDITOR_DIST_DIR:
        print("SkillEditor dist directory is disabled.")
        return 2
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
