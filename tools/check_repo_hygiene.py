from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LEGACY_ASSET_ROOT = "asse" + "st"

ALLOWED_ROOT_NAMES = {
    ".codex",
    ".git",
    ".gitignore",
    ".vite",
    "AGENTS.md",
    "assets",
    "configs",
    "dist",
    "docs",
    "index.html",
    "logs",
    "map",
    "mapEditor.bat",
    "node_modules",
    "openspec",
    "package-lock.json",
    "package.json",
    "reports",
    "run.bat",
    "scripts",
    "skillEditor_run.bat",
    "src",
    "tests",
    "tools",
    "tsconfig.json",
    "vite.config.ts",
    "webapp",
}

TEXT_SUFFIXES = {
    ".bat",
    ".css",
    ".html",
    ".js",
    ".json",
    ".md",
    ".mjs",
    ".py",
    ".toml",
    ".ts",
    ".tsx",
    ".yaml",
    ".yml",
}


def main() -> int:
    errors: list[str] = []

    if (ROOT / LEGACY_ASSET_ROOT).exists():
        errors.append(f"Use assets/; the legacy {LEGACY_ASSET_ROOT}/ directory must not exist.")

    for item in ROOT.iterdir():
        if item.name not in ALLOWED_ROOT_NAMES:
            errors.append(f"Unexpected root item: {item.name}")
        if item.is_file() and re.search(r"\.(err\.)?log$", item.name):
            errors.append(f"Log file belongs under logs/, not repo root: {item.name}")

    for path in iter_text_files():
        raw = path.read_bytes()
        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError as exc:
            errors.append(f"Text file must be valid UTF-8: {path.relative_to(ROOT)} at byte {exc.start}")
            continue
        if "\ufffd" in text:
            errors.append(f"Text file contains replacement character U+FFFD: {path.relative_to(ROOT)}")
        if LEGACY_ASSET_ROOT in text:
            errors.append(f"Legacy asset root reference found: {path.relative_to(ROOT)}")

    if errors:
        print("Repository hygiene check failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Repository hygiene check passed.")
    return 0


def iter_text_files():
    skipped_dirs = {".codex", ".git", "node_modules", "dist", ".vite"}
    skipped_files = {".gitignore", Path(__file__).name}
    for path in ROOT.rglob("*"):
        if any(part in skipped_dirs for part in path.relative_to(ROOT).parts):
            continue
        if path.name in skipped_files:
            continue
        if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES:
            yield path


if __name__ == "__main__":
    raise SystemExit(main())
