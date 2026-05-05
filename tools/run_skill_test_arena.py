from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))


def main() -> int:
    print("Skill Test Arena is disabled. Use the playable WebApp battle view for verification.")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
