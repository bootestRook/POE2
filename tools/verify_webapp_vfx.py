from __future__ import annotations

import asyncio
import base64
import json
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path

import websockets
from PIL import Image


APP_URL = "http://127.0.0.1:8010"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 9342


async def main() -> None:
    raise SystemExit("Skill editor VFX verification is disabled. Use the playable WebApp battle view instead.")
    profile = Path(tempfile.gettempdir()) / "poe-codex-chrome-vfx"
    profile.mkdir(parents=True, exist_ok=True)
    subprocess.Popen(
        [
            CHROME,
            "--headless=new",
            "--disable-gpu",
            f"--remote-debugging-port={PORT}",
            f"--user-data-dir={profile}",
            "--window-size=1280,900",
            "about:blank",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(2)

    reports = Path("reports")
    reports.mkdir(exist_ok=True)
    cases = [
        ("fork", "web_seed_support_skill_shape_modifier_1_support_fire_bolt_fork", ".hit-fork-sparks-vfx"),
        ("nova", "web_seed_support_skill_shape_modifier_2_support_fire_bolt_nova", ".hit-nova-ring-vfx"),
        ("rain", "web_seed_support_skill_shape_modifier_3_support_fire_bolt_rain", ".hit-meteor-rain-vfx"),
    ]
    results = []
    for case in cases:
        results.append(await run_case(*case, reports=reports))
    print(json.dumps(results, ensure_ascii=False, indent=2))


def request_json(path: str, payload: dict | None = None) -> dict:
    if payload is None:
        with urllib.request.urlopen(APP_URL + path, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        APP_URL + path,
        data=body,
        headers={"content-type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


def new_target(url: str) -> dict:
    request = urllib.request.Request(f"http://127.0.0.1:{PORT}/json/new?{url}", method="PUT")
    with urllib.request.urlopen(request, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


async def connect_cdp(ws_url: str):
    websocket = await websockets.connect(ws_url, max_size=None)
    next_id = 0

    async def send(method: str, params: dict | None = None) -> dict:
        nonlocal next_id
        next_id += 1
        message_id = next_id
        await websocket.send(json.dumps({"id": message_id, "method": method, "params": params or {}}))
        while True:
            message = json.loads(await websocket.recv())
            if message.get("id") == message_id:
                if "error" in message:
                    raise RuntimeError(message["error"])
                return message.get("result", {})

    return websocket, send


async def run_case(name: str, support_id: str, selector: str, *, reports: Path) -> dict:
    for gem_id in [
        "web_seed_active_1_active_fire_bolt",
        "web_seed_support_skill_shape_modifier_1_support_fire_bolt_fork",
        "web_seed_support_skill_shape_modifier_2_support_fire_bolt_nova",
        "web_seed_support_skill_shape_modifier_3_support_fire_bolt_rain",
    ]:
        try:
            request_json("/api/unmount", {"instance_id": gem_id})
        except Exception:
            pass

    request_json("/api/mount", {"instance_id": "web_seed_active_1_active_fire_bolt", "row": 0, "column": 0})
    request_json("/api/mount", {"instance_id": support_id, "row": 1, "column": 0})
    preview = request_json("/api/state")["skill_preview"][0]

    target = new_target(APP_URL + "?skill_editor=1")
    websocket, send = await connect_cdp(target["webSocketDebuggerUrl"])
    await send("Page.enable")
    await send("Runtime.enable")
    await send(
        "Emulation.setDeviceMetricsOverride",
        {"width": 1280, "height": 900, "deviceScaleFactor": 1, "mobile": False},
    )
    await asyncio.sleep(2)
    click = {"result": {"value": "skill_editor_autoplay"}}
    await send(
        "Runtime.evaluate",
        {
            "expression": """
(() => {
  const button = Array.from(document.querySelectorAll('button'))
    .find((item) => item.innerText.includes('关闭'));
  if (button) button.click();
  return Boolean(button);
})()
""",
            "returnByValue": True,
        },
    )

    max_counts = {"shape": 0, "hit": 0, "bolt": 0, "fork": 0, "nova": 0, "rain": 0, "log": []}
    screenshot: Path | None = None
    frames: list[Path] = []
    for frame_index in range(36):
        await asyncio.sleep(0.1)
        counts = await send(
            "Runtime.evaluate",
            {
                "expression": f"""
(() => ({{
  shape: document.querySelectorAll('{selector}').length,
  fork: document.querySelectorAll('.hit-fork-sparks-vfx').length,
  nova: document.querySelectorAll('.hit-nova-ring-vfx').length,
  rain: document.querySelectorAll('.hit-meteor-rain-vfx').length,
  hit: document.querySelectorAll('[data-skill-event="hit_vfx"]').length,
  bolt: document.querySelectorAll('[data-skill-event="projectile_spawn"]').length,
  log: Array.from(document.querySelectorAll('.combat-feed p')).map((item) => item.innerText).slice(0, 3)
}}))()
""",
                "returnByValue": True,
            },
        )
        current = counts["result"]["value"]
        if current["shape"] > max_counts["shape"] or current["hit"] > max_counts["hit"]:
            max_counts = current
        if current["shape"] > 0 and screenshot is None:
            screenshot = reports / f"{name}-shape-visible.png"
            await capture(send, screenshot)
        if frame_index % 3 == 0:
            frame_path = reports / f"{name}-canvas-frame-{frame_index:02d}.png"
            await capture(send, frame_path)
            frames.append(frame_path)

    if screenshot is None:
        screenshot = reports / f"{name}-no-shape-final.png"
        await capture(send, screenshot)
    contact_sheet = reports / f"{name}-canvas-contact-sheet.png"
    make_contact_sheet(frames, contact_sheet)

    await websocket.close()
    return {
        "name": name,
        "shape_effects": preview.get("shape_effects"),
        "click": click["result"].get("value"),
        "max_counts": max_counts,
        "screenshot": str(screenshot.resolve()),
        "contact_sheet": str(contact_sheet.resolve()),
    }


async def capture(send, path: Path) -> None:
    screenshot = await send("Page.captureScreenshot", {"format": "png"})
    path.write_bytes(base64.b64decode(screenshot["data"]))


def make_contact_sheet(frames: list[Path], output: Path) -> None:
    if not frames:
        return
    thumbs = []
    for frame in frames:
        image = Image.open(frame).convert("RGB")
        image.thumbnail((320, 225))
        thumbs.append(image.copy())
    columns = 4
    rows = (len(thumbs) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * 320, rows * 225), (8, 10, 14))
    for index, image in enumerate(thumbs):
        sheet.paste(image, ((index % columns) * 320, (index // columns) * 225))
    sheet.save(output)


if __name__ == "__main__":
    asyncio.run(main())
