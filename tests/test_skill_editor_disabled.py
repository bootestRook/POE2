from __future__ import annotations

import unittest
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT))

from liufang.web_api import V1WebAppApi
from tools import webapp_server


class SkillEditorDisabledTest(unittest.TestCase):
    def test_web_api_state_does_not_expose_skill_editor(self) -> None:
        state = V1WebAppApi(ROOT / "configs").state()

        self.assertNotIn("skill_editor", state)

    def test_web_api_skill_editor_methods_are_disabled(self) -> None:
        api = V1WebAppApi(ROOT / "configs")

        save = api.save_skill_package("active_fire_bolt", {})
        preview = api.preview_skill_modifier_stack({})
        arena = api.run_skill_test_arena({})

        self.assertFalse(save["ok"])
        self.assertFalse(preview["ok"])
        self.assertFalse(arena["ok"])
        self.assertEqual(save["message_text"], "SkillEditor is disabled.")
        self.assertIsNone(preview["preview"])
        self.assertIsNone(arena["result"])

    def test_server_identifies_skill_editor_routes(self) -> None:
        self.assertTrue(webapp_server._is_skill_editor_path("/skill-editor"))
        self.assertTrue(webapp_server._is_skill_editor_path("/skill-editor/active_fire_bolt"))
        self.assertTrue(webapp_server._is_skill_editor_api_path("/api/skill-editor/save"))
        self.assertFalse(webapp_server._is_skill_editor_path("/"))
        self.assertFalse(webapp_server._is_skill_editor_api_path("/api/runtime/skill-events"))


if __name__ == "__main__":
    unittest.main()
