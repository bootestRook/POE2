# AGENTS.md

Codex must follow this file when working in this repository.

These rules are designed to reduce common AI coding mistakes:

- Silent assumptions
- Overengineering
- Large unrelated diffs
- Unrequested refactors
- Weak verification
- Changing the wrong branch
- Touching files outside the requested scope
- Implementing before understanding

When these rules conflict with user instructions, the narrower and more explicit instruction wins.

---

## 0. Client-Only Project Constraint

This project has no backend now.

Codex must not connect any feature to a backend.

Do not add, restore, depend on, or call backend APIs, backend services, server runtimes, web API layers, or server-generated gameplay behavior for any feature.

All new or changed functionality must run from frontend/client-side code, local static config, local assets, or other explicitly client-only mechanisms.

If existing instructions, code, docs, tests, or comments mention backend/canonical runtime, interpret the allowed implementation as client-side only. Do not use those references to justify adding or reintroducing backend coupling.

---

## 1. Think Before Coding

Do not start coding before understanding the task.

Before making changes, Codex must identify:

- What the user is actually asking for
- Which branch should be used
- Which module or files are in scope
- What must not be changed
- The smallest safe implementation path
- How the result will be verified

If the requirement is ambiguous, stop and ask.

If there are multiple valid interpretations, state them instead of silently choosing one.

If a simpler approach exists, say so.

If the requested approach is likely unsafe, overcomplicated, or likely to create unnecessary diff, push back before editing.

Do not hide uncertainty.

---

## 2. Skill Work Reuses Mechanisms

Before skill work, read `docs/codex-skill-workflow.md`.

For skill work, Codex must search by gameplay mechanism before editing, not only by skill ID.

Reuse existing runtime/config/test paths when possible; state the reused function, event, field, or test. For example, kill-triggered effects must check `on_kill`, `unit_killed`, `killed`, `defeated`, `kill_explosion`, and similar paths.

Skill alignment tests must prove runtime behavior, not only config payload presence.

There must be one canonical skill runtime for actual gameplay. The playable WebApp battle view must consume backend/canonical `SkillRuntime` events and must not maintain or reintroduce a separate frontend-local battle runtime mirror for skill event generation, target selection, damage-zone timing, projectile behavior, chain behavior, melee arcs, nova behavior, orbit ticks, hit timing, or damage application.

Frontend code may render canonical events, schedule canonical event delays, and adapt canonical event payloads into visuals. It must not recalculate trajectory, hit targets, hit timing, damage-zone origins, chain targets, orbit tick hits, or damage results for actual gameplay when those belong to the canonical runtime.

If a temporary frontend-only simulator exists for tooling, it must be isolated from the playable WebApp battle path, named as non-canonical tooling, and guarded by tests that prove the playable path does not call it. Do not use tooling simulators or skill editor results as proof of actual gameplay behavior.

This project is a 2D top-down project. Do not introduce 2.5D, isometric, dimetric, projection-scaled, or perspective-squashed gameplay visuals unless the user explicitly asks for that specific exception.

Circular gameplay areas, circular damage zones, circular targeting guides, circular hit effects, and circular VFX must render as circles in screen space. Do not squash circles into ellipses by tile ratio, projection ratio, camera ratio, depth ratio, or any other implicit transform.

---

## 3. Plan Before Non-Trivial Changes

For any non-trivial task, Codex must produce a short plan before editing.

A task is non-trivial if it involves:

- More than one file
- Runtime behavior changes
- Data schema changes
- Public API changes
- Build/config changes
- Tests
- Architecture or module boundary decisions
- Any change where the root cause is not already obvious

Use this format:

```text
Plan:
1. Inspect [area/file] -> verify: understand current behavior
2. Change [specific file/module] -> verify: minimal diff only
3. Run [test/build/check] -> verify: pass/fail result
```

---

## 4. Frontend Verification Is Mandatory

For any task that changes or can affect the frontend, Codex must run the frontend in a browser and verify it visually with a screenshot.

Backend-only tests, unit tests, static checks, logs, or guesses are not enough for frontend-affecting work.

For any visual change or visual test, Codex must run screenshot regression through the built-in WebApp's actual game/battle view. Do not validate visual behavior only from backend tests, code inspection, config checks, build output, or indirect evidence.

The skill editor is disabled and must not be opened, served, launched, scripted, or used as a verification surface. Do not navigate to `/skill-editor`, do not use `?skill_editor=1` or `view=skill_editor`, do not start port `8765`, and do not use `dist-skill-editor`. Skill VFX, combat visuals, unit visuals, map visuals, targeting guides, and damage areas must be verified in the actual playable WebApp view.

Codex must:

- Start or open the frontend locally.
- Exercise the changed frontend behavior in the built-in WebApp browser view.
- Capture a screenshot of the actual rendered result.
- Describe what is visible in the screenshot.
- Clearly state any frontend behavior that could not be verified.

Do not claim that frontend behavior works unless it was actually observed in the running frontend.

---

## 5. No Root-Level Screenshots Or Logs

Codex must not write screenshots, browser captures, verification images, logs, server output, or test output files into the repository root.

Use dedicated artifact directories instead:

- Screenshots and visual verification images: `artifacts/screenshots/`
- Logs and captured command/server output: `artifacts/logs/`
- Task-specific generated evidence: a clearly named subdirectory under `artifacts/`

If an existing tool defaults to writing these files in the root, override the output path before running it. If root-level screenshot or log files are created accidentally, move them into the appropriate `artifacts/` directory before finishing.
