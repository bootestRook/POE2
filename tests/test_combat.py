from __future__ import annotations

import random
import sys
import unittest
from dataclasses import replace
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from liufang.affixes import AffixGenerator
from liufang.combat import CombatSession, CombatStartError, Monster, Player, Position
from liufang.config import (
    load_affix_definitions,
    load_board_rules,
    load_gem_definitions,
    load_rarity_affix_counts,
    load_relation_coefficients,
    load_skill_scaling_rules,
    load_skill_templates,
)
from liufang.gem_board import SudokuGemBoard
from liufang.inventory import GemInventory
from liufang.loot import LootRuntime
from liufang.skill_effects import SkillEffectCalculator
from liufang.skill_runtime import SkillEvent


OBSOLETE_GEM_IDS = frozenset(
    {
        "active_fire_bolt",
        "active_lava_orb",
        "passive_vitality",
        "support_fast_attack",
    }
)


class CombatTest(unittest.TestCase):
    def setUp(self) -> None:
        self.config_root = ROOT / "configs"
        self.definitions = load_gem_definitions(self.config_root)
        self.inventory = GemInventory(self.definitions)
        self._skip_missing_obsolete_gems()
        self.board = SudokuGemBoard(load_board_rules(self.config_root), self.inventory)
        self.affix_definitions = load_affix_definitions(self.config_root)

    def _skip_missing_obsolete_gems(self) -> None:
        add_instance = self.inventory.add_instance

        def add_instance_or_skip(instance_id: str, base_gem_id: str, *args: object, **kwargs: object) -> object:
            if base_gem_id in OBSOLETE_GEM_IDS and base_gem_id not in self.definitions:
                self.skipTest(f"obsolete gem definition removed: {base_gem_id}")
            return add_instance(instance_id, base_gem_id, *args, **kwargs)

        self.inventory.add_instance = add_instance_or_skip  # type: ignore[method-assign]

    def calculator(self) -> SkillEffectCalculator:
        return SkillEffectCalculator(
            board=self.board,
            definitions=self.definitions,
            skill_templates=load_skill_templates(self.config_root),
            relation_coefficients=load_relation_coefficients(self.config_root),
            scaling_rules=load_skill_scaling_rules(self.config_root),
            affix_definitions={definition.affix_id: definition for definition in self.affix_definitions},
        )

    def loot_runtime(self, seed: int = 1) -> LootRuntime:
        generator = AffixGenerator(
            self.affix_definitions,
            load_rarity_affix_counts(self.config_root),
            random.Random(seed),
        )
        return LootRuntime.from_configs(
            self.config_root,
            self.definitions,
            {"normal": 1},
            generator,
            rng=random.Random(seed),
        )

    def player(self, item_interaction_reach: float = 2.0) -> Player:
        return Player(
            player_id="player_1",
            current_life=100,
            max_life=100,
            position=Position(0, 0),
            item_interaction_reach=item_interaction_reach,
            current_mana=100,
            max_mana=100,
            mana_regen_flat=0,
        )

    def test_monster_accumulates_frostbite_and_enters_frozen_state(self) -> None:
        monster = Monster("monster_1", current_life=1000, max_life=1000, position=Position(0, 0))

        for _ in range(11):
            monster.apply_ailment(
                {
                    "status_type": "frostbite",
                    "duration_ms": 4000,
                    "base_value": 10,
                    "max_stacks": 999,
                    "effect_per_stack": 1,
                    "threshold": 100,
                }
            )

        self.assertTrue(monster.is_frozen)
        self.assertEqual(sum(state.base_value for state in monster.ailments if state.ailment_type == "frostbite"), 110)
        self.assertTrue(all(state.polarity == "negative" for state in monster.ailments))
        self.assertEqual(monster.ailments[0].buff_type, "cold_damage_taken_increase")

    def test_monster_ticks_damage_over_time_ailments(self) -> None:
        monster = Monster("monster_1", current_life=1000, max_life=1000, position=Position(0, 0))
        monster.apply_ailment(
            {
                "status_type": "ignite",
                "duration_ms": 4000,
                "base_damage_per_second": 25,
                "max_stacks": 1,
            }
        )

        dealt = monster.tick_ailments(1000)

        self.assertEqual(dealt, 25)
        self.assertEqual(monster.current_life, 975)

    def test_frostbite_numbed_and_shock_modify_followup_hits(self) -> None:
        monster = Monster("monster_1", current_life=1000, max_life=1000, position=Position(0, 0))
        monster.apply_ailment({"status_type": "frostbite", "duration_ms": 4000, "base_value": 10, "effect_per_stack": 1})
        monster.apply_ailment({"status_type": "numbed", "duration_ms": 2000, "effect_per_stack": 5, "max_stacks": 10})
        monster.apply_ailment({"status_type": "shock", "duration_ms": 4000, "base_value": 30, "max_triggers": 1})

        monster.take_hit_components({"cold": 100, "lightning": 100})

        self.assertEqual(monster.current_life, 764)
        self.assertFalse(any(state.ailment_type == "shock" for state in monster.ailments))

    def test_start_requires_legal_board_and_active_skill(self) -> None:
        with self.assertRaises(CombatStartError) as empty_error:
            CombatSession.start(
                player=self.player(),
                monsters=[],
                inventory=self.inventory,
                skill_effect_calculator=self.calculator(),
                loot_runtime=self.loot_runtime(),
            )
        self.assertEqual(empty_error.exception.error_key, "board.enter_combat.empty_board")

        self.inventory.add_instance("support", "support_fast_attack")
        self.board.mount_gem("support", 0, 0)
        with self.assertRaises(CombatStartError) as no_active_error:
            CombatSession.start(
                player=self.player(),
                monsters=[],
                inventory=self.inventory,
                skill_effect_calculator=self.calculator(),
                loot_runtime=self.loot_runtime(),
            )
        self.assertEqual(no_active_error.exception.error_key, "board.enter_combat.no_active_skill")

    def test_auto_release_uses_final_skill_instance_and_cooldown(self) -> None:
        self.inventory.add_instance("active", "active_fire_bolt")
        self.board.mount_gem("active", 0, 0)
        session = CombatSession.start(
            player=self.player(),
            monsters=[Monster("monster_1", current_life=200, max_life=200, position=Position(1, 0))],
            inventory=self.inventory,
            skill_effect_calculator=self.calculator(),
            loot_runtime=self.loot_runtime(),
        )

        first_events = session.tick(1)
        self.assertEqual(first_events, ())
        self.assertEqual(session.monsters[0].current_life, 200)
        expected_spawn_count = session.active_skill_instances[0].projectile_count
        burst_interval_ms = int((session.active_skill_instances[0].runtime_params or {}).get("burst_interval_ms", 0))
        event_types = [event.type for event in session.skill_events]
        self.assertIn("cast_start", event_types)
        self.assertEqual(event_types.count("projectile_spawn"), expected_spawn_count)
        self.assertEqual(event_types.count("projectile_hit"), expected_spawn_count)
        self.assertEqual(event_types.count("damage"), expected_spawn_count)
        self.assertEqual(event_types.count("hit_vfx"), expected_spawn_count)
        self.assertEqual(event_types.count("floating_text"), expected_spawn_count)

        projectile_duration_ms = next(event.duration_ms for event in session.skill_events if event.type == "projectile_spawn")
        before_hit_events = session.tick(projectile_duration_ms - 1)
        self.assertEqual(before_hit_events, ())
        self.assertEqual(session.monsters[0].current_life, 200)

        hit_events = session.tick(1)
        expected_first_wave = expected_spawn_count if burst_interval_ms == 0 else 1
        self.assertEqual(len(hit_events), expected_first_wave)
        self.assertEqual(hit_events[0].skill_instance.active_gem_instance_id, "active")
        self.assertEqual(hit_events[0].damage, session.active_skill_instances[0].final_damage)
        self.assertEqual(
            session.monsters[0].current_life,
            200 - session.active_skill_instances[0].final_damage * expected_first_wave,
        )

        second_events = session.tick(max(1, burst_interval_ms))
        if expected_spawn_count > 1 and burst_interval_ms > 0:
            self.assertEqual(len(second_events), 1)
        else:
            self.assertEqual(second_events, ())

    def test_lava_orb_uses_packaged_orbit_event_pipeline(self) -> None:
        self.inventory.add_instance("active", "active_lava_orb")
        self.board.mount_gem("active", 0, 0)
        session = CombatSession.start(
            player=self.player(),
            monsters=[Monster("monster_1", current_life=30, max_life=30, position=Position(0, -118))],
            inventory=self.inventory,
            skill_effect_calculator=self.calculator(),
            loot_runtime=self.loot_runtime(),
        )

        first_events = session.tick(1)

        self.assertEqual(first_events, ())
        self.assertEqual(session.active_skill_instances[0].skill_package_id, "active_lava_orb")
        self.assertEqual(session.active_skill_instances[0].behavior_template, "module_chain")
        self.assertEqual(session.monsters[0].current_life, 30)
        event_types = [event.type for event in session.skill_events]
        self.assertIn("orbit_spawn", event_types)
        self.assertIn("orbit_tick", event_types)
        self.assertIn("damage_zone", event_types)

        damage_events = session.tick(2160)

        self.assertGreaterEqual(len(damage_events), 1)
        self.assertLess(session.monsters[0].current_life, 30)

    def test_chromatic_shot_kill_explosion_damages_nearby_monsters(self) -> None:
        self.inventory.add_instance("active", "active_chromatic_shot")
        self.board.mount_gem("active", 0, 0)
        session = CombatSession.start(
            player=self.player(),
            monsters=[
                Monster("monster_1", current_life=80, max_life=1000, position=Position(1, 0)),
                Monster("monster_2", current_life=400, max_life=400, position=Position(4, 0)),
                Monster("monster_3", current_life=400, max_life=400, position=Position(12, 0)),
            ],
            inventory=self.inventory,
            skill_effect_calculator=self.calculator(),
            loot_runtime=self.loot_runtime(),
        )
        skill = session.active_skill_instances[0]
        runtime_params = {
            **(skill.runtime_params or {}),
            "on_kill_explosion_chance_percent": 100,
            "on_kill_explosion_radius": 5,
            "on_kill_explosion_max_life_percent": 25,
            "on_kill_explosion_damage_type": "true",
        }
        skill = replace(skill, runtime_params=runtime_params)
        session.active_skill_instances = (skill,)
        session._cooldowns[skill.active_gem_instance_id].skill = skill

        session.tick(1)
        hit_events = session.tick(80)
        explosion_zones = [
            event for event in session.skill_events
            if event.type == "damage_zone" and event.payload.get("damage_module") == "max_life_percent_true_damage"
        ]
        explosion_hits = [
            event for event in session.skill_events
            if event.type == "damage_zone_hit" and event.payload.get("damage_module") == "max_life_percent_true_damage"
        ]
        explosion_events = [
            event for event in session.skill_events
            if event.type == "damage" and event.payload.get("trigger_event_type") == "damage_zone_hit" and event.damage_type == "true"
        ]

        self.assertTrue(hit_events[0].killed)
        self.assertEqual(len(explosion_zones), 1)
        self.assertEqual(len(explosion_hits), 1)
        self.assertEqual(explosion_hits[0].target_entity, "monster_2")
        self.assertEqual(len(explosion_events), 1)
        self.assertEqual(explosion_events[0].target_entity, "monster_2")
        self.assertEqual(explosion_events[0].payload["trigger_event_id"], explosion_hits[0].event_id)
        self.assertEqual(explosion_events[0].amount, 100)
        self.assertEqual(explosion_events[0].payload["damage_components"], {"true": 100})
        self.assertEqual(explosion_events[0].payload["target_max_life"], 400)
        self.assertEqual(session.monsters[1].current_life, 300)
        self.assertEqual(session.monsters[2].current_life, 400)

    def test_ring_of_ice_recasts_once_from_defeated_enemy_position(self) -> None:
        self.inventory.add_instance("active", "active_ring_of_ice")
        self.board.mount_gem("active", 0, 0)
        session = CombatSession.start(
            player=self.player(),
            monsters=[
                Monster("monster_1", current_life=70, max_life=70, position=Position(100, 0)),
                Monster("monster_2", current_life=500, max_life=500, position=Position(180, 0)),
                Monster("monster_3", current_life=500, max_life=500, position=Position(260, 0)),
            ],
            inventory=self.inventory,
            skill_effect_calculator=self.calculator(),
            loot_runtime=self.loot_runtime(),
        )
        skill = session.active_skill_instances[0]
        self.assertEqual(skill.base_damage, 76.5)
        self.assertEqual(skill.hit["base_damage"], 76.5)
        skill = replace(
            skill,
            runtime_params={
                **(skill.runtime_params or {}),
                "on_kill_recast_chance_percent": 100,
            },
        )
        session.active_skill_instances = (skill,)
        session._cooldowns[skill.active_gem_instance_id].skill = skill

        session.tick(1)
        first_hit_events = session.tick(140)
        recast_areas = [
            event for event in session.skill_events
            if event.type == "area_spawn" and event.payload.get("effect") == "on_kill_recast"
        ]

        self.assertTrue(first_hit_events[0].killed)
        self.assertEqual(len(recast_areas), 1)
        self.assertEqual(recast_areas[0].position, {"x": 100, "y": 0})
        self.assertEqual(recast_areas[0].payload["source_area_id"], "active.1.area.1")
        self.assertEqual(session.monsters[1].current_life, 500)

        recast_hit_events = session.tick(140)
        self.assertEqual(len(recast_hit_events), 1)
        self.assertEqual(recast_hit_events[0].monster_id, "monster_2")
        self.assertEqual(session.monsters[1].current_life, 423.5)
        self.assertEqual(session.monsters[2].current_life, 500)
        self.assertEqual(
            len([
                event for event in session.skill_events
                if event.type == "area_spawn" and event.payload.get("source_area_id") == "active.1.area.1"
            ]),
            1,
        )

    def test_split_firebolt_child_projectiles_apply_damage_after_parent_hit(self) -> None:
        self.inventory.add_instance("active", "active_split_firebolt")
        self.board.mount_gem("active", 0, 0)
        session = CombatSession.start(
            player=self.player(),
            monsters=[
                Monster("monster_1", current_life=5000, max_life=5000, position=Position(100, 0)),
                Monster("split_target_1", current_life=5000, max_life=5000, position=Position(208.8, -50.7)),
                Monster("split_target_2", current_life=5000, max_life=5000, position=Position(220, 0)),
                Monster("split_target_3", current_life=5000, max_life=5000, position=Position(208.8, 50.7)),
            ],
            inventory=self.inventory,
            skill_effect_calculator=self.calculator(),
            loot_runtime=self.loot_runtime(),
        )
        skill = session.active_skill_instances[0]
        runtime_params = {
            **(skill.runtime_params or {}),
            "spawn_offset": {"x": 0, "y": 0},
            "projectile_count": 1,
            "spread_angle_deg": 0,
            "pierce_count": 0,
            "hit_policy": "first_hit",
            "split_projectile_count": 3,
            "split_projectile_angle_step_deg": 25,
            "split_projectile_damage_multiplier": 0.5,
            "split_projectile_pierce_count": 1,
            "split_projectile_speed": 620,
            "split_projectile_max_distance": 240,
            "split_projectile_collision_radius": 10,
        }
        skill = replace(skill, projectile_count=1, runtime_params=runtime_params)
        session.active_skill_instances = (skill,)
        session._cooldowns[skill.active_gem_instance_id].skill = skill

        session.tick(1)
        split_spawns = [
            event for event in session.skill_events
            if event.type == "projectile_spawn" and event.payload.get("split_projectile")
        ]
        self.assertEqual(len(split_spawns), 3)
        parent_hit = next(
            event for event in session.skill_events
            if event.type == "projectile_hit" and not event.payload.get("split_projectile")
        )
        self.assertTrue(all(event.payload["trigger_event_id"] == parent_hit.event_id for event in split_spawns))

        session.tick(max(event.delay_ms for event in session.skill_events if event.payload.get("split_projectile")))

        child_damage_events = [
            event for event in session.skill_events
            if event.type == "damage" and event.payload.get("split_projectile")
        ]
        self.assertEqual(len(child_damage_events), 3)
        self.assertEqual({event.target_entity for event in child_damage_events}, {"split_target_1", "split_target_2", "split_target_3"})
        self.assertTrue(all(event.amount == skill.final_damage * 0.5 for event in child_damage_events))
        self.assertTrue(all(monster.current_life < 5000 for monster in session.monsters[1:]))

    def test_player_resource_and_defense_stats_affect_incoming_damage(self) -> None:
        player = Player(
            player_id="player_1",
            current_life=100,
            max_life=100,
            position=Position(0, 0),
            item_interaction_reach=2,
            current_mana=10,
            max_mana=20,
            life_regen_flat=10,
            mana_regen_flat=5,
            current_energy_shield=20,
            max_energy_shield=20,
            energy_shield_charge_speed_percent=50,
            energy_shield_charge_delay_ms=500,
            armor=100,
            evasion=1000,
            attack_block_chance_percent=50,
            block_damage_reduction_percent=50,
            fire_resistance_percent=50,
            chaos_resistance_percent=25,
        )

        player.regenerate(1000)
        self.assertEqual(player.current_life, 100)
        self.assertEqual(player.current_mana, 15)

        player.current_life = 80
        player.regenerate(500)
        self.assertEqual(player.current_life, 85)

        life_damage = player.take_hit(40, damage_type="physical", hit_kind="attack")
        self.assertLess(life_damage, 20)
        self.assertLess(player.current_energy_shield, 20)
        shield_after_hit = player.current_energy_shield

        player.regenerate(400)
        self.assertEqual(player.current_energy_shield, shield_after_hit)
        player.regenerate(600)
        self.assertGreater(player.current_energy_shield, shield_after_hit)

        fire_player = Player(
            player_id="player_2",
            current_life=100,
            max_life=100,
            position=Position(0, 0),
            item_interaction_reach=2,
            fire_resistance_percent=50,
            chaos_resistance_percent=25,
        )
        self.assertEqual(fire_player.take_hit(40, damage_type="fire", avoidable=False), 20)
        self.assertEqual(fire_player.take_hit(40, damage_type="chaos", avoidable=False), 30)

    def test_guard_buff_absorbs_direct_hits_until_amount_or_duration_expires(self) -> None:
        player = Player(
            player_id="player",
            current_life=100,
            max_life=100,
            position=Position(0, 0),
            item_interaction_reach=2,
        )
        player.apply_buff_event(
            SkillEvent(
                event_id="stoneskin.buff",
                type="buff_apply",
                timestamp_ms=0,
                source_entity="player",
                target_entity="player",
                position={"x": 0, "y": 0},
                direction={"x": 0, "y": 0},
                delay_ms=0,
                duration_ms=6000,
                amount=150,
                damage_type="physical",
                skill_instance_id="active",
                vfx_key="skill_event.stoneskin.vfx",
                sfx_key="skill_event.stoneskin.sfx",
                reason_key="skill_event.guard.buff_apply",
                payload={
                    "skill_id": "active_stoneskin",
                    "buff_type": "guard",
                    "absorb_percent": 70,
                    "absorb_amount": 150,
                    "duration_ms": 6000,
                    "exclude_damage_over_time": True,
                },
            )
        )

        self.assertEqual(len(player.buffs), 1)
        self.assertEqual(player.take_hit(100, avoidable=False), 30)
        self.assertEqual(player.current_life, 70)
        self.assertEqual(player.buffs[0].remaining_amount, 80)

        self.assertEqual(player.take_hit(100, avoidable=False, damage_over_time=True), 100)
        self.assertEqual(player.current_life, 0)
        self.assertEqual(player.buffs[0].remaining_amount, 80)

        player.current_life = 100
        player.regenerate(6000)
        self.assertEqual(player.buffs, [])
        self.assertEqual(player.take_hit(100, avoidable=False), 100)

    def test_passive_self_stat_applies_before_combat_and_does_not_release(self) -> None:
        self.inventory.add_instance("active", "active_fire_bolt")
        self.inventory.add_instance("passive", "passive_vitality")
        self.board.mount_gem("active", 0, 0)
        self.board.mount_gem("passive", 1, 0)

        session = CombatSession.start(
            player=self.player(),
            monsters=[Monster("monster_1", current_life=30, max_life=30, position=Position(1, 0))],
            inventory=self.inventory,
            skill_effect_calculator=self.calculator(),
            loot_runtime=self.loot_runtime(),
        )

        self.assertEqual(session.player.max_life, 125)
        self.assertEqual(session.player.current_life, 125)
        self.assertEqual(len(session.active_skill_instances), 1)
        self.assertEqual(session.active_skill_instances[0].active_gem_instance_id, "active")

    def test_kill_triggers_gem_drop_and_pickup_enters_inventory(self) -> None:
        self.inventory.add_instance("active", "active_fire_bolt")
        self.board.mount_gem("active", 0, 0)
        session = CombatSession.start(
            player=self.player(item_interaction_reach=2.0),
            monsters=[Monster("monster_1", current_life=5, max_life=5, position=Position(1, 0))],
            inventory=self.inventory,
            skill_effect_calculator=self.calculator(),
            loot_runtime=self.loot_runtime(seed=3),
        )

        session.tick(1)
        events = session.tick(420)
        self.assertTrue(events[0].killed)
        self.assertFalse(session.monsters[0].is_alive)
        self.assertEqual(len(session.dropped_gems), 1)
        dropped = session.dropped_gems[0]
        self.assertFalse(dropped.picked_up)
        self.assertIn("gem", dropped.gem_instance.tags)
        self.assertIn(dropped.gem_instance.rarity, {"normal", "magic", "rare"})

        picked = session.pickup_nearby()
        self.assertEqual(len(picked), 1)
        self.assertTrue(dropped.picked_up)
        stored = self.inventory.require(dropped.gem_instance.instance_id)
        self.assertEqual(stored.base_gem_id, dropped.gem_instance.base_gem_id)
        self.assertEqual(stored.rarity, dropped.gem_instance.rarity)
        self.assertEqual(stored.random_affixes, ())
        self.assertEqual(dropped.gem_instance.random_affixes, ())
        self.assertEqual(stored.locked, dropped.gem_instance.locked)
        self.assertEqual(stored.board_position, dropped.gem_instance.board_position)

        self.assertEqual(session.pickup_nearby(), ())

    def test_active_skill_spends_mana_and_skips_release_when_insufficient(self) -> None:
        self.inventory.add_instance("active", "active_fire_bolt")
        self.board.mount_gem("active", 0, 0)
        player = self.player()
        player.current_mana = 6
        player.max_mana = 6
        session = CombatSession.start(
            player=player,
            monsters=[Monster("monster_1", current_life=50, max_life=50, position=Position(1, 0))],
            inventory=self.inventory,
            skill_effect_calculator=self.calculator(),
            loot_runtime=self.loot_runtime(),
        )

        session.tick(1)

        self.assertEqual(session.player.current_mana, 0)
        self.assertTrue(session.skill_events)

        session.skill_events.clear()
        session.tick(session.active_skill_instances[0].actual_interval_ms)

        self.assertEqual(session.player.current_mana, 0)
        self.assertEqual(session.skill_events, [])
        self.assertEqual(
            session._last_release_skip_reasons["active"],
            "combat.skip.insufficient_mana",
        )

    def test_item_interaction_reach_blocks_far_drops_until_player_is_near(self) -> None:
        self.inventory.add_instance("active", "active_fire_bolt")
        self.board.mount_gem("active", 0, 0)
        session = CombatSession.start(
            player=self.player(item_interaction_reach=1.0),
            monsters=[Monster("monster_1", current_life=5, max_life=5, position=Position(5, 0))],
            inventory=self.inventory,
            skill_effect_calculator=self.calculator(),
            loot_runtime=self.loot_runtime(seed=4),
        )

        session.tick(1)
        session.tick(420)
        self.assertEqual(len(session.dropped_gems), 1)
        self.assertEqual(session.pickup_nearby(), ())
        self.assertFalse(session.dropped_gems[0].picked_up)

        session.player.position = Position(5, 0)
        self.assertEqual(len(session.pickup_nearby()), 1)
        self.assertTrue(session.dropped_gems[0].picked_up)


if __name__ == "__main__":
    unittest.main()
