from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any


MANIFEST_PATH = Path("skills") / "tlidb_adopted_skills.json"


@lru_cache(maxsize=8)
def load_tlidb_adopted_manifest(config_root_text: str) -> dict[str, Any]:
    config_root = Path(config_root_text)
    path = config_root / MANIFEST_PATH
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ValueError("tlidb adopted skill manifest root must be an object")
    return data


def adopted_manifest(config_root: Path) -> dict[str, Any]:
    return load_tlidb_adopted_manifest(str(config_root.resolve()))


def adopted_entries(config_root: Path, section: str) -> list[dict[str, Any]]:
    value = adopted_manifest(config_root).get(section, [])
    if not isinstance(value, list):
        return []
    return [entry for entry in value if isinstance(entry, dict)]


def adopted_product_ids(config_root: Path, section: str) -> set[str]:
    return {
        str(entry["id"])
        for entry in adopted_entries(config_root, section)
        if isinstance(entry.get("id"), str) and entry.get("product_status", "product") == "product"
    }


def active_product_ids(config_root: Path) -> set[str]:
    return adopted_product_ids(config_root, "active")


def support_product_ids(config_root: Path) -> set[str]:
    support_ids = adopted_product_ids(config_root, "support")
    support_ids.update(adopted_product_ids(config_root, "board_conduits"))
    return support_ids


def passive_product_ids(config_root: Path) -> set[str]:
    return adopted_product_ids(config_root, "passive")


def manifest_present(config_root: Path) -> bool:
    return bool(adopted_manifest(config_root))
