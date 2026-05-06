// Generated frontend-owned playable seed data for normal play.

export const FRONTEND_INITIAL_APP_STATE = {
  "inventory": [
    {
      "instance_id": "web_seed_active_1_active_split_firebolt",
      "name_text": "裂变火球",
      "description_text": "向前发射火球，火球命中后分裂成小型火球继续追击附近敌人。",
      "category_text": "主动技能宝石",
      "gem_type": {
        "id": "gem_type_1",
        "number": 1,
        "display_text": "1号宝石",
        "identity_text": "一号主动技能身份",
        "color_key": "red"
      },
      "gem_kind": "active_skill",
      "gem_kind_text": "主动技能宝石",
      "sudoku_digit": 1,
      "rarity_text": "魔法",
      "level": 1,
      "locked": false,
      "board_position": null,
      "tags": [
        {
          "id": "active_skill_gem",
          "text": "主动技能宝石"
        },
        {
          "id": "area",
          "text": "范围"
        },
        {
          "id": "fire",
          "text": "火焰"
        },
        {
          "id": "gem",
          "text": "宝石"
        },
        {
          "id": "gem_type_1",
          "text": "1号宝石"
        },
        {
          "id": "loot_gem",
          "text": "可掉落宝石"
        },
        {
          "id": "projectile",
          "text": "投射物"
        },
        {
          "id": "skill_split_firebolt",
          "text": "裂变火球"
        },
        {
          "id": "spell",
          "text": "法术"
        }
      ],
      "base_effect": {
        "title_text": "技能基础效果",
        "template_text": "裂变火球",
        "damage_type_text": "火焰",
        "base_damage": 84.25,
        "base_release_interval_ms": 650,
        "base_cooldown_ms": 0,
        "trigger_interval_ms": 0,
        "mana_cost": 8,
        "scaling_stats": [
          {
            "id": "damage_add_percent",
            "text": "伤害提高"
          },
          {
            "id": "fire_damage_add_percent",
            "text": "火焰伤害提高"
          },
          {
            "id": "cast_speed_add_percent",
            "text": "施法速度提高"
          },
          {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          {
            "id": "skill_speed_final_percent",
            "text": "最终技能速度"
          },
          {
            "id": "projectile_speed_add_percent",
            "text": "投射物速度提高"
          },
          {
            "id": "projectile_count_add",
            "text": "投射物数量增加"
          },
          {
            "id": "chain_count_add",
            "text": "连锁次数增加"
          },
          {
            "id": "pierce_count_add",
            "text": "穿透次数增加"
          },
          {
            "id": "area_add_percent",
            "text": "范围提高"
          }
        ]
      },
      "can_affect": {
        "summary_text": "影响自身技能",
        "tags_any": [],
        "tags_all": [],
        "tags_none": []
      },
      "current_effective_targets": [
        {
          "instance_id": "",
          "name_text": "当前盘面暂无实际生效对象",
          "status_text": "当前盘面暂无实际生效对象"
        }
      ],
      "board_relations": [],
      "visual_effect": "skill_event.split_firebolt.vfx",
      "shape_effect": "",
      "shape_effect_text": "",
      "tlidb": {
        "source_values": {
          "source": "tlidb",
          "tlidb_id": "Split_Firebolt",
          "display_level": 20,
          "raw_lines": [
            "释放该技能向前发射 1 个火球，火球抵达射程终点时产生爆炸，火球击中和爆炸时各能造成 674-1011 法术火焰伤害。",
            "火球击中后分裂成三个小型火球，小型火球击中时造成 337-506 法术火焰伤害。",
            "火球：",
            "造成 674-1011 法术火焰伤害",
            "基础发射 1 个投射物",
            "火球爆炸：",
            "造成 674-1011 法术火焰伤害",
            "小型火球：",
            "造成 337-506 法术火焰伤害",
            "该技能分裂出的小火球 +1 穿透次数"
          ],
          "parsed_values": {
            "base_damage": 842.5,
            "mana_cost": 8,
            "release_interval_ms": 650
          },
          "anchors": {
            "base_damage": {
              "20": 842.5
            }
          }
        },
        "level_values": {
          "base_damage": 84.25,
          "mana_cost": 8,
          "release_interval_ms": 650
        },
        "auto_release": {
          "policy": "nearest_enemy",
          "notes": [
            "??????????TLIDB ???? Lv20 ???"
          ]
        }
      },
      "tooltip_view": {
        "variant": "active",
        "icon_text": "裂",
        "icon_color_key": "red",
        "icon_sprite": "",
        "name_text": "裂变火球",
        "subtitle_text": "红色、宝石、法术、火焰、投射物、范围",
        "type_identity_text": "",
        "tags": [
          {
            "id": "gem",
            "text": "宝石"
          },
          {
            "id": "spell",
            "text": "法术"
          },
          {
            "id": "fire",
            "text": "火焰"
          },
          {
            "id": "projectile",
            "text": "投射物"
          },
          {
            "id": "area",
            "text": "范围"
          }
        ],
        "sections": {
          "description": {
            "title_text": "描述",
            "lines": [
              "向前发射火球，火球命中后分裂成小型火球继续追击附近敌人。"
            ]
          },
          "stats": {
            "title_text": "核心数值",
            "lines": [
              {
                "label_text": "等级",
                "value_text": "1"
              },
              {
                "label_text": "法术伤害",
                "value_text": "84.25"
              },
              {
                "label_text": "魔力消耗",
                "value_text": "8"
              }
            ]
          },
          "recent_dps": {
            "title_text": "近期 DPS",
            "lines": []
          },
          "base_skill_level": {
            "lines": [
              "基础技能等级为 1"
            ]
          },
          "tlidb_source": {
            "title_text": "TLIDB 源数值",
            "lines": [
              "TLIDB ID: Split_Firebolt",
              "Lv20 source card",
              "Source: base_damage=842.5, mana_cost=8, release_interval_ms=650"
            ]
          },
          "tlidb_level": {
            "title_text": "等级表",
            "lines": [
              "base_damage=84.25, mana_cost=8, release_interval_ms=650"
            ]
          },
          "auto_release": {
            "title_text": "自动释放适配",
            "lines": [
              "policy: nearest_enemy",
              "??????????TLIDB ???? Lv20 ???"
            ]
          },
          "bonuses": {
            "title_text": "当前加成",
            "lines": [
              "同数独数字宝石不能位于同一行、列或宫格"
            ]
          }
        }
      }
    },
    {
      "instance_id": "web_seed_active_2_active_ice_shot",
      "name_text": "寒冰射击",
      "description_text": "向前发射冰锥，命中后在目标身后引发冰霜爆炸，并可施加冰结。",
      "category_text": "主动技能宝石",
      "gem_type": {
        "id": "gem_type_1",
        "number": 1,
        "display_text": "1号宝石",
        "identity_text": "一号主动技能身份",
        "color_key": "red"
      },
      "gem_kind": "active_skill",
      "gem_kind_text": "主动技能宝石",
      "sudoku_digit": 1,
      "rarity_text": "普通",
      "level": 1,
      "locked": false,
      "board_position": null,
      "tags": [
        {
          "id": "active_skill_gem",
          "text": "主动技能宝石"
        },
        {
          "id": "area",
          "text": "范围"
        },
        {
          "id": "attack",
          "text": "攻击"
        },
        {
          "id": "bow",
          "text": "弓"
        },
        {
          "id": "cold",
          "text": "冰霜"
        },
        {
          "id": "gem",
          "text": "宝石"
        },
        {
          "id": "gem_type_1",
          "text": "1号宝石"
        },
        {
          "id": "loot_gem",
          "text": "可掉落宝石"
        },
        {
          "id": "projectile",
          "text": "投射物"
        },
        {
          "id": "ranged",
          "text": "远程"
        },
        {
          "id": "skill_ice_shot",
          "text": "寒冰射击"
        }
      ],
      "base_effect": {
        "title_text": "技能基础效果",
        "template_text": "寒冰射击",
        "damage_type_text": "冰霜",
        "base_damage": 31.3,
        "base_release_interval_ms": 1000,
        "base_cooldown_ms": 0,
        "trigger_interval_ms": 0,
        "mana_cost": 5,
        "scaling_stats": [
          {
            "id": "damage_add_percent",
            "text": "伤害提高"
          },
          {
            "id": "cold_damage_add_percent",
            "text": "冰霜伤害提高"
          },
          {
            "id": "attack_speed_add_percent",
            "text": "攻击速度提高"
          },
          {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          {
            "id": "skill_speed_final_percent",
            "text": "最终技能速度"
          },
          {
            "id": "projectile_speed_add_percent",
            "text": "投射物速度提高"
          },
          {
            "id": "projectile_count_add",
            "text": "投射物数量增加"
          },
          {
            "id": "chain_count_add",
            "text": "连锁次数增加"
          },
          {
            "id": "pierce_count_add",
            "text": "穿透次数增加"
          },
          {
            "id": "area_add_percent",
            "text": "范围提高"
          }
        ]
      },
      "can_affect": {
        "summary_text": "影响自身技能",
        "tags_any": [],
        "tags_all": [],
        "tags_none": []
      },
      "current_effective_targets": [
        {
          "instance_id": "",
          "name_text": "当前盘面暂无实际生效对象",
          "status_text": "当前盘面暂无实际生效对象"
        }
      ],
      "board_relations": [],
      "visual_effect": "skill_event.ice_shot.vfx",
      "shape_effect": "",
      "shape_effect_text": "",
      "tlidb": {
        "source_values": {
          "source": "tlidb",
          "tlidb_id": "Ice_Shot",
          "display_level": 20,
          "raw_lines": [
            "释放该技能向前发射 1 个冰锥，击中时造成 313% 武器攻击伤害。",
            "冰锥击中敌人时在其身后产生爆炸，击中时造成 157% 武器攻击伤害。",
            "该技能全部物理伤害转化为冰霜伤害。",
            "冰锥：",
            "造成 313% 武器攻击伤害",
            "基础发射 1 个投射物",
            "爆炸：",
            "造成 157% 武器攻击伤害",
            "该技能 100% 物理伤害转化为冰霜伤害",
            "该技能造成击中冰霜伤害时，施加冰结"
          ],
          "parsed_values": {
            "base_damage": 313,
            "mana_cost": 5,
            "release_interval_ms": 1000
          },
          "anchors": {
            "base_damage": {
              "20": 313
            }
          }
        },
        "level_values": {
          "base_damage": 31.3,
          "mana_cost": 5,
          "release_interval_ms": 1000
        },
        "auto_release": {
          "policy": "nearest_enemy",
          "notes": [
            "??????????TLIDB ???? Lv20 ???"
          ]
        }
      },
      "tooltip_view": {
        "variant": "active",
        "icon_text": "寒",
        "icon_color_key": "red",
        "icon_sprite": "",
        "name_text": "寒冰射击",
        "subtitle_text": "红色、宝石、弓、远程、攻击、冰霜、投射物、范围",
        "type_identity_text": "",
        "tags": [
          {
            "id": "gem",
            "text": "宝石"
          },
          {
            "id": "bow",
            "text": "弓"
          },
          {
            "id": "ranged",
            "text": "远程"
          },
          {
            "id": "attack",
            "text": "攻击"
          },
          {
            "id": "cold",
            "text": "冰霜"
          },
          {
            "id": "projectile",
            "text": "投射物"
          },
          {
            "id": "area",
            "text": "范围"
          }
        ],
        "sections": {
          "description": {
            "title_text": "描述",
            "lines": [
              "向前发射冰锥，命中后在目标身后引发冰霜爆炸，并可施加冰结。"
            ]
          },
          "stats": {
            "title_text": "核心数值",
            "lines": [
              {
                "label_text": "等级",
                "value_text": "1"
              },
              {
                "label_text": "攻击伤害",
                "value_text": "31.3"
              },
              {
                "label_text": "魔力消耗",
                "value_text": "5"
              }
            ]
          },
          "recent_dps": {
            "title_text": "近期 DPS",
            "lines": []
          },
          "base_skill_level": {
            "lines": [
              "基础技能等级为 1"
            ]
          },
          "tlidb_source": {
            "title_text": "TLIDB 源数值",
            "lines": [
              "TLIDB ID: Ice_Shot",
              "Lv20 source card",
              "Source: base_damage=313, mana_cost=5, release_interval_ms=1000"
            ]
          },
          "tlidb_level": {
            "title_text": "等级表",
            "lines": [
              "base_damage=31.3, mana_cost=5, release_interval_ms=1000"
            ]
          },
          "auto_release": {
            "title_text": "自动释放适配",
            "lines": [
              "policy: nearest_enemy",
              "??????????TLIDB ???? Lv20 ???"
            ]
          },
          "bonuses": {
            "title_text": "当前加成",
            "lines": [
              "同数独数字宝石不能位于同一行、列或宫格"
            ]
          }
        }
      }
    },
    {
      "instance_id": "web_seed_active_3_active_chromatic_shot",
      "name_text": "五彩魔矢",
      "description_text": "发射会追踪敌人的五彩魔矢，释放时随机选择火焰、冰霜或闪电形态；多个投射物可以命中同一敌人，击败敌人时可能引发爆炸。",
      "category_text": "主动技能宝石",
      "gem_type": {
        "id": "gem_type_1",
        "number": 1,
        "display_text": "1号宝石",
        "identity_text": "一号主动技能身份",
        "color_key": "red"
      },
      "gem_kind": "active_skill",
      "gem_kind_text": "主动技能宝石",
      "sudoku_digit": 1,
      "rarity_text": "普通",
      "level": 1,
      "locked": false,
      "board_position": null,
      "tags": [
        {
          "id": "active_skill_gem",
          "text": "主动技能宝石"
        },
        {
          "id": "area",
          "text": "范围"
        },
        {
          "id": "cold",
          "text": "冰霜"
        },
        {
          "id": "fire",
          "text": "火焰"
        },
        {
          "id": "gem",
          "text": "宝石"
        },
        {
          "id": "gem_type_1",
          "text": "1号宝石"
        },
        {
          "id": "lightning",
          "text": "闪电"
        },
        {
          "id": "loot_gem",
          "text": "可掉落宝石"
        },
        {
          "id": "projectile",
          "text": "投射物"
        },
        {
          "id": "skill_chromatic_shot",
          "text": "五彩魔矢"
        },
        {
          "id": "spell",
          "text": "法术"
        }
      ],
      "base_effect": {
        "title_text": "技能基础效果",
        "template_text": "五彩魔矢",
        "damage_type_text": "火焰",
        "base_damage": 84.6,
        "base_release_interval_ms": 650,
        "base_cooldown_ms": 0,
        "trigger_interval_ms": 0,
        "mana_cost": 8,
        "scaling_stats": [
          {
            "id": "damage_add_percent",
            "text": "伤害提高"
          },
          {
            "id": "fire_damage_add_percent",
            "text": "火焰伤害提高"
          },
          {
            "id": "cast_speed_add_percent",
            "text": "施法速度提高"
          },
          {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          {
            "id": "skill_speed_final_percent",
            "text": "最终技能速度"
          },
          {
            "id": "projectile_speed_add_percent",
            "text": "投射物速度提高"
          },
          {
            "id": "projectile_count_add",
            "text": "投射物数量增加"
          },
          {
            "id": "chain_count_add",
            "text": "连锁次数增加"
          },
          {
            "id": "pierce_count_add",
            "text": "穿透次数增加"
          },
          {
            "id": "area_add_percent",
            "text": "范围提高"
          }
        ]
      },
      "can_affect": {
        "summary_text": "影响自身技能",
        "tags_any": [],
        "tags_all": [],
        "tags_none": []
      },
      "current_effective_targets": [
        {
          "instance_id": "",
          "name_text": "当前盘面暂无实际生效对象",
          "status_text": "当前盘面暂无实际生效对象"
        }
      ],
      "board_relations": [],
      "visual_effect": "skill_event.chromatic_shot.vfx",
      "shape_effect": "",
      "shape_effect_text": "",
      "tlidb": {
        "source_values": {
          "source": "tlidb",
          "tlidb_id": "Chromatic_Shot",
          "display_level": 20,
          "raw_lines": [
            "释放该技能向前发射 3 个自动追踪敌人的魔矢，造成 59-110 法术伤害。",
            "该技能击败敌人时，有 10% 几率产生一次爆炸，造成被击败敌人最大生命 25% 的真实伤害。",
            "每次释放该技能会随机选择一种元素伤害，使下次技能的所有伤害都强制转化为该类型",
            "该技能发射的魔矢可以命中同一个敌人。",
            "五彩魔矢：",
            "造成 59-110 法术伤害",
            "基础发射 1 个投射物",
            "该技能 +2 投射物数量",
            "该技能释放时，随机选择一种元素类型，使下次该技能的伤害强制转化为该类型",
            "该技能击败敌人时 10% 几率爆炸，对半径 5 米内的敌人造成被击败的敌人最大生命 25% 的真实伤害",
            "该技能发射的投射物可以命中同一个敌人",
            "该技能的霰弹效应衰减系数为 70%"
          ],
          "parsed_values": {
            "base_damage": 84.6,
            "mana_cost": 8,
            "release_interval_ms": 650
          },
          "anchors": {
            "base_damage": {
              "1": 84.6
            }
          }
        },
        "level_values": {
          "base_damage": 84.6,
          "mana_cost": 8,
          "release_interval_ms": 650
        },
        "auto_release": {
          "policy": "nearest_enemy",
          "notes": [
            "??????????TLIDB ???? Lv20 ???"
          ]
        }
      },
      "tooltip_view": {
        "variant": "active",
        "icon_text": "五",
        "icon_color_key": "red",
        "icon_sprite": "",
        "name_text": "五彩魔矢",
        "subtitle_text": "红色、宝石、法术、火焰、冰霜、闪电、投射物、范围",
        "type_identity_text": "",
        "tags": [
          {
            "id": "gem",
            "text": "宝石"
          },
          {
            "id": "spell",
            "text": "法术"
          },
          {
            "id": "fire",
            "text": "火焰"
          },
          {
            "id": "cold",
            "text": "冰霜"
          },
          {
            "id": "lightning",
            "text": "闪电"
          },
          {
            "id": "projectile",
            "text": "投射物"
          },
          {
            "id": "area",
            "text": "范围"
          }
        ],
        "sections": {
          "description": {
            "title_text": "描述",
            "lines": [
              "发射会追踪敌人的五彩魔矢，释放时随机选择火焰、冰霜或闪电形态；多个投射物可以命中同一敌人，击败敌人时可能引发爆炸。"
            ]
          },
          "stats": {
            "title_text": "核心数值",
            "lines": [
              {
                "label_text": "等级",
                "value_text": "1"
              },
              {
                "label_text": "法术伤害",
                "value_text": "84.6"
              },
              {
                "label_text": "魔力消耗",
                "value_text": "8"
              }
            ]
          },
          "recent_dps": {
            "title_text": "近期 DPS",
            "lines": []
          },
          "base_skill_level": {
            "lines": [
              "基础技能等级为 1"
            ]
          },
          "tlidb_source": {
            "title_text": "TLIDB 源数值",
            "lines": [
              "TLIDB ID: Chromatic_Shot",
              "Lv20 source card",
              "Source: base_damage=84.6, mana_cost=8, release_interval_ms=650"
            ]
          },
          "tlidb_level": {
            "title_text": "等级表",
            "lines": [
              "base_damage=84.6, mana_cost=8, release_interval_ms=650"
            ]
          },
          "auto_release": {
            "title_text": "自动释放适配",
            "lines": [
              "policy: nearest_enemy",
              "??????????TLIDB ???? Lv20 ???"
            ]
          },
          "bonuses": {
            "title_text": "当前加成",
            "lines": [
              "同数独数字宝石不能位于同一行、列或宫格"
            ]
          }
        }
      }
    },
    {
      "instance_id": "web_seed_active_4_active_whirlwind",
      "name_text": "旋风斩",
      "description_text": "以自身为中心持续旋转挥击，覆盖周围区域。",
      "category_text": "主动技能宝石",
      "gem_type": {
        "id": "gem_type_1",
        "number": 1,
        "display_text": "1号宝石",
        "identity_text": "一号主动技能身份",
        "color_key": "red"
      },
      "gem_kind": "active_skill",
      "gem_kind_text": "主动技能宝石",
      "sudoku_digit": 1,
      "rarity_text": "普通",
      "level": 1,
      "locked": false,
      "board_position": null,
      "tags": [
        {
          "id": "active_skill_gem",
          "text": "主动技能宝石"
        },
        {
          "id": "area",
          "text": "范围"
        },
        {
          "id": "attack",
          "text": "攻击"
        },
        {
          "id": "channel",
          "text": "引导"
        },
        {
          "id": "gem",
          "text": "宝石"
        },
        {
          "id": "gem_type_1",
          "text": "1号宝石"
        },
        {
          "id": "loot_gem",
          "text": "可掉落宝石"
        },
        {
          "id": "melee",
          "text": "近战"
        },
        {
          "id": "physical",
          "text": "物理"
        },
        {
          "id": "skill_whirlwind",
          "text": "旋风斩"
        }
      ],
      "base_effect": {
        "title_text": "技能基础效果",
        "template_text": "旋风斩",
        "damage_type_text": "物理",
        "base_damage": 8.3,
        "base_release_interval_ms": 1000,
        "base_cooldown_ms": 0,
        "trigger_interval_ms": 500,
        "mana_cost": 5,
        "scaling_stats": [
          {
            "id": "damage_add_percent",
            "text": "伤害提高"
          },
          {
            "id": "physical_damage_add_percent",
            "text": "物理伤害提高"
          },
          {
            "id": "attack_speed_add_percent",
            "text": "攻击速度提高"
          },
          {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          {
            "id": "skill_speed_final_percent",
            "text": "最终技能速度"
          },
          {
            "id": "projectile_speed_add_percent",
            "text": "投射物速度提高"
          },
          {
            "id": "projectile_count_add",
            "text": "投射物数量增加"
          },
          {
            "id": "chain_count_add",
            "text": "连锁次数增加"
          },
          {
            "id": "pierce_count_add",
            "text": "穿透次数增加"
          },
          {
            "id": "area_add_percent",
            "text": "范围提高"
          },
          {
            "id": "channel_max_stacks_add",
            "text": "未配置文案：stat.channel_max_stacks_add.name"
          },
          {
            "id": "channel_min_stacks_add",
            "text": "引导层数下限"
          },
          {
            "id": "channel_time_per_stack_ms_reduction_percent",
            "text": "未配置文案：stat.channel_time_per_stack_ms_reduction_percent.name"
          }
        ]
      },
      "can_affect": {
        "summary_text": "影响自身技能",
        "tags_any": [],
        "tags_all": [],
        "tags_none": []
      },
      "current_effective_targets": [
        {
          "instance_id": "",
          "name_text": "当前盘面暂无实际生效对象",
          "status_text": "当前盘面暂无实际生效对象"
        }
      ],
      "board_relations": [],
      "visual_effect": "skill_event.whirlwind.vfx",
      "shape_effect": "",
      "shape_effect_text": "",
      "tlidb": {
        "source_values": {
          "source": "tlidb",
          "tlidb_id": "Whirlwind",
          "display_level": 20,
          "raw_lines": [
            "引导该技能时不断对自身一定范围内的敌人造成 83% 武器攻击伤害。",
            "引导层数达到上限时，失去所有引导层数并有几率释放斩击，对大范围敌人造成 138% 武器攻击伤害，几率等同于斩击几率。",
            "引导该技能时可以移动。",
            "挥击：",
            "造成 83% 武器攻击伤害",
            "斩击：",
            "造成 138% 武器攻击伤害",
            "该技能额外 +100% 攻击速度",
            "该技能 +20% 斩击几率",
            "该技能引导时， -30% 移动速度",
            "该技能引导时可以移动",
            "引导层数最多 5 层"
          ],
          "parsed_values": {
            "base_damage": 83,
            "mana_cost": 5,
            "release_interval_ms": 1000
          },
          "anchors": {
            "base_damage": {
              "20": 83
            }
          }
        },
        "level_values": {
          "base_damage": 8.3,
          "mana_cost": 5,
          "release_interval_ms": 1000
        },
        "auto_release": {
          "policy": "duration_window",
          "notes": [
            "??????????TLIDB ???? Lv20 ???"
          ]
        }
      },
      "tooltip_view": {
        "variant": "active",
        "icon_text": "旋",
        "icon_color_key": "red",
        "icon_sprite": "",
        "name_text": "旋风斩",
        "subtitle_text": "红色、宝石、近战、攻击、物理、范围、引导",
        "type_identity_text": "",
        "tags": [
          {
            "id": "gem",
            "text": "宝石"
          },
          {
            "id": "melee",
            "text": "近战"
          },
          {
            "id": "attack",
            "text": "攻击"
          },
          {
            "id": "physical",
            "text": "物理"
          },
          {
            "id": "area",
            "text": "范围"
          },
          {
            "id": "channel",
            "text": "引导"
          }
        ],
        "sections": {
          "description": {
            "title_text": "描述",
            "lines": [
              "以自身为中心持续旋转挥击，覆盖周围区域。"
            ]
          },
          "stats": {
            "title_text": "核心数值",
            "lines": [
              {
                "label_text": "等级",
                "value_text": "1"
              },
              {
                "label_text": "攻击伤害",
                "value_text": "8.3"
              },
              {
                "label_text": "魔力消耗",
                "value_text": "5"
              }
            ]
          },
          "recent_dps": {
            "title_text": "近期 DPS",
            "lines": []
          },
          "base_skill_level": {
            "lines": [
              "基础技能等级为 1"
            ]
          },
          "tlidb_source": {
            "title_text": "TLIDB 源数值",
            "lines": [
              "TLIDB ID: Whirlwind",
              "Lv20 source card",
              "Source: base_damage=83, mana_cost=5, release_interval_ms=1000"
            ]
          },
          "tlidb_level": {
            "title_text": "等级表",
            "lines": [
              "base_damage=8.3, mana_cost=5, release_interval_ms=1000"
            ]
          },
          "auto_release": {
            "title_text": "自动释放适配",
            "lines": [
              "policy: duration_window",
              "??????????TLIDB ???? Lv20 ???"
            ]
          },
          "bonuses": {
            "title_text": "当前加成",
            "lines": [
              "同数独数字宝石不能位于同一行、列或宫格"
            ]
          }
        }
      }
    },
    {
      "instance_id": "web_seed_active_5_active_stoneskin",
      "name_text": "石肤术",
      "description_text": "释放后获得短暂防护，用于承受直接打击。",
      "category_text": "主动技能宝石",
      "gem_type": {
        "id": "gem_type_1",
        "number": 1,
        "display_text": "1号宝石",
        "identity_text": "一号主动技能身份",
        "color_key": "red"
      },
      "gem_kind": "active_skill",
      "gem_kind_text": "主动技能宝石",
      "sudoku_digit": 1,
      "rarity_text": "普通",
      "level": 1,
      "locked": false,
      "board_position": null,
      "tags": [
        {
          "id": "active_skill_gem",
          "text": "主动技能宝石"
        },
        {
          "id": "gem",
          "text": "宝石"
        },
        {
          "id": "gem_type_1",
          "text": "1号宝石"
        },
        {
          "id": "guard",
          "text": "守护"
        },
        {
          "id": "loot_gem",
          "text": "可掉落宝石"
        },
        {
          "id": "skill_stoneskin",
          "text": "石肤术"
        },
        {
          "id": "spell",
          "text": "法术"
        }
      ],
      "base_effect": {
        "title_text": "技能基础效果",
        "template_text": "石肤术",
        "damage_type_text": "物理",
        "base_damage": 0,
        "base_release_interval_ms": 1000,
        "base_cooldown_ms": 6000,
        "trigger_interval_ms": 0,
        "mana_cost": 15,
        "scaling_stats": [
          {
            "id": "damage_add_percent",
            "text": "伤害提高"
          },
          {
            "id": "physical_damage_add_percent",
            "text": "物理伤害提高"
          },
          {
            "id": "cast_speed_add_percent",
            "text": "施法速度提高"
          },
          {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          {
            "id": "skill_speed_final_percent",
            "text": "最终技能速度"
          },
          {
            "id": "projectile_speed_add_percent",
            "text": "投射物速度提高"
          },
          {
            "id": "projectile_count_add",
            "text": "投射物数量增加"
          },
          {
            "id": "chain_count_add",
            "text": "连锁次数增加"
          },
          {
            "id": "pierce_count_add",
            "text": "穿透次数增加"
          }
        ]
      },
      "can_affect": {
        "summary_text": "影响自身技能",
        "tags_any": [],
        "tags_all": [],
        "tags_none": []
      },
      "current_effective_targets": [
        {
          "instance_id": "",
          "name_text": "当前盘面暂无实际生效对象",
          "status_text": "当前盘面暂无实际生效对象"
        }
      ],
      "board_relations": [],
      "visual_effect": "skill_event.stoneskin.vfx",
      "shape_effect": "",
      "shape_effect_text": "",
      "tlidb": {
        "source_values": {
          "source": "tlidb",
          "tlidb_id": "Stoneskin",
          "display_level": 20,
          "raw_lines": [
            "释放该技能获得防护：吸收 吸收70%受到的伤害，无法吸收持续伤害",
            "共吸收1500点伤害 自身受到的伤害，最多吸收 吸收70%受到的伤害，无法吸收持续伤害",
            "共吸收1500点伤害 点，持续 6 秒。",
            "释放该技能获得防护：吸收 吸收70%受到的伤害，无法吸收持续伤害",
            "共吸收1500点伤害 自身受到的伤害",
            "最多吸收 吸收70%受到的伤害，无法吸收持续伤害",
            "共吸收1500点伤害 点",
            "持续 6 秒"
          ],
          "parsed_values": {
            "base_damage": 0,
            "mana_cost": 15,
            "release_interval_ms": 1000
          },
          "anchors": {
            "base_damage": {
              "20": 0
            }
          }
        },
        "level_values": {
          "base_damage": 0,
          "mana_cost": 15,
          "release_interval_ms": 1000
        },
        "auto_release": {
          "policy": "defensive_threshold",
          "notes": [
            "??????????TLIDB ???? Lv20 ???"
          ]
        }
      },
      "tooltip_view": {
        "variant": "active",
        "icon_text": "石",
        "icon_color_key": "red",
        "icon_sprite": "",
        "name_text": "石肤术",
        "subtitle_text": "红色、宝石、法术、守护",
        "type_identity_text": "",
        "tags": [
          {
            "id": "gem",
            "text": "宝石"
          },
          {
            "id": "spell",
            "text": "法术"
          },
          {
            "id": "guard",
            "text": "守护"
          }
        ],
        "sections": {
          "description": {
            "title_text": "描述",
            "lines": [
              "释放后获得短暂防护，用于承受直接打击。"
            ]
          },
          "stats": {
            "title_text": "核心数值",
            "lines": [
              {
                "label_text": "等级",
                "value_text": "1"
              },
              {
                "label_text": "冷却",
                "value_text": "6000 毫秒"
              },
              {
                "label_text": "魔力消耗",
                "value_text": "15"
              }
            ]
          },
          "recent_dps": {
            "title_text": "近期 DPS",
            "lines": []
          },
          "base_skill_level": {
            "lines": [
              "基础技能等级为 1"
            ]
          },
          "tlidb_source": {
            "title_text": "TLIDB 源数值",
            "lines": [
              "TLIDB ID: Stoneskin",
              "Lv20 source card",
              "Source: base_damage=0, mana_cost=15, release_interval_ms=1000"
            ]
          },
          "tlidb_level": {
            "title_text": "等级表",
            "lines": [
              "base_damage=0, mana_cost=15, release_interval_ms=1000"
            ]
          },
          "auto_release": {
            "title_text": "自动释放适配",
            "lines": [
              "policy: defensive_threshold",
              "??????????TLIDB ???? Lv20 ???"
            ]
          },
          "bonuses": {
            "title_text": "当前加成",
            "lines": [
              "同数独数字宝石不能位于同一行、列或宫格"
            ]
          }
        }
      }
    },
    {
      "instance_id": "web_seed_active_6_active_thundercloud",
      "name_text": "雷云放射",
      "description_text": "在自身上方凝聚雷云，雷云会持续锁定附近敌人并降下雷击。",
      "category_text": "主动技能宝石",
      "gem_type": {
        "id": "gem_type_1",
        "number": 1,
        "display_text": "1号宝石",
        "identity_text": "一号主动技能身份",
        "color_key": "red"
      },
      "gem_kind": "active_skill",
      "gem_kind_text": "主动技能宝石",
      "sudoku_digit": 1,
      "rarity_text": "普通",
      "level": 1,
      "locked": false,
      "board_position": null,
      "tags": [
        {
          "id": "active_skill_gem",
          "text": "主动技能宝石"
        },
        {
          "id": "area",
          "text": "范围"
        },
        {
          "id": "channel",
          "text": "引导"
        },
        {
          "id": "gem",
          "text": "宝石"
        },
        {
          "id": "gem_type_1",
          "text": "1号宝石"
        },
        {
          "id": "lightning",
          "text": "闪电"
        },
        {
          "id": "loot_gem",
          "text": "可掉落宝石"
        },
        {
          "id": "skill_thundercloud",
          "text": "雷云放射"
        },
        {
          "id": "spell",
          "text": "法术"
        }
      ],
      "base_effect": {
        "title_text": "技能基础效果",
        "template_text": "雷云放射",
        "damage_type_text": "闪电",
        "base_damage": 35.9,
        "base_release_interval_ms": 333,
        "base_cooldown_ms": 0,
        "trigger_interval_ms": 500,
        "mana_cost": 8,
        "scaling_stats": [
          {
            "id": "damage_add_percent",
            "text": "伤害提高"
          },
          {
            "id": "lightning_damage_add_percent",
            "text": "闪电伤害提高"
          },
          {
            "id": "cast_speed_add_percent",
            "text": "施法速度提高"
          },
          {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          {
            "id": "skill_speed_final_percent",
            "text": "最终技能速度"
          },
          {
            "id": "projectile_speed_add_percent",
            "text": "投射物速度提高"
          },
          {
            "id": "projectile_count_add",
            "text": "投射物数量增加"
          },
          {
            "id": "chain_count_add",
            "text": "连锁次数增加"
          },
          {
            "id": "pierce_count_add",
            "text": "穿透次数增加"
          },
          {
            "id": "area_add_percent",
            "text": "范围提高"
          },
          {
            "id": "channel_max_stacks_add",
            "text": "未配置文案：stat.channel_max_stacks_add.name"
          },
          {
            "id": "channel_min_stacks_add",
            "text": "引导层数下限"
          },
          {
            "id": "channel_time_per_stack_ms_reduction_percent",
            "text": "未配置文案：stat.channel_time_per_stack_ms_reduction_percent.name"
          }
        ]
      },
      "can_affect": {
        "summary_text": "影响自身技能",
        "tags_any": [],
        "tags_all": [],
        "tags_none": []
      },
      "current_effective_targets": [
        {
          "instance_id": "",
          "name_text": "当前盘面暂无实际生效对象",
          "status_text": "当前盘面暂无实际生效对象"
        }
      ],
      "board_relations": [],
      "visual_effect": "skill_event.thundercloud.vfx",
      "shape_effect": "",
      "shape_effect_text": "",
      "tlidb": {
        "source_values": {
          "source": "tlidb",
          "tlidb_id": "Thundercloud",
          "display_level": 20,
          "raw_lines": [
            "引导该技能时在自身上方凝聚出一朵雷云，一段时间内持续打击一定范围内的敌人，每次造成 36-682 法术闪电伤害。",
            "引导层数使该技能的雷云持续时间增长，打击频率提高。",
            "雷云：",
            "造成 36-682 法术闪电伤害",
            "引导层数最多 5 层",
            "每层引导层数使雷云的持续时间 +2.5 秒",
            "雷云最多选择 3 个敌人作为目标",
            "该技能 +1 弹射次数",
            "雷云打击频率在 9 层引导层数时达到最快"
          ],
          "parsed_values": {
            "base_damage": 359,
            "mana_cost": 8,
            "release_interval_ms": 333
          },
          "anchors": {
            "base_damage": {
              "20": 359
            }
          }
        },
        "level_values": {
          "base_damage": 35.9,
          "mana_cost": 8,
          "release_interval_ms": 333
        },
        "auto_release": {
          "policy": "duration_window",
          "notes": [
            "??????????TLIDB ???? Lv20 ???"
          ]
        }
      },
      "tooltip_view": {
        "variant": "active",
        "icon_text": "雷",
        "icon_color_key": "red",
        "icon_sprite": "",
        "name_text": "雷云放射",
        "subtitle_text": "红色、宝石、法术、闪电、范围、引导",
        "type_identity_text": "",
        "tags": [
          {
            "id": "gem",
            "text": "宝石"
          },
          {
            "id": "spell",
            "text": "法术"
          },
          {
            "id": "lightning",
            "text": "闪电"
          },
          {
            "id": "area",
            "text": "范围"
          },
          {
            "id": "channel",
            "text": "引导"
          }
        ],
        "sections": {
          "description": {
            "title_text": "描述",
            "lines": [
              "在自身上方凝聚雷云，雷云会持续锁定附近敌人并降下雷击。"
            ]
          },
          "stats": {
            "title_text": "核心数值",
            "lines": [
              {
                "label_text": "等级",
                "value_text": "1"
              },
              {
                "label_text": "法术伤害",
                "value_text": "35.9"
              },
              {
                "label_text": "魔力消耗",
                "value_text": "8"
              }
            ]
          },
          "recent_dps": {
            "title_text": "近期 DPS",
            "lines": []
          },
          "base_skill_level": {
            "lines": [
              "基础技能等级为 1"
            ]
          },
          "tlidb_source": {
            "title_text": "TLIDB 源数值",
            "lines": [
              "TLIDB ID: Thundercloud",
              "Lv20 source card",
              "Source: base_damage=359, mana_cost=8, release_interval_ms=333"
            ]
          },
          "tlidb_level": {
            "title_text": "等级表",
            "lines": [
              "base_damage=35.9, mana_cost=8, release_interval_ms=333"
            ]
          },
          "auto_release": {
            "title_text": "自动释放适配",
            "lines": [
              "policy: duration_window",
              "??????????TLIDB ???? Lv20 ???"
            ]
          },
          "bonuses": {
            "title_text": "当前加成",
            "lines": [
              "同数独数字宝石不能位于同一行、列或宫格"
            ]
          }
        }
      }
    },
    {
      "instance_id": "web_seed_active_7_active_blizzard",
      "name_text": "暴风雪",
      "description_text": "在目标区域召唤多波暴风雪落点，持续打击范围内敌人。",
      "category_text": "主动技能宝石",
      "gem_type": {
        "id": "gem_type_1",
        "number": 1,
        "display_text": "1号宝石",
        "identity_text": "一号主动技能身份",
        "color_key": "red"
      },
      "gem_kind": "active_skill",
      "gem_kind_text": "主动技能宝石",
      "sudoku_digit": 1,
      "rarity_text": "普通",
      "level": 1,
      "locked": false,
      "board_position": null,
      "tags": [
        {
          "id": "active_skill_gem",
          "text": "主动技能宝石"
        },
        {
          "id": "area",
          "text": "范围"
        },
        {
          "id": "bombardment",
          "text": "轰炸"
        },
        {
          "id": "cold",
          "text": "冰霜"
        },
        {
          "id": "gem",
          "text": "宝石"
        },
        {
          "id": "gem_type_1",
          "text": "1号宝石"
        },
        {
          "id": "intelligence",
          "text": "智慧"
        },
        {
          "id": "loot_gem",
          "text": "可掉落宝石"
        },
        {
          "id": "skill_blizzard",
          "text": "暴风雪"
        },
        {
          "id": "spell",
          "text": "法术"
        }
      ],
      "base_effect": {
        "title_text": "技能基础效果",
        "template_text": "暴风雪",
        "damage_type_text": "冰霜",
        "base_damage": 3.5,
        "base_release_interval_ms": 900,
        "base_cooldown_ms": 2000,
        "trigger_interval_ms": 0,
        "mana_cost": 8,
        "scaling_stats": [
          {
            "id": "damage_add_percent",
            "text": "伤害提高"
          },
          {
            "id": "cold_damage_add_percent",
            "text": "冰霜伤害提高"
          },
          {
            "id": "cast_speed_add_percent",
            "text": "施法速度提高"
          },
          {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          {
            "id": "skill_speed_final_percent",
            "text": "最终技能速度"
          },
          {
            "id": "projectile_speed_add_percent",
            "text": "投射物速度提高"
          },
          {
            "id": "projectile_count_add",
            "text": "投射物数量增加"
          },
          {
            "id": "chain_count_add",
            "text": "连锁次数增加"
          },
          {
            "id": "pierce_count_add",
            "text": "穿透次数增加"
          },
          {
            "id": "area_add_percent",
            "text": "范围提高"
          }
        ]
      },
      "can_affect": {
        "summary_text": "影响自身技能",
        "tags_any": [],
        "tags_all": [],
        "tags_none": []
      },
      "current_effective_targets": [
        {
          "instance_id": "",
          "name_text": "当前盘面暂无实际生效对象",
          "status_text": "当前盘面暂无实际生效对象"
        }
      ],
      "board_relations": [],
      "visual_effect": "skill_event.blizzard.vfx",
      "shape_effect": "",
      "shape_effect_text": "",
      "tlidb": {
        "source_values": {
          "source": "tlidb",
          "tlidb_id": "Blizzard",
          "display_level": 20,
          "raw_lines": [
            "释放该技能在指定位置落下 3 波暴风雪，造成 203-303 法术冰霜伤害。",
            "该技能击中时对敌人施加减益：额外 10% 受到的冰霜伤害，持续 6 秒。",
            "暴风雪：",
            "造成 203-303 法术冰霜伤害",
            "基础落下 1 波暴风雪",
            "该技能 +2 总波次",
            "额外 +10% 受到的冰霜伤害"
          ],
          "parsed_values": {
            "base_damage": 3.5,
            "level_20_base_damage": 253,
            "added_damage_effectiveness_percent": 47,
            "mana_cost": 8,
            "release_interval_ms": 900
          },
          "anchors": {
            "base_damage": {
              "1": 3.5,
              "20": 253
            }
          }
        },
        "level_values": {
          "base_damage": 3.5,
          "mana_cost": 8,
          "release_interval_ms": 900
        },
        "auto_release": {
          "policy": "target_cluster",
          "notes": [
            "??????????TLIDB ???? Lv20 ???"
          ]
        }
      },
      "tooltip_view": {
        "variant": "active",
        "icon_text": "暴",
        "icon_color_key": "red",
        "icon_sprite": "",
        "name_text": "暴风雪",
        "subtitle_text": "红色、宝石、法术、冰霜、范围、轰炸、智慧",
        "type_identity_text": "",
        "tags": [
          {
            "id": "gem",
            "text": "宝石"
          },
          {
            "id": "spell",
            "text": "法术"
          },
          {
            "id": "cold",
            "text": "冰霜"
          },
          {
            "id": "area",
            "text": "范围"
          },
          {
            "id": "bombardment",
            "text": "轰炸"
          },
          {
            "id": "intelligence",
            "text": "智慧"
          }
        ],
        "sections": {
          "description": {
            "title_text": "描述",
            "lines": [
              "在目标区域召唤多波暴风雪落点，持续打击范围内敌人。"
            ]
          },
          "stats": {
            "title_text": "核心数值",
            "lines": [
              {
                "label_text": "等级",
                "value_text": "1"
              },
              {
                "label_text": "法术伤害",
                "value_text": "3.5"
              },
              {
                "label_text": "冷却",
                "value_text": "2000 毫秒"
              },
              {
                "label_text": "魔力消耗",
                "value_text": "8"
              }
            ]
          },
          "recent_dps": {
            "title_text": "近期 DPS",
            "lines": []
          },
          "base_skill_level": {
            "lines": [
              "基础技能等级为 1"
            ]
          },
          "tlidb_source": {
            "title_text": "TLIDB 源数值",
            "lines": [
              "TLIDB ID: Blizzard",
              "Lv20 source card",
              "Source: added_damage_effectiveness_percent=47, base_damage=3.5, level_20_base_damage=253, mana_cost=8, release_interval_ms=900"
            ]
          },
          "tlidb_level": {
            "title_text": "等级表",
            "lines": [
              "base_damage=3.5, mana_cost=8, release_interval_ms=900"
            ]
          },
          "auto_release": {
            "title_text": "自动释放适配",
            "lines": [
              "policy: target_cluster",
              "??????????TLIDB ???? Lv20 ???"
            ]
          },
          "bonuses": {
            "title_text": "当前加成",
            "lines": [
              "同数独数字宝石不能位于同一行、列或宫格"
            ]
          }
        }
      }
    },
    {
      "instance_id": "web_seed_active_8_active_chain_lightning",
      "name_text": "闪电链",
      "description_text": "向敌人释放闪电链，闪电会在附近目标之间弹射。",
      "category_text": "主动技能宝石",
      "gem_type": {
        "id": "gem_type_1",
        "number": 1,
        "display_text": "1号宝石",
        "identity_text": "一号主动技能身份",
        "color_key": "red"
      },
      "gem_kind": "active_skill",
      "gem_kind_text": "主动技能宝石",
      "sudoku_digit": 1,
      "rarity_text": "普通",
      "level": 1,
      "locked": false,
      "board_position": null,
      "tags": [
        {
          "id": "active_skill_gem",
          "text": "主动技能宝石"
        },
        {
          "id": "chain",
          "text": "连锁"
        },
        {
          "id": "gem",
          "text": "宝石"
        },
        {
          "id": "gem_type_1",
          "text": "1号宝石"
        },
        {
          "id": "lightning",
          "text": "闪电"
        },
        {
          "id": "loot_gem",
          "text": "可掉落宝石"
        },
        {
          "id": "skill_chain_lightning",
          "text": "闪电链"
        },
        {
          "id": "spell",
          "text": "法术"
        }
      ],
      "base_effect": {
        "title_text": "技能基础效果",
        "template_text": "闪电链",
        "damage_type_text": "闪电",
        "base_damage": 73.3,
        "base_release_interval_ms": 650,
        "base_cooldown_ms": 0,
        "trigger_interval_ms": 0,
        "mana_cost": 8,
        "scaling_stats": [
          {
            "id": "damage_add_percent",
            "text": "伤害提高"
          },
          {
            "id": "lightning_damage_add_percent",
            "text": "闪电伤害提高"
          },
          {
            "id": "cast_speed_add_percent",
            "text": "施法速度提高"
          },
          {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          {
            "id": "skill_speed_final_percent",
            "text": "最终技能速度"
          },
          {
            "id": "projectile_speed_add_percent",
            "text": "投射物速度提高"
          },
          {
            "id": "projectile_count_add",
            "text": "投射物数量增加"
          },
          {
            "id": "chain_count_add",
            "text": "连锁次数增加"
          },
          {
            "id": "pierce_count_add",
            "text": "穿透次数增加"
          },
          {
            "id": "area_add_percent",
            "text": "范围提高"
          }
        ]
      },
      "can_affect": {
        "summary_text": "影响自身技能",
        "tags_any": [],
        "tags_all": [],
        "tags_none": []
      },
      "current_effective_targets": [
        {
          "instance_id": "",
          "name_text": "当前盘面暂无实际生效对象",
          "status_text": "当前盘面暂无实际生效对象"
        }
      ],
      "board_relations": [],
      "visual_effect": "skill_event.chain_lightning.vfx",
      "shape_effect": "",
      "shape_effect_text": "",
      "tlidb": {
        "source_values": {
          "source": "tlidb",
          "tlidb_id": "Chain_Lightning",
          "display_level": 20,
          "raw_lines": [
            "释放该技能向敌人发射一道闪电链，造成 73-1393 法术闪电伤害。闪电链可以弹射 2 次。",
            "闪电链：",
            "造成 73-1393 法术闪电伤害",
            "该技能 +2 弹射次数"
          ],
          "parsed_values": {
            "base_damage": 733,
            "mana_cost": 8,
            "release_interval_ms": 650
          },
          "anchors": {
            "base_damage": {
              "20": 733
            }
          }
        },
        "level_values": {
          "base_damage": 73.3,
          "mana_cost": 8,
          "release_interval_ms": 650
        },
        "auto_release": {
          "policy": "nearest_enemy",
          "notes": [
            "??????????TLIDB ???? Lv20 ???"
          ]
        }
      },
      "tooltip_view": {
        "variant": "active",
        "icon_text": "闪",
        "icon_color_key": "red",
        "icon_sprite": "",
        "name_text": "闪电链",
        "subtitle_text": "红色、宝石、法术、闪电、连锁",
        "type_identity_text": "",
        "tags": [
          {
            "id": "gem",
            "text": "宝石"
          },
          {
            "id": "spell",
            "text": "法术"
          },
          {
            "id": "lightning",
            "text": "闪电"
          },
          {
            "id": "chain",
            "text": "连锁"
          }
        ],
        "sections": {
          "description": {
            "title_text": "描述",
            "lines": [
              "向敌人释放闪电链，闪电会在附近目标之间弹射。"
            ]
          },
          "stats": {
            "title_text": "核心数值",
            "lines": [
              {
                "label_text": "等级",
                "value_text": "1"
              },
              {
                "label_text": "法术伤害",
                "value_text": "73.3"
              },
              {
                "label_text": "魔力消耗",
                "value_text": "8"
              }
            ]
          },
          "recent_dps": {
            "title_text": "近期 DPS",
            "lines": []
          },
          "base_skill_level": {
            "lines": [
              "基础技能等级为 1"
            ]
          },
          "tlidb_source": {
            "title_text": "TLIDB 源数值",
            "lines": [
              "TLIDB ID: Chain_Lightning",
              "Lv20 source card",
              "Source: base_damage=733, mana_cost=8, release_interval_ms=650"
            ]
          },
          "tlidb_level": {
            "title_text": "等级表",
            "lines": [
              "base_damage=73.3, mana_cost=8, release_interval_ms=650"
            ]
          },
          "auto_release": {
            "title_text": "自动释放适配",
            "lines": [
              "policy: nearest_enemy",
              "??????????TLIDB ???? Lv20 ???"
            ]
          },
          "bonuses": {
            "title_text": "当前加成",
            "lines": [
              "同数独数字宝石不能位于同一行、列或宫格"
            ]
          }
        }
      }
    },
    {
      "instance_id": "web_seed_active_9_active_ring_of_ice",
      "name_text": "冰环术",
      "description_text": "以自身为中心形成冰环；击败敌人时可能在敌人位置再次触发冰环。",
      "category_text": "主动技能宝石",
      "gem_type": {
        "id": "gem_type_1",
        "number": 1,
        "display_text": "1号宝石",
        "identity_text": "一号主动技能身份",
        "color_key": "red"
      },
      "gem_kind": "active_skill",
      "gem_kind_text": "主动技能宝石",
      "sudoku_digit": 1,
      "rarity_text": "普通",
      "level": 1,
      "locked": false,
      "board_position": null,
      "tags": [
        {
          "id": "active_skill_gem",
          "text": "主动技能宝石"
        },
        {
          "id": "area",
          "text": "范围"
        },
        {
          "id": "cold",
          "text": "冰霜"
        },
        {
          "id": "gem",
          "text": "宝石"
        },
        {
          "id": "gem_type_1",
          "text": "1号宝石"
        },
        {
          "id": "loot_gem",
          "text": "可掉落宝石"
        },
        {
          "id": "nova",
          "text": "环形爆发"
        },
        {
          "id": "skill_ring_of_ice",
          "text": "冰环术"
        },
        {
          "id": "spell",
          "text": "法术"
        }
      ],
      "base_effect": {
        "title_text": "技能基础效果",
        "template_text": "冰环术",
        "damage_type_text": "冰霜",
        "base_damage": 76.5,
        "base_release_interval_ms": 800,
        "base_cooldown_ms": 0,
        "trigger_interval_ms": 0,
        "mana_cost": 8,
        "scaling_stats": [
          {
            "id": "damage_add_percent",
            "text": "伤害提高"
          },
          {
            "id": "cold_damage_add_percent",
            "text": "冰霜伤害提高"
          },
          {
            "id": "cast_speed_add_percent",
            "text": "施法速度提高"
          },
          {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          {
            "id": "skill_speed_final_percent",
            "text": "最终技能速度"
          },
          {
            "id": "projectile_speed_add_percent",
            "text": "投射物速度提高"
          },
          {
            "id": "projectile_count_add",
            "text": "投射物数量增加"
          },
          {
            "id": "chain_count_add",
            "text": "连锁次数增加"
          },
          {
            "id": "pierce_count_add",
            "text": "穿透次数增加"
          },
          {
            "id": "area_add_percent",
            "text": "范围提高"
          }
        ]
      },
      "can_affect": {
        "summary_text": "影响自身技能",
        "tags_any": [],
        "tags_all": [],
        "tags_none": []
      },
      "current_effective_targets": [
        {
          "instance_id": "",
          "name_text": "当前盘面暂无实际生效对象",
          "status_text": "当前盘面暂无实际生效对象"
        }
      ],
      "board_relations": [],
      "visual_effect": "skill_event.ring_of_ice.vfx",
      "shape_effect": "",
      "shape_effect_text": "",
      "tlidb": {
        "source_values": {
          "source": "tlidb",
          "tlidb_id": "Ring_of_Ice",
          "display_level": 20,
          "raw_lines": [
            "释放该技能在自身一定范围内形成一圈冰环，造成 612-918 法术冰霜伤害。",
            "该技能击败敌人时，有 20% 几率在该敌人位置再次触发一圈冰环。每圈冰环只能触发一次该效果。",
            "冰环：",
            "造成 612-918 法术冰霜伤害",
            "该技能击败敌人时， +20% 几率在敌人的位置再次触发该技能；每圈冰环只能触发一次该效果"
          ],
          "parsed_values": {
            "base_damage": 765,
            "mana_cost": 8,
            "release_interval_ms": 800
          },
          "anchors": {
            "base_damage": {
              "20": 765
            }
          }
        },
        "level_values": {
          "base_damage": 76.5,
          "mana_cost": 8,
          "release_interval_ms": 800
        },
        "auto_release": {
          "policy": "self_center",
          "notes": [
            "??????????TLIDB ???? Lv20 ???"
          ]
        }
      },
      "tooltip_view": {
        "variant": "active",
        "icon_text": "冰",
        "icon_color_key": "red",
        "icon_sprite": "",
        "name_text": "冰环术",
        "subtitle_text": "红色、宝石、法术、冰霜、范围、环形爆发",
        "type_identity_text": "",
        "tags": [
          {
            "id": "gem",
            "text": "宝石"
          },
          {
            "id": "spell",
            "text": "法术"
          },
          {
            "id": "cold",
            "text": "冰霜"
          },
          {
            "id": "area",
            "text": "范围"
          },
          {
            "id": "nova",
            "text": "环形爆发"
          }
        ],
        "sections": {
          "description": {
            "title_text": "描述",
            "lines": [
              "以自身为中心形成冰环；击败敌人时可能在敌人位置再次触发冰环。"
            ]
          },
          "stats": {
            "title_text": "核心数值",
            "lines": [
              {
                "label_text": "等级",
                "value_text": "1"
              },
              {
                "label_text": "法术伤害",
                "value_text": "76.5"
              },
              {
                "label_text": "魔力消耗",
                "value_text": "8"
              }
            ]
          },
          "recent_dps": {
            "title_text": "近期 DPS",
            "lines": []
          },
          "base_skill_level": {
            "lines": [
              "基础技能等级为 1"
            ]
          },
          "tlidb_source": {
            "title_text": "TLIDB 源数值",
            "lines": [
              "TLIDB ID: Ring_of_Ice",
              "Lv20 source card",
              "Source: base_damage=765, mana_cost=8, release_interval_ms=800"
            ]
          },
          "tlidb_level": {
            "title_text": "等级表",
            "lines": [
              "base_damage=76.5, mana_cost=8, release_interval_ms=800"
            ]
          },
          "auto_release": {
            "title_text": "自动释放适配",
            "lines": [
              "policy: self_center",
              "??????????TLIDB ???? Lv20 ???"
            ]
          },
          "bonuses": {
            "title_text": "当前加成",
            "lines": [
              "同数独数字宝石不能位于同一行、列或宫格"
            ]
          }
        }
      }
    },
    {
      "instance_id": "web_seed_active_10_active_flame_slash",
      "name_text": "烈焰斩",
      "description_text": "向前方扇形区域挥击；触发斩击形态时改为释放多道可叠加命中的烈焰。",
      "category_text": "主动技能宝石",
      "gem_type": {
        "id": "gem_type_1",
        "number": 1,
        "display_text": "1号宝石",
        "identity_text": "一号主动技能身份",
        "color_key": "red"
      },
      "gem_kind": "active_skill",
      "gem_kind_text": "主动技能宝石",
      "sudoku_digit": 1,
      "rarity_text": "普通",
      "level": 1,
      "locked": false,
      "board_position": null,
      "tags": [
        {
          "id": "active_skill_gem",
          "text": "主动技能宝石"
        },
        {
          "id": "area",
          "text": "范围"
        },
        {
          "id": "attack",
          "text": "攻击"
        },
        {
          "id": "fire",
          "text": "火焰"
        },
        {
          "id": "gem",
          "text": "宝石"
        },
        {
          "id": "gem_type_1",
          "text": "1号宝石"
        },
        {
          "id": "loot_gem",
          "text": "可掉落宝石"
        },
        {
          "id": "melee",
          "text": "近战"
        },
        {
          "id": "skill_flame_slash",
          "text": "烈焰斩"
        },
        {
          "id": "slash",
          "text": "挥斩"
        }
      ],
      "base_effect": {
        "title_text": "技能基础效果",
        "template_text": "烈焰斩",
        "damage_type_text": "火焰",
        "base_damage": 34.6,
        "base_release_interval_ms": 1000,
        "base_cooldown_ms": 0,
        "trigger_interval_ms": 0,
        "mana_cost": 5,
        "scaling_stats": [
          {
            "id": "damage_add_percent",
            "text": "伤害提高"
          },
          {
            "id": "fire_damage_add_percent",
            "text": "火焰伤害提高"
          },
          {
            "id": "attack_speed_add_percent",
            "text": "攻击速度提高"
          },
          {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          {
            "id": "skill_speed_final_percent",
            "text": "最终技能速度"
          },
          {
            "id": "projectile_speed_add_percent",
            "text": "投射物速度提高"
          },
          {
            "id": "projectile_count_add",
            "text": "投射物数量增加"
          },
          {
            "id": "chain_count_add",
            "text": "连锁次数增加"
          },
          {
            "id": "pierce_count_add",
            "text": "穿透次数增加"
          },
          {
            "id": "area_add_percent",
            "text": "范围提高"
          },
          {
            "id": "slash_chance_add_percent",
            "text": "斩击几率提高"
          }
        ]
      },
      "can_affect": {
        "summary_text": "影响自身技能",
        "tags_any": [],
        "tags_all": [],
        "tags_none": []
      },
      "current_effective_targets": [
        {
          "instance_id": "",
          "name_text": "当前盘面暂无实际生效对象",
          "status_text": "当前盘面暂无实际生效对象"
        }
      ],
      "board_relations": [],
      "visual_effect": "skill_event.flame_slash.vfx",
      "shape_effect": "",
      "shape_effect_text": "",
      "tlidb": {
        "source_values": {
          "source": "tlidb",
          "tlidb_id": "Flame_Slash",
          "display_level": 20,
          "raw_lines": [
            "释放挥击攻击前方扇形区域，击中时造成 346% 武器攻击伤害。",
            "该技能受斩击几率影响，使其有可能以斩击形态释放。该技能释放斩击时生成 3 道烈焰，击中时造成 346% 武器攻击伤害。技能范围使该技能斩击生成的烈焰数量增加。多道烈焰伤害可以命中同一个敌人。",
            "该技能全部物理伤害转化为火焰伤害。",
            "挥击：",
            "造成 346% 武器攻击伤害",
            "斩击：",
            "造成 346% 武器攻击伤害",
            "每 115% 对该技能范围的加成，+2 火浪道数",
            "每 115% 对该技能范围的加成，+30% 火浪距离",
            "多道火浪的伤害可以叠加",
            "该技能的霰弹效应衰减系数为 50%",
            "该技能 100% 物理伤害转化为火焰伤害"
          ],
          "parsed_values": {
            "base_damage": 346,
            "mana_cost": 5,
            "release_interval_ms": 1000
          },
          "anchors": {
            "base_damage": {
              "20": 346
            }
          }
        },
        "level_values": {
          "base_damage": 34.6,
          "mana_cost": 5,
          "release_interval_ms": 1000
        },
        "auto_release": {
          "policy": "nearest_enemy",
          "notes": [
            "??????????TLIDB ???? Lv20 ???"
          ]
        }
      },
      "tooltip_view": {
        "variant": "active",
        "icon_text": "烈",
        "icon_color_key": "red",
        "icon_sprite": "",
        "name_text": "烈焰斩",
        "subtitle_text": "红色、宝石、近战、攻击、火焰、范围、挥斩",
        "type_identity_text": "",
        "tags": [
          {
            "id": "gem",
            "text": "宝石"
          },
          {
            "id": "melee",
            "text": "近战"
          },
          {
            "id": "attack",
            "text": "攻击"
          },
          {
            "id": "fire",
            "text": "火焰"
          },
          {
            "id": "area",
            "text": "范围"
          },
          {
            "id": "slash",
            "text": "挥斩"
          }
        ],
        "sections": {
          "description": {
            "title_text": "描述",
            "lines": [
              "向前方扇形区域挥击；触发斩击形态时改为释放多道可叠加命中的烈焰。"
            ]
          },
          "stats": {
            "title_text": "核心数值",
            "lines": [
              {
                "label_text": "等级",
                "value_text": "1"
              },
              {
                "label_text": "攻击伤害",
                "value_text": "34.6"
              },
              {
                "label_text": "魔力消耗",
                "value_text": "5"
              }
            ]
          },
          "recent_dps": {
            "title_text": "近期 DPS",
            "lines": []
          },
          "base_skill_level": {
            "lines": [
              "基础技能等级为 1"
            ]
          },
          "tlidb_source": {
            "title_text": "TLIDB 源数值",
            "lines": [
              "TLIDB ID: Flame_Slash",
              "Lv20 source card",
              "Source: base_damage=346, mana_cost=5, release_interval_ms=1000"
            ]
          },
          "tlidb_level": {
            "title_text": "等级表",
            "lines": [
              "base_damage=34.6, mana_cost=5, release_interval_ms=1000"
            ]
          },
          "auto_release": {
            "title_text": "自动释放适配",
            "lines": [
              "policy: nearest_enemy",
              "??????????TLIDB ???? Lv20 ???"
            ]
          },
          "bonuses": {
            "title_text": "当前加成",
            "lines": [
              "同数独数字宝石不能位于同一行、列或宫格"
            ]
          }
        }
      }
    },
    {
      "instance_id": "web_seed_active_11_active_lightning_shot",
      "name_text": "闪电射击",
      "description_text": "向前发射闪电箭，命中后分裂为多道闪电打击附近敌人。",
      "category_text": "主动技能宝石",
      "gem_type": {
        "id": "gem_type_1",
        "number": 1,
        "display_text": "1号宝石",
        "identity_text": "一号主动技能身份",
        "color_key": "red"
      },
      "gem_kind": "active_skill",
      "gem_kind_text": "主动技能宝石",
      "sudoku_digit": 1,
      "rarity_text": "普通",
      "level": 1,
      "locked": false,
      "board_position": null,
      "tags": [
        {
          "id": "active_skill_gem",
          "text": "主动技能宝石"
        },
        {
          "id": "attack",
          "text": "攻击"
        },
        {
          "id": "bow",
          "text": "弓"
        },
        {
          "id": "gem",
          "text": "宝石"
        },
        {
          "id": "gem_type_1",
          "text": "1号宝石"
        },
        {
          "id": "lightning",
          "text": "闪电"
        },
        {
          "id": "loot_gem",
          "text": "可掉落宝石"
        },
        {
          "id": "projectile",
          "text": "投射物"
        },
        {
          "id": "ranged",
          "text": "远程"
        },
        {
          "id": "skill_lightning_shot",
          "text": "闪电射击"
        }
      ],
      "base_effect": {
        "title_text": "技能基础效果",
        "template_text": "闪电射击",
        "damage_type_text": "闪电",
        "base_damage": 33.4,
        "base_release_interval_ms": 1000,
        "base_cooldown_ms": 0,
        "trigger_interval_ms": 0,
        "mana_cost": 5,
        "scaling_stats": [
          {
            "id": "damage_add_percent",
            "text": "伤害提高"
          },
          {
            "id": "lightning_damage_add_percent",
            "text": "闪电伤害提高"
          },
          {
            "id": "attack_speed_add_percent",
            "text": "攻击速度提高"
          },
          {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          {
            "id": "skill_speed_final_percent",
            "text": "最终技能速度"
          },
          {
            "id": "projectile_speed_add_percent",
            "text": "投射物速度提高"
          },
          {
            "id": "projectile_count_add",
            "text": "投射物数量增加"
          },
          {
            "id": "chain_count_add",
            "text": "连锁次数增加"
          },
          {
            "id": "pierce_count_add",
            "text": "穿透次数增加"
          },
          {
            "id": "area_add_percent",
            "text": "范围提高"
          }
        ]
      },
      "can_affect": {
        "summary_text": "影响自身技能",
        "tags_any": [],
        "tags_all": [],
        "tags_none": []
      },
      "current_effective_targets": [
        {
          "instance_id": "",
          "name_text": "当前盘面暂无实际生效对象",
          "status_text": "当前盘面暂无实际生效对象"
        }
      ],
      "board_relations": [],
      "visual_effect": "skill_event.lightning_shot.projectile",
      "shape_effect": "",
      "shape_effect_text": "",
      "tlidb": {
        "source_values": {
          "source": "tlidb",
          "tlidb_id": "Lightning_Shot",
          "display_level": 20,
          "raw_lines": [
            "释放该技能向前发射 1 个闪电箭，击中时对敌人造成 334% 武器伤害。",
            "闪电箭击中敌人时分裂为三道闪电，对一定范围内的随机3个敌人各造成 334% 武器攻击伤害。",
            "该技能全部物理伤害转化为闪电伤害。",
            "闪电箭：",
            "敌人造成 334% 武器伤害",
            "基础发射 1 个投射物",
            "闪电：",
            "造成 334% 武器攻击伤害",
            "该技能 100% 物理伤害转化为闪电伤害"
          ],
          "parsed_values": {
            "base_damage": 334,
            "mana_cost": 5,
            "release_interval_ms": 1000
          },
          "anchors": {
            "base_damage": {
              "20": 334
            }
          }
        },
        "level_values": {
          "base_damage": 33.4,
          "mana_cost": 5,
          "release_interval_ms": 1000
        },
        "auto_release": {
          "policy": "nearest_enemy",
          "notes": [
            "??????????TLIDB ???? Lv20 ???"
          ]
        }
      },
      "tooltip_view": {
        "variant": "active",
        "icon_text": "闪",
        "icon_color_key": "red",
        "icon_sprite": "",
        "name_text": "闪电射击",
        "subtitle_text": "红色、宝石、弓、远程、攻击、闪电、投射物",
        "type_identity_text": "",
        "tags": [
          {
            "id": "gem",
            "text": "宝石"
          },
          {
            "id": "bow",
            "text": "弓"
          },
          {
            "id": "ranged",
            "text": "远程"
          },
          {
            "id": "attack",
            "text": "攻击"
          },
          {
            "id": "lightning",
            "text": "闪电"
          },
          {
            "id": "projectile",
            "text": "投射物"
          }
        ],
        "sections": {
          "description": {
            "title_text": "描述",
            "lines": [
              "向前发射闪电箭，命中后分裂为多道闪电打击附近敌人。"
            ]
          },
          "stats": {
            "title_text": "核心数值",
            "lines": [
              {
                "label_text": "等级",
                "value_text": "1"
              },
              {
                "label_text": "攻击伤害",
                "value_text": "33.4"
              },
              {
                "label_text": "魔力消耗",
                "value_text": "5"
              }
            ]
          },
          "recent_dps": {
            "title_text": "近期 DPS",
            "lines": []
          },
          "base_skill_level": {
            "lines": [
              "基础技能等级为 1"
            ]
          },
          "tlidb_source": {
            "title_text": "TLIDB 源数值",
            "lines": [
              "TLIDB ID: Lightning_Shot",
              "Lv20 source card",
              "Source: base_damage=334, mana_cost=5, release_interval_ms=1000"
            ]
          },
          "tlidb_level": {
            "title_text": "等级表",
            "lines": [
              "base_damage=33.4, mana_cost=5, release_interval_ms=1000"
            ]
          },
          "auto_release": {
            "title_text": "自动释放适配",
            "lines": [
              "policy: nearest_enemy",
              "??????????TLIDB ???? Lv20 ???"
            ]
          },
          "bonuses": {
            "title_text": "当前加成",
            "lines": [
              "同数独数字宝石不能位于同一行、列或宫格"
            ]
          }
        }
      }
    },
    {
      "instance_id": "web_seed_active_12_active_corrosive_shot",
      "name_text": "侵蚀弹",
      "description_text": "向前投射混沌弹，接触目标或落点后产生混沌区域并施加易伤。",
      "category_text": "主动技能宝石",
      "gem_type": {
        "id": "gem_type_1",
        "number": 1,
        "display_text": "1号宝石",
        "identity_text": "一号主动技能身份",
        "color_key": "red"
      },
      "gem_kind": "active_skill",
      "gem_kind_text": "主动技能宝石",
      "sudoku_digit": 1,
      "rarity_text": "普通",
      "level": 1,
      "locked": false,
      "board_position": null,
      "tags": [
        {
          "id": "active_skill_gem",
          "text": "主动技能宝石"
        },
        {
          "id": "area",
          "text": "范围"
        },
        {
          "id": "attack",
          "text": "攻击"
        },
        {
          "id": "cannon",
          "text": "炮"
        },
        {
          "id": "chaos",
          "text": "混沌"
        },
        {
          "id": "dexterity",
          "text": "敏捷"
        },
        {
          "id": "dot",
          "text": "持续伤害"
        },
        {
          "id": "gem",
          "text": "宝石"
        },
        {
          "id": "gem_type_1",
          "text": "1号宝石"
        },
        {
          "id": "ground",
          "text": "地面"
        },
        {
          "id": "gun",
          "text": "枪"
        },
        {
          "id": "loot_gem",
          "text": "可掉落宝石"
        },
        {
          "id": "projectile",
          "text": "投射物"
        },
        {
          "id": "ranged",
          "text": "远程"
        },
        {
          "id": "skill_corrosive_shot",
          "text": "侵蚀弹"
        }
      ],
      "base_effect": {
        "title_text": "技能基础效果",
        "template_text": "侵蚀弹",
        "damage_type_text": "混沌",
        "base_damage": 9.5,
        "base_release_interval_ms": 1000,
        "base_cooldown_ms": 0,
        "trigger_interval_ms": 0,
        "mana_cost": 5,
        "scaling_stats": [
          {
            "id": "damage_add_percent",
            "text": "伤害提高"
          },
          {
            "id": "chaos_damage_add_percent",
            "text": "混沌伤害提高"
          },
          {
            "id": "attack_speed_add_percent",
            "text": "攻击速度提高"
          },
          {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          {
            "id": "skill_speed_final_percent",
            "text": "最终技能速度"
          },
          {
            "id": "projectile_speed_add_percent",
            "text": "投射物速度提高"
          },
          {
            "id": "projectile_count_add",
            "text": "投射物数量增加"
          },
          {
            "id": "chain_count_add",
            "text": "连锁次数增加"
          },
          {
            "id": "pierce_count_add",
            "text": "穿透次数增加"
          },
          {
            "id": "area_add_percent",
            "text": "范围提高"
          }
        ]
      },
      "can_affect": {
        "summary_text": "影响自身技能",
        "tags_any": [],
        "tags_all": [],
        "tags_none": []
      },
      "current_effective_targets": [
        {
          "instance_id": "",
          "name_text": "当前盘面暂无实际生效对象",
          "status_text": "当前盘面暂无实际生效对象"
        }
      ],
      "board_relations": [],
      "visual_effect": "skill_event.corrosive_shot.vfx",
      "shape_effect": "",
      "shape_effect_text": "",
      "tlidb": {
        "source_values": {
          "source": "tlidb",
          "tlidb_id": "Corrosive_Shot",
          "display_level": 20,
          "raw_lines": [
            "释放该技能向前抛射一个侵蚀弹，侵蚀弹接触目标时产生爆炸，造成 95% 武器攻击伤害。",
            "未分裂的侵蚀弹接触目标时还会生成侵蚀地面，对其中的敌人每秒造成 57 持续混沌伤害，并使其中敌人受到的该技能的伤害额外增加。",
            "该技能造成的凋零伤害更高。",
            "该技能全部物理伤害转化为混沌伤害。",
            "爆炸：",
            "造成 95% 武器攻击伤害",
            "该技能 +30% 凋零几率",
            "该技能额外 +30% 凋零伤害",
            "该技能 100% 物理伤害转化为混沌伤害",
            "侵蚀地面：",
            "侵蚀地面持续 3 秒",
            "伤害状态持续 2 秒，每秒造成 57 持续混沌伤害"
          ],
          "parsed_values": {
            "base_damage": 95,
            "mana_cost": 5,
            "release_interval_ms": 1000
          },
          "anchors": {
            "base_damage": {
              "20": 95
            }
          }
        },
        "level_values": {
          "base_damage": 9.5,
          "mana_cost": 5,
          "release_interval_ms": 1000
        },
        "auto_release": {
          "policy": "target_cluster",
          "notes": [
            "??????????TLIDB ???? Lv20 ???"
          ]
        }
      },
      "tooltip_view": {
        "variant": "active",
        "icon_text": "侵",
        "icon_color_key": "red",
        "icon_sprite": "",
        "name_text": "侵蚀弹",
        "subtitle_text": "红色、宝石、远程、攻击、投射物、范围、持续伤害、炮、混沌、敏捷、地面、枪",
        "type_identity_text": "",
        "tags": [
          {
            "id": "gem",
            "text": "宝石"
          },
          {
            "id": "ranged",
            "text": "远程"
          },
          {
            "id": "attack",
            "text": "攻击"
          },
          {
            "id": "projectile",
            "text": "投射物"
          },
          {
            "id": "area",
            "text": "范围"
          },
          {
            "id": "dot",
            "text": "持续伤害"
          },
          {
            "id": "cannon",
            "text": "炮"
          },
          {
            "id": "chaos",
            "text": "混沌"
          },
          {
            "id": "dexterity",
            "text": "敏捷"
          },
          {
            "id": "ground",
            "text": "地面"
          },
          {
            "id": "gun",
            "text": "枪"
          }
        ],
        "sections": {
          "description": {
            "title_text": "描述",
            "lines": [
              "向前投射混沌弹，接触目标或落点后产生混沌区域并施加易伤。"
            ]
          },
          "stats": {
            "title_text": "核心数值",
            "lines": [
              {
                "label_text": "等级",
                "value_text": "1"
              },
              {
                "label_text": "攻击伤害",
                "value_text": "9.5"
              },
              {
                "label_text": "魔力消耗",
                "value_text": "5"
              }
            ]
          },
          "recent_dps": {
            "title_text": "近期 DPS",
            "lines": []
          },
          "base_skill_level": {
            "lines": [
              "基础技能等级为 1"
            ]
          },
          "tlidb_source": {
            "title_text": "TLIDB 源数值",
            "lines": [
              "TLIDB ID: Corrosive_Shot",
              "Lv20 source card",
              "Source: base_damage=95, mana_cost=5, release_interval_ms=1000"
            ]
          },
          "tlidb_level": {
            "title_text": "等级表",
            "lines": [
              "base_damage=9.5, mana_cost=5, release_interval_ms=1000"
            ]
          },
          "auto_release": {
            "title_text": "自动释放适配",
            "lines": [
              "policy: target_cluster",
              "??????????TLIDB ???? Lv20 ???"
            ]
          },
          "bonuses": {
            "title_text": "当前加成",
            "lines": [
              "同数独数字宝石不能位于同一行、列或宫格"
            ]
          }
        }
      }
    },
    {
      "instance_id": "web_seed_active_13_active_burning_shot",
      "name_text": "燃烧射击",
      "description_text": "向前发射烈焰箭，有机会点燃敌人；命中已被点燃的敌人时引发爆燃。",
      "category_text": "主动技能宝石",
      "gem_type": {
        "id": "gem_type_1",
        "number": 1,
        "display_text": "1号宝石",
        "identity_text": "一号主动技能身份",
        "color_key": "red"
      },
      "gem_kind": "active_skill",
      "gem_kind_text": "主动技能宝石",
      "sudoku_digit": 1,
      "rarity_text": "普通",
      "level": 1,
      "locked": false,
      "board_position": null,
      "tags": [
        {
          "id": "active_skill_gem",
          "text": "主动技能宝石"
        },
        {
          "id": "attack",
          "text": "攻击"
        },
        {
          "id": "bow",
          "text": "弓"
        },
        {
          "id": "fire",
          "text": "火焰"
        },
        {
          "id": "gem",
          "text": "宝石"
        },
        {
          "id": "gem_type_1",
          "text": "1号宝石"
        },
        {
          "id": "loot_gem",
          "text": "可掉落宝石"
        },
        {
          "id": "projectile",
          "text": "投射物"
        },
        {
          "id": "ranged",
          "text": "远程"
        },
        {
          "id": "skill_burning_shot",
          "text": "燃烧射击"
        }
      ],
      "base_effect": {
        "title_text": "技能基础效果",
        "template_text": "燃烧射击",
        "damage_type_text": "火焰",
        "base_damage": 25.6,
        "base_release_interval_ms": 1000,
        "base_cooldown_ms": 1000,
        "trigger_interval_ms": 0,
        "mana_cost": 5,
        "scaling_stats": [
          {
            "id": "damage_add_percent",
            "text": "伤害提高"
          },
          {
            "id": "fire_damage_add_percent",
            "text": "火焰伤害提高"
          },
          {
            "id": "attack_speed_add_percent",
            "text": "攻击速度提高"
          },
          {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          {
            "id": "skill_speed_final_percent",
            "text": "最终技能速度"
          },
          {
            "id": "projectile_speed_add_percent",
            "text": "投射物速度提高"
          },
          {
            "id": "projectile_count_add",
            "text": "投射物数量增加"
          },
          {
            "id": "chain_count_add",
            "text": "连锁次数增加"
          },
          {
            "id": "pierce_count_add",
            "text": "穿透次数增加"
          },
          {
            "id": "area_add_percent",
            "text": "范围提高"
          }
        ]
      },
      "can_affect": {
        "summary_text": "影响自身技能",
        "tags_any": [],
        "tags_all": [],
        "tags_none": []
      },
      "current_effective_targets": [
        {
          "instance_id": "",
          "name_text": "当前盘面暂无实际生效对象",
          "status_text": "当前盘面暂无实际生效对象"
        }
      ],
      "board_relations": [],
      "visual_effect": "skill_event.burning_shot.vfx",
      "shape_effect": "",
      "shape_effect_text": "",
      "tlidb": {
        "source_values": {
          "source": "tlidb",
          "tlidb_id": "Burning_Shot",
          "display_level": 20,
          "raw_lines": [
            "释放该技能向前发射 1 个烈焰箭，造成 256% 武器攻击伤害，且造成的点燃伤害额外增加。",
            "该技能击中点燃的敌人时引发爆炸，对半径 3 米内敌人造成相当于 100% 该敌人受到的每秒点燃伤害的真实伤害，并造成 5-5 间接火焰伤害。",
            "该技能全部物理伤害转化为火焰伤害。",
            "燃烧射击：",
            "造成 256% 武器攻击伤害",
            "基础发射 1 个投射物",
            "该技能额外 +30% 点燃伤害",
            "该技能 100% 物理伤害转化为火焰伤害",
            "该技能 +25% 点燃几率 (Lv1:25)",
            "该技能击中点燃的敌人时引发爆炸，对半径 3 米内敌人造成相当于 100% 该敌人受到的每秒点燃伤害的真实伤害；该效果对同一敌人有 5 秒冷却时间"
          ],
          "parsed_values": {
            "base_damage": 256,
            "mana_cost": 5,
            "release_interval_ms": 1000
          },
          "anchors": {
            "base_damage": {
              "20": 256
            }
          }
        },
        "level_values": {
          "base_damage": 25.6,
          "mana_cost": 5,
          "release_interval_ms": 1000
        },
        "auto_release": {
          "policy": "nearest_enemy",
          "notes": [
            "??????????TLIDB ???? Lv20 ???"
          ]
        }
      },
      "tooltip_view": {
        "variant": "active",
        "icon_text": "燃",
        "icon_color_key": "red",
        "icon_sprite": "",
        "name_text": "燃烧射击",
        "subtitle_text": "红色、宝石、弓、远程、攻击、火焰、投射物",
        "type_identity_text": "",
        "tags": [
          {
            "id": "gem",
            "text": "宝石"
          },
          {
            "id": "bow",
            "text": "弓"
          },
          {
            "id": "ranged",
            "text": "远程"
          },
          {
            "id": "attack",
            "text": "攻击"
          },
          {
            "id": "fire",
            "text": "火焰"
          },
          {
            "id": "projectile",
            "text": "投射物"
          }
        ],
        "sections": {
          "description": {
            "title_text": "描述",
            "lines": [
              "向前发射烈焰箭，有机会点燃敌人；命中已被点燃的敌人时引发爆燃。"
            ]
          },
          "stats": {
            "title_text": "核心数值",
            "lines": [
              {
                "label_text": "等级",
                "value_text": "1"
              },
              {
                "label_text": "攻击伤害",
                "value_text": "25.6"
              },
              {
                "label_text": "冷却",
                "value_text": "1000 毫秒"
              },
              {
                "label_text": "魔力消耗",
                "value_text": "5"
              }
            ]
          },
          "recent_dps": {
            "title_text": "近期 DPS",
            "lines": []
          },
          "base_skill_level": {
            "lines": [
              "基础技能等级为 1"
            ]
          },
          "tlidb_source": {
            "title_text": "TLIDB 源数值",
            "lines": [
              "TLIDB ID: Burning_Shot",
              "Lv20 source card",
              "Source: base_damage=256, mana_cost=5, release_interval_ms=1000"
            ]
          },
          "tlidb_level": {
            "title_text": "等级表",
            "lines": [
              "base_damage=25.6, mana_cost=5, release_interval_ms=1000"
            ]
          },
          "auto_release": {
            "title_text": "自动释放适配",
            "lines": [
              "policy: nearest_enemy",
              "??????????TLIDB ???? Lv20 ???"
            ]
          },
          "bonuses": {
            "title_text": "当前加成",
            "lines": [
              "同数独数字宝石不能位于同一行、列或宫格"
            ]
          }
        }
      }
    },
    {
      "instance_id": "web_seed_active_14_active_rain_of_arrows",
      "name_text": "箭雨",
      "description_text": "向空中发射箭矢，随后在目标区域形成箭雨落点。",
      "category_text": "主动技能宝石",
      "gem_type": {
        "id": "gem_type_1",
        "number": 1,
        "display_text": "1号宝石",
        "identity_text": "一号主动技能身份",
        "color_key": "red"
      },
      "gem_kind": "active_skill",
      "gem_kind_text": "主动技能宝石",
      "sudoku_digit": 1,
      "rarity_text": "普通",
      "level": 1,
      "locked": false,
      "board_position": null,
      "tags": [
        {
          "id": "active_skill_gem",
          "text": "主动技能宝石"
        },
        {
          "id": "area",
          "text": "范围"
        },
        {
          "id": "attack",
          "text": "攻击"
        },
        {
          "id": "bow",
          "text": "弓"
        },
        {
          "id": "gem",
          "text": "宝石"
        },
        {
          "id": "gem_type_1",
          "text": "1号宝石"
        },
        {
          "id": "loot_gem",
          "text": "可掉落宝石"
        },
        {
          "id": "physical",
          "text": "物理"
        },
        {
          "id": "projectile",
          "text": "投射物"
        },
        {
          "id": "ranged",
          "text": "远程"
        },
        {
          "id": "skill_rain_of_arrows",
          "text": "箭雨"
        }
      ],
      "base_effect": {
        "title_text": "技能基础效果",
        "template_text": "箭雨",
        "damage_type_text": "物理",
        "base_damage": 13.4,
        "base_release_interval_ms": 1000,
        "base_cooldown_ms": 0,
        "trigger_interval_ms": 0,
        "mana_cost": 5,
        "scaling_stats": [
          {
            "id": "damage_add_percent",
            "text": "伤害提高"
          },
          {
            "id": "physical_damage_add_percent",
            "text": "物理伤害提高"
          },
          {
            "id": "attack_speed_add_percent",
            "text": "攻击速度提高"
          },
          {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          {
            "id": "skill_speed_final_percent",
            "text": "最终技能速度"
          },
          {
            "id": "projectile_speed_add_percent",
            "text": "投射物速度提高"
          },
          {
            "id": "projectile_count_add",
            "text": "投射物数量增加"
          },
          {
            "id": "chain_count_add",
            "text": "连锁次数增加"
          },
          {
            "id": "pierce_count_add",
            "text": "穿透次数增加"
          },
          {
            "id": "area_add_percent",
            "text": "范围提高"
          }
        ]
      },
      "can_affect": {
        "summary_text": "影响自身技能",
        "tags_any": [],
        "tags_all": [],
        "tags_none": []
      },
      "current_effective_targets": [
        {
          "instance_id": "",
          "name_text": "当前盘面暂无实际生效对象",
          "status_text": "当前盘面暂无实际生效对象"
        }
      ],
      "board_relations": [],
      "visual_effect": "skill_event.rain_of_arrows.vfx",
      "shape_effect": "",
      "shape_effect_text": "",
      "tlidb": {
        "source_values": {
          "source": "tlidb",
          "tlidb_id": "Rain_of_Arrows",
          "display_level": 20,
          "raw_lines": [
            "释放该技能向空中发射 15 个投射物，投射物落下时随机攻击一定范围内的敌人，造成 134% 武器攻击伤害。",
            "投射物速度使该技能伤害额外增加。",
            "箭雨：",
            "造成 134% 武器攻击伤害",
            "基础发射 1 个投射物",
            "该技能 +14 投射物数量",
            "对该技能投射物速度加成的 25% 同样作用于该技能额外伤害",
            "该技能发射的投射物可以命中同一个敌人",
            "该技能的霰弹效应衰减系数为 70%"
          ],
          "parsed_values": {
            "base_damage": 134,
            "mana_cost": 5,
            "release_interval_ms": 1000
          },
          "anchors": {
            "base_damage": {
              "20": 134
            }
          }
        },
        "level_values": {
          "base_damage": 13.4,
          "mana_cost": 5,
          "release_interval_ms": 1000
        },
        "auto_release": {
          "policy": "target_cluster",
          "notes": [
            "??????????TLIDB ???? Lv20 ???"
          ]
        }
      },
      "tooltip_view": {
        "variant": "active",
        "icon_text": "箭",
        "icon_color_key": "red",
        "icon_sprite": "",
        "name_text": "箭雨",
        "subtitle_text": "红色、宝石、弓、远程、攻击、物理、投射物、范围",
        "type_identity_text": "",
        "tags": [
          {
            "id": "gem",
            "text": "宝石"
          },
          {
            "id": "bow",
            "text": "弓"
          },
          {
            "id": "ranged",
            "text": "远程"
          },
          {
            "id": "attack",
            "text": "攻击"
          },
          {
            "id": "physical",
            "text": "物理"
          },
          {
            "id": "projectile",
            "text": "投射物"
          },
          {
            "id": "area",
            "text": "范围"
          }
        ],
        "sections": {
          "description": {
            "title_text": "描述",
            "lines": [
              "向空中发射箭矢，随后在目标区域形成箭雨落点。"
            ]
          },
          "stats": {
            "title_text": "核心数值",
            "lines": [
              {
                "label_text": "等级",
                "value_text": "1"
              },
              {
                "label_text": "攻击伤害",
                "value_text": "13.4"
              },
              {
                "label_text": "魔力消耗",
                "value_text": "5"
              }
            ]
          },
          "recent_dps": {
            "title_text": "近期 DPS",
            "lines": []
          },
          "base_skill_level": {
            "lines": [
              "基础技能等级为 1"
            ]
          },
          "tlidb_source": {
            "title_text": "TLIDB 源数值",
            "lines": [
              "TLIDB ID: Rain_of_Arrows",
              "Lv20 source card",
              "Source: base_damage=134, mana_cost=5, release_interval_ms=1000"
            ]
          },
          "tlidb_level": {
            "title_text": "等级表",
            "lines": [
              "base_damage=13.4, mana_cost=5, release_interval_ms=1000"
            ]
          },
          "auto_release": {
            "title_text": "自动释放适配",
            "lines": [
              "policy: target_cluster",
              "??????????TLIDB ???? Lv20 ???"
            ]
          },
          "bonuses": {
            "title_text": "当前加成",
            "lines": [
              "同数独数字宝石不能位于同一行、列或宫格"
            ]
          }
        }
      }
    },
    {
      "instance_id": "web_seed_active_15_active_sparkle",
      "name_text": "电火花",
      "description_text": "向前发射电火花，电火花会在飞行中持续作用于附近区域。",
      "category_text": "主动技能宝石",
      "gem_type": {
        "id": "gem_type_1",
        "number": 1,
        "display_text": "1号宝石",
        "identity_text": "一号主动技能身份",
        "color_key": "red"
      },
      "gem_kind": "active_skill",
      "gem_kind_text": "主动技能宝石",
      "sudoku_digit": 1,
      "rarity_text": "普通",
      "level": 1,
      "locked": false,
      "board_position": null,
      "tags": [
        {
          "id": "active_skill_gem",
          "text": "主动技能宝石"
        },
        {
          "id": "gem",
          "text": "宝石"
        },
        {
          "id": "gem_type_1",
          "text": "1号宝石"
        },
        {
          "id": "lightning",
          "text": "闪电"
        },
        {
          "id": "loot_gem",
          "text": "可掉落宝石"
        },
        {
          "id": "projectile",
          "text": "投射物"
        },
        {
          "id": "skill_sparkle",
          "text": "电火花"
        },
        {
          "id": "spell",
          "text": "法术"
        }
      ],
      "base_effect": {
        "title_text": "技能基础效果",
        "template_text": "电火花",
        "damage_type_text": "闪电",
        "base_damage": 42.65,
        "base_release_interval_ms": 650,
        "base_cooldown_ms": 0,
        "trigger_interval_ms": 0,
        "mana_cost": 8,
        "scaling_stats": [
          {
            "id": "damage_add_percent",
            "text": "伤害提高"
          },
          {
            "id": "lightning_damage_add_percent",
            "text": "闪电伤害提高"
          },
          {
            "id": "cast_speed_add_percent",
            "text": "施法速度提高"
          },
          {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          {
            "id": "skill_speed_final_percent",
            "text": "最终技能速度"
          },
          {
            "id": "projectile_speed_add_percent",
            "text": "投射物速度提高"
          },
          {
            "id": "projectile_count_add",
            "text": "投射物数量增加"
          },
          {
            "id": "chain_count_add",
            "text": "连锁次数增加"
          },
          {
            "id": "pierce_count_add",
            "text": "穿透次数增加"
          },
          {
            "id": "area_add_percent",
            "text": "范围提高"
          }
        ]
      },
      "can_affect": {
        "summary_text": "影响自身技能",
        "tags_any": [],
        "tags_all": [],
        "tags_none": []
      },
      "current_effective_targets": [
        {
          "instance_id": "",
          "name_text": "当前盘面暂无实际生效对象",
          "status_text": "当前盘面暂无实际生效对象"
        }
      ],
      "board_relations": [],
      "visual_effect": "skill_event.sparkle.vfx",
      "shape_effect": "",
      "shape_effect_text": "",
      "tlidb": {
        "source_values": {
          "source": "tlidb",
          "tlidb_id": "Sparkle",
          "display_level": 20,
          "raw_lines": [
            "释放该技能向前发射 1 个电火花，持续打击其范围内的敌人，每次造成 43-810 法术闪电伤害。电火花的速度逐渐降低。",
            "电火花：",
            "造成 43-810 法术闪电伤害",
            "投射物每 0.25 秒打击一次",
            "投射物持续 1.5 秒"
          ],
          "parsed_values": {
            "base_damage": 426.5,
            "mana_cost": 8,
            "release_interval_ms": 650
          },
          "anchors": {
            "base_damage": {
              "20": 426.5
            }
          }
        },
        "level_values": {
          "base_damage": 42.65,
          "mana_cost": 8,
          "release_interval_ms": 650
        },
        "auto_release": {
          "policy": "target_cluster",
          "notes": [
            "??????????TLIDB ???? Lv20 ???"
          ]
        }
      },
      "tooltip_view": {
        "variant": "active",
        "icon_text": "电",
        "icon_color_key": "red",
        "icon_sprite": "",
        "name_text": "电火花",
        "subtitle_text": "红色、宝石、法术、闪电、投射物",
        "type_identity_text": "",
        "tags": [
          {
            "id": "gem",
            "text": "宝石"
          },
          {
            "id": "spell",
            "text": "法术"
          },
          {
            "id": "lightning",
            "text": "闪电"
          },
          {
            "id": "projectile",
            "text": "投射物"
          }
        ],
        "sections": {
          "description": {
            "title_text": "描述",
            "lines": [
              "向前发射电火花，电火花会在飞行中持续作用于附近区域。"
            ]
          },
          "stats": {
            "title_text": "核心数值",
            "lines": [
              {
                "label_text": "等级",
                "value_text": "1"
              },
              {
                "label_text": "法术伤害",
                "value_text": "42.65"
              },
              {
                "label_text": "魔力消耗",
                "value_text": "8"
              }
            ]
          },
          "recent_dps": {
            "title_text": "近期 DPS",
            "lines": []
          },
          "base_skill_level": {
            "lines": [
              "基础技能等级为 1"
            ]
          },
          "tlidb_source": {
            "title_text": "TLIDB 源数值",
            "lines": [
              "TLIDB ID: Sparkle",
              "Lv20 source card",
              "Source: base_damage=426.5, mana_cost=8, release_interval_ms=650"
            ]
          },
          "tlidb_level": {
            "title_text": "等级表",
            "lines": [
              "base_damage=42.65, mana_cost=8, release_interval_ms=650"
            ]
          },
          "auto_release": {
            "title_text": "自动释放适配",
            "lines": [
              "policy: target_cluster",
              "??????????TLIDB ???? Lv20 ???"
            ]
          },
          "bonuses": {
            "title_text": "当前加成",
            "lines": [
              "同数独数字宝石不能位于同一行、列或宫格"
            ]
          }
        }
      }
    },
    {
      "instance_id": "web_seed_active_16_active_black_hole",
      "name_text": "黑洞",
      "description_text": "在目标位置形成黑洞，持续牵制范围内敌人并周期性造成混沌伤害。",
      "category_text": "主动技能宝石",
      "gem_type": {
        "id": "gem_type_1",
        "number": 1,
        "display_text": "1号宝石",
        "identity_text": "一号主动技能身份",
        "color_key": "red"
      },
      "gem_kind": "active_skill",
      "gem_kind_text": "主动技能宝石",
      "sudoku_digit": 1,
      "rarity_text": "普通",
      "level": 1,
      "locked": false,
      "board_position": null,
      "tags": [
        {
          "id": "active_skill_gem",
          "text": "主动技能宝石"
        },
        {
          "id": "area",
          "text": "范围"
        },
        {
          "id": "chaos",
          "text": "混沌"
        },
        {
          "id": "dot",
          "text": "持续伤害"
        },
        {
          "id": "gem",
          "text": "宝石"
        },
        {
          "id": "gem_type_1",
          "text": "1号宝石"
        },
        {
          "id": "loot_gem",
          "text": "可掉落宝石"
        },
        {
          "id": "skill_black_hole",
          "text": "黑洞"
        },
        {
          "id": "spell",
          "text": "法术"
        }
      ],
      "base_effect": {
        "title_text": "技能基础效果",
        "template_text": "黑洞",
        "damage_type_text": "混沌",
        "base_damage": 24.9,
        "base_release_interval_ms": 800,
        "base_cooldown_ms": 10000,
        "trigger_interval_ms": 0,
        "mana_cost": 15,
        "scaling_stats": [
          {
            "id": "damage_add_percent",
            "text": "伤害提高"
          },
          {
            "id": "chaos_damage_add_percent",
            "text": "混沌伤害提高"
          },
          {
            "id": "cast_speed_add_percent",
            "text": "施法速度提高"
          },
          {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          {
            "id": "skill_speed_final_percent",
            "text": "最终技能速度"
          },
          {
            "id": "projectile_speed_add_percent",
            "text": "投射物速度提高"
          },
          {
            "id": "projectile_count_add",
            "text": "投射物数量增加"
          },
          {
            "id": "chain_count_add",
            "text": "连锁次数增加"
          },
          {
            "id": "pierce_count_add",
            "text": "穿透次数增加"
          },
          {
            "id": "area_add_percent",
            "text": "范围提高"
          }
        ]
      },
      "can_affect": {
        "summary_text": "影响自身技能",
        "tags_any": [],
        "tags_all": [],
        "tags_none": []
      },
      "current_effective_targets": [
        {
          "instance_id": "",
          "name_text": "当前盘面暂无实际生效对象",
          "status_text": "当前盘面暂无实际生效对象"
        }
      ],
      "board_relations": [],
      "visual_effect": "skill_event.black_hole.vfx",
      "shape_effect": "",
      "shape_effect_text": "",
      "tlidb": {
        "source_values": {
          "source": "tlidb",
          "tlidb_id": "Black_Hole",
          "display_level": 20,
          "raw_lines": [
            "释放该技能在指定位置形成黑洞，对一定范围内敌人造成每秒 249 持续混沌伤害，且周期性反向击退其中的敌人，持续 4 秒。受到该技能伤害的敌人被施加 100 点加剧值，冷却时间为 1 秒。",
            "释放该技能获得亢奋：",
            "黑洞中的敌人每有 10 点加剧值，你对其额外造成 3.5% 持续伤害,持续 4 秒",
            "黑洞：",
            "造成 249-249 持续混沌伤害",
            "该技能具有反向击退",
            "该技能造成持续伤害时，对敌人施加 100 点加剧值，该效果冷却时间为 1 秒",
            "黑洞每间隔 0.5 秒击退其中的敌人",
            "持续 4 秒",
            "释放该技能获得亢奋：",
            "黑洞中的敌人每有 10 点加剧值，你对其额外造成 3.5% 持续伤害,持续 4 秒"
          ],
          "parsed_values": {
            "base_damage": 249,
            "mana_cost": 15,
            "release_interval_ms": 800
          },
          "anchors": {
            "base_damage": {
              "20": 249
            }
          }
        },
        "level_values": {
          "base_damage": 24.9,
          "mana_cost": 15,
          "release_interval_ms": 800
        },
        "auto_release": {
          "policy": "target_cluster",
          "notes": [
            "??????????TLIDB ???? Lv20 ???"
          ]
        }
      },
      "tooltip_view": {
        "variant": "active",
        "icon_text": "黑",
        "icon_color_key": "red",
        "icon_sprite": "",
        "name_text": "黑洞",
        "subtitle_text": "红色、宝石、法术、范围、持续伤害、混沌",
        "type_identity_text": "",
        "tags": [
          {
            "id": "gem",
            "text": "宝石"
          },
          {
            "id": "spell",
            "text": "法术"
          },
          {
            "id": "area",
            "text": "范围"
          },
          {
            "id": "dot",
            "text": "持续伤害"
          },
          {
            "id": "chaos",
            "text": "混沌"
          }
        ],
        "sections": {
          "description": {
            "title_text": "描述",
            "lines": [
              "在目标位置形成黑洞，持续牵制范围内敌人并周期性造成混沌伤害。"
            ]
          },
          "stats": {
            "title_text": "核心数值",
            "lines": [
              {
                "label_text": "等级",
                "value_text": "1"
              },
              {
                "label_text": "法术伤害",
                "value_text": "24.9"
              },
              {
                "label_text": "冷却",
                "value_text": "10000 毫秒"
              },
              {
                "label_text": "魔力消耗",
                "value_text": "15"
              }
            ]
          },
          "recent_dps": {
            "title_text": "近期 DPS",
            "lines": []
          },
          "base_skill_level": {
            "lines": [
              "基础技能等级为 1"
            ]
          },
          "tlidb_source": {
            "title_text": "TLIDB 源数值",
            "lines": [
              "TLIDB ID: Black_Hole",
              "Lv20 source card",
              "Source: base_damage=249, mana_cost=15, release_interval_ms=800"
            ]
          },
          "tlidb_level": {
            "title_text": "等级表",
            "lines": [
              "base_damage=24.9, mana_cost=15, release_interval_ms=800"
            ]
          },
          "auto_release": {
            "title_text": "自动释放适配",
            "lines": [
              "policy: target_cluster",
              "??????????TLIDB ???? Lv20 ???"
            ]
          },
          "bonuses": {
            "title_text": "当前加成",
            "lines": [
              "同数独数字宝石不能位于同一行、列或宫格"
            ]
          }
        }
      }
    }
  ],
  "board": {
    "cells": [
      [
        {
          "row": 0,
          "column": 0,
          "box": 0,
          "gem": null
        },
        {
          "row": 0,
          "column": 1,
          "box": 0,
          "gem": null
        },
        {
          "row": 0,
          "column": 2,
          "box": 0,
          "gem": null
        },
        {
          "row": 0,
          "column": 3,
          "box": 1,
          "gem": null
        },
        {
          "row": 0,
          "column": 4,
          "box": 1,
          "gem": null
        },
        {
          "row": 0,
          "column": 5,
          "box": 1,
          "gem": null
        },
        {
          "row": 0,
          "column": 6,
          "box": 2,
          "gem": null
        },
        {
          "row": 0,
          "column": 7,
          "box": 2,
          "gem": null
        },
        {
          "row": 0,
          "column": 8,
          "box": 2,
          "gem": null
        }
      ],
      [
        {
          "row": 1,
          "column": 0,
          "box": 0,
          "gem": null
        },
        {
          "row": 1,
          "column": 1,
          "box": 0,
          "gem": null
        },
        {
          "row": 1,
          "column": 2,
          "box": 0,
          "gem": null
        },
        {
          "row": 1,
          "column": 3,
          "box": 1,
          "gem": null
        },
        {
          "row": 1,
          "column": 4,
          "box": 1,
          "gem": null
        },
        {
          "row": 1,
          "column": 5,
          "box": 1,
          "gem": null
        },
        {
          "row": 1,
          "column": 6,
          "box": 2,
          "gem": null
        },
        {
          "row": 1,
          "column": 7,
          "box": 2,
          "gem": null
        },
        {
          "row": 1,
          "column": 8,
          "box": 2,
          "gem": null
        }
      ],
      [
        {
          "row": 2,
          "column": 0,
          "box": 0,
          "gem": null
        },
        {
          "row": 2,
          "column": 1,
          "box": 0,
          "gem": null
        },
        {
          "row": 2,
          "column": 2,
          "box": 0,
          "gem": null
        },
        {
          "row": 2,
          "column": 3,
          "box": 1,
          "gem": null
        },
        {
          "row": 2,
          "column": 4,
          "box": 1,
          "gem": null
        },
        {
          "row": 2,
          "column": 5,
          "box": 1,
          "gem": null
        },
        {
          "row": 2,
          "column": 6,
          "box": 2,
          "gem": null
        },
        {
          "row": 2,
          "column": 7,
          "box": 2,
          "gem": null
        },
        {
          "row": 2,
          "column": 8,
          "box": 2,
          "gem": null
        }
      ],
      [
        {
          "row": 3,
          "column": 0,
          "box": 3,
          "gem": null
        },
        {
          "row": 3,
          "column": 1,
          "box": 3,
          "gem": null
        },
        {
          "row": 3,
          "column": 2,
          "box": 3,
          "gem": null
        },
        {
          "row": 3,
          "column": 3,
          "box": 4,
          "gem": null
        },
        {
          "row": 3,
          "column": 4,
          "box": 4,
          "gem": null
        },
        {
          "row": 3,
          "column": 5,
          "box": 4,
          "gem": null
        },
        {
          "row": 3,
          "column": 6,
          "box": 5,
          "gem": null
        },
        {
          "row": 3,
          "column": 7,
          "box": 5,
          "gem": null
        },
        {
          "row": 3,
          "column": 8,
          "box": 5,
          "gem": null
        }
      ],
      [
        {
          "row": 4,
          "column": 0,
          "box": 3,
          "gem": null
        },
        {
          "row": 4,
          "column": 1,
          "box": 3,
          "gem": null
        },
        {
          "row": 4,
          "column": 2,
          "box": 3,
          "gem": null
        },
        {
          "row": 4,
          "column": 3,
          "box": 4,
          "gem": null
        },
        {
          "row": 4,
          "column": 4,
          "box": 4,
          "gem": null
        },
        {
          "row": 4,
          "column": 5,
          "box": 4,
          "gem": null
        },
        {
          "row": 4,
          "column": 6,
          "box": 5,
          "gem": null
        },
        {
          "row": 4,
          "column": 7,
          "box": 5,
          "gem": null
        },
        {
          "row": 4,
          "column": 8,
          "box": 5,
          "gem": null
        }
      ],
      [
        {
          "row": 5,
          "column": 0,
          "box": 3,
          "gem": null
        },
        {
          "row": 5,
          "column": 1,
          "box": 3,
          "gem": null
        },
        {
          "row": 5,
          "column": 2,
          "box": 3,
          "gem": null
        },
        {
          "row": 5,
          "column": 3,
          "box": 4,
          "gem": null
        },
        {
          "row": 5,
          "column": 4,
          "box": 4,
          "gem": null
        },
        {
          "row": 5,
          "column": 5,
          "box": 4,
          "gem": null
        },
        {
          "row": 5,
          "column": 6,
          "box": 5,
          "gem": null
        },
        {
          "row": 5,
          "column": 7,
          "box": 5,
          "gem": null
        },
        {
          "row": 5,
          "column": 8,
          "box": 5,
          "gem": null
        }
      ],
      [
        {
          "row": 6,
          "column": 0,
          "box": 6,
          "gem": null
        },
        {
          "row": 6,
          "column": 1,
          "box": 6,
          "gem": null
        },
        {
          "row": 6,
          "column": 2,
          "box": 6,
          "gem": null
        },
        {
          "row": 6,
          "column": 3,
          "box": 7,
          "gem": null
        },
        {
          "row": 6,
          "column": 4,
          "box": 7,
          "gem": null
        },
        {
          "row": 6,
          "column": 5,
          "box": 7,
          "gem": null
        },
        {
          "row": 6,
          "column": 6,
          "box": 8,
          "gem": null
        },
        {
          "row": 6,
          "column": 7,
          "box": 8,
          "gem": null
        },
        {
          "row": 6,
          "column": 8,
          "box": 8,
          "gem": null
        }
      ],
      [
        {
          "row": 7,
          "column": 0,
          "box": 6,
          "gem": null
        },
        {
          "row": 7,
          "column": 1,
          "box": 6,
          "gem": null
        },
        {
          "row": 7,
          "column": 2,
          "box": 6,
          "gem": null
        },
        {
          "row": 7,
          "column": 3,
          "box": 7,
          "gem": null
        },
        {
          "row": 7,
          "column": 4,
          "box": 7,
          "gem": null
        },
        {
          "row": 7,
          "column": 5,
          "box": 7,
          "gem": null
        },
        {
          "row": 7,
          "column": 6,
          "box": 8,
          "gem": null
        },
        {
          "row": 7,
          "column": 7,
          "box": 8,
          "gem": null
        },
        {
          "row": 7,
          "column": 8,
          "box": 8,
          "gem": null
        }
      ],
      [
        {
          "row": 8,
          "column": 0,
          "box": 6,
          "gem": null
        },
        {
          "row": 8,
          "column": 1,
          "box": 6,
          "gem": null
        },
        {
          "row": 8,
          "column": 2,
          "box": 6,
          "gem": null
        },
        {
          "row": 8,
          "column": 3,
          "box": 7,
          "gem": null
        },
        {
          "row": 8,
          "column": 4,
          "box": 7,
          "gem": null
        },
        {
          "row": 8,
          "column": 5,
          "box": 7,
          "gem": null
        },
        {
          "row": 8,
          "column": 6,
          "box": 8,
          "gem": null
        },
        {
          "row": 8,
          "column": 7,
          "box": 8,
          "gem": null
        },
        {
          "row": 8,
          "column": 8,
          "box": 8,
          "gem": null
        }
      ]
    ],
    "boxes": [
      {
        "box": 0,
        "label_text": "1宫",
        "cells": [
          {
            "row": 0,
            "column": 0
          },
          {
            "row": 0,
            "column": 1
          },
          {
            "row": 0,
            "column": 2
          },
          {
            "row": 1,
            "column": 0
          },
          {
            "row": 1,
            "column": 1
          },
          {
            "row": 1,
            "column": 2
          },
          {
            "row": 2,
            "column": 0
          },
          {
            "row": 2,
            "column": 1
          },
          {
            "row": 2,
            "column": 2
          }
        ]
      },
      {
        "box": 1,
        "label_text": "2宫",
        "cells": [
          {
            "row": 0,
            "column": 3
          },
          {
            "row": 0,
            "column": 4
          },
          {
            "row": 0,
            "column": 5
          },
          {
            "row": 1,
            "column": 3
          },
          {
            "row": 1,
            "column": 4
          },
          {
            "row": 1,
            "column": 5
          },
          {
            "row": 2,
            "column": 3
          },
          {
            "row": 2,
            "column": 4
          },
          {
            "row": 2,
            "column": 5
          }
        ]
      },
      {
        "box": 2,
        "label_text": "3宫",
        "cells": [
          {
            "row": 0,
            "column": 6
          },
          {
            "row": 0,
            "column": 7
          },
          {
            "row": 0,
            "column": 8
          },
          {
            "row": 1,
            "column": 6
          },
          {
            "row": 1,
            "column": 7
          },
          {
            "row": 1,
            "column": 8
          },
          {
            "row": 2,
            "column": 6
          },
          {
            "row": 2,
            "column": 7
          },
          {
            "row": 2,
            "column": 8
          }
        ]
      },
      {
        "box": 3,
        "label_text": "4宫",
        "cells": [
          {
            "row": 3,
            "column": 0
          },
          {
            "row": 3,
            "column": 1
          },
          {
            "row": 3,
            "column": 2
          },
          {
            "row": 4,
            "column": 0
          },
          {
            "row": 4,
            "column": 1
          },
          {
            "row": 4,
            "column": 2
          },
          {
            "row": 5,
            "column": 0
          },
          {
            "row": 5,
            "column": 1
          },
          {
            "row": 5,
            "column": 2
          }
        ]
      },
      {
        "box": 4,
        "label_text": "5宫",
        "cells": [
          {
            "row": 3,
            "column": 3
          },
          {
            "row": 3,
            "column": 4
          },
          {
            "row": 3,
            "column": 5
          },
          {
            "row": 4,
            "column": 3
          },
          {
            "row": 4,
            "column": 4
          },
          {
            "row": 4,
            "column": 5
          },
          {
            "row": 5,
            "column": 3
          },
          {
            "row": 5,
            "column": 4
          },
          {
            "row": 5,
            "column": 5
          }
        ]
      },
      {
        "box": 5,
        "label_text": "6宫",
        "cells": [
          {
            "row": 3,
            "column": 6
          },
          {
            "row": 3,
            "column": 7
          },
          {
            "row": 3,
            "column": 8
          },
          {
            "row": 4,
            "column": 6
          },
          {
            "row": 4,
            "column": 7
          },
          {
            "row": 4,
            "column": 8
          },
          {
            "row": 5,
            "column": 6
          },
          {
            "row": 5,
            "column": 7
          },
          {
            "row": 5,
            "column": 8
          }
        ]
      },
      {
        "box": 6,
        "label_text": "7宫",
        "cells": [
          {
            "row": 6,
            "column": 0
          },
          {
            "row": 6,
            "column": 1
          },
          {
            "row": 6,
            "column": 2
          },
          {
            "row": 7,
            "column": 0
          },
          {
            "row": 7,
            "column": 1
          },
          {
            "row": 7,
            "column": 2
          },
          {
            "row": 8,
            "column": 0
          },
          {
            "row": 8,
            "column": 1
          },
          {
            "row": 8,
            "column": 2
          }
        ]
      },
      {
        "box": 7,
        "label_text": "8宫",
        "cells": [
          {
            "row": 6,
            "column": 3
          },
          {
            "row": 6,
            "column": 4
          },
          {
            "row": 6,
            "column": 5
          },
          {
            "row": 7,
            "column": 3
          },
          {
            "row": 7,
            "column": 4
          },
          {
            "row": 7,
            "column": 5
          },
          {
            "row": 8,
            "column": 3
          },
          {
            "row": 8,
            "column": 4
          },
          {
            "row": 8,
            "column": 5
          }
        ]
      },
      {
        "box": 8,
        "label_text": "9宫",
        "cells": [
          {
            "row": 6,
            "column": 6
          },
          {
            "row": 6,
            "column": 7
          },
          {
            "row": 6,
            "column": 8
          },
          {
            "row": 7,
            "column": 6
          },
          {
            "row": 7,
            "column": 7
          },
          {
            "row": 7,
            "column": 8
          },
          {
            "row": 8,
            "column": 6
          },
          {
            "row": 8,
            "column": 7
          },
          {
            "row": 8,
            "column": 8
          }
        ]
      }
    ],
    "placed_gems": [],
    "is_valid": true,
    "can_enter_combat": false,
    "prompts": [
      "空盘不可进入战斗"
    ],
    "highlights": {
      "same_row": [],
      "same_column": [],
      "same_box": [],
      "adjacent": []
    },
    "influence_preview": [],
    "skill_preview": []
  },
  "skill_preview": [],
  "skill_error": "空盘不可进入战斗",
  "combat": null,
  "drops": [],
  "logs": [
    "已清空物品栏，并加入 16 个 TLIDB 主动技能宝石。"
  ],
  "player_stats": {
    "strength": {
      "label_text": "力量",
      "value": 10,
      "value_type": "number",
      "category": "base_attribute",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 10.0
      }
    },
    "dexterity": {
      "label_text": "敏捷",
      "value": 10,
      "value_type": "number",
      "category": "base_attribute",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 10.0
      }
    },
    "intelligence": {
      "label_text": "智慧",
      "value": 10,
      "value_type": "number",
      "category": "base_attribute",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 10.0
      }
    },
    "max_life": {
      "label_text": "最大生命",
      "value": 500.0,
      "value_type": "number",
      "category": "base_survival",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 495.0,
        "primary_attribute": 5.0
      }
    },
    "current_life": {
      "label_text": "当前生命",
      "value": 500,
      "value_type": "number",
      "category": "runtime_survival",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 500.0
      }
    },
    "life_regen_flat": {
      "label_text": "每秒生命回复",
      "value": 10,
      "value_type": "number",
      "category": "recovery",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 10.0
      }
    },
    "life_return_percent": {
      "label_text": "生命返还",
      "value": 0,
      "value_type": "percent",
      "category": "recovery",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "max_mana": {
      "label_text": "最大魔力",
      "value": 100.0,
      "value_type": "number",
      "category": "resource",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 95.0,
        "primary_attribute": 5.0
      }
    },
    "current_mana": {
      "label_text": "当前魔力",
      "value": 100,
      "value_type": "number",
      "category": "resource",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 100.0
      }
    },
    "mana_regen_flat": {
      "label_text": "每秒魔力回复",
      "value": 8,
      "value_type": "number",
      "category": "resource",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 8.0
      }
    },
    "mana_cost_multiplier_percent": {
      "label_text": "魔力消耗倍率",
      "value": 100,
      "value_type": "percent",
      "category": "resource",
      "v1_status": "V1_RESERVED",
      "runtime_effective": false,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 100.0
      }
    },
    "mana_seal_percent": {
      "label_text": "魔力封印比例",
      "value": 0,
      "value_type": "percent",
      "category": "resource",
      "v1_status": "V1_RESERVED",
      "runtime_effective": false,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "max_energy_shield": {
      "label_text": "最大能量护盾",
      "value": 0,
      "value_type": "number",
      "category": "energy_shield",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "current_energy_shield": {
      "label_text": "当前能量护盾",
      "value": 0,
      "value_type": "number",
      "category": "energy_shield",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "energy_shield_charge_speed_percent": {
      "label_text": "护盾充能速度",
      "value": 0,
      "value_type": "percent",
      "category": "energy_shield",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "energy_shield_charge_delay_ms": {
      "label_text": "护盾充能延迟",
      "value": 2000,
      "value_type": "integer",
      "category": "energy_shield",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 2000.0
      }
    },
    "shield_return_percent": {
      "label_text": "护盾返还",
      "value": 0,
      "value_type": "percent",
      "category": "energy_shield",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "move_speed": {
      "label_text": "移动速度",
      "value": 250.0,
      "value_type": "number",
      "category": "base_mobility",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 1.0
      }
    },
    "support_link_limit": {
      "label_text": "单宝石最大辅助连接数",
      "value": 8,
      "value_type": "integer",
      "category": "board_rule",
      "v1_status": "V1_RESERVED",
      "runtime_effective": false,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 8.0
      }
    },
    "physical_damage_add_percent": {
      "label_text": "物理伤害提高",
      "value": 0,
      "value_type": "percent",
      "category": "damage_type",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "fire_damage_add_percent": {
      "label_text": "火焰伤害提高",
      "value": 0,
      "value_type": "percent",
      "category": "damage_type",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "cold_damage_add_percent": {
      "label_text": "冰霜伤害提高",
      "value": 0,
      "value_type": "percent",
      "category": "damage_type",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "lightning_damage_add_percent": {
      "label_text": "闪电伤害提高",
      "value": 0,
      "value_type": "percent",
      "category": "damage_type",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "chaos_damage_add_percent": {
      "label_text": "混沌伤害提高",
      "value": 0,
      "value_type": "percent",
      "category": "damage_type",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "elemental_damage_add_percent": {
      "label_text": "元素伤害提高",
      "value": 0,
      "value_type": "percent",
      "category": "damage_type",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "non_physical_damage_add_percent": {
      "label_text": "非物理伤害提高",
      "value": 0,
      "value_type": "percent",
      "category": "damage_type",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "all_damage_type_add_percent": {
      "label_text": "所有伤害类型提高",
      "value": 0,
      "value_type": "percent",
      "category": "damage_type",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "hit_damage_add_percent": {
      "label_text": "击中伤害提高",
      "value": 0,
      "value_type": "percent",
      "category": "damage_form",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "dot_damage_add_percent": {
      "label_text": "持续伤害提高",
      "value": 0,
      "value_type": "percent",
      "category": "damage_form",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "secondary_damage_add_percent": {
      "label_text": "次级伤害提高",
      "value": 0,
      "value_type": "percent",
      "category": "damage_form",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "ailment_damage_add_percent": {
      "label_text": "异常伤害提高",
      "value": 0,
      "value_type": "percent",
      "category": "damage_form",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "ailment_damage_deepen_percent": {
      "label_text": "异常伤害加深",
      "value": 0,
      "value_type": "percent",
      "category": "damage_form",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "minion_damage_add_percent": {
      "label_text": "召唤物伤害提高",
      "value": 0,
      "value_type": "percent",
      "category": "damage_form",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "attack_damage_add_percent": {
      "label_text": "攻击伤害提高",
      "value": 0,
      "value_type": "percent",
      "category": "skill_tag",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "spell_damage_add_percent": {
      "label_text": "法术伤害提高",
      "value": 0,
      "value_type": "percent",
      "category": "skill_tag",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "melee_damage_add_percent": {
      "label_text": "近战伤害提高",
      "value": 2.0,
      "value_type": "percent",
      "category": "skill_tag",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0,
        "primary_attribute": 2.0
      }
    },
    "ranged_damage_add_percent": {
      "label_text": "远程伤害提高",
      "value": 0,
      "value_type": "percent",
      "category": "skill_tag",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "projectile_damage_add_percent": {
      "label_text": "投射物伤害提高",
      "value": 0,
      "value_type": "percent",
      "category": "skill_tag",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "area_damage_add_percent": {
      "label_text": "范围伤害提高",
      "value": 0,
      "value_type": "percent",
      "category": "skill_tag",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "chain_damage_add_percent": {
      "label_text": "连锁伤害提高",
      "value": 0,
      "value_type": "percent",
      "category": "skill_tag",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "pierce_damage_add_percent": {
      "label_text": "穿透伤害提高",
      "value": 0,
      "value_type": "percent",
      "category": "skill_tag",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "orbit_damage_add_percent": {
      "label_text": "环绕伤害提高",
      "value": 0,
      "value_type": "percent",
      "category": "skill_tag",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "trap_mine_damage_add_percent": {
      "label_text": "放置物伤害提高",
      "value": 0,
      "value_type": "percent",
      "category": "skill_tag",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "aura_effect_add_percent": {
      "label_text": "光环效果提高",
      "value": 0,
      "value_type": "percent",
      "category": "effect",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "buff_effect_add_percent": {
      "label_text": "增益效果提高",
      "value": 0,
      "value_type": "percent",
      "category": "effect",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "damage_add_percent": {
      "label_text": "伤害提高",
      "value": 0,
      "value_type": "percent",
      "category": "combat",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "damage_final_percent": {
      "label_text": "最终伤害修正",
      "value": 0,
      "value_type": "percent",
      "category": "combat",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "damage_taken_final_percent": {
      "label_text": "敌人受到伤害提高",
      "value": 0,
      "value_type": "percent",
      "category": "combat",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "hit_damage_final_percent": {
      "label_text": "最终击中伤害",
      "value": 0,
      "value_type": "percent",
      "category": "combat",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "dot_damage_final_percent": {
      "label_text": "最终持续伤害",
      "value": 0,
      "value_type": "percent",
      "category": "combat",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "skill_damage_effectiveness_percent": {
      "label_text": "技能伤害效用",
      "value": 100,
      "value_type": "percent",
      "category": "combat",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 100.0
      }
    },
    "double_damage_chance_percent": {
      "label_text": "双倍伤害概率",
      "value": 0,
      "value_type": "percent",
      "category": "combat",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "resistance_penetration_percent": {
      "label_text": "抗性穿透",
      "value": 0,
      "value_type": "percent",
      "category": "combat",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "conversion_physical_to_fire_percent": {
      "label_text": "物理转火焰",
      "value": 0,
      "value_type": "percent",
      "category": "conversion",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "conversion_physical_to_cold_percent": {
      "label_text": "物理转冰霜",
      "value": 0,
      "value_type": "percent",
      "category": "conversion",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "conversion_physical_to_lightning_percent": {
      "label_text": "物理转闪电",
      "value": 0,
      "value_type": "percent",
      "category": "conversion",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "conversion_physical_to_chaos_percent": {
      "label_text": "物理转混沌",
      "value": 0,
      "value_type": "percent",
      "category": "conversion",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "conversion_lightning_to_cold_percent": {
      "label_text": "闪电转冰霜",
      "value": 0,
      "value_type": "percent",
      "category": "conversion",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "conversion_lightning_to_fire_percent": {
      "label_text": "闪电转火焰",
      "value": 0,
      "value_type": "percent",
      "category": "conversion",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "conversion_lightning_to_chaos_percent": {
      "label_text": "闪电转混沌",
      "value": 0,
      "value_type": "percent",
      "category": "conversion",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "conversion_cold_to_fire_percent": {
      "label_text": "冰霜转火焰",
      "value": 0,
      "value_type": "percent",
      "category": "conversion",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "conversion_cold_to_chaos_percent": {
      "label_text": "冰霜转混沌",
      "value": 0,
      "value_type": "percent",
      "category": "conversion",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "conversion_fire_to_chaos_percent": {
      "label_text": "火焰转混沌",
      "value": 0,
      "value_type": "percent",
      "category": "conversion",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "attack_speed_add_percent": {
      "label_text": "攻击速度提高",
      "value": 2.0,
      "value_type": "percent",
      "category": "speed",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0,
        "primary_attribute": 2.0
      }
    },
    "cast_speed_add_percent": {
      "label_text": "施法速度提高",
      "value": 2.0,
      "value_type": "percent",
      "category": "speed",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0,
        "primary_attribute": 2.0
      }
    },
    "skill_speed_final_percent": {
      "label_text": "最终技能速度",
      "value": 0,
      "value_type": "percent",
      "category": "speed",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "cooldown_recovery_add_percent": {
      "label_text": "冷却回复速度提高",
      "value": 0,
      "value_type": "percent",
      "category": "speed",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "added_cooldown_ms": {
      "label_text": "附加冷却",
      "value": 0,
      "value_type": "integer",
      "category": "speed",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "cooldown_recovery_final_percent": {
      "label_text": "最终冷却恢复",
      "value": 0,
      "value_type": "percent",
      "category": "speed",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "projectile_speed_add_percent": {
      "label_text": "投射物速度提高",
      "value": 0,
      "value_type": "percent",
      "category": "speed",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "base_crit_chance_percent": {
      "label_text": "基础暴击率",
      "value": 5,
      "value_type": "percent",
      "category": "crit",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 5.0
      }
    },
    "crit_chance_add_percent": {
      "label_text": "暴击率提高",
      "value": 0,
      "value_type": "percent",
      "category": "crit",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "crit_rating": {
      "label_text": "暴击值",
      "value": 0,
      "value_type": "number",
      "category": "crit",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "crit_damage_rating": {
      "label_text": "暴击伤害值",
      "value": 0,
      "value_type": "number",
      "category": "crit",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "crit_damage_add_percent": {
      "label_text": "暴击伤害提高",
      "value": 0,
      "value_type": "percent",
      "category": "crit",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "crit_damage_final_percent": {
      "label_text": "最终暴击伤害",
      "value": 0,
      "value_type": "percent",
      "category": "crit",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "derived_crit_chance_percent": {
      "label_text": "暴击率",
      "value": 5.0,
      "value_type": "percent",
      "category": "crit",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0,
        "derived": 5.0
      }
    },
    "derived_crit_damage_percent": {
      "label_text": "暴击伤害",
      "value": 150.0,
      "value_type": "percent",
      "category": "crit",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 150.0,
        "derived": 150.0
      }
    },
    "crit_damage_taken_reduction_percent": {
      "label_text": "暴击伤害减免",
      "value": 0,
      "value_type": "percent",
      "category": "crit",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "cannot_crit": {
      "label_text": "无法暴击",
      "value": false,
      "value_type": "boolean",
      "category": "crit",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {}
    },
    "prevent_elemental_ailments": {
      "label_text": "无法造成点燃/冰结/麻痹",
      "value": false,
      "value_type": "boolean",
      "category": "status",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {}
    },
    "area_add_percent": {
      "label_text": "范围提高",
      "value": 0,
      "value_type": "percent",
      "category": "behavior",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "slash_chance_add_percent": {
      "label_text": "斩击几率提高",
      "value": 0,
      "value_type": "percent",
      "category": "behavior",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "continuous_attack_chance_percent": {
      "label_text": "连续攻击几率",
      "value": 0,
      "value_type": "percent",
      "category": "behavior",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "continuous_attack_damage_step_percent": {
      "label_text": "连续攻击伤害递增",
      "value": 0,
      "value_type": "percent",
      "category": "behavior",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "continuous_attack_damage_step_final_percent": {
      "label_text": "连续攻击伤害额外递增",
      "value": 0,
      "value_type": "percent",
      "category": "behavior",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "area_final_percent": {
      "label_text": "最终范围",
      "value": 0,
      "value_type": "percent",
      "category": "behavior",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "projectile_count_add": {
      "label_text": "投射物数量增加",
      "value": 0,
      "value_type": "integer",
      "category": "behavior",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "split_projectile_chance_percent": {
      "label_text": "分裂触发几率",
      "value": 0,
      "value_type": "percent",
      "category": "behavior",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "split_projectile_count_add": {
      "label_text": "分裂数量增加",
      "value": 0,
      "value_type": "integer",
      "category": "behavior",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "projectile_spread_angle_add": {
      "label_text": "投射物散射角增加",
      "value": 0,
      "value_type": "number",
      "category": "behavior",
      "v1_status": "V1_DISPLAY_ONLY",
      "runtime_effective": false,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "chain_count_add": {
      "label_text": "连锁次数增加",
      "value": 0,
      "value_type": "integer",
      "category": "behavior",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "bounce_count_add": {
      "label_text": "弹射次数增加",
      "value": 0,
      "value_type": "integer",
      "category": "behavior",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "pierce_count_add": {
      "label_text": "穿透次数增加",
      "value": 0,
      "value_type": "integer",
      "category": "behavior",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "duration_add_percent": {
      "label_text": "持续时间提高",
      "value": 0,
      "value_type": "percent",
      "category": "behavior",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "guard_trigger_count": {
      "label_text": "守护触发次数",
      "value": 0,
      "value_type": "integer",
      "category": "buff",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "guard_internal_cooldown_ms": {
      "label_text": "守护内置冷却",
      "value": 0,
      "value_type": "integer",
      "category": "buff",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "skill_effect_frequency_add_percent": {
      "label_text": "技能效果频率提高",
      "value": 0,
      "value_type": "percent",
      "category": "behavior",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "explosion_radius_add_percent": {
      "label_text": "爆炸范围提高",
      "value": 0,
      "value_type": "percent",
      "category": "behavior",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "status_chance_add_percent": {
      "label_text": "状态施加概率提高",
      "value": 0,
      "value_type": "percent",
      "category": "status",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "ignite_chance_add_percent": {
      "label_text": "点燃概率提高",
      "value": 0,
      "value_type": "percent",
      "category": "status",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "frostbite_chance_add_percent": {
      "label_text": "冰结概率提高",
      "value": 0,
      "value_type": "percent",
      "category": "status",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "shock_chance_add_percent": {
      "label_text": "触电概率提高",
      "value": 0,
      "value_type": "percent",
      "category": "status",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "trauma_chance_add_percent": {
      "label_text": "创伤概率提高",
      "value": 0,
      "value_type": "percent",
      "category": "status",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "armor": {
      "label_text": "护甲",
      "value": 0,
      "value_type": "number",
      "category": "defense",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "armor_add_percent": {
      "label_text": "护甲提高",
      "value": 0,
      "value_type": "percent",
      "category": "defense",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "evasion": {
      "label_text": "闪避",
      "value": 0,
      "value_type": "number",
      "category": "defense",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "evasion_add_percent": {
      "label_text": "闪避提高",
      "value": 2.0,
      "value_type": "percent",
      "category": "defense",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0,
        "primary_attribute": 2.0
      }
    },
    "attack_block_chance_percent": {
      "label_text": "攻击格挡率",
      "value": 0,
      "value_type": "percent",
      "category": "defense",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "spell_block_chance_percent": {
      "label_text": "法术格挡率",
      "value": 0,
      "value_type": "percent",
      "category": "defense",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "block_damage_reduction_percent": {
      "label_text": "格挡减伤比例",
      "value": 0,
      "value_type": "percent",
      "category": "defense",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "damage_mitigation_final_percent": {
      "label_text": "最终伤害减免",
      "value": 0,
      "value_type": "percent",
      "category": "defense",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "physical_damage_reduction_percent": {
      "label_text": "物理伤害减免",
      "value": 0,
      "value_type": "percent",
      "category": "defense",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "fire_resistance_percent": {
      "label_text": "火焰抗性",
      "value": 0,
      "value_type": "percent",
      "category": "resistance",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "cold_resistance_percent": {
      "label_text": "冰霜抗性",
      "value": 0,
      "value_type": "percent",
      "category": "resistance",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "lightning_resistance_percent": {
      "label_text": "闪电抗性",
      "value": 0,
      "value_type": "percent",
      "category": "resistance",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "chaos_resistance_percent": {
      "label_text": "混沌抗性",
      "value": 0,
      "value_type": "percent",
      "category": "resistance",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "elemental_resistance_percent": {
      "label_text": "元素抗性",
      "value": 0,
      "value_type": "percent",
      "category": "resistance",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "gem_drop_quantity_add_percent": {
      "label_text": "宝石掉落数量提高",
      "value": 0,
      "value_type": "percent",
      "category": "loot_growth",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "gem_drop_rarity_add_percent": {
      "label_text": "宝石掉落稀有度提高",
      "value": 0,
      "value_type": "percent",
      "category": "loot_growth",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "active_gem_level_add": {
      "label_text": "主动宝石等级增加",
      "value": 0,
      "value_type": "integer",
      "category": "loot_growth",
      "v1_status": "V1_RESERVED",
      "runtime_effective": false,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "passive_gem_level_add": {
      "label_text": "被动宝石等级增加",
      "value": 0,
      "value_type": "integer",
      "category": "loot_growth",
      "v1_status": "V1_RESERVED",
      "runtime_effective": false,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "support_gem_level_add": {
      "label_text": "辅助宝石等级增加",
      "value": 0,
      "value_type": "integer",
      "category": "loot_growth",
      "v1_status": "V1_RESERVED",
      "runtime_effective": false,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "player_level": {
      "label_text": "玩家等级",
      "value": 1,
      "value_type": "integer",
      "category": "loot_growth",
      "v1_status": "V1_RESERVED",
      "runtime_effective": false,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 1.0
      }
    },
    "gem_level": {
      "label_text": "宝石等级",
      "value": 1,
      "value_type": "integer",
      "category": "loot_growth",
      "v1_status": "V1_RESERVED",
      "runtime_effective": false,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 1.0
      }
    },
    "source_power_row": {
      "label_text": "同行来源强度",
      "value": 0,
      "value_type": "percent",
      "category": "sudoku_relation",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "source_power_column": {
      "label_text": "同列来源强度",
      "value": 0,
      "value_type": "percent",
      "category": "sudoku_relation",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "source_power_box": {
      "label_text": "同宫来源强度",
      "value": 0,
      "value_type": "percent",
      "category": "sudoku_relation",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "source_power_adjacent": {
      "label_text": "相邻来源强度",
      "value": 0,
      "value_type": "percent",
      "category": "sudoku_relation",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "target_power_row": {
      "label_text": "同行接受强度",
      "value": 0,
      "value_type": "percent",
      "category": "sudoku_relation",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "target_power_column": {
      "label_text": "同列接受强度",
      "value": 0,
      "value_type": "percent",
      "category": "sudoku_relation",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "target_power_box": {
      "label_text": "同宫接受强度",
      "value": 0,
      "value_type": "percent",
      "category": "sudoku_relation",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "target_power_adjacent": {
      "label_text": "相邻接受强度",
      "value": 0,
      "value_type": "percent",
      "category": "sudoku_relation",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "conduit_power_row": {
      "label_text": "行导管强度",
      "value": 0,
      "value_type": "percent",
      "category": "sudoku_relation",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "conduit_power_column": {
      "label_text": "列导管强度",
      "value": 0,
      "value_type": "percent",
      "category": "sudoku_relation",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "conduit_power_box": {
      "label_text": "宫导管强度",
      "value": 0,
      "value_type": "percent",
      "category": "sudoku_relation",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": true,
      "trace": {
        "base": 0.0
      }
    },
    "relation_effect_final_percent": {
      "label_text": "关系效果最终修正",
      "value": 0,
      "value_type": "percent",
      "category": "sudoku_relation",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    },
    "adjacent_bonus_final_percent": {
      "label_text": "相邻关系最终加成",
      "value": 0,
      "value_type": "percent",
      "category": "sudoku_relation",
      "v1_status": "V1_ACTIVE",
      "runtime_effective": true,
      "affix_spawn_enabled_v1": false,
      "trace": {
        "base": 0.0
      }
    }
  },
  "character_panel": {
    "sections": [
      {
        "id": "attributes",
        "title_text": "基础属性",
        "layout": "attributes",
        "rows": [
          {
            "id": "strength",
            "stat_id": "strength",
            "label_text": "力量",
            "value": 10,
            "value_type": "number",
            "formatter": "integer",
            "icon_text": "?",
            "tone": "life",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "dexterity",
            "stat_id": "dexterity",
            "label_text": "敏捷",
            "value": 10,
            "value_type": "number",
            "formatter": "integer",
            "icon_text": "?",
            "tone": "evasion",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "intelligence",
            "stat_id": "intelligence",
            "label_text": "智慧",
            "value": 10,
            "value_type": "number",
            "formatter": "integer",
            "icon_text": "?",
            "tone": "mana",
            "v1_status": "V1_ACTIVE"
          }
        ]
      },
      {
        "id": "core",
        "title_text": "核心属性",
        "layout": "core",
        "rows": [
          {
            "id": "current_life",
            "stat_id": "current_life",
            "label_text": "当前生命",
            "value": 500,
            "value_type": "number",
            "formatter": "integer",
            "icon_text": "?",
            "tone": "life",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "current_energy_shield",
            "stat_id": "current_energy_shield",
            "label_text": "当前能量护盾",
            "value": 0,
            "value_type": "number",
            "formatter": "integer",
            "icon_text": "?",
            "tone": "shield",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "current_mana",
            "stat_id": "current_mana",
            "label_text": "当前魔力",
            "value": 100,
            "value_type": "number",
            "formatter": "integer",
            "icon_text": "?",
            "tone": "mana",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "armor",
            "stat_id": "armor",
            "label_text": "护甲",
            "value": 0,
            "value_type": "number",
            "formatter": "integer",
            "icon_text": "?",
            "tone": "armor",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "evasion",
            "stat_id": "evasion",
            "label_text": "闪避",
            "value": 0,
            "value_type": "number",
            "formatter": "integer",
            "icon_text": "?",
            "tone": "evasion",
            "v1_status": "V1_ACTIVE"
          }
        ]
      },
      {
        "id": "life",
        "title_text": "生命",
        "layout": "detail",
        "rows": [
          {
            "id": "max_life",
            "stat_id": "max_life",
            "label_text": "最大生命",
            "value": 500.0,
            "value_type": "number",
            "formatter": "number",
            "icon_text": "?",
            "tone": "life",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "life_regen_flat",
            "stat_id": "life_regen_flat",
            "label_text": "每秒生命回复",
            "value": 10,
            "value_type": "number",
            "formatter": "number",
            "icon_text": "?",
            "tone": "life",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "life_return_percent",
            "stat_id": "life_return_percent",
            "label_text": "生命返还",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "life",
            "v1_status": "V1_ACTIVE"
          }
        ]
      },
      {
        "id": "mana",
        "title_text": "魔力",
        "layout": "detail",
        "rows": [
          {
            "id": "max_mana",
            "stat_id": "max_mana",
            "label_text": "最大魔力",
            "value": 100.0,
            "value_type": "number",
            "formatter": "number",
            "icon_text": "?",
            "tone": "mana",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "mana_regen_flat",
            "stat_id": "mana_regen_flat",
            "label_text": "每秒魔力回复",
            "value": 8,
            "value_type": "number",
            "formatter": "number",
            "icon_text": "?",
            "tone": "mana",
            "v1_status": "V1_ACTIVE"
          }
        ]
      },
      {
        "id": "energy_shield",
        "title_text": "能量护盾",
        "layout": "detail",
        "rows": [
          {
            "id": "max_energy_shield",
            "stat_id": "max_energy_shield",
            "label_text": "最大能量护盾",
            "value": 0,
            "value_type": "number",
            "formatter": "number",
            "icon_text": "?",
            "tone": "shield",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "energy_shield_charge_speed_percent",
            "stat_id": "energy_shield_charge_speed_percent",
            "label_text": "护盾充能速度",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "shield",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "energy_shield_charge_delay_ms",
            "stat_id": "energy_shield_charge_delay_ms",
            "label_text": "护盾充能延迟",
            "value": 2000,
            "value_type": "integer",
            "formatter": "seconds_from_ms",
            "icon_text": "?",
            "tone": "shield",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "shield_return_percent",
            "stat_id": "shield_return_percent",
            "label_text": "护盾返还",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "shield",
            "v1_status": "V1_ACTIVE"
          }
        ]
      },
      {
        "id": "defense",
        "title_text": "防御",
        "layout": "detail",
        "rows": [
          {
            "id": "armor_add_percent",
            "stat_id": "armor_add_percent",
            "label_text": "护甲提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "armor",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "evasion_add_percent",
            "stat_id": "evasion_add_percent",
            "label_text": "闪避提高",
            "value": 2.0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "evasion",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "physical_damage_reduction_percent",
            "stat_id": "physical_damage_reduction_percent",
            "label_text": "物理伤害减免",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "armor",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "damage_mitigation_final_percent",
            "stat_id": "damage_mitigation_final_percent",
            "label_text": "最终伤害减免",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "armor",
            "v1_status": "V1_ACTIVE"
          }
        ]
      },
      {
        "id": "block",
        "title_text": "格挡",
        "layout": "detail",
        "rows": [
          {
            "id": "attack_block_chance_percent",
            "stat_id": "attack_block_chance_percent",
            "label_text": "攻击格挡率",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "armor",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "spell_block_chance_percent",
            "stat_id": "spell_block_chance_percent",
            "label_text": "法术格挡率",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "shield",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "block_damage_reduction_percent",
            "stat_id": "block_damage_reduction_percent",
            "label_text": "格挡减伤比例",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "armor",
            "v1_status": "V1_ACTIVE"
          }
        ]
      },
      {
        "id": "resistances",
        "title_text": "抗性",
        "layout": "resistance",
        "rows": [
          {
            "id": "fire_resistance_percent",
            "stat_id": "fire_resistance_percent",
            "label_text": "火焰抗性",
            "value": 0.0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "fire",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "cold_resistance_percent",
            "stat_id": "cold_resistance_percent",
            "label_text": "冰霜抗性",
            "value": 0.0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "cold",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "lightning_resistance_percent",
            "stat_id": "lightning_resistance_percent",
            "label_text": "闪电抗性",
            "value": 0.0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "lightning",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "chaos_resistance_percent",
            "stat_id": "chaos_resistance_percent",
            "label_text": "混沌抗性",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "shadow",
            "v1_status": "V1_ACTIVE"
          }
        ]
      },
      {
        "id": "mobility",
        "title_text": "机动性",
        "layout": "detail",
        "rows": [
          {
            "id": "move_speed",
            "stat_id": "move_speed",
            "label_text": "移动速度",
            "value": 250.0,
            "value_type": "number",
            "formatter": "number",
            "icon_text": "?",
            "tone": "evasion",
            "v1_status": "V1_ACTIVE"
          }
        ]
      },
      {
        "id": "damage_overview",
        "title_text": "伤害总览",
        "layout": "detail",
        "rows": [
          {
            "id": "damage_add_percent",
            "stat_id": "damage_add_percent",
            "label_text": "伤害提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "fire",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "damage_final_percent",
            "stat_id": "damage_final_percent",
            "label_text": "最终伤害修正",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "fire",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "hit_damage_add_percent",
            "stat_id": "hit_damage_add_percent",
            "label_text": "击中伤害提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "fire",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "hit_damage_final_percent",
            "stat_id": "hit_damage_final_percent",
            "label_text": "最终击中伤害",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "fire",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "dot_damage_add_percent",
            "stat_id": "dot_damage_add_percent",
            "label_text": "持续伤害提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "shadow",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "dot_damage_final_percent",
            "stat_id": "dot_damage_final_percent",
            "label_text": "最终持续伤害",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "shadow",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "ailment_damage_add_percent",
            "stat_id": "ailment_damage_add_percent",
            "label_text": "异常伤害提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "shadow",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "ailment_damage_deepen_percent",
            "stat_id": "ailment_damage_deepen_percent",
            "label_text": "异常伤害加深",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "shadow",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "secondary_damage_add_percent",
            "stat_id": "secondary_damage_add_percent",
            "label_text": "次级伤害提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "fire",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "minion_damage_add_percent",
            "stat_id": "minion_damage_add_percent",
            "label_text": "召唤物伤害提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "mana",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "damage_taken_final_percent",
            "stat_id": "damage_taken_final_percent",
            "label_text": "敌人受到伤害提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "shadow",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "skill_damage_effectiveness_percent",
            "stat_id": "skill_damage_effectiveness_percent",
            "label_text": "技能伤害效用",
            "value": 100,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "fire",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "double_damage_chance_percent",
            "stat_id": "double_damage_chance_percent",
            "label_text": "双倍伤害概率",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "fire",
            "v1_status": "V1_ACTIVE"
          }
        ]
      },
      {
        "id": "skill_type",
        "title_text": "技能类型",
        "layout": "detail",
        "rows": [
          {
            "id": "attack_damage_add_percent",
            "stat_id": "attack_damage_add_percent",
            "label_text": "攻击伤害提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "fire",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "spell_damage_add_percent",
            "stat_id": "spell_damage_add_percent",
            "label_text": "法术伤害提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "mana",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "melee_damage_add_percent",
            "stat_id": "melee_damage_add_percent",
            "label_text": "近战伤害提高",
            "value": 2.0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "armor",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "ranged_damage_add_percent",
            "stat_id": "ranged_damage_add_percent",
            "label_text": "远程伤害提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "evasion",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "projectile_damage_add_percent",
            "stat_id": "projectile_damage_add_percent",
            "label_text": "投射物伤害提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "evasion",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "area_damage_add_percent",
            "stat_id": "area_damage_add_percent",
            "label_text": "范围伤害提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "cold",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "chain_damage_add_percent",
            "stat_id": "chain_damage_add_percent",
            "label_text": "连锁伤害提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "lightning",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "pierce_damage_add_percent",
            "stat_id": "pierce_damage_add_percent",
            "label_text": "穿透伤害提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "evasion",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "orbit_damage_add_percent",
            "stat_id": "orbit_damage_add_percent",
            "label_text": "环绕伤害提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "fire",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "trap_mine_damage_add_percent",
            "stat_id": "trap_mine_damage_add_percent",
            "label_text": "放置物伤害提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "shadow",
            "v1_status": "V1_ACTIVE"
          }
        ]
      },
      {
        "id": "speed_cooldown",
        "title_text": "速度与冷却",
        "layout": "detail",
        "rows": [
          {
            "id": "attack_speed_add_percent",
            "stat_id": "attack_speed_add_percent",
            "label_text": "攻击速度提高",
            "value": 2.0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "evasion",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "cast_speed_add_percent",
            "stat_id": "cast_speed_add_percent",
            "label_text": "施法速度提高",
            "value": 2.0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "mana",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "skill_speed_final_percent",
            "stat_id": "skill_speed_final_percent",
            "label_text": "最终技能速度",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "evasion",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "cooldown_recovery_add_percent",
            "stat_id": "cooldown_recovery_add_percent",
            "label_text": "冷却回复速度提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "cold",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "added_cooldown_ms",
            "stat_id": "added_cooldown_ms",
            "label_text": "附加冷却",
            "value": 0,
            "value_type": "integer",
            "formatter": "seconds_from_ms",
            "icon_text": "?",
            "tone": "cold",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "cooldown_recovery_final_percent",
            "stat_id": "cooldown_recovery_final_percent",
            "label_text": "最终冷却恢复",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "cold",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "projectile_speed_add_percent",
            "stat_id": "projectile_speed_add_percent",
            "label_text": "投射物速度提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "evasion",
            "v1_status": "V1_ACTIVE"
          }
        ]
      },
      {
        "id": "crit",
        "title_text": "暴击",
        "layout": "detail",
        "rows": [
          {
            "id": "crit_rating",
            "stat_id": "crit_rating",
            "label_text": "暴击值",
            "value": 0,
            "value_type": "number",
            "formatter": "rating",
            "icon_text": "?",
            "tone": "fire",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "derived_crit_chance_percent",
            "stat_id": "derived_crit_chance_percent",
            "label_text": "暴击率",
            "value": 5.0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "fire",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "crit_damage_rating",
            "stat_id": "crit_damage_rating",
            "label_text": "暴击伤害值",
            "value": 0,
            "value_type": "number",
            "formatter": "rating",
            "icon_text": "?",
            "tone": "fire",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "derived_crit_damage_percent",
            "stat_id": "derived_crit_damage_percent",
            "label_text": "暴击伤害",
            "value": 150.0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "fire",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "crit_damage_taken_reduction_percent",
            "stat_id": "crit_damage_taken_reduction_percent",
            "label_text": "暴击伤害减免",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "evasion",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "cannot_crit",
            "stat_id": "cannot_crit",
            "label_text": "无法暴击",
            "value": false,
            "value_type": "boolean",
            "formatter": "boolean",
            "icon_text": "?",
            "tone": "shadow",
            "v1_status": "V1_ACTIVE"
          }
        ]
      },
      {
        "id": "status",
        "title_text": "异常",
        "layout": "detail",
        "rows": [
          {
            "id": "status_chance_add_percent",
            "stat_id": "status_chance_add_percent",
            "label_text": "状态施加概率提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "shadow",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "ignite_chance_add_percent",
            "stat_id": "ignite_chance_add_percent",
            "label_text": "点燃概率提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "fire",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "frostbite_chance_add_percent",
            "stat_id": "frostbite_chance_add_percent",
            "label_text": "冰结概率提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "cold",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "shock_chance_add_percent",
            "stat_id": "shock_chance_add_percent",
            "label_text": "触电概率提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "lightning",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "trauma_chance_add_percent",
            "stat_id": "trauma_chance_add_percent",
            "label_text": "创伤概率提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "armor",
            "v1_status": "V1_ACTIVE"
          }
        ]
      },
      {
        "id": "effects",
        "title_text": "效果",
        "layout": "detail",
        "rows": [
          {
            "id": "aura_effect_add_percent",
            "stat_id": "aura_effect_add_percent",
            "label_text": "光环效果提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "mana",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "buff_effect_add_percent",
            "stat_id": "buff_effect_add_percent",
            "label_text": "增益效果提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "mana",
            "v1_status": "V1_ACTIVE"
          }
        ]
      },
      {
        "id": "conversion",
        "title_text": "转化",
        "layout": "detail",
        "rows": [
          {
            "id": "conversion_physical_to_fire_percent",
            "stat_id": "conversion_physical_to_fire_percent",
            "label_text": "物理转火焰",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "fire",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "conversion_physical_to_cold_percent",
            "stat_id": "conversion_physical_to_cold_percent",
            "label_text": "物理转冰霜",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "cold",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "conversion_physical_to_lightning_percent",
            "stat_id": "conversion_physical_to_lightning_percent",
            "label_text": "物理转闪电",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "lightning",
            "v1_status": "V1_ACTIVE"
          }
        ]
      },
      {
        "id": "drops",
        "title_text": "掉落",
        "layout": "detail",
        "rows": [
          {
            "id": "gem_drop_quantity_add_percent",
            "stat_id": "gem_drop_quantity_add_percent",
            "label_text": "宝石掉落数量提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "mana",
            "v1_status": "V1_ACTIVE"
          },
          {
            "id": "gem_drop_rarity_add_percent",
            "stat_id": "gem_drop_rarity_add_percent",
            "label_text": "宝石掉落稀有度提高",
            "value": 0,
            "value_type": "percent",
            "formatter": "percent",
            "icon_text": "?",
            "tone": "mana",
            "v1_status": "V1_ACTIVE"
          }
        ]
      }
    ]
  },
  "equipment_slots": [
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null
  ],
  "map_progression": {
    "selected_stage_id": "start_i",
    "stages": [
      {
        "id": "start_i",
        "display_name": "起始区域 I",
        "phase": "growth",
        "order": 1,
        "map_level_min": 1,
        "map_level_max": 9,
        "map_level_text": "1-9",
        "monster_level": 5,
        "entry_cost": 0,
        "free_entry": true,
        "entry_count": 0,
        "unlocked": true,
        "enterable": true,
        "selected": true,
        "boss_stage": false,
        "gem_level_min": 1,
        "gem_level_max": 3,
        "base_drop_chance": 0.10,
        "equipment_rarity_weights": {
          "white": 760,
          "blue": 220,
          "purple": 20,
          "pink": 0
        },
        "gem_rarity_weights": {
          "normal": 850,
          "magic": 130,
          "rare": 20
        }
      },
      {
        "id": "start_ii",
        "display_name": "起始区域 II",
        "phase": "growth",
        "order": 2,
        "map_level_min": 10,
        "map_level_max": 19,
        "map_level_text": "10-19",
        "monster_level": 15,
        "entry_cost": 1,
        "free_entry": false,
        "entry_count": 0,
        "unlocked": false,
        "enterable": false,
        "selected": false,
        "boss_stage": false,
        "gem_level_min": 1,
        "gem_level_max": 3,
        "base_drop_chance": 0.10,
        "equipment_rarity_weights": {
          "white": 760,
          "blue": 220,
          "purple": 20,
          "pink": 0
        },
        "gem_rarity_weights": {
          "normal": 850,
          "magic": 130,
          "rare": 20
        }
      },
      {
        "id": "borderland",
        "display_name": "边境区域",
        "phase": "growth",
        "order": 3,
        "map_level_min": 20,
        "map_level_max": 29,
        "map_level_text": "20-29",
        "monster_level": 25,
        "entry_cost": 1,
        "free_entry": false,
        "entry_count": 0,
        "unlocked": false,
        "enterable": false,
        "selected": false,
        "boss_stage": false,
        "gem_level_min": 3,
        "gem_level_max": 7,
        "base_drop_chance": 0.12,
        "equipment_rarity_weights": {
          "white": 700,
          "blue": 260,
          "purple": 38,
          "pink": 2
        },
        "gem_rarity_weights": {
          "normal": 760,
          "magic": 190,
          "rare": 50
        }
      },
      {
        "id": "depths",
        "display_name": "深层区域",
        "phase": "growth",
        "order": 4,
        "map_level_min": 30,
        "map_level_max": 39,
        "map_level_text": "30-39",
        "monster_level": 35,
        "entry_cost": 1,
        "free_entry": false,
        "entry_count": 0,
        "unlocked": false,
        "enterable": false,
        "selected": false,
        "boss_stage": false,
        "gem_level_min": 3,
        "gem_level_max": 7,
        "base_drop_chance": 0.12,
        "equipment_rarity_weights": {
          "white": 700,
          "blue": 260,
          "purple": 38,
          "pink": 2
        },
        "gem_rarity_weights": {
          "normal": 760,
          "magic": 190,
          "rare": 50
        }
      },
      {
        "id": "danger_i",
        "display_name": "高危区域 I",
        "phase": "growth",
        "order": 5,
        "map_level_min": 40,
        "map_level_max": 49,
        "map_level_text": "40-49",
        "monster_level": 45,
        "entry_cost": 1,
        "free_entry": false,
        "entry_count": 0,
        "unlocked": false,
        "enterable": false,
        "selected": false,
        "boss_stage": false,
        "gem_level_min": 6,
        "gem_level_max": 10,
        "base_drop_chance": 0.14,
        "equipment_rarity_weights": {
          "white": 640,
          "blue": 290,
          "purple": 65,
          "pink": 5
        },
        "gem_rarity_weights": {
          "normal": 640,
          "magic": 270,
          "rare": 90
        }
      },
      {
        "id": "danger_ii",
        "display_name": "高危区域 II",
        "phase": "growth",
        "order": 6,
        "map_level_min": 50,
        "map_level_max": 59,
        "map_level_text": "50-59",
        "monster_level": 55,
        "entry_cost": 1,
        "free_entry": false,
        "entry_count": 0,
        "unlocked": false,
        "enterable": false,
        "selected": false,
        "boss_stage": true,
        "gem_level_min": 6,
        "gem_level_max": 10,
        "base_drop_chance": 0.14,
        "equipment_rarity_weights": {
          "white": 640,
          "blue": 290,
          "purple": 65,
          "pink": 5
        },
        "gem_rarity_weights": {
          "normal": 640,
          "magic": 270,
          "rare": 90
        }
      },
      {
        "id": "timemark_1",
        "display_name": "时刻 1",
        "phase": "timemark",
        "order": 7,
        "map_level_min": 60,
        "map_level_max": 67,
        "map_level_text": "60-67",
        "monster_level": 64,
        "entry_cost": 1,
        "free_entry": false,
        "entry_count": 0,
        "unlocked": false,
        "enterable": false,
        "selected": false,
        "boss_stage": false,
        "gem_level_min": 9,
        "gem_level_max": 12,
        "base_drop_chance": 0.16,
        "equipment_rarity_weights": {
          "white": 590,
          "blue": 320,
          "purple": 80,
          "pink": 10
        },
        "gem_rarity_weights": {
          "normal": 520,
          "magic": 330,
          "rare": 150
        }
      },
      {
        "id": "timemark_2",
        "display_name": "时刻 2",
        "phase": "timemark",
        "order": 8,
        "map_level_min": 68,
        "map_level_max": 72,
        "map_level_text": "68-72",
        "monster_level": 70,
        "entry_cost": 1,
        "free_entry": false,
        "entry_count": 0,
        "unlocked": false,
        "enterable": false,
        "selected": false,
        "boss_stage": false,
        "gem_level_min": 11,
        "gem_level_max": 14,
        "base_drop_chance": 0.18,
        "equipment_rarity_weights": {
          "white": 540,
          "blue": 340,
          "purple": 100,
          "pink": 20
        },
        "gem_rarity_weights": {
          "normal": 450,
          "magic": 350,
          "rare": 200
        }
      },
      {
        "id": "timemark_3",
        "display_name": "时刻 3",
        "phase": "timemark",
        "order": 9,
        "map_level_min": 73,
        "map_level_max": 76,
        "map_level_text": "73-76",
        "monster_level": 75,
        "entry_cost": 1,
        "free_entry": false,
        "entry_count": 0,
        "unlocked": false,
        "enterable": false,
        "selected": false,
        "boss_stage": false,
        "gem_level_min": 13,
        "gem_level_max": 15,
        "base_drop_chance": 0.20,
        "equipment_rarity_weights": {
          "white": 500,
          "blue": 350,
          "purple": 115,
          "pink": 35
        },
        "gem_rarity_weights": {
          "normal": 390,
          "magic": 360,
          "rare": 250
        }
      },
      {
        "id": "timemark_4",
        "display_name": "时刻 4",
        "phase": "timemark",
        "order": 10,
        "map_level_min": 77,
        "map_level_max": 79,
        "map_level_text": "77-79",
        "monster_level": 78,
        "entry_cost": 1,
        "free_entry": false,
        "entry_count": 0,
        "unlocked": false,
        "enterable": false,
        "selected": false,
        "boss_stage": false,
        "gem_level_min": 14,
        "gem_level_max": 16,
        "base_drop_chance": 0.22,
        "equipment_rarity_weights": {
          "white": 460,
          "blue": 360,
          "purple": 130,
          "pink": 50
        },
        "gem_rarity_weights": {
          "normal": 340,
          "magic": 360,
          "rare": 300
        }
      },
      {
        "id": "timemark_5",
        "display_name": "时刻 5",
        "phase": "timemark",
        "order": 11,
        "map_level_min": 80,
        "map_level_max": 81,
        "map_level_text": "80-81",
        "monster_level": 81,
        "entry_cost": 1,
        "free_entry": false,
        "entry_count": 0,
        "unlocked": false,
        "enterable": false,
        "selected": false,
        "boss_stage": false,
        "gem_level_min": 15,
        "gem_level_max": 17,
        "base_drop_chance": 0.24,
        "equipment_rarity_weights": {
          "white": 420,
          "blue": 370,
          "purple": 145,
          "pink": 65
        },
        "gem_rarity_weights": {
          "normal": 290,
          "magic": 360,
          "rare": 350
        }
      },
      {
        "id": "timemark_6",
        "display_name": "时刻 6",
        "phase": "timemark",
        "order": 12,
        "map_level_min": 82,
        "map_level_max": 83,
        "map_level_text": "82-83",
        "monster_level": 83,
        "entry_cost": 1,
        "free_entry": false,
        "entry_count": 0,
        "unlocked": false,
        "enterable": false,
        "selected": false,
        "boss_stage": true,
        "gem_level_min": 16,
        "gem_level_max": 18,
        "base_drop_chance": 0.26,
        "equipment_rarity_weights": {
          "white": 390,
          "blue": 375,
          "purple": 155,
          "pink": 80
        },
        "gem_rarity_weights": {
          "normal": 240,
          "magic": 360,
          "rare": 400
        }
      },
      {
        "id": "timemark_7_1",
        "display_name": "时刻 7-1",
        "phase": "timemark",
        "order": 13,
        "map_level_min": 84,
        "map_level_max": 84,
        "map_level_text": "84",
        "monster_level": 84,
        "entry_cost": 1,
        "free_entry": false,
        "entry_count": 0,
        "unlocked": false,
        "enterable": false,
        "selected": false,
        "boss_stage": false,
        "gem_level_min": 17,
        "gem_level_max": 19,
        "base_drop_chance": 0.28,
        "equipment_rarity_weights": {
          "white": 360,
          "blue": 350,
          "purple": 190,
          "pink": 100
        },
        "gem_rarity_weights": {
          "normal": 190,
          "magic": 350,
          "rare": 460
        }
      },
      {
        "id": "timemark_7_2",
        "display_name": "时刻 7-2",
        "phase": "timemark",
        "order": 14,
        "map_level_min": 85,
        "map_level_max": 85,
        "map_level_text": "85",
        "monster_level": 85,
        "entry_cost": 1,
        "free_entry": false,
        "entry_count": 0,
        "unlocked": false,
        "enterable": false,
        "selected": false,
        "boss_stage": true,
        "gem_level_min": 17,
        "gem_level_max": 19,
        "base_drop_chance": 0.28,
        "equipment_rarity_weights": {
          "white": 360,
          "blue": 350,
          "purple": 190,
          "pink": 100
        },
        "gem_rarity_weights": {
          "normal": 190,
          "magic": 350,
          "rare": 460
        }
      },
      {
        "id": "timemark_8_1",
        "display_name": "时刻 8-1",
        "phase": "timemark",
        "order": 15,
        "map_level_min": 86,
        "map_level_max": 86,
        "map_level_text": "86",
        "monster_level": 86,
        "entry_cost": 1,
        "free_entry": false,
        "entry_count": 0,
        "unlocked": false,
        "enterable": false,
        "selected": false,
        "boss_stage": false,
        "gem_level_min": 18,
        "gem_level_max": 20,
        "base_drop_chance": 0.30,
        "equipment_rarity_weights": {
          "white": 340,
          "blue": 330,
          "purple": 220,
          "pink": 110
        },
        "gem_rarity_weights": {
          "normal": 140,
          "magic": 330,
          "rare": 530
        }
      },
      {
        "id": "timemark_8_2",
        "display_name": "时刻 8-2",
        "phase": "timemark",
        "order": 16,
        "map_level_min": 87,
        "map_level_max": 87,
        "map_level_text": "87",
        "monster_level": 87,
        "entry_cost": 1,
        "free_entry": false,
        "entry_count": 0,
        "unlocked": false,
        "enterable": false,
        "selected": false,
        "boss_stage": false,
        "gem_level_min": 18,
        "gem_level_max": 20,
        "base_drop_chance": 0.30,
        "equipment_rarity_weights": {
          "white": 340,
          "blue": 330,
          "purple": 220,
          "pink": 110
        },
        "gem_rarity_weights": {
          "normal": 140,
          "magic": 330,
          "rare": 530
        }
      },
      {
        "id": "timemark_8_3",
        "display_name": "时刻 8-3",
        "phase": "timemark",
        "order": 17,
        "map_level_min": 88,
        "map_level_max": 88,
        "map_level_text": "88",
        "monster_level": 88,
        "entry_cost": 1,
        "free_entry": false,
        "entry_count": 0,
        "unlocked": false,
        "enterable": false,
        "selected": false,
        "boss_stage": false,
        "gem_level_min": 18,
        "gem_level_max": 20,
        "base_drop_chance": 0.30,
        "equipment_rarity_weights": {
          "white": 340,
          "blue": 330,
          "purple": 220,
          "pink": 110
        },
        "gem_rarity_weights": {
          "normal": 140,
          "magic": 330,
          "rare": 530
        }
      },
      {
        "id": "timemark_8_4",
        "display_name": "时刻 8-4",
        "phase": "timemark",
        "order": 18,
        "map_level_min": 89,
        "map_level_max": 100,
        "map_level_text": "89-100",
        "monster_level": 92,
        "entry_cost": 1,
        "free_entry": false,
        "entry_count": 0,
        "unlocked": false,
        "enterable": false,
        "selected": false,
        "boss_stage": true,
        "gem_level_min": 18,
        "gem_level_max": 20,
        "base_drop_chance": 0.30,
        "equipment_rarity_weights": {
          "white": 340,
          "blue": 330,
          "purple": 220,
          "pink": 110
        },
        "gem_rarity_weights": {
          "normal": 140,
          "magic": 330,
          "rare": 530
        }
      }
    ]
  },
  "current_map_run": null,
  "frontend_save": {
    "version": 1,
    "map_state": {
      "unlocked_stage_ids": [
        "start_i"
      ],
      "map_entries": {},
      "selected_stage_id": "start_i"
    },
    "next_map_run_number": 1,
    "next_gm_item_index": 1,
    "gems": [
      {
        "instance_id": "web_seed_active_1_active_split_firebolt",
        "base_gem_id": "active_split_firebolt",
        "rarity": "magic",
        "level": 1,
        "locked": false,
        "board_position": null
      },
      {
        "instance_id": "web_seed_active_2_active_ice_shot",
        "base_gem_id": "active_ice_shot",
        "rarity": "normal",
        "level": 1,
        "locked": false,
        "board_position": null
      },
      {
        "instance_id": "web_seed_active_3_active_chromatic_shot",
        "base_gem_id": "active_chromatic_shot",
        "rarity": "normal",
        "level": 1,
        "locked": false,
        "board_position": null
      },
      {
        "instance_id": "web_seed_active_4_active_whirlwind",
        "base_gem_id": "active_whirlwind",
        "rarity": "normal",
        "level": 1,
        "locked": false,
        "board_position": null
      },
      {
        "instance_id": "web_seed_active_5_active_stoneskin",
        "base_gem_id": "active_stoneskin",
        "rarity": "normal",
        "level": 1,
        "locked": false,
        "board_position": null
      },
      {
        "instance_id": "web_seed_active_6_active_thundercloud",
        "base_gem_id": "active_thundercloud",
        "rarity": "normal",
        "level": 1,
        "locked": false,
        "board_position": null
      },
      {
        "instance_id": "web_seed_active_7_active_blizzard",
        "base_gem_id": "active_blizzard",
        "rarity": "normal",
        "level": 1,
        "locked": false,
        "board_position": null
      },
      {
        "instance_id": "web_seed_active_8_active_chain_lightning",
        "base_gem_id": "active_chain_lightning",
        "rarity": "normal",
        "level": 1,
        "locked": false,
        "board_position": null
      },
      {
        "instance_id": "web_seed_active_9_active_ring_of_ice",
        "base_gem_id": "active_ring_of_ice",
        "rarity": "normal",
        "level": 1,
        "locked": false,
        "board_position": null
      },
      {
        "instance_id": "web_seed_active_10_active_flame_slash",
        "base_gem_id": "active_flame_slash",
        "rarity": "normal",
        "level": 1,
        "locked": false,
        "board_position": null
      },
      {
        "instance_id": "web_seed_active_11_active_lightning_shot",
        "base_gem_id": "active_lightning_shot",
        "rarity": "normal",
        "level": 1,
        "locked": false,
        "board_position": null
      },
      {
        "instance_id": "web_seed_active_12_active_corrosive_shot",
        "base_gem_id": "active_corrosive_shot",
        "rarity": "normal",
        "level": 1,
        "locked": false,
        "board_position": null
      },
      {
        "instance_id": "web_seed_active_13_active_burning_shot",
        "base_gem_id": "active_burning_shot",
        "rarity": "normal",
        "level": 1,
        "locked": false,
        "board_position": null
      },
      {
        "instance_id": "web_seed_active_14_active_rain_of_arrows",
        "base_gem_id": "active_rain_of_arrows",
        "rarity": "normal",
        "level": 1,
        "locked": false,
        "board_position": null
      },
      {
        "instance_id": "web_seed_active_15_active_sparkle",
        "base_gem_id": "active_sparkle",
        "rarity": "normal",
        "level": 1,
        "locked": false,
        "board_position": null
      },
      {
        "instance_id": "web_seed_active_16_active_black_hole",
        "base_gem_id": "active_black_hole",
        "rarity": "normal",
        "level": 1,
        "locked": false,
        "board_position": null
      }
    ],
    "equipment_items": [],
    "equipment_slots": [
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ]
  },
  "ui_text": {
    "only_gems_on_board": "只有宝石可以放入宝石盘"
  }
} as const;

export const FRONTEND_SKILL_PREVIEWS_BY_SKILL_TAG = {
  "skill_split_firebolt": {
    "active_gem_instance_id": "web_seed_active_1_active_split_firebolt",
    "name_text": "裂变火球",
    "skill_template_id": "skill_split_firebolt",
    "skill_package_id": "active_split_firebolt",
    "skill_package_version": "1.0.0",
    "template_text": "裂变火球",
    "damage_type": "fire",
    "behavior_type": "projectile",
    "behavior_template": "projectile",
    "visual_effect": "skill_event.split_firebolt.vfx",
    "cast": {
      "mode": "spell",
      "target_selector": "nearest_enemy",
      "search_range": 420,
      "cooldown_ms": 0,
      "release_interval_ms": 650,
      "base_cooldown_ms": 0,
      "trigger_interval_ms": 0,
      "mana_cost": 8,
      "windup_ms": 0,
      "recovery_ms": 0
    },
    "hit": {
      "base_damage": 84.25,
      "can_crit": true,
      "can_apply_status": true,
      "damage_timing": "on_projectile_hit",
      "hit_delay_ms": 160,
      "hit_radius": 36,
      "target_policy": "selected_target"
    },
    "runtime_params": {
      "projectile_count": 1,
      "spread_angle_deg": 0,
      "projectile_speed": 620.0,
      "projectile_width": 64,
      "projectile_height": 64,
      "max_distance": 420,
      "hit_policy": "first_hit",
      "pierce_count": 0,
      "collision_radius": 32,
      "spawn_offset": {
        "x": 0,
        "y": 0
      },
      "projectile_radius": 14,
      "impact_radius": 36,
      "max_targets": 1,
      "min_duration_ms": 80,
      "max_duration_ms": 2200,
      "split_projectile_count": 3,
      "split_projectile_angle_step_deg": 25,
      "split_projectile_damage_multiplier": 0.5,
      "split_projectile_pierce_count": 1,
      "split_projectile_speed": 620,
      "split_projectile_max_distance": 320,
      "split_projectile_width": 40,
      "split_projectile_height": 29,
      "split_projectile_collision_radius": 16
    },
    "presentation_keys": {
      "vfx": "skill_event.split_firebolt.vfx",
      "cast_vfx_key": "skill_event.split_firebolt.vfx",
      "projectile_vfx_key": "skill_event.split_firebolt.vfx",
      "hit_vfx_key": "skill_event.split_firebolt.vfx",
      "sfx": "skill_event.split_firebolt.sfx",
      "floating_text": "skill_event.split_firebolt.floating_text",
      "floating_text_style": "skill_event.split_firebolt.floating_text",
      "screen_feedback": "skill_event.split_firebolt.screen_feedback",
      "hit_stop_ms": 0,
      "camera_shake": 0
    },
    "source_context": {
      "active_gem_instance_id": "web_seed_active_1_active_split_firebolt",
      "base_gem_id": "active_split_firebolt",
      "gem_kind": "active_skill",
      "sudoku_digit": 1,
      "base_gem_level": 1,
      "effective_gem_level": 1,
      "tlidb_source_values": {
        "source": "tlidb",
        "tlidb_id": "Split_Firebolt",
        "display_level": 20,
        "raw_lines": [
          "释放该技能向前发射 1 个火球，火球抵达射程终点时产生爆炸，火球击中和爆炸时各能造成 674-1011 法术火焰伤害。",
          "火球击中后分裂成三个小型火球，小型火球击中时造成 337-506 法术火焰伤害。",
          "火球：",
          "造成 674-1011 法术火焰伤害",
          "基础发射 1 个投射物",
          "火球爆炸：",
          "造成 674-1011 法术火焰伤害",
          "小型火球：",
          "造成 337-506 法术火焰伤害",
          "该技能分裂出的小火球 +1 穿透次数"
        ],
        "parsed_values": {
          "base_damage": 842.5,
          "mana_cost": 8,
          "release_interval_ms": 650
        },
        "anchors": {
          "base_damage": {
            "20": 842.5
          }
        }
      },
      "level_values": {
        "base_damage": 84.25,
        "mana_cost": 8,
        "release_interval_ms": 650
      },
      "auto_release": {
        "policy": "nearest_enemy",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "damage_basis": "flat",
      "damage_form": "spell",
      "weapon_attack_base_damage": 100.0,
      "added_damage_effectiveness_percent": 100.0
    },
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Split_Firebolt",
        "display_level": 20,
        "raw_lines": [
          "释放该技能向前发射 1 个火球，火球抵达射程终点时产生爆炸，火球击中和爆炸时各能造成 674-1011 法术火焰伤害。",
          "火球击中后分裂成三个小型火球，小型火球击中时造成 337-506 法术火焰伤害。",
          "火球：",
          "造成 674-1011 法术火焰伤害",
          "基础发射 1 个投射物",
          "火球爆炸：",
          "造成 674-1011 法术火焰伤害",
          "小型火球：",
          "造成 337-506 法术火焰伤害",
          "该技能分裂出的小火球 +1 穿透次数"
        ],
        "parsed_values": {
          "base_damage": 842.5,
          "mana_cost": 8,
          "release_interval_ms": 650
        },
        "anchors": {
          "base_damage": {
            "20": 842.5
          }
        }
      },
      "level_values": {
        "base_damage": 84.25,
        "mana_cost": 8,
        "release_interval_ms": 650
      },
      "auto_release": {
        "policy": "nearest_enemy",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "routed_modifiers": [],
      "final_values": {
        "base_damage": 84.25,
        "final_damage": 84.25,
        "actual_interval_ms": 637,
        "mana_cost": 8,
        "projectile_count": 1,
        "area_multiplier": 1.0,
        "speed_multiplier": 1.02
      }
    },
    "shape_effects": [],
    "labels": {
      "base_damage": "基础伤害",
      "final_damage": "最终伤害",
      "expected_hit_damage": "期望击中伤害",
      "preview_dps": "预览 DPS",
      "base_release_interval_ms": "基础释放间隔",
      "release_interval_ms": "释放间隔",
      "base_cooldown_ms": "基础冷却",
      "final_cooldown_ms": "最终冷却",
      "actual_interval_ms": "实际释放间隔",
      "trigger_interval_ms": "触发间隔",
      "mana_cost": "魔力消耗",
      "projectile_count": "投射物数量",
      "area_multiplier": "范围倍率",
      "speed_multiplier": "速度倍率"
    },
    "base_damage": 84.25,
    "final_damage": 84.25,
    "non_crit_damage": 84.25,
    "increase_pool": 0.0,
    "final_pool": 0.0,
    "crit_chance": 0.05,
    "crit_multiplier": 3.0,
    "expected_hit_damage": 92.67500000000001,
    "uses_per_second": 1.5698587127158556,
    "hit_coverage_factor": 1.0,
    "preview_dps": 145.48665620094195,
    "base_release_interval_ms": 650,
    "release_interval_ms": 637,
    "base_cooldown_ms": 0,
    "final_cooldown_ms": 0,
    "actual_interval_ms": 637,
    "trigger_interval_ms": 0,
    "mana_cost": 8,
    "projectile_count": 1,
    "area_multiplier": 1.0,
    "speed_multiplier": 1.02,
    "tags": [
      {
        "id": "area",
        "text": "范围"
      },
      {
        "id": "fire",
        "text": "火焰"
      },
      {
        "id": "projectile",
        "text": "投射物"
      },
      {
        "id": "spell",
        "text": "法术"
      }
    ],
    "applied_modifiers": [],
    "skill_stats": {
      "life_regen_flat": 10.0,
      "max_mana": 100.0,
      "max_energy_shield": 0.0,
      "physical_damage_add_percent": 0.0,
      "fire_damage_add_percent": 0.0,
      "cold_damage_add_percent": 0.0,
      "lightning_damage_add_percent": 0.0,
      "chaos_damage_add_percent": 0.0,
      "elemental_damage_add_percent": 0.0,
      "all_damage_type_add_percent": 0.0,
      "hit_damage_add_percent": 0.0,
      "dot_damage_add_percent": 0.0,
      "attack_damage_add_percent": 0.0,
      "spell_damage_add_percent": 0.0,
      "melee_damage_add_percent": 2.0,
      "ranged_damage_add_percent": 0.0,
      "projectile_damage_add_percent": 0.0,
      "area_damage_add_percent": 0.0,
      "chain_damage_add_percent": 0.0,
      "pierce_damage_add_percent": 0.0,
      "damage_add_percent": 0.0,
      "damage_final_percent": 0.0,
      "hit_damage_final_percent": 0.0,
      "double_damage_chance_percent": 0.0,
      "conversion_physical_to_fire_percent": 0.0,
      "conversion_physical_to_cold_percent": 0.0,
      "conversion_physical_to_lightning_percent": 0.0,
      "conversion_physical_to_chaos_percent": 0.0,
      "conversion_lightning_to_cold_percent": 0.0,
      "conversion_lightning_to_fire_percent": 0.0,
      "conversion_lightning_to_chaos_percent": 0.0,
      "conversion_cold_to_fire_percent": 0.0,
      "conversion_cold_to_chaos_percent": 0.0,
      "conversion_fire_to_chaos_percent": 0.0,
      "attack_speed_add_percent": 2.0,
      "cast_speed_add_percent": 2.0,
      "skill_speed_final_percent": 0.0,
      "cooldown_recovery_add_percent": 0.0,
      "added_cooldown_ms": 0.0,
      "projectile_speed_add_percent": 0.0,
      "base_crit_chance_percent": 5.0,
      "crit_chance_add_percent": 0.0,
      "crit_rating": 0.0,
      "crit_damage_rating": 0.0,
      "crit_damage_add_percent": 0.0,
      "derived_crit_chance_percent": 5.0,
      "derived_crit_damage_percent": 300.0,
      "cannot_crit": false,
      "prevent_elemental_ailments": false,
      "area_add_percent": 0.0,
      "slash_chance_add_percent": 0.0,
      "projectile_count_add": 0.0,
      "split_projectile_chance_percent": 0.0,
      "split_projectile_count_add": 0.0,
      "chain_count_add": 0.0,
      "bounce_count_add": 0.0,
      "pierce_count_add": 0.0,
      "duration_add_percent": 0.0,
      "status_chance_add_percent": 0.0,
      "ignite_chance_add_percent": 0.0,
      "guard_trigger_count": 0.0,
      "guard_internal_cooldown_ms": 0.0,
      "added_damage_effectiveness_percent": 100.0
    }
  },
  "skill_ice_shot": {
    "active_gem_instance_id": "web_seed_active_2_active_ice_shot",
    "name_text": "寒冰射击",
    "skill_template_id": "skill_ice_shot",
    "skill_package_id": "active_ice_shot",
    "skill_package_version": "1.0.0",
    "template_text": "寒冰射击",
    "damage_type": "cold",
    "behavior_type": "projectile",
    "behavior_template": "projectile",
    "visual_effect": "skill_event.ice_shot.vfx",
    "cast": {
      "mode": "attack",
      "target_selector": "nearest_enemy",
      "search_range": 420,
      "cooldown_ms": 0,
      "release_interval_ms": 1000,
      "base_cooldown_ms": 0,
      "trigger_interval_ms": 0,
      "mana_cost": 5,
      "windup_ms": 0,
      "recovery_ms": 0
    },
    "hit": {
      "base_damage": 31.3,
      "damage_basis": "weapon_attack",
      "weapon_attack_percent": 31.3,
      "damage_components": {
        "physical": 313
      },
      "damage_conversions": [
        {
          "from": "physical",
          "to": "cold",
          "percent": 100
        }
      ],
      "ailments": [
        {
          "type": "frostbite",
          "source_damage_type": "cold",
          "chance_percent": 100,
          "duration_ms": 4000,
          "base_value": 10,
          "max_stacks": 999,
          "effect_per_stack": 1,
          "threshold": 100
        }
      ],
      "secondary_hits": [
        {
          "id": "ice_cone_back_explosion",
          "trigger": "on_projectile_hit",
          "shape": "circle",
          "placement": "behind_target",
          "offset_distance": 42,
          "radius": 64,
          "base_damage": 15.7,
          "damage_basis": "weapon_attack",
          "weapon_attack_percent": 15.700000000000001,
          "damage_components": {
            "physical": 15.7
          },
          "damage_conversions": [
            {
              "from": "physical",
              "to": "cold",
              "percent": 100
            }
          ],
          "ailments": [
            {
              "type": "frostbite",
              "source_damage_type": "cold",
              "chance_percent": 100,
              "duration_ms": 4000,
              "base_value": 10,
              "max_stacks": 999,
              "effect_per_stack": 1,
              "threshold": 100
            }
          ],
          "max_targets": 8,
          "delay_ms": 0,
          "vfx_key": "skill_event.ice_shot.vfx",
          "reason_key": "skill_event.ice_shot.damage_reason"
        }
      ],
      "can_crit": true,
      "can_apply_status": true,
      "damage_timing": "on_projectile_hit",
      "hit_delay_ms": 160,
      "hit_radius": 36,
      "target_policy": "selected_target"
    },
    "runtime_params": {
      "projectile_count": 1,
      "spread_angle_deg": 0,
      "projectile_speed": 640.0,
      "projectile_width": 58,
      "projectile_height": 32,
      "max_distance": 440,
      "hit_policy": "first_hit",
      "pierce_count": 0,
      "collision_radius": 16,
      "spawn_offset": {
        "x": -14,
        "y": -20
      },
      "projectile_radius": 12,
      "impact_radius": 36,
      "max_targets": 1,
      "min_duration_ms": 80,
      "max_duration_ms": 2200
    },
    "presentation_keys": {
      "vfx": "skill_event.ice_shot.vfx",
      "cast_vfx_key": "skill_event.ice_shot.vfx",
      "projectile_vfx_key": "skill_event.ice_shot.vfx",
      "hit_vfx_key": "skill_event.ice_shot.vfx",
      "sfx": "skill_event.ice_shot.sfx",
      "floating_text": "skill_event.ice_shot.floating_text",
      "floating_text_style": "skill_event.ice_shot.floating_text",
      "screen_feedback": "skill_event.ice_shot.screen_feedback",
      "hit_stop_ms": 0,
      "camera_shake": 0
    },
    "source_context": {
      "active_gem_instance_id": "web_seed_active_2_active_ice_shot",
      "base_gem_id": "active_ice_shot",
      "gem_kind": "active_skill",
      "sudoku_digit": 1,
      "base_gem_level": 1,
      "effective_gem_level": 1,
      "tlidb_source_values": {
        "source": "tlidb",
        "tlidb_id": "Ice_Shot",
        "display_level": 20,
        "raw_lines": [
          "释放该技能向前发射 1 个冰锥，击中时造成 313% 武器攻击伤害。",
          "冰锥击中敌人时在其身后产生爆炸，击中时造成 157% 武器攻击伤害。",
          "该技能全部物理伤害转化为冰霜伤害。",
          "冰锥：",
          "造成 313% 武器攻击伤害",
          "基础发射 1 个投射物",
          "爆炸：",
          "造成 157% 武器攻击伤害",
          "该技能 100% 物理伤害转化为冰霜伤害",
          "该技能造成击中冰霜伤害时，施加冰结"
        ],
        "parsed_values": {
          "base_damage": 313,
          "mana_cost": 5,
          "release_interval_ms": 1000
        },
        "anchors": {
          "base_damage": {
            "20": 313
          }
        }
      },
      "level_values": {
        "base_damage": 31.3,
        "mana_cost": 5,
        "release_interval_ms": 1000
      },
      "auto_release": {
        "policy": "nearest_enemy",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "damage_basis": "weapon_attack",
      "damage_form": "attack",
      "weapon_attack_base_damage": 100.0,
      "added_damage_effectiveness_percent": 100.0
    },
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Ice_Shot",
        "display_level": 20,
        "raw_lines": [
          "释放该技能向前发射 1 个冰锥，击中时造成 313% 武器攻击伤害。",
          "冰锥击中敌人时在其身后产生爆炸，击中时造成 157% 武器攻击伤害。",
          "该技能全部物理伤害转化为冰霜伤害。",
          "冰锥：",
          "造成 313% 武器攻击伤害",
          "基础发射 1 个投射物",
          "爆炸：",
          "造成 157% 武器攻击伤害",
          "该技能 100% 物理伤害转化为冰霜伤害",
          "该技能造成击中冰霜伤害时，施加冰结"
        ],
        "parsed_values": {
          "base_damage": 313,
          "mana_cost": 5,
          "release_interval_ms": 1000
        },
        "anchors": {
          "base_damage": {
            "20": 313
          }
        }
      },
      "level_values": {
        "base_damage": 31.3,
        "mana_cost": 5,
        "release_interval_ms": 1000
      },
      "auto_release": {
        "policy": "nearest_enemy",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "routed_modifiers": [],
      "final_values": {
        "base_damage": 31.3,
        "final_damage": 31.3,
        "actual_interval_ms": 980,
        "mana_cost": 5,
        "projectile_count": 1,
        "area_multiplier": 1.0,
        "speed_multiplier": 1.02
      }
    },
    "shape_effects": [],
    "labels": {
      "base_damage": "基础伤害",
      "final_damage": "最终伤害",
      "expected_hit_damage": "期望击中伤害",
      "preview_dps": "预览 DPS",
      "base_release_interval_ms": "基础释放间隔",
      "release_interval_ms": "释放间隔",
      "base_cooldown_ms": "基础冷却",
      "final_cooldown_ms": "最终冷却",
      "actual_interval_ms": "实际释放间隔",
      "trigger_interval_ms": "触发间隔",
      "mana_cost": "魔力消耗",
      "projectile_count": "投射物数量",
      "area_multiplier": "范围倍率",
      "speed_multiplier": "速度倍率"
    },
    "base_damage": 31.3,
    "final_damage": 31.3,
    "non_crit_damage": 31.3,
    "increase_pool": 0.0,
    "final_pool": 0.0,
    "crit_chance": 0.05,
    "crit_multiplier": 3.0,
    "expected_hit_damage": 34.43000000000001,
    "uses_per_second": 1.0204081632653061,
    "hit_coverage_factor": 1.0,
    "preview_dps": 35.132653061224495,
    "base_release_interval_ms": 1000,
    "release_interval_ms": 980,
    "base_cooldown_ms": 0,
    "final_cooldown_ms": 0,
    "actual_interval_ms": 980,
    "trigger_interval_ms": 0,
    "mana_cost": 5,
    "projectile_count": 1,
    "area_multiplier": 1.0,
    "speed_multiplier": 1.02,
    "tags": [
      {
        "id": "area",
        "text": "范围"
      },
      {
        "id": "attack",
        "text": "攻击"
      },
      {
        "id": "bow",
        "text": "弓"
      },
      {
        "id": "cold",
        "text": "冰霜"
      },
      {
        "id": "projectile",
        "text": "投射物"
      },
      {
        "id": "ranged",
        "text": "远程"
      }
    ],
    "applied_modifiers": [],
    "skill_stats": {
      "life_regen_flat": 10.0,
      "max_mana": 100.0,
      "max_energy_shield": 0.0,
      "physical_damage_add_percent": 0.0,
      "fire_damage_add_percent": 0.0,
      "cold_damage_add_percent": 0.0,
      "lightning_damage_add_percent": 0.0,
      "chaos_damage_add_percent": 0.0,
      "elemental_damage_add_percent": 0.0,
      "all_damage_type_add_percent": 0.0,
      "hit_damage_add_percent": 0.0,
      "dot_damage_add_percent": 0.0,
      "attack_damage_add_percent": 0.0,
      "spell_damage_add_percent": 0.0,
      "melee_damage_add_percent": 2.0,
      "ranged_damage_add_percent": 0.0,
      "projectile_damage_add_percent": 0.0,
      "area_damage_add_percent": 0.0,
      "chain_damage_add_percent": 0.0,
      "pierce_damage_add_percent": 0.0,
      "damage_add_percent": 0.0,
      "damage_final_percent": 0.0,
      "hit_damage_final_percent": 0.0,
      "double_damage_chance_percent": 0.0,
      "conversion_physical_to_fire_percent": 0.0,
      "conversion_physical_to_cold_percent": 0.0,
      "conversion_physical_to_lightning_percent": 0.0,
      "conversion_physical_to_chaos_percent": 0.0,
      "conversion_lightning_to_cold_percent": 0.0,
      "conversion_lightning_to_fire_percent": 0.0,
      "conversion_lightning_to_chaos_percent": 0.0,
      "conversion_cold_to_fire_percent": 0.0,
      "conversion_cold_to_chaos_percent": 0.0,
      "conversion_fire_to_chaos_percent": 0.0,
      "attack_speed_add_percent": 2.0,
      "cast_speed_add_percent": 2.0,
      "skill_speed_final_percent": 0.0,
      "cooldown_recovery_add_percent": 0.0,
      "added_cooldown_ms": 0.0,
      "projectile_speed_add_percent": 0.0,
      "base_crit_chance_percent": 5.0,
      "crit_chance_add_percent": 0.0,
      "crit_rating": 0.0,
      "crit_damage_rating": 0.0,
      "crit_damage_add_percent": 0.0,
      "derived_crit_chance_percent": 5.0,
      "derived_crit_damage_percent": 300.0,
      "cannot_crit": false,
      "prevent_elemental_ailments": false,
      "area_add_percent": 0.0,
      "slash_chance_add_percent": 0.0,
      "projectile_count_add": 0.0,
      "split_projectile_chance_percent": 0.0,
      "split_projectile_count_add": 0.0,
      "chain_count_add": 0.0,
      "bounce_count_add": 0.0,
      "pierce_count_add": 0.0,
      "duration_add_percent": 0.0,
      "status_chance_add_percent": 0.0,
      "ignite_chance_add_percent": 0.0,
      "guard_trigger_count": 0.0,
      "guard_internal_cooldown_ms": 0.0,
      "added_damage_effectiveness_percent": 100.0
    }
  },
  "skill_chromatic_shot": {
    "active_gem_instance_id": "web_seed_active_3_active_chromatic_shot",
    "name_text": "五彩魔矢",
    "skill_template_id": "skill_chromatic_shot",
    "skill_package_id": "active_chromatic_shot",
    "skill_package_version": "1.0.0",
    "template_text": "五彩魔矢",
    "damage_type": "fire",
    "behavior_type": "projectile",
    "behavior_template": "projectile",
    "visual_effect": "skill_event.chromatic_shot.vfx",
    "cast": {
      "mode": "spell",
      "target_selector": "nearest_enemy",
      "search_range": 420,
      "cooldown_ms": 0,
      "release_interval_ms": 650,
      "base_cooldown_ms": 0,
      "trigger_interval_ms": 0,
      "mana_cost": 8,
      "windup_ms": 0,
      "recovery_ms": 0
    },
    "hit": {
      "base_damage": 84.6,
      "can_crit": true,
      "can_apply_status": true,
      "damage_timing": "on_projectile_hit",
      "hit_delay_ms": 160,
      "hit_radius": 28,
      "target_policy": "selected_target"
    },
    "runtime_params": {
      "projectile_count": 3,
      "burst_interval_ms": 100,
      "spread_angle_deg": 24,
      "random_angle_jitter_deg": 8,
      "projectile_speed": 600.0,
      "projectile_width": 46,
      "projectile_height": 32,
      "max_distance": 420,
      "hit_policy": "first_hit",
      "pierce_count": 0,
      "collision_radius": 16,
      "spawn_offset": {
        "x": 0,
        "y": 0
      },
      "projectile_radius": 12,
      "impact_radius": 28,
      "max_targets": 1,
      "min_duration_ms": 80,
      "max_duration_ms": 2200,
      "target_policy": "nearest_unique_enemy",
      "forced_element_types": [
        "fire",
        "cold",
        "lightning"
      ],
      "allow_same_target_projectile_hits": true,
      "shotgun_falloff_coeff": 0.7,
      "on_kill_explosion_chance_percent": 10,
      "on_kill_explosion_radius": 5,
      "on_kill_explosion_max_life_percent": 25,
      "on_kill_explosion_damage_type": "true"
    },
    "presentation_keys": {
      "vfx": "skill_event.chromatic_shot.vfx",
      "cast_vfx_key": "skill_event.chromatic_shot.vfx",
      "projectile_vfx_key": "skill_event.chromatic_shot.vfx",
      "hit_vfx_key": "skill_event.chromatic_shot.vfx",
      "sfx": "skill_event.chromatic_shot.sfx",
      "floating_text": "skill_event.chromatic_shot.floating_text",
      "floating_text_style": "skill_event.chromatic_shot.floating_text",
      "screen_feedback": "skill_event.chromatic_shot.screen_feedback",
      "hit_stop_ms": 0,
      "camera_shake": 0
    },
    "source_context": {
      "active_gem_instance_id": "web_seed_active_3_active_chromatic_shot",
      "base_gem_id": "active_chromatic_shot",
      "gem_kind": "active_skill",
      "sudoku_digit": 1,
      "base_gem_level": 1,
      "effective_gem_level": 1,
      "tlidb_source_values": {
        "source": "tlidb",
        "tlidb_id": "Chromatic_Shot",
        "display_level": 20,
        "raw_lines": [
          "释放该技能向前发射 3 个自动追踪敌人的魔矢，造成 59-110 法术伤害。",
          "该技能击败敌人时，有 10% 几率产生一次爆炸，造成被击败敌人最大生命 25% 的真实伤害。",
          "每次释放该技能会随机选择一种元素伤害，使下次技能的所有伤害都强制转化为该类型",
          "该技能发射的魔矢可以命中同一个敌人。",
          "五彩魔矢：",
          "造成 59-110 法术伤害",
          "基础发射 1 个投射物",
          "该技能 +2 投射物数量",
          "该技能释放时，随机选择一种元素类型，使下次该技能的伤害强制转化为该类型",
          "该技能击败敌人时 10% 几率爆炸，对半径 5 米内的敌人造成被击败的敌人最大生命 25% 的真实伤害",
          "该技能发射的投射物可以命中同一个敌人",
          "该技能的霰弹效应衰减系数为 70%"
        ],
        "parsed_values": {
          "base_damage": 84.6,
          "mana_cost": 8,
          "release_interval_ms": 650
        },
        "anchors": {
          "base_damage": {
            "1": 84.6
          }
        }
      },
      "level_values": {
        "base_damage": 84.6,
        "mana_cost": 8,
        "release_interval_ms": 650
      },
      "auto_release": {
        "policy": "nearest_enemy",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "damage_basis": "flat",
      "damage_form": "spell",
      "weapon_attack_base_damage": 100.0,
      "added_damage_effectiveness_percent": 100.0
    },
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Chromatic_Shot",
        "display_level": 20,
        "raw_lines": [
          "释放该技能向前发射 3 个自动追踪敌人的魔矢，造成 59-110 法术伤害。",
          "该技能击败敌人时，有 10% 几率产生一次爆炸，造成被击败敌人最大生命 25% 的真实伤害。",
          "每次释放该技能会随机选择一种元素伤害，使下次技能的所有伤害都强制转化为该类型",
          "该技能发射的魔矢可以命中同一个敌人。",
          "五彩魔矢：",
          "造成 59-110 法术伤害",
          "基础发射 1 个投射物",
          "该技能 +2 投射物数量",
          "该技能释放时，随机选择一种元素类型，使下次该技能的伤害强制转化为该类型",
          "该技能击败敌人时 10% 几率爆炸，对半径 5 米内的敌人造成被击败的敌人最大生命 25% 的真实伤害",
          "该技能发射的投射物可以命中同一个敌人",
          "该技能的霰弹效应衰减系数为 70%"
        ],
        "parsed_values": {
          "base_damage": 84.6,
          "mana_cost": 8,
          "release_interval_ms": 650
        },
        "anchors": {
          "base_damage": {
            "1": 84.6
          }
        }
      },
      "level_values": {
        "base_damage": 84.6,
        "mana_cost": 8,
        "release_interval_ms": 650
      },
      "auto_release": {
        "policy": "nearest_enemy",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "routed_modifiers": [],
      "final_values": {
        "base_damage": 84.6,
        "final_damage": 84.6,
        "actual_interval_ms": 637,
        "mana_cost": 8,
        "projectile_count": 3,
        "area_multiplier": 1.0,
        "speed_multiplier": 1.02
      }
    },
    "shape_effects": [],
    "labels": {
      "base_damage": "基础伤害",
      "final_damage": "最终伤害",
      "expected_hit_damage": "期望击中伤害",
      "preview_dps": "预览 DPS",
      "base_release_interval_ms": "基础释放间隔",
      "release_interval_ms": "释放间隔",
      "base_cooldown_ms": "基础冷却",
      "final_cooldown_ms": "最终冷却",
      "actual_interval_ms": "实际释放间隔",
      "trigger_interval_ms": "触发间隔",
      "mana_cost": "魔力消耗",
      "projectile_count": "投射物数量",
      "area_multiplier": "范围倍率",
      "speed_multiplier": "速度倍率"
    },
    "base_damage": 84.6,
    "final_damage": 84.6,
    "non_crit_damage": 84.6,
    "increase_pool": 0.0,
    "final_pool": 0.0,
    "crit_chance": 0.05,
    "crit_multiplier": 3.0,
    "expected_hit_damage": 93.06,
    "uses_per_second": 1.5698587127158556,
    "hit_coverage_factor": 1.0,
    "preview_dps": 146.09105180533754,
    "base_release_interval_ms": 650,
    "release_interval_ms": 637,
    "base_cooldown_ms": 0,
    "final_cooldown_ms": 0,
    "actual_interval_ms": 637,
    "trigger_interval_ms": 0,
    "mana_cost": 8,
    "projectile_count": 3,
    "area_multiplier": 1.0,
    "speed_multiplier": 1.02,
    "tags": [
      {
        "id": "area",
        "text": "范围"
      },
      {
        "id": "cold",
        "text": "冰霜"
      },
      {
        "id": "fire",
        "text": "火焰"
      },
      {
        "id": "lightning",
        "text": "闪电"
      },
      {
        "id": "projectile",
        "text": "投射物"
      },
      {
        "id": "spell",
        "text": "法术"
      }
    ],
    "applied_modifiers": [],
    "skill_stats": {
      "life_regen_flat": 10.0,
      "max_mana": 100.0,
      "max_energy_shield": 0.0,
      "physical_damage_add_percent": 0.0,
      "fire_damage_add_percent": 0.0,
      "cold_damage_add_percent": 0.0,
      "lightning_damage_add_percent": 0.0,
      "chaos_damage_add_percent": 0.0,
      "elemental_damage_add_percent": 0.0,
      "all_damage_type_add_percent": 0.0,
      "hit_damage_add_percent": 0.0,
      "dot_damage_add_percent": 0.0,
      "attack_damage_add_percent": 0.0,
      "spell_damage_add_percent": 0.0,
      "melee_damage_add_percent": 2.0,
      "ranged_damage_add_percent": 0.0,
      "projectile_damage_add_percent": 0.0,
      "area_damage_add_percent": 0.0,
      "chain_damage_add_percent": 0.0,
      "pierce_damage_add_percent": 0.0,
      "damage_add_percent": 0.0,
      "damage_final_percent": 0.0,
      "hit_damage_final_percent": 0.0,
      "double_damage_chance_percent": 0.0,
      "conversion_physical_to_fire_percent": 0.0,
      "conversion_physical_to_cold_percent": 0.0,
      "conversion_physical_to_lightning_percent": 0.0,
      "conversion_physical_to_chaos_percent": 0.0,
      "conversion_lightning_to_cold_percent": 0.0,
      "conversion_lightning_to_fire_percent": 0.0,
      "conversion_lightning_to_chaos_percent": 0.0,
      "conversion_cold_to_fire_percent": 0.0,
      "conversion_cold_to_chaos_percent": 0.0,
      "conversion_fire_to_chaos_percent": 0.0,
      "attack_speed_add_percent": 2.0,
      "cast_speed_add_percent": 2.0,
      "skill_speed_final_percent": 0.0,
      "cooldown_recovery_add_percent": 0.0,
      "added_cooldown_ms": 0.0,
      "projectile_speed_add_percent": 0.0,
      "base_crit_chance_percent": 5.0,
      "crit_chance_add_percent": 0.0,
      "crit_rating": 0.0,
      "crit_damage_rating": 0.0,
      "crit_damage_add_percent": 0.0,
      "derived_crit_chance_percent": 5.0,
      "derived_crit_damage_percent": 300.0,
      "cannot_crit": false,
      "prevent_elemental_ailments": false,
      "area_add_percent": 0.0,
      "slash_chance_add_percent": 0.0,
      "projectile_count_add": 0.0,
      "split_projectile_chance_percent": 0.0,
      "split_projectile_count_add": 0.0,
      "chain_count_add": 0.0,
      "bounce_count_add": 0.0,
      "pierce_count_add": 0.0,
      "duration_add_percent": 0.0,
      "status_chance_add_percent": 0.0,
      "ignite_chance_add_percent": 0.0,
      "guard_trigger_count": 0.0,
      "guard_internal_cooldown_ms": 0.0,
      "added_damage_effectiveness_percent": 100.0
    }
  },
  "skill_whirlwind": {
    "active_gem_instance_id": "web_seed_active_4_active_whirlwind",
    "name_text": "旋风斩",
    "skill_template_id": "skill_whirlwind",
    "skill_package_id": "active_whirlwind",
    "skill_package_version": "1.0.0",
    "template_text": "旋风斩",
    "damage_type": "physical",
    "behavior_type": "damage_zone",
    "behavior_template": "damage_zone",
    "visual_effect": "skill_event.whirlwind.vfx",
    "cast": {
      "mode": "attack",
      "target_selector": "self",
      "search_range": 420,
      "cooldown_ms": 0,
      "release_interval_ms": 1000,
      "base_cooldown_ms": 0,
      "trigger_interval_ms": 500,
      "mana_cost": 5,
      "windup_ms": 0,
      "recovery_ms": 0
    },
    "hit": {
      "base_damage": 8.3,
      "can_crit": true,
      "can_apply_status": true,
      "damage_timing": "on_damage_zone_hit",
      "hit_delay_ms": 160,
      "hit_radius": 86,
      "target_policy": "selected_target"
    },
    "runtime_params": {
      "shape": "circle",
      "origin_policy": "caster",
      "facing_policy": "none",
      "radius": 111.8,
      "expand_duration_ms": 120,
      "hit_at_ms": 120,
      "max_targets": 8,
      "ring_width": 42,
      "status_chance_scale": 1.0,
      "zone_vfx_key": "skill_event.whirlwind.vfx",
      "duration_ms": 2500,
      "tick_interval_ms": 500,
      "max_hits": 40,
      "max_hits_per_target": 5,
      "channel_max_stacks": 5,
      "channel_time_per_stack_ms": 500,
      "channel_frequency_cap_stacks": 5,
      "base_tick_interval_ms": 500,
      "channel_tick_during_channel": true,
      "slash_chance_percent": 20.0,
      "slash_damage_scale": 1.662651,
      "slash_radius": 150,
      "channel_move_speed_multiplier": 0.7,
      "projectile_count": 1,
      "channel_min_stacks": 0
    },
    "presentation_keys": {
      "vfx": "skill_event.whirlwind.vfx",
      "cast_vfx_key": "skill_event.whirlwind.vfx",
      "projectile_vfx_key": "skill_event.whirlwind.vfx",
      "hit_vfx_key": "skill_event.whirlwind.vfx",
      "sfx": "skill_event.whirlwind.sfx",
      "floating_text": "skill_event.whirlwind.floating_text",
      "floating_text_style": "skill_event.whirlwind.floating_text",
      "screen_feedback": "skill_event.whirlwind.screen_feedback",
      "hit_stop_ms": 0,
      "camera_shake": 0
    },
    "source_context": {
      "active_gem_instance_id": "web_seed_active_4_active_whirlwind",
      "base_gem_id": "active_whirlwind",
      "gem_kind": "active_skill",
      "sudoku_digit": 1,
      "base_gem_level": 1,
      "effective_gem_level": 1,
      "tlidb_source_values": {
        "source": "tlidb",
        "tlidb_id": "Whirlwind",
        "display_level": 20,
        "raw_lines": [
          "引导该技能时不断对自身一定范围内的敌人造成 83% 武器攻击伤害。",
          "引导层数达到上限时，失去所有引导层数并有几率释放斩击，对大范围敌人造成 138% 武器攻击伤害，几率等同于斩击几率。",
          "引导该技能时可以移动。",
          "挥击：",
          "造成 83% 武器攻击伤害",
          "斩击：",
          "造成 138% 武器攻击伤害",
          "该技能额外 +100% 攻击速度",
          "该技能 +20% 斩击几率",
          "该技能引导时， -30% 移动速度",
          "该技能引导时可以移动",
          "引导层数最多 5 层"
        ],
        "parsed_values": {
          "base_damage": 83,
          "mana_cost": 5,
          "release_interval_ms": 1000
        },
        "anchors": {
          "base_damage": {
            "20": 83
          }
        }
      },
      "level_values": {
        "base_damage": 8.3,
        "mana_cost": 5,
        "release_interval_ms": 1000
      },
      "auto_release": {
        "policy": "duration_window",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "damage_basis": "flat",
      "damage_form": "attack",
      "weapon_attack_base_damage": 100.0,
      "added_damage_effectiveness_percent": 100.0
    },
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Whirlwind",
        "display_level": 20,
        "raw_lines": [
          "引导该技能时不断对自身一定范围内的敌人造成 83% 武器攻击伤害。",
          "引导层数达到上限时，失去所有引导层数并有几率释放斩击，对大范围敌人造成 138% 武器攻击伤害，几率等同于斩击几率。",
          "引导该技能时可以移动。",
          "挥击：",
          "造成 83% 武器攻击伤害",
          "斩击：",
          "造成 138% 武器攻击伤害",
          "该技能额外 +100% 攻击速度",
          "该技能 +20% 斩击几率",
          "该技能引导时， -30% 移动速度",
          "该技能引导时可以移动",
          "引导层数最多 5 层"
        ],
        "parsed_values": {
          "base_damage": 83,
          "mana_cost": 5,
          "release_interval_ms": 1000
        },
        "anchors": {
          "base_damage": {
            "20": 83
          }
        }
      },
      "level_values": {
        "base_damage": 8.3,
        "mana_cost": 5,
        "release_interval_ms": 1000
      },
      "auto_release": {
        "policy": "duration_window",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "routed_modifiers": [],
      "final_values": {
        "base_damage": 8.3,
        "final_damage": 8.466000000000001,
        "actual_interval_ms": 980,
        "mana_cost": 5,
        "projectile_count": 1,
        "area_multiplier": 1.0,
        "speed_multiplier": 1.02
      }
    },
    "shape_effects": [],
    "labels": {
      "base_damage": "基础伤害",
      "final_damage": "最终伤害",
      "expected_hit_damage": "期望击中伤害",
      "preview_dps": "预览 DPS",
      "base_release_interval_ms": "基础释放间隔",
      "release_interval_ms": "释放间隔",
      "base_cooldown_ms": "基础冷却",
      "final_cooldown_ms": "最终冷却",
      "actual_interval_ms": "实际释放间隔",
      "trigger_interval_ms": "触发间隔",
      "mana_cost": "魔力消耗",
      "projectile_count": "投射物数量",
      "area_multiplier": "范围倍率",
      "speed_multiplier": "速度倍率"
    },
    "base_damage": 8.3,
    "final_damage": 8.466000000000001,
    "non_crit_damage": 8.466000000000001,
    "increase_pool": 2.0,
    "final_pool": 0.0,
    "crit_chance": 0.05,
    "crit_multiplier": 3.0,
    "expected_hit_damage": 9.312600000000002,
    "uses_per_second": 1.0204081632653061,
    "hit_coverage_factor": 1.0,
    "preview_dps": 9.50265306122449,
    "base_release_interval_ms": 1000,
    "release_interval_ms": 980,
    "base_cooldown_ms": 0,
    "final_cooldown_ms": 0,
    "actual_interval_ms": 980,
    "trigger_interval_ms": 500,
    "mana_cost": 5,
    "projectile_count": 1,
    "area_multiplier": 1.0,
    "speed_multiplier": 1.02,
    "tags": [
      {
        "id": "area",
        "text": "范围"
      },
      {
        "id": "attack",
        "text": "攻击"
      },
      {
        "id": "channel",
        "text": "引导"
      },
      {
        "id": "melee",
        "text": "近战"
      },
      {
        "id": "physical",
        "text": "物理"
      }
    ],
    "applied_modifiers": [],
    "skill_stats": {
      "life_regen_flat": 10.0,
      "max_mana": 100.0,
      "max_energy_shield": 0.0,
      "physical_damage_add_percent": 0.0,
      "fire_damage_add_percent": 0.0,
      "cold_damage_add_percent": 0.0,
      "lightning_damage_add_percent": 0.0,
      "chaos_damage_add_percent": 0.0,
      "elemental_damage_add_percent": 0.0,
      "all_damage_type_add_percent": 0.0,
      "hit_damage_add_percent": 0.0,
      "dot_damage_add_percent": 0.0,
      "attack_damage_add_percent": 0.0,
      "spell_damage_add_percent": 0.0,
      "melee_damage_add_percent": 2.0,
      "ranged_damage_add_percent": 0.0,
      "projectile_damage_add_percent": 0.0,
      "area_damage_add_percent": 0.0,
      "chain_damage_add_percent": 0.0,
      "pierce_damage_add_percent": 0.0,
      "damage_add_percent": 0.0,
      "damage_final_percent": 0.0,
      "hit_damage_final_percent": 0.0,
      "double_damage_chance_percent": 0.0,
      "conversion_physical_to_fire_percent": 0.0,
      "conversion_physical_to_cold_percent": 0.0,
      "conversion_physical_to_lightning_percent": 0.0,
      "conversion_physical_to_chaos_percent": 0.0,
      "conversion_lightning_to_cold_percent": 0.0,
      "conversion_lightning_to_fire_percent": 0.0,
      "conversion_lightning_to_chaos_percent": 0.0,
      "conversion_cold_to_fire_percent": 0.0,
      "conversion_cold_to_chaos_percent": 0.0,
      "conversion_fire_to_chaos_percent": 0.0,
      "attack_speed_add_percent": 2.0,
      "cast_speed_add_percent": 2.0,
      "skill_speed_final_percent": 0.0,
      "cooldown_recovery_add_percent": 0.0,
      "added_cooldown_ms": 0.0,
      "projectile_speed_add_percent": 0.0,
      "base_crit_chance_percent": 5.0,
      "crit_chance_add_percent": 0.0,
      "crit_rating": 0.0,
      "crit_damage_rating": 0.0,
      "crit_damage_add_percent": 0.0,
      "derived_crit_chance_percent": 5.0,
      "derived_crit_damage_percent": 300.0,
      "cannot_crit": false,
      "prevent_elemental_ailments": false,
      "area_add_percent": 0.0,
      "slash_chance_add_percent": 0.0,
      "projectile_count_add": 0.0,
      "split_projectile_chance_percent": 0.0,
      "split_projectile_count_add": 0.0,
      "chain_count_add": 0.0,
      "bounce_count_add": 0.0,
      "pierce_count_add": 0.0,
      "duration_add_percent": 0.0,
      "status_chance_add_percent": 0.0,
      "ignite_chance_add_percent": 0.0,
      "guard_trigger_count": 0.0,
      "guard_internal_cooldown_ms": 0.0,
      "added_damage_effectiveness_percent": 100.0
    }
  },
  "skill_stoneskin": {
    "active_gem_instance_id": "web_seed_active_5_active_stoneskin",
    "name_text": "石肤术",
    "skill_template_id": "skill_stoneskin",
    "skill_package_id": "active_stoneskin",
    "skill_package_version": "1.0.0",
    "template_text": "石肤术",
    "damage_type": "physical",
    "behavior_type": "player_nova",
    "behavior_template": "player_nova",
    "visual_effect": "skill_event.stoneskin.vfx",
    "cast": {
      "mode": "spell",
      "target_selector": "self",
      "search_range": 420,
      "cooldown_ms": 0,
      "release_interval_ms": 1000,
      "base_cooldown_ms": 6000,
      "trigger_interval_ms": 0,
      "mana_cost": 15,
      "windup_ms": 0,
      "recovery_ms": 0
    },
    "hit": {
      "base_damage": 0.0,
      "can_crit": false,
      "can_apply_status": true,
      "damage_timing": "on_area_hit",
      "hit_delay_ms": 160,
      "hit_radius": 1,
      "target_policy": "selected_target"
    },
    "runtime_params": {
      "radius": 1.0,
      "expand_duration_ms": 0,
      "hit_at_ms": 0,
      "max_targets": 1,
      "center_policy": "player_center",
      "damage_falloff_by_distance": "none",
      "ring_width": 1,
      "status_chance_scale": 0.0,
      "guard_absorb_percent": 70,
      "guard_absorb_amount": 150,
      "guard_duration_ms": 6000,
      "guard_exclude_damage_over_time": true,
      "projectile_count": 1
    },
    "presentation_keys": {
      "vfx": "skill_event.stoneskin.vfx",
      "cast_vfx_key": "skill_event.stoneskin.vfx",
      "projectile_vfx_key": "skill_event.stoneskin.vfx",
      "hit_vfx_key": "skill_event.stoneskin.vfx",
      "sfx": "skill_event.stoneskin.sfx",
      "floating_text": "skill_event.stoneskin.floating_text",
      "floating_text_style": "skill_event.stoneskin.floating_text",
      "screen_feedback": "skill_event.stoneskin.screen_feedback",
      "hit_stop_ms": 0,
      "camera_shake": 0
    },
    "source_context": {
      "active_gem_instance_id": "web_seed_active_5_active_stoneskin",
      "base_gem_id": "active_stoneskin",
      "gem_kind": "active_skill",
      "sudoku_digit": 1,
      "base_gem_level": 1,
      "effective_gem_level": 1,
      "tlidb_source_values": {
        "source": "tlidb",
        "tlidb_id": "Stoneskin",
        "display_level": 20,
        "raw_lines": [
          "释放该技能获得防护：吸收 吸收70%受到的伤害，无法吸收持续伤害",
          "共吸收1500点伤害 自身受到的伤害，最多吸收 吸收70%受到的伤害，无法吸收持续伤害",
          "共吸收1500点伤害 点，持续 6 秒。",
          "释放该技能获得防护：吸收 吸收70%受到的伤害，无法吸收持续伤害",
          "共吸收1500点伤害 自身受到的伤害",
          "最多吸收 吸收70%受到的伤害，无法吸收持续伤害",
          "共吸收1500点伤害 点",
          "持续 6 秒"
        ],
        "parsed_values": {
          "base_damage": 0,
          "mana_cost": 15,
          "release_interval_ms": 1000
        },
        "anchors": {
          "base_damage": {
            "20": 0
          }
        }
      },
      "level_values": {
        "base_damage": 0,
        "mana_cost": 15,
        "release_interval_ms": 1000
      },
      "auto_release": {
        "policy": "defensive_threshold",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "damage_basis": "flat",
      "damage_form": "spell",
      "weapon_attack_base_damage": 100.0,
      "added_damage_effectiveness_percent": 100.0
    },
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Stoneskin",
        "display_level": 20,
        "raw_lines": [
          "释放该技能获得防护：吸收 吸收70%受到的伤害，无法吸收持续伤害",
          "共吸收1500点伤害 自身受到的伤害，最多吸收 吸收70%受到的伤害，无法吸收持续伤害",
          "共吸收1500点伤害 点，持续 6 秒。",
          "释放该技能获得防护：吸收 吸收70%受到的伤害，无法吸收持续伤害",
          "共吸收1500点伤害 自身受到的伤害",
          "最多吸收 吸收70%受到的伤害，无法吸收持续伤害",
          "共吸收1500点伤害 点",
          "持续 6 秒"
        ],
        "parsed_values": {
          "base_damage": 0,
          "mana_cost": 15,
          "release_interval_ms": 1000
        },
        "anchors": {
          "base_damage": {
            "20": 0
          }
        }
      },
      "level_values": {
        "base_damage": 0,
        "mana_cost": 15,
        "release_interval_ms": 1000
      },
      "auto_release": {
        "policy": "defensive_threshold",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "routed_modifiers": [],
      "final_values": {
        "base_damage": 0.0,
        "final_damage": 0,
        "actual_interval_ms": 6000,
        "mana_cost": 15,
        "projectile_count": 1,
        "area_multiplier": 1.0,
        "speed_multiplier": 1.02
      }
    },
    "shape_effects": [],
    "labels": {
      "base_damage": "基础伤害",
      "final_damage": "最终伤害",
      "expected_hit_damage": "期望击中伤害",
      "preview_dps": "预览 DPS",
      "base_release_interval_ms": "基础释放间隔",
      "release_interval_ms": "释放间隔",
      "base_cooldown_ms": "基础冷却",
      "final_cooldown_ms": "最终冷却",
      "actual_interval_ms": "实际释放间隔",
      "trigger_interval_ms": "触发间隔",
      "mana_cost": "魔力消耗",
      "projectile_count": "投射物数量",
      "area_multiplier": "范围倍率",
      "speed_multiplier": "速度倍率"
    },
    "base_damage": 0.0,
    "final_damage": 0,
    "non_crit_damage": 0,
    "increase_pool": 0.0,
    "final_pool": 0.0,
    "crit_chance": 0.0,
    "crit_multiplier": 3.0,
    "expected_hit_damage": 0.0,
    "uses_per_second": 0.16666666666666666,
    "hit_coverage_factor": 1.0,
    "preview_dps": 0.0,
    "base_release_interval_ms": 1000,
    "release_interval_ms": 980,
    "base_cooldown_ms": 6000,
    "final_cooldown_ms": 6000,
    "actual_interval_ms": 6000,
    "trigger_interval_ms": 0,
    "mana_cost": 15,
    "projectile_count": 1,
    "area_multiplier": 1.0,
    "speed_multiplier": 1.02,
    "tags": [
      {
        "id": "guard",
        "text": "守护"
      },
      {
        "id": "spell",
        "text": "法术"
      }
    ],
    "applied_modifiers": [],
    "skill_stats": {
      "life_regen_flat": 10.0,
      "max_mana": 100.0,
      "max_energy_shield": 0.0,
      "physical_damage_add_percent": 0.0,
      "fire_damage_add_percent": 0.0,
      "cold_damage_add_percent": 0.0,
      "lightning_damage_add_percent": 0.0,
      "chaos_damage_add_percent": 0.0,
      "elemental_damage_add_percent": 0.0,
      "all_damage_type_add_percent": 0.0,
      "hit_damage_add_percent": 0.0,
      "dot_damage_add_percent": 0.0,
      "attack_damage_add_percent": 0.0,
      "spell_damage_add_percent": 0.0,
      "melee_damage_add_percent": 2.0,
      "ranged_damage_add_percent": 0.0,
      "projectile_damage_add_percent": 0.0,
      "area_damage_add_percent": 0.0,
      "chain_damage_add_percent": 0.0,
      "pierce_damage_add_percent": 0.0,
      "damage_add_percent": 0.0,
      "damage_final_percent": 0.0,
      "hit_damage_final_percent": 0.0,
      "double_damage_chance_percent": 0.0,
      "conversion_physical_to_fire_percent": 0.0,
      "conversion_physical_to_cold_percent": 0.0,
      "conversion_physical_to_lightning_percent": 0.0,
      "conversion_physical_to_chaos_percent": 0.0,
      "conversion_lightning_to_cold_percent": 0.0,
      "conversion_lightning_to_fire_percent": 0.0,
      "conversion_lightning_to_chaos_percent": 0.0,
      "conversion_cold_to_fire_percent": 0.0,
      "conversion_cold_to_chaos_percent": 0.0,
      "conversion_fire_to_chaos_percent": 0.0,
      "attack_speed_add_percent": 2.0,
      "cast_speed_add_percent": 2.0,
      "skill_speed_final_percent": 0.0,
      "cooldown_recovery_add_percent": 0.0,
      "added_cooldown_ms": 0.0,
      "projectile_speed_add_percent": 0.0,
      "base_crit_chance_percent": 5.0,
      "crit_chance_add_percent": 0.0,
      "crit_rating": 0.0,
      "crit_damage_rating": 0.0,
      "crit_damage_add_percent": 0.0,
      "derived_crit_chance_percent": 5.0,
      "derived_crit_damage_percent": 300.0,
      "cannot_crit": false,
      "prevent_elemental_ailments": false,
      "area_add_percent": 0.0,
      "slash_chance_add_percent": 0.0,
      "projectile_count_add": 0.0,
      "split_projectile_chance_percent": 0.0,
      "split_projectile_count_add": 0.0,
      "chain_count_add": 0.0,
      "bounce_count_add": 0.0,
      "pierce_count_add": 0.0,
      "duration_add_percent": 0.0,
      "status_chance_add_percent": 0.0,
      "ignite_chance_add_percent": 0.0,
      "guard_trigger_count": 0.0,
      "guard_internal_cooldown_ms": 0.0,
      "added_damage_effectiveness_percent": 100.0
    }
  },
  "skill_thundercloud": {
    "active_gem_instance_id": "web_seed_active_6_active_thundercloud",
    "name_text": "雷云放射",
    "skill_template_id": "skill_thundercloud",
    "skill_package_id": "active_thundercloud",
    "skill_package_version": "1.0.0",
    "template_text": "雷云放射",
    "damage_type": "lightning",
    "behavior_type": "damage_zone",
    "behavior_template": "damage_zone",
    "visual_effect": "skill_event.thundercloud.vfx",
    "cast": {
      "mode": "spell",
      "target_selector": "nearest_enemy",
      "search_range": 420,
      "cooldown_ms": 0,
      "release_interval_ms": 333,
      "base_cooldown_ms": 0,
      "trigger_interval_ms": 500,
      "mana_cost": 8,
      "windup_ms": 0,
      "recovery_ms": 0
    },
    "hit": {
      "base_damage": 35.9,
      "can_crit": true,
      "can_apply_status": true,
      "damage_timing": "on_damage_zone_hit",
      "hit_delay_ms": 160,
      "hit_radius": 143,
      "target_policy": "selected_target"
    },
    "runtime_params": {
      "shape": "circle",
      "origin_policy": "caster",
      "facing_policy": "none",
      "hit_at_ms": 120,
      "max_targets": 3,
      "status_chance_scale": 1.0,
      "zone_vfx_key": "skill_event.thundercloud.vfx",
      "radius": 143.0,
      "expand_duration_ms": 120,
      "ring_width": 60,
      "channel_max_stacks": 5,
      "channel_time_per_stack_ms": 333,
      "channel_frequency_cap_stacks": 9,
      "cloud_duration_per_stack_ms": 2500,
      "base_tick_interval_ms": 600,
      "duration_ms": 12500,
      "tick_interval_ms": 333,
      "max_hits": 111,
      "max_hits_per_target": 37,
      "chain_count": 1,
      "chain_radius": 160.0,
      "segment_vfx_key": "skill_event.thundercloud.vfx",
      "projectile_count": 1,
      "channel_min_stacks": 0
    },
    "presentation_keys": {
      "vfx": "skill_event.thundercloud.vfx",
      "cast_vfx_key": "skill_event.thundercloud.vfx",
      "projectile_vfx_key": "skill_event.thundercloud.vfx",
      "hit_vfx_key": "skill_event.thundercloud.vfx",
      "sfx": "skill_event.thundercloud.sfx",
      "floating_text": "skill_event.thundercloud.floating_text",
      "floating_text_style": "skill_event.thundercloud.floating_text",
      "screen_feedback": "skill_event.thundercloud.screen_feedback",
      "hit_stop_ms": 0,
      "camera_shake": 0
    },
    "source_context": {
      "active_gem_instance_id": "web_seed_active_6_active_thundercloud",
      "base_gem_id": "active_thundercloud",
      "gem_kind": "active_skill",
      "sudoku_digit": 1,
      "base_gem_level": 1,
      "effective_gem_level": 1,
      "tlidb_source_values": {
        "source": "tlidb",
        "tlidb_id": "Thundercloud",
        "display_level": 20,
        "raw_lines": [
          "引导该技能时在自身上方凝聚出一朵雷云，一段时间内持续打击一定范围内的敌人，每次造成 36-682 法术闪电伤害。",
          "引导层数使该技能的雷云持续时间增长，打击频率提高。",
          "雷云：",
          "造成 36-682 法术闪电伤害",
          "引导层数最多 5 层",
          "每层引导层数使雷云的持续时间 +2.5 秒",
          "雷云最多选择 3 个敌人作为目标",
          "该技能 +1 弹射次数",
          "雷云打击频率在 9 层引导层数时达到最快"
        ],
        "parsed_values": {
          "base_damage": 359,
          "mana_cost": 8,
          "release_interval_ms": 333
        },
        "anchors": {
          "base_damage": {
            "20": 359
          }
        }
      },
      "level_values": {
        "base_damage": 35.9,
        "mana_cost": 8,
        "release_interval_ms": 333
      },
      "auto_release": {
        "policy": "duration_window",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "damage_basis": "flat",
      "damage_form": "spell",
      "weapon_attack_base_damage": 100.0,
      "added_damage_effectiveness_percent": 100.0
    },
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Thundercloud",
        "display_level": 20,
        "raw_lines": [
          "引导该技能时在自身上方凝聚出一朵雷云，一段时间内持续打击一定范围内的敌人，每次造成 36-682 法术闪电伤害。",
          "引导层数使该技能的雷云持续时间增长，打击频率提高。",
          "雷云：",
          "造成 36-682 法术闪电伤害",
          "引导层数最多 5 层",
          "每层引导层数使雷云的持续时间 +2.5 秒",
          "雷云最多选择 3 个敌人作为目标",
          "该技能 +1 弹射次数",
          "雷云打击频率在 9 层引导层数时达到最快"
        ],
        "parsed_values": {
          "base_damage": 359,
          "mana_cost": 8,
          "release_interval_ms": 333
        },
        "anchors": {
          "base_damage": {
            "20": 359
          }
        }
      },
      "level_values": {
        "base_damage": 35.9,
        "mana_cost": 8,
        "release_interval_ms": 333
      },
      "auto_release": {
        "policy": "duration_window",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "routed_modifiers": [],
      "final_values": {
        "base_damage": 35.9,
        "final_damage": 35.9,
        "actual_interval_ms": 326,
        "mana_cost": 8,
        "projectile_count": 1,
        "area_multiplier": 1.0,
        "speed_multiplier": 1.02
      }
    },
    "shape_effects": [],
    "labels": {
      "base_damage": "基础伤害",
      "final_damage": "最终伤害",
      "expected_hit_damage": "期望击中伤害",
      "preview_dps": "预览 DPS",
      "base_release_interval_ms": "基础释放间隔",
      "release_interval_ms": "释放间隔",
      "base_cooldown_ms": "基础冷却",
      "final_cooldown_ms": "最终冷却",
      "actual_interval_ms": "实际释放间隔",
      "trigger_interval_ms": "触发间隔",
      "mana_cost": "魔力消耗",
      "projectile_count": "投射物数量",
      "area_multiplier": "范围倍率",
      "speed_multiplier": "速度倍率"
    },
    "base_damage": 35.9,
    "final_damage": 35.9,
    "non_crit_damage": 35.9,
    "increase_pool": 0.0,
    "final_pool": 0.0,
    "crit_chance": 0.05,
    "crit_multiplier": 3.0,
    "expected_hit_damage": 39.49,
    "uses_per_second": 3.067484662576687,
    "hit_coverage_factor": 1.0,
    "preview_dps": 121.13496932515338,
    "base_release_interval_ms": 333,
    "release_interval_ms": 326,
    "base_cooldown_ms": 0,
    "final_cooldown_ms": 0,
    "actual_interval_ms": 326,
    "trigger_interval_ms": 500,
    "mana_cost": 8,
    "projectile_count": 1,
    "area_multiplier": 1.0,
    "speed_multiplier": 1.02,
    "tags": [
      {
        "id": "area",
        "text": "范围"
      },
      {
        "id": "channel",
        "text": "引导"
      },
      {
        "id": "lightning",
        "text": "闪电"
      },
      {
        "id": "spell",
        "text": "法术"
      }
    ],
    "applied_modifiers": [],
    "skill_stats": {
      "life_regen_flat": 10.0,
      "max_mana": 100.0,
      "max_energy_shield": 0.0,
      "physical_damage_add_percent": 0.0,
      "fire_damage_add_percent": 0.0,
      "cold_damage_add_percent": 0.0,
      "lightning_damage_add_percent": 0.0,
      "chaos_damage_add_percent": 0.0,
      "elemental_damage_add_percent": 0.0,
      "all_damage_type_add_percent": 0.0,
      "hit_damage_add_percent": 0.0,
      "dot_damage_add_percent": 0.0,
      "attack_damage_add_percent": 0.0,
      "spell_damage_add_percent": 0.0,
      "melee_damage_add_percent": 2.0,
      "ranged_damage_add_percent": 0.0,
      "projectile_damage_add_percent": 0.0,
      "area_damage_add_percent": 0.0,
      "chain_damage_add_percent": 0.0,
      "pierce_damage_add_percent": 0.0,
      "damage_add_percent": 0.0,
      "damage_final_percent": 0.0,
      "hit_damage_final_percent": 0.0,
      "double_damage_chance_percent": 0.0,
      "conversion_physical_to_fire_percent": 0.0,
      "conversion_physical_to_cold_percent": 0.0,
      "conversion_physical_to_lightning_percent": 0.0,
      "conversion_physical_to_chaos_percent": 0.0,
      "conversion_lightning_to_cold_percent": 0.0,
      "conversion_lightning_to_fire_percent": 0.0,
      "conversion_lightning_to_chaos_percent": 0.0,
      "conversion_cold_to_fire_percent": 0.0,
      "conversion_cold_to_chaos_percent": 0.0,
      "conversion_fire_to_chaos_percent": 0.0,
      "attack_speed_add_percent": 2.0,
      "cast_speed_add_percent": 2.0,
      "skill_speed_final_percent": 0.0,
      "cooldown_recovery_add_percent": 0.0,
      "added_cooldown_ms": 0.0,
      "projectile_speed_add_percent": 0.0,
      "base_crit_chance_percent": 5.0,
      "crit_chance_add_percent": 0.0,
      "crit_rating": 0.0,
      "crit_damage_rating": 0.0,
      "crit_damage_add_percent": 0.0,
      "derived_crit_chance_percent": 5.0,
      "derived_crit_damage_percent": 300.0,
      "cannot_crit": false,
      "prevent_elemental_ailments": false,
      "area_add_percent": 0.0,
      "slash_chance_add_percent": 0.0,
      "projectile_count_add": 0.0,
      "split_projectile_chance_percent": 0.0,
      "split_projectile_count_add": 0.0,
      "chain_count_add": 0.0,
      "bounce_count_add": 0.0,
      "pierce_count_add": 0.0,
      "duration_add_percent": 0.0,
      "status_chance_add_percent": 0.0,
      "ignite_chance_add_percent": 0.0,
      "guard_trigger_count": 0.0,
      "guard_internal_cooldown_ms": 0.0,
      "added_damage_effectiveness_percent": 100.0
    }
  },
  "skill_blizzard": {
    "active_gem_instance_id": "web_seed_active_7_active_blizzard",
    "name_text": "暴风雪",
    "skill_template_id": "skill_blizzard",
    "skill_package_id": "active_blizzard",
    "skill_package_version": "1.0.0",
    "template_text": "暴风雪",
    "damage_type": "cold",
    "behavior_type": "damage_zone",
    "behavior_template": "damage_zone",
    "visual_effect": "skill_event.blizzard.vfx",
    "cast": {
      "mode": "spell",
      "target_selector": "nearest_enemy",
      "search_range": 630,
      "cooldown_ms": 0,
      "release_interval_ms": 900,
      "base_cooldown_ms": 2000,
      "trigger_interval_ms": 0,
      "mana_cost": 8,
      "windup_ms": 0,
      "recovery_ms": 0
    },
    "hit": {
      "base_damage": 3.5,
      "ailments": [
        {
          "type": "frostbite",
          "source_damage_type": "cold",
          "chance_percent": 100,
          "duration_ms": 6000,
          "base_value": 10,
          "max_stacks": 1,
          "effect_per_stack": 10,
          "threshold": 0
        }
      ],
      "can_crit": true,
      "can_apply_status": true,
      "damage_timing": "on_damage_zone_hit",
      "hit_delay_ms": 160,
      "hit_radius": 120,
      "target_policy": "selected_target"
    },
    "runtime_params": {
      "shape": "circle",
      "origin_policy": "target_position",
      "facing_policy": "none",
      "hit_at_ms": 240,
      "max_targets": 8,
      "status_chance_scale": 1.0,
      "zone_vfx_key": "skill_event.blizzard.vfx",
      "radius": 120.0,
      "expand_duration_ms": 180,
      "ring_width": 80,
      "duration_ms": 420,
      "max_hits": 8,
      "max_hits_per_target": 1,
      "wave_count": 3,
      "wave_interval_ms": 300,
      "target_lock_policy": "nearest_unique_enemy",
      "impact_marker_policy": "target_lock",
      "projectile_count": 1
    },
    "presentation_keys": {
      "vfx": "skill_event.blizzard.vfx",
      "cast_vfx_key": "skill_event.blizzard.vfx",
      "projectile_vfx_key": "skill_event.blizzard.vfx",
      "hit_vfx_key": "skill_event.blizzard.vfx",
      "sfx": "skill_event.blizzard.sfx",
      "floating_text": "skill_event.blizzard.floating_text",
      "floating_text_style": "skill_event.blizzard.floating_text",
      "screen_feedback": "skill_event.blizzard.screen_feedback",
      "hit_stop_ms": 0,
      "camera_shake": 0
    },
    "source_context": {
      "active_gem_instance_id": "web_seed_active_7_active_blizzard",
      "base_gem_id": "active_blizzard",
      "gem_kind": "active_skill",
      "sudoku_digit": 1,
      "base_gem_level": 1,
      "effective_gem_level": 1,
      "tlidb_source_values": {
        "source": "tlidb",
        "tlidb_id": "Blizzard",
        "display_level": 20,
        "raw_lines": [
          "释放该技能在指定位置落下 3 波暴风雪，造成 203-303 法术冰霜伤害。",
          "该技能击中时对敌人施加减益：额外 10% 受到的冰霜伤害，持续 6 秒。",
          "暴风雪：",
          "造成 203-303 法术冰霜伤害",
          "基础落下 1 波暴风雪",
          "该技能 +2 总波次",
          "额外 +10% 受到的冰霜伤害"
        ],
        "parsed_values": {
          "base_damage": 3.5,
          "level_20_base_damage": 253,
          "added_damage_effectiveness_percent": 47,
          "mana_cost": 8,
          "release_interval_ms": 900
        },
        "anchors": {
          "base_damage": {
            "1": 3.5,
            "20": 253
          }
        }
      },
      "level_values": {
        "base_damage": 3.5,
        "mana_cost": 8,
        "release_interval_ms": 900
      },
      "auto_release": {
        "policy": "target_cluster",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "damage_basis": "flat",
      "damage_form": "spell",
      "weapon_attack_base_damage": 100.0,
      "added_damage_effectiveness_percent": 47.0
    },
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Blizzard",
        "display_level": 20,
        "raw_lines": [
          "释放该技能在指定位置落下 3 波暴风雪，造成 203-303 法术冰霜伤害。",
          "该技能击中时对敌人施加减益：额外 10% 受到的冰霜伤害，持续 6 秒。",
          "暴风雪：",
          "造成 203-303 法术冰霜伤害",
          "基础落下 1 波暴风雪",
          "该技能 +2 总波次",
          "额外 +10% 受到的冰霜伤害"
        ],
        "parsed_values": {
          "base_damage": 3.5,
          "level_20_base_damage": 253,
          "added_damage_effectiveness_percent": 47,
          "mana_cost": 8,
          "release_interval_ms": 900
        },
        "anchors": {
          "base_damage": {
            "1": 3.5,
            "20": 253
          }
        }
      },
      "level_values": {
        "base_damage": 3.5,
        "mana_cost": 8,
        "release_interval_ms": 900
      },
      "auto_release": {
        "policy": "target_cluster",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "routed_modifiers": [],
      "final_values": {
        "base_damage": 3.5,
        "final_damage": 3.5,
        "actual_interval_ms": 2000,
        "mana_cost": 8,
        "projectile_count": 1,
        "area_multiplier": 1.0,
        "speed_multiplier": 1.02
      }
    },
    "shape_effects": [],
    "labels": {
      "base_damage": "基础伤害",
      "final_damage": "最终伤害",
      "expected_hit_damage": "期望击中伤害",
      "preview_dps": "预览 DPS",
      "base_release_interval_ms": "基础释放间隔",
      "release_interval_ms": "释放间隔",
      "base_cooldown_ms": "基础冷却",
      "final_cooldown_ms": "最终冷却",
      "actual_interval_ms": "实际释放间隔",
      "trigger_interval_ms": "触发间隔",
      "mana_cost": "魔力消耗",
      "projectile_count": "投射物数量",
      "area_multiplier": "范围倍率",
      "speed_multiplier": "速度倍率"
    },
    "base_damage": 3.5,
    "final_damage": 3.5,
    "non_crit_damage": 3.5,
    "increase_pool": 0.0,
    "final_pool": 0.0,
    "crit_chance": 0.05,
    "crit_multiplier": 3.0,
    "expected_hit_damage": 3.8500000000000005,
    "uses_per_second": 0.5,
    "hit_coverage_factor": 1.0,
    "preview_dps": 1.9250000000000003,
    "base_release_interval_ms": 900,
    "release_interval_ms": 882,
    "base_cooldown_ms": 2000,
    "final_cooldown_ms": 2000,
    "actual_interval_ms": 2000,
    "trigger_interval_ms": 0,
    "mana_cost": 8,
    "projectile_count": 1,
    "area_multiplier": 1.0,
    "speed_multiplier": 1.02,
    "tags": [
      {
        "id": "area",
        "text": "范围"
      },
      {
        "id": "bombardment",
        "text": "轰炸"
      },
      {
        "id": "cold",
        "text": "冰霜"
      },
      {
        "id": "intelligence",
        "text": "智慧"
      },
      {
        "id": "spell",
        "text": "法术"
      }
    ],
    "applied_modifiers": [],
    "skill_stats": {
      "life_regen_flat": 10.0,
      "max_mana": 100.0,
      "max_energy_shield": 0.0,
      "physical_damage_add_percent": 0.0,
      "fire_damage_add_percent": 0.0,
      "cold_damage_add_percent": 0.0,
      "lightning_damage_add_percent": 0.0,
      "chaos_damage_add_percent": 0.0,
      "elemental_damage_add_percent": 0.0,
      "all_damage_type_add_percent": 0.0,
      "hit_damage_add_percent": 0.0,
      "dot_damage_add_percent": 0.0,
      "attack_damage_add_percent": 0.0,
      "spell_damage_add_percent": 0.0,
      "melee_damage_add_percent": 2.0,
      "ranged_damage_add_percent": 0.0,
      "projectile_damage_add_percent": 0.0,
      "area_damage_add_percent": 0.0,
      "chain_damage_add_percent": 0.0,
      "pierce_damage_add_percent": 0.0,
      "damage_add_percent": 0.0,
      "damage_final_percent": 0.0,
      "hit_damage_final_percent": 0.0,
      "double_damage_chance_percent": 0.0,
      "conversion_physical_to_fire_percent": 0.0,
      "conversion_physical_to_cold_percent": 0.0,
      "conversion_physical_to_lightning_percent": 0.0,
      "conversion_physical_to_chaos_percent": 0.0,
      "conversion_lightning_to_cold_percent": 0.0,
      "conversion_lightning_to_fire_percent": 0.0,
      "conversion_lightning_to_chaos_percent": 0.0,
      "conversion_cold_to_fire_percent": 0.0,
      "conversion_cold_to_chaos_percent": 0.0,
      "conversion_fire_to_chaos_percent": 0.0,
      "attack_speed_add_percent": 2.0,
      "cast_speed_add_percent": 2.0,
      "skill_speed_final_percent": 0.0,
      "cooldown_recovery_add_percent": 0.0,
      "added_cooldown_ms": 0.0,
      "projectile_speed_add_percent": 0.0,
      "base_crit_chance_percent": 5.0,
      "crit_chance_add_percent": 0.0,
      "crit_rating": 0.0,
      "crit_damage_rating": 0.0,
      "crit_damage_add_percent": 0.0,
      "derived_crit_chance_percent": 5.0,
      "derived_crit_damage_percent": 300.0,
      "cannot_crit": false,
      "prevent_elemental_ailments": false,
      "area_add_percent": 0.0,
      "slash_chance_add_percent": 0.0,
      "projectile_count_add": 0.0,
      "split_projectile_chance_percent": 0.0,
      "split_projectile_count_add": 0.0,
      "chain_count_add": 0.0,
      "bounce_count_add": 0.0,
      "pierce_count_add": 0.0,
      "duration_add_percent": 0.0,
      "status_chance_add_percent": 0.0,
      "ignite_chance_add_percent": 0.0,
      "guard_trigger_count": 0.0,
      "guard_internal_cooldown_ms": 0.0,
      "added_damage_effectiveness_percent": 47.0
    }
  },
  "skill_chain_lightning": {
    "active_gem_instance_id": "web_seed_active_8_active_chain_lightning",
    "name_text": "闪电链",
    "skill_template_id": "skill_chain_lightning",
    "skill_package_id": "active_chain_lightning",
    "skill_package_version": "1.0.0",
    "template_text": "闪电链",
    "damage_type": "lightning",
    "behavior_type": "chain",
    "behavior_template": "chain",
    "visual_effect": "skill_event.chain_lightning.vfx",
    "cast": {
      "mode": "spell",
      "target_selector": "nearest_enemy",
      "search_range": 420,
      "cooldown_ms": 0,
      "release_interval_ms": 650,
      "base_cooldown_ms": 0,
      "trigger_interval_ms": 0,
      "mana_cost": 8,
      "windup_ms": 0,
      "recovery_ms": 0
    },
    "hit": {
      "base_damage": 73.3,
      "can_crit": true,
      "can_apply_status": true,
      "damage_timing": "on_chain_hit",
      "hit_delay_ms": 160,
      "hit_radius": 24,
      "target_policy": "selected_target"
    },
    "runtime_params": {
      "chain_count": 3,
      "chain_radius": 180.0,
      "chain_delay_ms": 90,
      "damage_falloff_per_chain": 0,
      "target_policy": "nearest_not_hit",
      "allow_repeat_target": false,
      "max_targets": 4,
      "segment_vfx_key": "skill_event.lightning_chain.vfx",
      "projectile_count": 1
    },
    "presentation_keys": {
      "vfx": "skill_event.chain_lightning.vfx",
      "cast_vfx_key": "skill_event.chain_lightning.vfx",
      "projectile_vfx_key": "skill_event.chain_lightning.vfx",
      "hit_vfx_key": "skill_event.chain_lightning.vfx",
      "sfx": "skill_event.chain_lightning.sfx",
      "floating_text": "skill_event.chain_lightning.floating_text",
      "floating_text_style": "skill_event.chain_lightning.floating_text",
      "screen_feedback": "skill_event.chain_lightning.screen_feedback",
      "hit_stop_ms": 0,
      "camera_shake": 0
    },
    "source_context": {
      "active_gem_instance_id": "web_seed_active_8_active_chain_lightning",
      "base_gem_id": "active_chain_lightning",
      "gem_kind": "active_skill",
      "sudoku_digit": 1,
      "base_gem_level": 1,
      "effective_gem_level": 1,
      "tlidb_source_values": {
        "source": "tlidb",
        "tlidb_id": "Chain_Lightning",
        "display_level": 20,
        "raw_lines": [
          "释放该技能向敌人发射一道闪电链，造成 73-1393 法术闪电伤害。闪电链可以弹射 2 次。",
          "闪电链：",
          "造成 73-1393 法术闪电伤害",
          "该技能 +2 弹射次数"
        ],
        "parsed_values": {
          "base_damage": 733,
          "mana_cost": 8,
          "release_interval_ms": 650
        },
        "anchors": {
          "base_damage": {
            "20": 733
          }
        }
      },
      "level_values": {
        "base_damage": 73.3,
        "mana_cost": 8,
        "release_interval_ms": 650
      },
      "auto_release": {
        "policy": "nearest_enemy",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "damage_basis": "flat",
      "damage_form": "spell",
      "weapon_attack_base_damage": 100.0,
      "added_damage_effectiveness_percent": 100.0
    },
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Chain_Lightning",
        "display_level": 20,
        "raw_lines": [
          "释放该技能向敌人发射一道闪电链，造成 73-1393 法术闪电伤害。闪电链可以弹射 2 次。",
          "闪电链：",
          "造成 73-1393 法术闪电伤害",
          "该技能 +2 弹射次数"
        ],
        "parsed_values": {
          "base_damage": 733,
          "mana_cost": 8,
          "release_interval_ms": 650
        },
        "anchors": {
          "base_damage": {
            "20": 733
          }
        }
      },
      "level_values": {
        "base_damage": 73.3,
        "mana_cost": 8,
        "release_interval_ms": 650
      },
      "auto_release": {
        "policy": "nearest_enemy",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "routed_modifiers": [],
      "final_values": {
        "base_damage": 73.3,
        "final_damage": 73.3,
        "actual_interval_ms": 637,
        "mana_cost": 8,
        "projectile_count": 1,
        "area_multiplier": 1.0,
        "speed_multiplier": 1.02
      }
    },
    "shape_effects": [],
    "labels": {
      "base_damage": "基础伤害",
      "final_damage": "最终伤害",
      "expected_hit_damage": "期望击中伤害",
      "preview_dps": "预览 DPS",
      "base_release_interval_ms": "基础释放间隔",
      "release_interval_ms": "释放间隔",
      "base_cooldown_ms": "基础冷却",
      "final_cooldown_ms": "最终冷却",
      "actual_interval_ms": "实际释放间隔",
      "trigger_interval_ms": "触发间隔",
      "mana_cost": "魔力消耗",
      "projectile_count": "投射物数量",
      "area_multiplier": "范围倍率",
      "speed_multiplier": "速度倍率"
    },
    "base_damage": 73.3,
    "final_damage": 73.3,
    "non_crit_damage": 73.3,
    "increase_pool": 0.0,
    "final_pool": 0.0,
    "crit_chance": 0.05,
    "crit_multiplier": 3.0,
    "expected_hit_damage": 80.63000000000001,
    "uses_per_second": 1.5698587127158556,
    "hit_coverage_factor": 1.0,
    "preview_dps": 126.57770800627945,
    "base_release_interval_ms": 650,
    "release_interval_ms": 637,
    "base_cooldown_ms": 0,
    "final_cooldown_ms": 0,
    "actual_interval_ms": 637,
    "trigger_interval_ms": 0,
    "mana_cost": 8,
    "projectile_count": 1,
    "area_multiplier": 1.0,
    "speed_multiplier": 1.02,
    "tags": [
      {
        "id": "chain",
        "text": "连锁"
      },
      {
        "id": "lightning",
        "text": "闪电"
      },
      {
        "id": "spell",
        "text": "法术"
      }
    ],
    "applied_modifiers": [],
    "skill_stats": {
      "life_regen_flat": 10.0,
      "max_mana": 100.0,
      "max_energy_shield": 0.0,
      "physical_damage_add_percent": 0.0,
      "fire_damage_add_percent": 0.0,
      "cold_damage_add_percent": 0.0,
      "lightning_damage_add_percent": 0.0,
      "chaos_damage_add_percent": 0.0,
      "elemental_damage_add_percent": 0.0,
      "all_damage_type_add_percent": 0.0,
      "hit_damage_add_percent": 0.0,
      "dot_damage_add_percent": 0.0,
      "attack_damage_add_percent": 0.0,
      "spell_damage_add_percent": 0.0,
      "melee_damage_add_percent": 2.0,
      "ranged_damage_add_percent": 0.0,
      "projectile_damage_add_percent": 0.0,
      "area_damage_add_percent": 0.0,
      "chain_damage_add_percent": 0.0,
      "pierce_damage_add_percent": 0.0,
      "damage_add_percent": 0.0,
      "damage_final_percent": 0.0,
      "hit_damage_final_percent": 0.0,
      "double_damage_chance_percent": 0.0,
      "conversion_physical_to_fire_percent": 0.0,
      "conversion_physical_to_cold_percent": 0.0,
      "conversion_physical_to_lightning_percent": 0.0,
      "conversion_physical_to_chaos_percent": 0.0,
      "conversion_lightning_to_cold_percent": 0.0,
      "conversion_lightning_to_fire_percent": 0.0,
      "conversion_lightning_to_chaos_percent": 0.0,
      "conversion_cold_to_fire_percent": 0.0,
      "conversion_cold_to_chaos_percent": 0.0,
      "conversion_fire_to_chaos_percent": 0.0,
      "attack_speed_add_percent": 2.0,
      "cast_speed_add_percent": 2.0,
      "skill_speed_final_percent": 0.0,
      "cooldown_recovery_add_percent": 0.0,
      "added_cooldown_ms": 0.0,
      "projectile_speed_add_percent": 0.0,
      "base_crit_chance_percent": 5.0,
      "crit_chance_add_percent": 0.0,
      "crit_rating": 0.0,
      "crit_damage_rating": 0.0,
      "crit_damage_add_percent": 0.0,
      "derived_crit_chance_percent": 5.0,
      "derived_crit_damage_percent": 300.0,
      "cannot_crit": false,
      "prevent_elemental_ailments": false,
      "area_add_percent": 0.0,
      "slash_chance_add_percent": 0.0,
      "projectile_count_add": 0.0,
      "split_projectile_chance_percent": 0.0,
      "split_projectile_count_add": 0.0,
      "chain_count_add": 0.0,
      "bounce_count_add": 0.0,
      "pierce_count_add": 0.0,
      "duration_add_percent": 0.0,
      "status_chance_add_percent": 0.0,
      "ignite_chance_add_percent": 0.0,
      "guard_trigger_count": 0.0,
      "guard_internal_cooldown_ms": 0.0,
      "added_damage_effectiveness_percent": 100.0
    }
  },
  "skill_ring_of_ice": {
    "active_gem_instance_id": "web_seed_active_9_active_ring_of_ice",
    "name_text": "冰环术",
    "skill_template_id": "skill_ring_of_ice",
    "skill_package_id": "active_ring_of_ice",
    "skill_package_version": "1.0.0",
    "template_text": "冰环术",
    "damage_type": "cold",
    "behavior_type": "player_nova",
    "behavior_template": "player_nova",
    "visual_effect": "skill_event.ring_of_ice.vfx",
    "cast": {
      "mode": "spell",
      "target_selector": "self",
      "search_range": 118,
      "cooldown_ms": 0,
      "release_interval_ms": 800,
      "base_cooldown_ms": 0,
      "trigger_interval_ms": 0,
      "mana_cost": 8,
      "windup_ms": 0,
      "recovery_ms": 0
    },
    "hit": {
      "base_damage": 76.5,
      "can_crit": true,
      "can_apply_status": true,
      "damage_timing": "on_area_hit",
      "hit_delay_ms": 160,
      "hit_radius": 118,
      "target_policy": "selected_target"
    },
    "runtime_params": {
      "radius": 118.0,
      "expand_duration_ms": 520,
      "hit_at_ms": 140,
      "max_targets": 8,
      "center_policy": "player_center",
      "damage_falloff_by_distance": "none",
      "ring_width": 82,
      "suppress_hit_vfx": true,
      "status_chance_scale": 1.0,
      "on_kill_recast_chance_percent": 20,
      "on_kill_recast_max_per_area": 1,
      "projectile_count": 1
    },
    "presentation_keys": {
      "vfx": "skill_event.ring_of_ice.vfx",
      "cast_vfx_key": "skill_event.ring_of_ice.vfx",
      "projectile_vfx_key": "skill_event.ring_of_ice.vfx",
      "sfx": "skill_event.ring_of_ice.sfx",
      "floating_text": "skill_event.ring_of_ice.floating_text",
      "floating_text_style": "skill_event.ring_of_ice.floating_text",
      "screen_feedback": "skill_event.ring_of_ice.screen_feedback",
      "hit_stop_ms": 0,
      "camera_shake": 0
    },
    "source_context": {
      "active_gem_instance_id": "web_seed_active_9_active_ring_of_ice",
      "base_gem_id": "active_ring_of_ice",
      "gem_kind": "active_skill",
      "sudoku_digit": 1,
      "base_gem_level": 1,
      "effective_gem_level": 1,
      "tlidb_source_values": {
        "source": "tlidb",
        "tlidb_id": "Ring_of_Ice",
        "display_level": 20,
        "raw_lines": [
          "释放该技能在自身一定范围内形成一圈冰环，造成 612-918 法术冰霜伤害。",
          "该技能击败敌人时，有 20% 几率在该敌人位置再次触发一圈冰环。每圈冰环只能触发一次该效果。",
          "冰环：",
          "造成 612-918 法术冰霜伤害",
          "该技能击败敌人时， +20% 几率在敌人的位置再次触发该技能；每圈冰环只能触发一次该效果"
        ],
        "parsed_values": {
          "base_damage": 765,
          "mana_cost": 8,
          "release_interval_ms": 800
        },
        "anchors": {
          "base_damage": {
            "20": 765
          }
        }
      },
      "level_values": {
        "base_damage": 76.5,
        "mana_cost": 8,
        "release_interval_ms": 800
      },
      "auto_release": {
        "policy": "self_center",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "damage_basis": "flat",
      "damage_form": "spell",
      "weapon_attack_base_damage": 100.0,
      "added_damage_effectiveness_percent": 100.0
    },
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Ring_of_Ice",
        "display_level": 20,
        "raw_lines": [
          "释放该技能在自身一定范围内形成一圈冰环，造成 612-918 法术冰霜伤害。",
          "该技能击败敌人时，有 20% 几率在该敌人位置再次触发一圈冰环。每圈冰环只能触发一次该效果。",
          "冰环：",
          "造成 612-918 法术冰霜伤害",
          "该技能击败敌人时， +20% 几率在敌人的位置再次触发该技能；每圈冰环只能触发一次该效果"
        ],
        "parsed_values": {
          "base_damage": 765,
          "mana_cost": 8,
          "release_interval_ms": 800
        },
        "anchors": {
          "base_damage": {
            "20": 765
          }
        }
      },
      "level_values": {
        "base_damage": 76.5,
        "mana_cost": 8,
        "release_interval_ms": 800
      },
      "auto_release": {
        "policy": "self_center",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "routed_modifiers": [],
      "final_values": {
        "base_damage": 76.5,
        "final_damage": 76.5,
        "actual_interval_ms": 784,
        "mana_cost": 8,
        "projectile_count": 1,
        "area_multiplier": 1.0,
        "speed_multiplier": 1.02
      }
    },
    "shape_effects": [],
    "labels": {
      "base_damage": "基础伤害",
      "final_damage": "最终伤害",
      "expected_hit_damage": "期望击中伤害",
      "preview_dps": "预览 DPS",
      "base_release_interval_ms": "基础释放间隔",
      "release_interval_ms": "释放间隔",
      "base_cooldown_ms": "基础冷却",
      "final_cooldown_ms": "最终冷却",
      "actual_interval_ms": "实际释放间隔",
      "trigger_interval_ms": "触发间隔",
      "mana_cost": "魔力消耗",
      "projectile_count": "投射物数量",
      "area_multiplier": "范围倍率",
      "speed_multiplier": "速度倍率"
    },
    "base_damage": 76.5,
    "final_damage": 76.5,
    "non_crit_damage": 76.5,
    "increase_pool": 0.0,
    "final_pool": 0.0,
    "crit_chance": 0.05,
    "crit_multiplier": 3.0,
    "expected_hit_damage": 84.15,
    "uses_per_second": 1.2755102040816326,
    "hit_coverage_factor": 1.0,
    "preview_dps": 107.3341836734694,
    "base_release_interval_ms": 800,
    "release_interval_ms": 784,
    "base_cooldown_ms": 0,
    "final_cooldown_ms": 0,
    "actual_interval_ms": 784,
    "trigger_interval_ms": 0,
    "mana_cost": 8,
    "projectile_count": 1,
    "area_multiplier": 1.0,
    "speed_multiplier": 1.02,
    "tags": [
      {
        "id": "area",
        "text": "范围"
      },
      {
        "id": "cold",
        "text": "冰霜"
      },
      {
        "id": "nova",
        "text": "环形爆发"
      },
      {
        "id": "spell",
        "text": "法术"
      }
    ],
    "applied_modifiers": [],
    "skill_stats": {
      "life_regen_flat": 10.0,
      "max_mana": 100.0,
      "max_energy_shield": 0.0,
      "physical_damage_add_percent": 0.0,
      "fire_damage_add_percent": 0.0,
      "cold_damage_add_percent": 0.0,
      "lightning_damage_add_percent": 0.0,
      "chaos_damage_add_percent": 0.0,
      "elemental_damage_add_percent": 0.0,
      "all_damage_type_add_percent": 0.0,
      "hit_damage_add_percent": 0.0,
      "dot_damage_add_percent": 0.0,
      "attack_damage_add_percent": 0.0,
      "spell_damage_add_percent": 0.0,
      "melee_damage_add_percent": 2.0,
      "ranged_damage_add_percent": 0.0,
      "projectile_damage_add_percent": 0.0,
      "area_damage_add_percent": 0.0,
      "chain_damage_add_percent": 0.0,
      "pierce_damage_add_percent": 0.0,
      "damage_add_percent": 0.0,
      "damage_final_percent": 0.0,
      "hit_damage_final_percent": 0.0,
      "double_damage_chance_percent": 0.0,
      "conversion_physical_to_fire_percent": 0.0,
      "conversion_physical_to_cold_percent": 0.0,
      "conversion_physical_to_lightning_percent": 0.0,
      "conversion_physical_to_chaos_percent": 0.0,
      "conversion_lightning_to_cold_percent": 0.0,
      "conversion_lightning_to_fire_percent": 0.0,
      "conversion_lightning_to_chaos_percent": 0.0,
      "conversion_cold_to_fire_percent": 0.0,
      "conversion_cold_to_chaos_percent": 0.0,
      "conversion_fire_to_chaos_percent": 0.0,
      "attack_speed_add_percent": 2.0,
      "cast_speed_add_percent": 2.0,
      "skill_speed_final_percent": 0.0,
      "cooldown_recovery_add_percent": 0.0,
      "added_cooldown_ms": 0.0,
      "projectile_speed_add_percent": 0.0,
      "base_crit_chance_percent": 5.0,
      "crit_chance_add_percent": 0.0,
      "crit_rating": 0.0,
      "crit_damage_rating": 0.0,
      "crit_damage_add_percent": 0.0,
      "derived_crit_chance_percent": 5.0,
      "derived_crit_damage_percent": 300.0,
      "cannot_crit": false,
      "prevent_elemental_ailments": false,
      "area_add_percent": 0.0,
      "slash_chance_add_percent": 0.0,
      "projectile_count_add": 0.0,
      "split_projectile_chance_percent": 0.0,
      "split_projectile_count_add": 0.0,
      "chain_count_add": 0.0,
      "bounce_count_add": 0.0,
      "pierce_count_add": 0.0,
      "duration_add_percent": 0.0,
      "status_chance_add_percent": 0.0,
      "ignite_chance_add_percent": 0.0,
      "guard_trigger_count": 0.0,
      "guard_internal_cooldown_ms": 0.0,
      "added_damage_effectiveness_percent": 100.0
    }
  },
  "skill_flame_slash": {
    "active_gem_instance_id": "web_seed_active_10_active_flame_slash",
    "name_text": "烈焰斩",
    "skill_template_id": "skill_flame_slash",
    "skill_package_id": "active_flame_slash",
    "skill_package_version": "1.0.0",
    "template_text": "烈焰斩",
    "damage_type": "fire",
    "behavior_type": "melee_arc",
    "behavior_template": "melee_arc",
    "visual_effect": "skill_event.flame_slash.vfx",
    "cast": {
      "mode": "attack",
      "target_selector": "nearest_enemy",
      "search_range": 420,
      "cooldown_ms": 0,
      "release_interval_ms": 1000,
      "base_cooldown_ms": 0,
      "trigger_interval_ms": 0,
      "mana_cost": 5,
      "windup_ms": 0,
      "recovery_ms": 0
    },
    "hit": {
      "base_damage": 34.6,
      "damage_basis": "weapon_attack",
      "weapon_attack_percent": 34.6,
      "damage_components": {
        "physical": 346
      },
      "damage_conversions": [
        {
          "from": "physical",
          "to": "fire",
          "percent": 100
        }
      ],
      "can_crit": true,
      "can_apply_status": true,
      "damage_timing": "on_melee_hit",
      "hit_delay_ms": 160,
      "hit_radius": 24,
      "target_policy": "selected_target"
    },
    "runtime_params": {
      "arc_angle": 120,
      "arc_radius": 162.0,
      "windup_ms": 120,
      "hit_at_ms": 160,
      "max_targets": 6,
      "facing_policy": "nearest_target",
      "hit_shape": "sector",
      "status_chance_scale": 1.0,
      "slash_vfx_key": "skill_event.flame_slash.vfx",
      "slash_chance_percent": 20.0,
      "flame_wave_count": 3,
      "flame_wave_count_per_area_step": 2,
      "flame_wave_area_step_percent": 115,
      "flame_wave_distance_bonus_per_area_step_percent": 30,
      "flame_wave_distance": 162.0,
      "flame_wave_spread_angle": 48,
      "flame_wave_arc_angle": 120,
      "allow_same_target_projectile_hits": true,
      "shotgun_falloff_coeff": 0.5,
      "flame_wave_area_steps": 0,
      "projectile_count": 1
    },
    "presentation_keys": {
      "vfx": "skill_event.flame_slash.vfx",
      "cast_vfx_key": "skill_event.flame_slash.vfx",
      "projectile_vfx_key": "skill_event.flame_slash.vfx",
      "hit_vfx_key": "skill_event.flame_slash.vfx",
      "sfx": "skill_event.flame_slash.sfx",
      "floating_text": "skill_event.flame_slash.floating_text",
      "floating_text_style": "skill_event.flame_slash.floating_text",
      "screen_feedback": "skill_event.flame_slash.screen_feedback",
      "hit_stop_ms": 0,
      "camera_shake": 0
    },
    "source_context": {
      "active_gem_instance_id": "web_seed_active_10_active_flame_slash",
      "base_gem_id": "active_flame_slash",
      "gem_kind": "active_skill",
      "sudoku_digit": 1,
      "base_gem_level": 1,
      "effective_gem_level": 1,
      "tlidb_source_values": {
        "source": "tlidb",
        "tlidb_id": "Flame_Slash",
        "display_level": 20,
        "raw_lines": [
          "释放挥击攻击前方扇形区域，击中时造成 346% 武器攻击伤害。",
          "该技能受斩击几率影响，使其有可能以斩击形态释放。该技能释放斩击时生成 3 道烈焰，击中时造成 346% 武器攻击伤害。技能范围使该技能斩击生成的烈焰数量增加。多道烈焰伤害可以命中同一个敌人。",
          "该技能全部物理伤害转化为火焰伤害。",
          "挥击：",
          "造成 346% 武器攻击伤害",
          "斩击：",
          "造成 346% 武器攻击伤害",
          "每 115% 对该技能范围的加成，+2 火浪道数",
          "每 115% 对该技能范围的加成，+30% 火浪距离",
          "多道火浪的伤害可以叠加",
          "该技能的霰弹效应衰减系数为 50%",
          "该技能 100% 物理伤害转化为火焰伤害"
        ],
        "parsed_values": {
          "base_damage": 346,
          "mana_cost": 5,
          "release_interval_ms": 1000
        },
        "anchors": {
          "base_damage": {
            "20": 346
          }
        }
      },
      "level_values": {
        "base_damage": 34.6,
        "mana_cost": 5,
        "release_interval_ms": 1000
      },
      "auto_release": {
        "policy": "nearest_enemy",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "damage_basis": "weapon_attack",
      "damage_form": "attack",
      "weapon_attack_base_damage": 100.0,
      "added_damage_effectiveness_percent": 100.0
    },
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Flame_Slash",
        "display_level": 20,
        "raw_lines": [
          "释放挥击攻击前方扇形区域，击中时造成 346% 武器攻击伤害。",
          "该技能受斩击几率影响，使其有可能以斩击形态释放。该技能释放斩击时生成 3 道烈焰，击中时造成 346% 武器攻击伤害。技能范围使该技能斩击生成的烈焰数量增加。多道烈焰伤害可以命中同一个敌人。",
          "该技能全部物理伤害转化为火焰伤害。",
          "挥击：",
          "造成 346% 武器攻击伤害",
          "斩击：",
          "造成 346% 武器攻击伤害",
          "每 115% 对该技能范围的加成，+2 火浪道数",
          "每 115% 对该技能范围的加成，+30% 火浪距离",
          "多道火浪的伤害可以叠加",
          "该技能的霰弹效应衰减系数为 50%",
          "该技能 100% 物理伤害转化为火焰伤害"
        ],
        "parsed_values": {
          "base_damage": 346,
          "mana_cost": 5,
          "release_interval_ms": 1000
        },
        "anchors": {
          "base_damage": {
            "20": 346
          }
        }
      },
      "level_values": {
        "base_damage": 34.6,
        "mana_cost": 5,
        "release_interval_ms": 1000
      },
      "auto_release": {
        "policy": "nearest_enemy",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "routed_modifiers": [],
      "final_values": {
        "base_damage": 34.6,
        "final_damage": 35.292,
        "actual_interval_ms": 980,
        "mana_cost": 5,
        "projectile_count": 1,
        "area_multiplier": 1.0,
        "speed_multiplier": 1.02
      }
    },
    "shape_effects": [],
    "labels": {
      "base_damage": "基础伤害",
      "final_damage": "最终伤害",
      "expected_hit_damage": "期望击中伤害",
      "preview_dps": "预览 DPS",
      "base_release_interval_ms": "基础释放间隔",
      "release_interval_ms": "释放间隔",
      "base_cooldown_ms": "基础冷却",
      "final_cooldown_ms": "最终冷却",
      "actual_interval_ms": "实际释放间隔",
      "trigger_interval_ms": "触发间隔",
      "mana_cost": "魔力消耗",
      "projectile_count": "投射物数量",
      "area_multiplier": "范围倍率",
      "speed_multiplier": "速度倍率"
    },
    "base_damage": 34.6,
    "final_damage": 35.292,
    "non_crit_damage": 35.292,
    "increase_pool": 2.0,
    "final_pool": 0.0,
    "crit_chance": 0.05,
    "crit_multiplier": 3.0,
    "expected_hit_damage": 38.821200000000005,
    "uses_per_second": 1.0204081632653061,
    "hit_coverage_factor": 1.0,
    "preview_dps": 39.61346938775511,
    "base_release_interval_ms": 1000,
    "release_interval_ms": 980,
    "base_cooldown_ms": 0,
    "final_cooldown_ms": 0,
    "actual_interval_ms": 980,
    "trigger_interval_ms": 0,
    "mana_cost": 5,
    "projectile_count": 1,
    "area_multiplier": 1.0,
    "speed_multiplier": 1.02,
    "tags": [
      {
        "id": "area",
        "text": "范围"
      },
      {
        "id": "attack",
        "text": "攻击"
      },
      {
        "id": "fire",
        "text": "火焰"
      },
      {
        "id": "melee",
        "text": "近战"
      },
      {
        "id": "slash",
        "text": "挥斩"
      }
    ],
    "applied_modifiers": [],
    "skill_stats": {
      "life_regen_flat": 10.0,
      "max_mana": 100.0,
      "max_energy_shield": 0.0,
      "physical_damage_add_percent": 0.0,
      "fire_damage_add_percent": 0.0,
      "cold_damage_add_percent": 0.0,
      "lightning_damage_add_percent": 0.0,
      "chaos_damage_add_percent": 0.0,
      "elemental_damage_add_percent": 0.0,
      "all_damage_type_add_percent": 0.0,
      "hit_damage_add_percent": 0.0,
      "dot_damage_add_percent": 0.0,
      "attack_damage_add_percent": 0.0,
      "spell_damage_add_percent": 0.0,
      "melee_damage_add_percent": 2.0,
      "ranged_damage_add_percent": 0.0,
      "projectile_damage_add_percent": 0.0,
      "area_damage_add_percent": 0.0,
      "chain_damage_add_percent": 0.0,
      "pierce_damage_add_percent": 0.0,
      "damage_add_percent": 0.0,
      "damage_final_percent": 0.0,
      "hit_damage_final_percent": 0.0,
      "double_damage_chance_percent": 0.0,
      "conversion_physical_to_fire_percent": 0.0,
      "conversion_physical_to_cold_percent": 0.0,
      "conversion_physical_to_lightning_percent": 0.0,
      "conversion_physical_to_chaos_percent": 0.0,
      "conversion_lightning_to_cold_percent": 0.0,
      "conversion_lightning_to_fire_percent": 0.0,
      "conversion_lightning_to_chaos_percent": 0.0,
      "conversion_cold_to_fire_percent": 0.0,
      "conversion_cold_to_chaos_percent": 0.0,
      "conversion_fire_to_chaos_percent": 0.0,
      "attack_speed_add_percent": 2.0,
      "cast_speed_add_percent": 2.0,
      "skill_speed_final_percent": 0.0,
      "cooldown_recovery_add_percent": 0.0,
      "added_cooldown_ms": 0.0,
      "projectile_speed_add_percent": 0.0,
      "base_crit_chance_percent": 5.0,
      "crit_chance_add_percent": 0.0,
      "crit_rating": 0.0,
      "crit_damage_rating": 0.0,
      "crit_damage_add_percent": 0.0,
      "derived_crit_chance_percent": 5.0,
      "derived_crit_damage_percent": 300.0,
      "cannot_crit": false,
      "prevent_elemental_ailments": false,
      "area_add_percent": 0.0,
      "slash_chance_add_percent": 0.0,
      "projectile_count_add": 0.0,
      "split_projectile_chance_percent": 0.0,
      "split_projectile_count_add": 0.0,
      "chain_count_add": 0.0,
      "bounce_count_add": 0.0,
      "pierce_count_add": 0.0,
      "duration_add_percent": 0.0,
      "status_chance_add_percent": 0.0,
      "ignite_chance_add_percent": 0.0,
      "guard_trigger_count": 0.0,
      "guard_internal_cooldown_ms": 0.0,
      "added_damage_effectiveness_percent": 100.0
    }
  },
  "skill_lightning_shot": {
    "active_gem_instance_id": "web_seed_active_11_active_lightning_shot",
    "name_text": "闪电射击",
    "skill_template_id": "skill_lightning_shot",
    "skill_package_id": "active_lightning_shot",
    "skill_package_version": "1.0.0",
    "template_text": "闪电射击",
    "damage_type": "lightning",
    "behavior_type": "projectile",
    "behavior_template": "projectile",
    "visual_effect": "skill_event.lightning_shot.projectile",
    "cast": {
      "mode": "attack",
      "target_selector": "nearest_enemy",
      "search_range": 420,
      "cooldown_ms": 0,
      "release_interval_ms": 1000,
      "base_cooldown_ms": 0,
      "trigger_interval_ms": 0,
      "mana_cost": 5,
      "windup_ms": 0,
      "recovery_ms": 0
    },
    "hit": {
      "base_damage": 33.4,
      "damage_basis": "weapon_attack",
      "weapon_attack_percent": 33.4,
      "damage_components": {
        "physical": 334
      },
      "damage_conversions": [
        {
          "from": "physical",
          "to": "lightning",
          "percent": 100
        }
      ],
      "secondary_hits": [
        {
          "id": "forked_lightning",
          "trigger": "on_projectile_hit",
          "trigger_marker_id": "lightning_shot_hit_a",
          "search_module_id": "lightning_shot_target_search",
          "direct_damage_module_id": "lightning_shot_direct_damage",
          "hit_marker_id": "lightning_shot_hit_b",
          "shape": "circle",
          "placement": "impact_position",
          "radius": 90,
          "base_damage": 33.4,
          "damage_basis": "weapon_attack",
          "weapon_attack_percent": 33.4,
          "damage_components": {
            "physical": 33.4
          },
          "damage_conversions": [
            {
              "from": "physical",
              "to": "lightning",
              "percent": 100
            }
          ],
          "max_targets": 3,
          "delay_ms": 0,
          "vfx_key": "skill_event.lightning_shot.chain_strike",
          "hit_vfx_key": "skill_event.lightning_shot.chain_strike",
          "reason_key": "skill_event.lightning_shot.damage_reason"
        }
      ],
      "can_crit": true,
      "can_apply_status": true,
      "damage_timing": "on_projectile_hit",
      "hit_delay_ms": 160,
      "hit_radius": 32,
      "target_policy": "selected_target"
    },
    "runtime_params": {
      "projectile_count": 1,
      "spread_angle_deg": 0,
      "projectile_speed": 660.0,
      "projectile_width": 58,
      "projectile_height": 32,
      "max_distance": 440,
      "hit_policy": "first_hit",
      "pierce_count": 0,
      "collision_radius": 16,
      "spawn_offset": {
        "x": -14,
        "y": -20
      },
      "projectile_radius": 12,
      "impact_radius": 32,
      "impact_marker_id": "lightning_shot_hit_a",
      "max_targets": 1,
      "min_duration_ms": 80,
      "max_duration_ms": 2200
    },
    "presentation_keys": {
      "vfx": "skill_event.lightning_shot.projectile",
      "cast_vfx_key": "skill_event.lightning_shot.muzzle",
      "projectile_vfx_key": "skill_event.lightning_shot.projectile",
      "hit_vfx_key": "skill_event.lightning_shot.impact",
      "sfx": "skill_event.lightning_shot.sfx",
      "floating_text": "skill_event.lightning_shot.floating_text",
      "floating_text_style": "skill_event.lightning_shot.floating_text",
      "screen_feedback": "skill_event.lightning_shot.screen_feedback",
      "hit_stop_ms": 0,
      "camera_shake": 0
    },
    "source_context": {
      "active_gem_instance_id": "web_seed_active_11_active_lightning_shot",
      "base_gem_id": "active_lightning_shot",
      "gem_kind": "active_skill",
      "sudoku_digit": 1,
      "base_gem_level": 1,
      "effective_gem_level": 1,
      "tlidb_source_values": {
        "source": "tlidb",
        "tlidb_id": "Lightning_Shot",
        "display_level": 20,
        "raw_lines": [
          "释放该技能向前发射 1 个闪电箭，击中时对敌人造成 334% 武器伤害。",
          "闪电箭击中敌人时分裂为三道闪电，对一定范围内的随机3个敌人各造成 334% 武器攻击伤害。",
          "该技能全部物理伤害转化为闪电伤害。",
          "闪电箭：",
          "敌人造成 334% 武器伤害",
          "基础发射 1 个投射物",
          "闪电：",
          "造成 334% 武器攻击伤害",
          "该技能 100% 物理伤害转化为闪电伤害"
        ],
        "parsed_values": {
          "base_damage": 334,
          "mana_cost": 5,
          "release_interval_ms": 1000
        },
        "anchors": {
          "base_damage": {
            "20": 334
          }
        }
      },
      "level_values": {
        "base_damage": 33.4,
        "mana_cost": 5,
        "release_interval_ms": 1000
      },
      "auto_release": {
        "policy": "nearest_enemy",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "damage_basis": "weapon_attack",
      "damage_form": "attack",
      "weapon_attack_base_damage": 100.0,
      "added_damage_effectiveness_percent": 100.0
    },
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Lightning_Shot",
        "display_level": 20,
        "raw_lines": [
          "释放该技能向前发射 1 个闪电箭，击中时对敌人造成 334% 武器伤害。",
          "闪电箭击中敌人时分裂为三道闪电，对一定范围内的随机3个敌人各造成 334% 武器攻击伤害。",
          "该技能全部物理伤害转化为闪电伤害。",
          "闪电箭：",
          "敌人造成 334% 武器伤害",
          "基础发射 1 个投射物",
          "闪电：",
          "造成 334% 武器攻击伤害",
          "该技能 100% 物理伤害转化为闪电伤害"
        ],
        "parsed_values": {
          "base_damage": 334,
          "mana_cost": 5,
          "release_interval_ms": 1000
        },
        "anchors": {
          "base_damage": {
            "20": 334
          }
        }
      },
      "level_values": {
        "base_damage": 33.4,
        "mana_cost": 5,
        "release_interval_ms": 1000
      },
      "auto_release": {
        "policy": "nearest_enemy",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "routed_modifiers": [],
      "final_values": {
        "base_damage": 33.4,
        "final_damage": 33.4,
        "actual_interval_ms": 980,
        "mana_cost": 5,
        "projectile_count": 1,
        "area_multiplier": 1.0,
        "speed_multiplier": 1.02
      }
    },
    "shape_effects": [],
    "labels": {
      "base_damage": "基础伤害",
      "final_damage": "最终伤害",
      "expected_hit_damage": "期望击中伤害",
      "preview_dps": "预览 DPS",
      "base_release_interval_ms": "基础释放间隔",
      "release_interval_ms": "释放间隔",
      "base_cooldown_ms": "基础冷却",
      "final_cooldown_ms": "最终冷却",
      "actual_interval_ms": "实际释放间隔",
      "trigger_interval_ms": "触发间隔",
      "mana_cost": "魔力消耗",
      "projectile_count": "投射物数量",
      "area_multiplier": "范围倍率",
      "speed_multiplier": "速度倍率"
    },
    "base_damage": 33.4,
    "final_damage": 33.4,
    "non_crit_damage": 33.4,
    "increase_pool": 0.0,
    "final_pool": 0.0,
    "crit_chance": 0.05,
    "crit_multiplier": 3.0,
    "expected_hit_damage": 36.74,
    "uses_per_second": 1.0204081632653061,
    "hit_coverage_factor": 1.0,
    "preview_dps": 37.48979591836735,
    "base_release_interval_ms": 1000,
    "release_interval_ms": 980,
    "base_cooldown_ms": 0,
    "final_cooldown_ms": 0,
    "actual_interval_ms": 980,
    "trigger_interval_ms": 0,
    "mana_cost": 5,
    "projectile_count": 1,
    "area_multiplier": 1.0,
    "speed_multiplier": 1.02,
    "tags": [
      {
        "id": "attack",
        "text": "攻击"
      },
      {
        "id": "bow",
        "text": "弓"
      },
      {
        "id": "lightning",
        "text": "闪电"
      },
      {
        "id": "projectile",
        "text": "投射物"
      },
      {
        "id": "ranged",
        "text": "远程"
      }
    ],
    "applied_modifiers": [],
    "skill_stats": {
      "life_regen_flat": 10.0,
      "max_mana": 100.0,
      "max_energy_shield": 0.0,
      "physical_damage_add_percent": 0.0,
      "fire_damage_add_percent": 0.0,
      "cold_damage_add_percent": 0.0,
      "lightning_damage_add_percent": 0.0,
      "chaos_damage_add_percent": 0.0,
      "elemental_damage_add_percent": 0.0,
      "all_damage_type_add_percent": 0.0,
      "hit_damage_add_percent": 0.0,
      "dot_damage_add_percent": 0.0,
      "attack_damage_add_percent": 0.0,
      "spell_damage_add_percent": 0.0,
      "melee_damage_add_percent": 2.0,
      "ranged_damage_add_percent": 0.0,
      "projectile_damage_add_percent": 0.0,
      "area_damage_add_percent": 0.0,
      "chain_damage_add_percent": 0.0,
      "pierce_damage_add_percent": 0.0,
      "damage_add_percent": 0.0,
      "damage_final_percent": 0.0,
      "hit_damage_final_percent": 0.0,
      "double_damage_chance_percent": 0.0,
      "conversion_physical_to_fire_percent": 0.0,
      "conversion_physical_to_cold_percent": 0.0,
      "conversion_physical_to_lightning_percent": 0.0,
      "conversion_physical_to_chaos_percent": 0.0,
      "conversion_lightning_to_cold_percent": 0.0,
      "conversion_lightning_to_fire_percent": 0.0,
      "conversion_lightning_to_chaos_percent": 0.0,
      "conversion_cold_to_fire_percent": 0.0,
      "conversion_cold_to_chaos_percent": 0.0,
      "conversion_fire_to_chaos_percent": 0.0,
      "attack_speed_add_percent": 2.0,
      "cast_speed_add_percent": 2.0,
      "skill_speed_final_percent": 0.0,
      "cooldown_recovery_add_percent": 0.0,
      "added_cooldown_ms": 0.0,
      "projectile_speed_add_percent": 0.0,
      "base_crit_chance_percent": 5.0,
      "crit_chance_add_percent": 0.0,
      "crit_rating": 0.0,
      "crit_damage_rating": 0.0,
      "crit_damage_add_percent": 0.0,
      "derived_crit_chance_percent": 5.0,
      "derived_crit_damage_percent": 300.0,
      "cannot_crit": false,
      "prevent_elemental_ailments": false,
      "area_add_percent": 0.0,
      "slash_chance_add_percent": 0.0,
      "projectile_count_add": 0.0,
      "split_projectile_chance_percent": 0.0,
      "split_projectile_count_add": 0.0,
      "chain_count_add": 0.0,
      "bounce_count_add": 0.0,
      "pierce_count_add": 0.0,
      "duration_add_percent": 0.0,
      "status_chance_add_percent": 0.0,
      "ignite_chance_add_percent": 0.0,
      "guard_trigger_count": 0.0,
      "guard_internal_cooldown_ms": 0.0,
      "added_damage_effectiveness_percent": 100.0
    }
  },
  "skill_corrosive_shot": {
    "active_gem_instance_id": "web_seed_active_12_active_corrosive_shot",
    "name_text": "侵蚀弹",
    "skill_template_id": "skill_corrosive_shot",
    "skill_package_id": "active_corrosive_shot",
    "skill_package_version": "1.0.0",
    "template_text": "侵蚀弹",
    "damage_type": "chaos",
    "behavior_type": "module_chain",
    "behavior_template": "module_chain",
    "visual_effect": "skill_event.corrosive_shot.vfx",
    "cast": {
      "mode": "attack",
      "target_selector": "nearest_enemy",
      "search_range": 420,
      "cooldown_ms": 0,
      "release_interval_ms": 1000,
      "base_cooldown_ms": 0,
      "trigger_interval_ms": 0,
      "mana_cost": 5,
      "windup_ms": 0,
      "recovery_ms": 0
    },
    "hit": {
      "base_damage": 9.5,
      "damage_basis": "weapon_attack",
      "weapon_attack_percent": 9.5,
      "damage_components": {
        "physical": 95
      },
      "damage_conversions": [
        {
          "from": "physical",
          "to": "chaos",
          "percent": 100
        }
      ],
      "ailments": [
        {
          "type": "wilt",
          "source_damage_type": "chaos",
          "chance_percent": 30,
          "duration_ms": 2000,
          "base_damage_per_second": 5.7,
          "max_stacks": 30
        }
      ],
      "can_crit": true,
      "can_apply_status": true,
      "damage_timing": "on_projectile_hit",
      "hit_delay_ms": 160,
      "hit_radius": 54,
      "target_policy": "selected_target"
    },
    "runtime_params": {
      "projectile_count": 1,
      "spread_angle_deg": 0,
      "projectile_speed": 540.0,
      "projectile_width": 46,
      "projectile_height": 30,
      "max_distance": 420,
      "hit_policy": "first_hit",
      "pierce_count": 0,
      "collision_radius": 16,
      "spawn_offset": {
        "x": -14,
        "y": -20
      },
      "projectile_radius": 12,
      "impact_radius": 54,
      "max_targets": 1,
      "min_duration_ms": 80,
      "max_duration_ms": 2200,
      "trajectory": "linear",
      "travel_time_ms": 520,
      "arc_height": 0,
      "impact_marker_id": "corrosive_impact",
      "modules": [
        {
          "id": "corrosive_projectile",
          "type": "projectile",
          "params": {
            "projectile_count": 1,
            "spread_angle_deg": 0,
            "projectile_speed": 540.0,
            "projectile_width": 46,
            "projectile_height": 30,
            "max_distance": 420,
            "hit_policy": "first_hit",
            "pierce_count": 0,
            "collision_radius": 16,
            "spawn_offset": {
              "x": -14,
              "y": -20
            },
            "projectile_radius": 12,
            "impact_radius": 54,
            "max_targets": 1,
            "min_duration_ms": 80,
            "max_duration_ms": 2200,
            "trajectory": "linear",
            "travel_time_ms": 520,
            "arc_height": 0,
            "target_policy": "target_position",
            "impact_marker_id": "corrosive_impact",
            "vfx_key": "skill_event.corrosive_shot.vfx"
          }
        },
        {
          "id": "corrosive_ground",
          "type": "damage_zone",
          "trigger": {
            "trigger_marker_id": "corrosive_impact",
            "trigger_delay_ms": 0
          },
          "params": {
            "shape": "circle",
            "origin_policy": "trigger_position",
            "facing_policy": "none",
            "hit_at_ms": 1000,
            "radius": 80.0,
            "max_targets": 8,
            "duration_ms": 3000,
            "tick_interval_ms": 1000,
            "max_hits": 160,
            "max_hits_per_target": 20,
            "damage_amount": 7.41,
            "emit_hit_vfx": false,
            "ring_width": 48,
            "vfx_key": "skill_event.corrosive_shot.vfx"
          }
        },
        {
          "id": "corrosive_exposure",
          "type": "buff",
          "trigger": {
            "trigger_marker_id": "corrosive_ground_hit",
            "trigger_delay_ms": 0
          },
          "params": {
            "effect_type": "damage_taken_increase",
            "chance_percent": 40,
            "duration_ms": 2000,
            "effect_per_stack": 30,
            "max_stacks": 1,
            "source_skill_id": "active_corrosive_shot",
            "target_policy": "trigger_target",
            "vfx_key": "skill_event.corrosive_shot.vfx"
          }
        }
      ]
    },
    "presentation_keys": {
      "vfx": "skill_event.corrosive_shot.vfx",
      "cast_vfx_key": "skill_event.corrosive_shot.vfx",
      "projectile_vfx_key": "skill_event.corrosive_shot.vfx",
      "hit_vfx_key": "skill_event.corrosive_shot.vfx",
      "sfx": "skill_event.corrosive_shot.sfx",
      "floating_text": "skill_event.corrosive_shot.floating_text",
      "floating_text_style": "skill_event.corrosive_shot.floating_text",
      "screen_feedback": "skill_event.corrosive_shot.screen_feedback",
      "hit_stop_ms": 0,
      "camera_shake": 0
    },
    "source_context": {
      "active_gem_instance_id": "web_seed_active_12_active_corrosive_shot",
      "base_gem_id": "active_corrosive_shot",
      "gem_kind": "active_skill",
      "sudoku_digit": 1,
      "base_gem_level": 1,
      "effective_gem_level": 1,
      "tlidb_source_values": {
        "source": "tlidb",
        "tlidb_id": "Corrosive_Shot",
        "display_level": 20,
        "raw_lines": [
          "释放该技能向前抛射一个侵蚀弹，侵蚀弹接触目标时产生爆炸，造成 95% 武器攻击伤害。",
          "未分裂的侵蚀弹接触目标时还会生成侵蚀地面，对其中的敌人每秒造成 57 持续混沌伤害，并使其中敌人受到的该技能的伤害额外增加。",
          "该技能造成的凋零伤害更高。",
          "该技能全部物理伤害转化为混沌伤害。",
          "爆炸：",
          "造成 95% 武器攻击伤害",
          "该技能 +30% 凋零几率",
          "该技能额外 +30% 凋零伤害",
          "该技能 100% 物理伤害转化为混沌伤害",
          "侵蚀地面：",
          "侵蚀地面持续 3 秒",
          "伤害状态持续 2 秒，每秒造成 57 持续混沌伤害"
        ],
        "parsed_values": {
          "base_damage": 95,
          "mana_cost": 5,
          "release_interval_ms": 1000
        },
        "anchors": {
          "base_damage": {
            "20": 95
          }
        }
      },
      "level_values": {
        "base_damage": 9.5,
        "mana_cost": 5,
        "release_interval_ms": 1000
      },
      "auto_release": {
        "policy": "target_cluster",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "damage_basis": "weapon_attack",
      "damage_form": "attack",
      "weapon_attack_base_damage": 100.0,
      "added_damage_effectiveness_percent": 100.0
    },
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Corrosive_Shot",
        "display_level": 20,
        "raw_lines": [
          "释放该技能向前抛射一个侵蚀弹，侵蚀弹接触目标时产生爆炸，造成 95% 武器攻击伤害。",
          "未分裂的侵蚀弹接触目标时还会生成侵蚀地面，对其中的敌人每秒造成 57 持续混沌伤害，并使其中敌人受到的该技能的伤害额外增加。",
          "该技能造成的凋零伤害更高。",
          "该技能全部物理伤害转化为混沌伤害。",
          "爆炸：",
          "造成 95% 武器攻击伤害",
          "该技能 +30% 凋零几率",
          "该技能额外 +30% 凋零伤害",
          "该技能 100% 物理伤害转化为混沌伤害",
          "侵蚀地面：",
          "侵蚀地面持续 3 秒",
          "伤害状态持续 2 秒，每秒造成 57 持续混沌伤害"
        ],
        "parsed_values": {
          "base_damage": 95,
          "mana_cost": 5,
          "release_interval_ms": 1000
        },
        "anchors": {
          "base_damage": {
            "20": 95
          }
        }
      },
      "level_values": {
        "base_damage": 9.5,
        "mana_cost": 5,
        "release_interval_ms": 1000
      },
      "auto_release": {
        "policy": "target_cluster",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "routed_modifiers": [],
      "final_values": {
        "base_damage": 9.5,
        "final_damage": 9.5,
        "actual_interval_ms": 980,
        "mana_cost": 5,
        "projectile_count": 1,
        "area_multiplier": 1.0,
        "speed_multiplier": 1.02
      }
    },
    "shape_effects": [],
    "labels": {
      "base_damage": "基础伤害",
      "final_damage": "最终伤害",
      "expected_hit_damage": "期望击中伤害",
      "preview_dps": "预览 DPS",
      "base_release_interval_ms": "基础释放间隔",
      "release_interval_ms": "释放间隔",
      "base_cooldown_ms": "基础冷却",
      "final_cooldown_ms": "最终冷却",
      "actual_interval_ms": "实际释放间隔",
      "trigger_interval_ms": "触发间隔",
      "mana_cost": "魔力消耗",
      "projectile_count": "投射物数量",
      "area_multiplier": "范围倍率",
      "speed_multiplier": "速度倍率"
    },
    "base_damage": 9.5,
    "final_damage": 9.5,
    "non_crit_damage": 9.5,
    "increase_pool": 0.0,
    "final_pool": 0.0,
    "crit_chance": 0.05,
    "crit_multiplier": 3.0,
    "expected_hit_damage": 10.450000000000001,
    "uses_per_second": 1.0204081632653061,
    "hit_coverage_factor": 1.0,
    "preview_dps": 10.663265306122451,
    "base_release_interval_ms": 1000,
    "release_interval_ms": 980,
    "base_cooldown_ms": 0,
    "final_cooldown_ms": 0,
    "actual_interval_ms": 980,
    "trigger_interval_ms": 0,
    "mana_cost": 5,
    "projectile_count": 1,
    "area_multiplier": 1.0,
    "speed_multiplier": 1.02,
    "tags": [
      {
        "id": "area",
        "text": "范围"
      },
      {
        "id": "attack",
        "text": "攻击"
      },
      {
        "id": "cannon",
        "text": "炮"
      },
      {
        "id": "chaos",
        "text": "混沌"
      },
      {
        "id": "dexterity",
        "text": "敏捷"
      },
      {
        "id": "dot",
        "text": "持续伤害"
      },
      {
        "id": "ground",
        "text": "地面"
      },
      {
        "id": "gun",
        "text": "枪"
      },
      {
        "id": "projectile",
        "text": "投射物"
      },
      {
        "id": "ranged",
        "text": "远程"
      }
    ],
    "applied_modifiers": [],
    "skill_stats": {
      "life_regen_flat": 10.0,
      "max_mana": 100.0,
      "max_energy_shield": 0.0,
      "physical_damage_add_percent": 0.0,
      "fire_damage_add_percent": 0.0,
      "cold_damage_add_percent": 0.0,
      "lightning_damage_add_percent": 0.0,
      "chaos_damage_add_percent": 0.0,
      "elemental_damage_add_percent": 0.0,
      "all_damage_type_add_percent": 0.0,
      "hit_damage_add_percent": 0.0,
      "dot_damage_add_percent": 0.0,
      "attack_damage_add_percent": 0.0,
      "spell_damage_add_percent": 0.0,
      "melee_damage_add_percent": 2.0,
      "ranged_damage_add_percent": 0.0,
      "projectile_damage_add_percent": 0.0,
      "area_damage_add_percent": 0.0,
      "chain_damage_add_percent": 0.0,
      "pierce_damage_add_percent": 0.0,
      "damage_add_percent": 0.0,
      "damage_final_percent": 0.0,
      "hit_damage_final_percent": 0.0,
      "double_damage_chance_percent": 0.0,
      "conversion_physical_to_fire_percent": 0.0,
      "conversion_physical_to_cold_percent": 0.0,
      "conversion_physical_to_lightning_percent": 0.0,
      "conversion_physical_to_chaos_percent": 0.0,
      "conversion_lightning_to_cold_percent": 0.0,
      "conversion_lightning_to_fire_percent": 0.0,
      "conversion_lightning_to_chaos_percent": 0.0,
      "conversion_cold_to_fire_percent": 0.0,
      "conversion_cold_to_chaos_percent": 0.0,
      "conversion_fire_to_chaos_percent": 0.0,
      "attack_speed_add_percent": 2.0,
      "cast_speed_add_percent": 2.0,
      "skill_speed_final_percent": 0.0,
      "cooldown_recovery_add_percent": 0.0,
      "added_cooldown_ms": 0.0,
      "projectile_speed_add_percent": 0.0,
      "base_crit_chance_percent": 5.0,
      "crit_chance_add_percent": 0.0,
      "crit_rating": 0.0,
      "crit_damage_rating": 0.0,
      "crit_damage_add_percent": 0.0,
      "derived_crit_chance_percent": 5.0,
      "derived_crit_damage_percent": 300.0,
      "cannot_crit": false,
      "prevent_elemental_ailments": false,
      "area_add_percent": 0.0,
      "slash_chance_add_percent": 0.0,
      "projectile_count_add": 0.0,
      "split_projectile_chance_percent": 0.0,
      "split_projectile_count_add": 0.0,
      "chain_count_add": 0.0,
      "bounce_count_add": 0.0,
      "pierce_count_add": 0.0,
      "duration_add_percent": 0.0,
      "status_chance_add_percent": 0.0,
      "ignite_chance_add_percent": 0.0,
      "guard_trigger_count": 0.0,
      "guard_internal_cooldown_ms": 0.0,
      "added_damage_effectiveness_percent": 100.0
    }
  },
  "skill_burning_shot": {
    "active_gem_instance_id": "web_seed_active_13_active_burning_shot",
    "name_text": "燃烧射击",
    "skill_template_id": "skill_burning_shot",
    "skill_package_id": "active_burning_shot",
    "skill_package_version": "1.0.0",
    "template_text": "燃烧射击",
    "damage_type": "fire",
    "behavior_type": "projectile",
    "behavior_template": "projectile",
    "visual_effect": "skill_event.burning_shot.vfx",
    "cast": {
      "mode": "attack",
      "target_selector": "nearest_enemy",
      "search_range": 420,
      "cooldown_ms": 0,
      "release_interval_ms": 1000,
      "base_cooldown_ms": 1000,
      "trigger_interval_ms": 0,
      "mana_cost": 5,
      "windup_ms": 0,
      "recovery_ms": 0
    },
    "hit": {
      "base_damage": 25.6,
      "damage_basis": "weapon_attack",
      "weapon_attack_percent": 25.6,
      "damage_components": {
        "physical": 256
      },
      "damage_conversions": [
        {
          "from": "physical",
          "to": "fire",
          "percent": 100
        }
      ],
      "ailments": [
        {
          "type": "ignite",
          "source_damage_type": "fire",
          "chance_percent": 25,
          "duration_ms": 4000,
          "base_damage_per_second": 25.6,
          "damage_over_time_more_percent": 30
        }
      ],
      "can_crit": true,
      "can_apply_status": true,
      "damage_timing": "on_projectile_hit",
      "hit_delay_ms": 160,
      "hit_radius": 36,
      "target_policy": "selected_target"
    },
    "runtime_params": {
      "projectile_count": 1,
      "spread_angle_deg": 0,
      "projectile_speed": 620.0,
      "projectile_width": 50,
      "projectile_height": 30,
      "max_distance": 430,
      "hit_policy": "first_hit",
      "pierce_count": 0,
      "collision_radius": 16,
      "spawn_offset": {
        "x": -14,
        "y": -20
      },
      "projectile_radius": 12,
      "impact_radius": 36,
      "max_targets": 1,
      "min_duration_ms": 80,
      "max_duration_ms": 2200,
      "on_ignited_hit_explosion_radius": 60,
      "on_ignited_hit_true_damage_percent_of_ignite_dps": 100,
      "on_ignited_hit_indirect_fire_damage": 5,
      "on_ignited_hit_cooldown_ms": 5000
    },
    "presentation_keys": {
      "vfx": "skill_event.burning_shot.vfx",
      "cast_vfx_key": "skill_event.burning_shot.vfx",
      "projectile_vfx_key": "skill_event.burning_shot.vfx",
      "hit_vfx_key": "skill_event.burning_shot.vfx",
      "sfx": "skill_event.burning_shot.sfx",
      "floating_text": "skill_event.burning_shot.floating_text",
      "floating_text_style": "skill_event.burning_shot.floating_text",
      "screen_feedback": "skill_event.burning_shot.screen_feedback",
      "hit_stop_ms": 0,
      "camera_shake": 0
    },
    "source_context": {
      "active_gem_instance_id": "web_seed_active_13_active_burning_shot",
      "base_gem_id": "active_burning_shot",
      "gem_kind": "active_skill",
      "sudoku_digit": 1,
      "base_gem_level": 1,
      "effective_gem_level": 1,
      "tlidb_source_values": {
        "source": "tlidb",
        "tlidb_id": "Burning_Shot",
        "display_level": 20,
        "raw_lines": [
          "释放该技能向前发射 1 个烈焰箭，造成 256% 武器攻击伤害，且造成的点燃伤害额外增加。",
          "该技能击中点燃的敌人时引发爆炸，对半径 3 米内敌人造成相当于 100% 该敌人受到的每秒点燃伤害的真实伤害，并造成 5-5 间接火焰伤害。",
          "该技能全部物理伤害转化为火焰伤害。",
          "燃烧射击：",
          "造成 256% 武器攻击伤害",
          "基础发射 1 个投射物",
          "该技能额外 +30% 点燃伤害",
          "该技能 100% 物理伤害转化为火焰伤害",
          "该技能 +25% 点燃几率 (Lv1:25)",
          "该技能击中点燃的敌人时引发爆炸，对半径 3 米内敌人造成相当于 100% 该敌人受到的每秒点燃伤害的真实伤害；该效果对同一敌人有 5 秒冷却时间"
        ],
        "parsed_values": {
          "base_damage": 256,
          "mana_cost": 5,
          "release_interval_ms": 1000
        },
        "anchors": {
          "base_damage": {
            "20": 256
          }
        }
      },
      "level_values": {
        "base_damage": 25.6,
        "mana_cost": 5,
        "release_interval_ms": 1000
      },
      "auto_release": {
        "policy": "nearest_enemy",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "damage_basis": "weapon_attack",
      "damage_form": "attack",
      "weapon_attack_base_damage": 100.0,
      "added_damage_effectiveness_percent": 100.0
    },
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Burning_Shot",
        "display_level": 20,
        "raw_lines": [
          "释放该技能向前发射 1 个烈焰箭，造成 256% 武器攻击伤害，且造成的点燃伤害额外增加。",
          "该技能击中点燃的敌人时引发爆炸，对半径 3 米内敌人造成相当于 100% 该敌人受到的每秒点燃伤害的真实伤害，并造成 5-5 间接火焰伤害。",
          "该技能全部物理伤害转化为火焰伤害。",
          "燃烧射击：",
          "造成 256% 武器攻击伤害",
          "基础发射 1 个投射物",
          "该技能额外 +30% 点燃伤害",
          "该技能 100% 物理伤害转化为火焰伤害",
          "该技能 +25% 点燃几率 (Lv1:25)",
          "该技能击中点燃的敌人时引发爆炸，对半径 3 米内敌人造成相当于 100% 该敌人受到的每秒点燃伤害的真实伤害；该效果对同一敌人有 5 秒冷却时间"
        ],
        "parsed_values": {
          "base_damage": 256,
          "mana_cost": 5,
          "release_interval_ms": 1000
        },
        "anchors": {
          "base_damage": {
            "20": 256
          }
        }
      },
      "level_values": {
        "base_damage": 25.6,
        "mana_cost": 5,
        "release_interval_ms": 1000
      },
      "auto_release": {
        "policy": "nearest_enemy",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "routed_modifiers": [],
      "final_values": {
        "base_damage": 25.6,
        "final_damage": 25.6,
        "actual_interval_ms": 1000,
        "mana_cost": 5,
        "projectile_count": 1,
        "area_multiplier": 1.0,
        "speed_multiplier": 1.02
      }
    },
    "shape_effects": [],
    "labels": {
      "base_damage": "基础伤害",
      "final_damage": "最终伤害",
      "expected_hit_damage": "期望击中伤害",
      "preview_dps": "预览 DPS",
      "base_release_interval_ms": "基础释放间隔",
      "release_interval_ms": "释放间隔",
      "base_cooldown_ms": "基础冷却",
      "final_cooldown_ms": "最终冷却",
      "actual_interval_ms": "实际释放间隔",
      "trigger_interval_ms": "触发间隔",
      "mana_cost": "魔力消耗",
      "projectile_count": "投射物数量",
      "area_multiplier": "范围倍率",
      "speed_multiplier": "速度倍率"
    },
    "base_damage": 25.6,
    "final_damage": 25.6,
    "non_crit_damage": 25.6,
    "increase_pool": 0.0,
    "final_pool": 0.0,
    "crit_chance": 0.05,
    "crit_multiplier": 3.0,
    "expected_hit_damage": 28.160000000000004,
    "uses_per_second": 1.0,
    "hit_coverage_factor": 1.0,
    "preview_dps": 28.160000000000004,
    "base_release_interval_ms": 1000,
    "release_interval_ms": 980,
    "base_cooldown_ms": 1000,
    "final_cooldown_ms": 1000,
    "actual_interval_ms": 1000,
    "trigger_interval_ms": 0,
    "mana_cost": 5,
    "projectile_count": 1,
    "area_multiplier": 1.0,
    "speed_multiplier": 1.02,
    "tags": [
      {
        "id": "attack",
        "text": "攻击"
      },
      {
        "id": "bow",
        "text": "弓"
      },
      {
        "id": "fire",
        "text": "火焰"
      },
      {
        "id": "projectile",
        "text": "投射物"
      },
      {
        "id": "ranged",
        "text": "远程"
      }
    ],
    "applied_modifiers": [],
    "skill_stats": {
      "life_regen_flat": 10.0,
      "max_mana": 100.0,
      "max_energy_shield": 0.0,
      "physical_damage_add_percent": 0.0,
      "fire_damage_add_percent": 0.0,
      "cold_damage_add_percent": 0.0,
      "lightning_damage_add_percent": 0.0,
      "chaos_damage_add_percent": 0.0,
      "elemental_damage_add_percent": 0.0,
      "all_damage_type_add_percent": 0.0,
      "hit_damage_add_percent": 0.0,
      "dot_damage_add_percent": 0.0,
      "attack_damage_add_percent": 0.0,
      "spell_damage_add_percent": 0.0,
      "melee_damage_add_percent": 2.0,
      "ranged_damage_add_percent": 0.0,
      "projectile_damage_add_percent": 0.0,
      "area_damage_add_percent": 0.0,
      "chain_damage_add_percent": 0.0,
      "pierce_damage_add_percent": 0.0,
      "damage_add_percent": 0.0,
      "damage_final_percent": 0.0,
      "hit_damage_final_percent": 0.0,
      "double_damage_chance_percent": 0.0,
      "conversion_physical_to_fire_percent": 0.0,
      "conversion_physical_to_cold_percent": 0.0,
      "conversion_physical_to_lightning_percent": 0.0,
      "conversion_physical_to_chaos_percent": 0.0,
      "conversion_lightning_to_cold_percent": 0.0,
      "conversion_lightning_to_fire_percent": 0.0,
      "conversion_lightning_to_chaos_percent": 0.0,
      "conversion_cold_to_fire_percent": 0.0,
      "conversion_cold_to_chaos_percent": 0.0,
      "conversion_fire_to_chaos_percent": 0.0,
      "attack_speed_add_percent": 2.0,
      "cast_speed_add_percent": 2.0,
      "skill_speed_final_percent": 0.0,
      "cooldown_recovery_add_percent": 0.0,
      "added_cooldown_ms": 0.0,
      "projectile_speed_add_percent": 0.0,
      "base_crit_chance_percent": 5.0,
      "crit_chance_add_percent": 0.0,
      "crit_rating": 0.0,
      "crit_damage_rating": 0.0,
      "crit_damage_add_percent": 0.0,
      "derived_crit_chance_percent": 5.0,
      "derived_crit_damage_percent": 300.0,
      "cannot_crit": false,
      "prevent_elemental_ailments": false,
      "area_add_percent": 0.0,
      "slash_chance_add_percent": 0.0,
      "projectile_count_add": 0.0,
      "split_projectile_chance_percent": 0.0,
      "split_projectile_count_add": 0.0,
      "chain_count_add": 0.0,
      "bounce_count_add": 0.0,
      "pierce_count_add": 0.0,
      "duration_add_percent": 0.0,
      "status_chance_add_percent": 0.0,
      "ignite_chance_add_percent": 0.0,
      "guard_trigger_count": 0.0,
      "guard_internal_cooldown_ms": 0.0,
      "added_damage_effectiveness_percent": 100.0
    }
  },
  "skill_rain_of_arrows": {
    "active_gem_instance_id": "web_seed_active_14_active_rain_of_arrows",
    "name_text": "箭雨",
    "skill_template_id": "skill_rain_of_arrows",
    "skill_package_id": "active_rain_of_arrows",
    "skill_package_version": "1.0.0",
    "template_text": "箭雨",
    "damage_type": "physical",
    "behavior_type": "projectile",
    "behavior_template": "projectile",
    "visual_effect": "skill_event.rain_of_arrows.vfx",
    "cast": {
      "mode": "attack",
      "target_selector": "nearest_enemy",
      "search_range": 420,
      "cooldown_ms": 0,
      "release_interval_ms": 1000,
      "base_cooldown_ms": 0,
      "trigger_interval_ms": 0,
      "mana_cost": 5,
      "windup_ms": 0,
      "recovery_ms": 0
    },
    "hit": {
      "base_damage": 13.4,
      "damage_basis": "weapon_attack",
      "weapon_attack_percent": 13.4,
      "damage_components": {
        "physical": 134
      },
      "can_crit": true,
      "can_apply_status": true,
      "damage_timing": "on_projectile_hit",
      "hit_delay_ms": 160,
      "hit_radius": 30,
      "target_policy": "selected_target"
    },
    "runtime_params": {
      "projectile_count": 15,
      "burst_interval_ms": 20,
      "spread_angle_deg": 60,
      "projectile_speed": 500.0,
      "projectile_width": 24,
      "projectile_height": 24,
      "max_distance": 360,
      "hit_policy": "first_hit",
      "pierce_count": 0,
      "collision_radius": 14,
      "spawn_offset": {
        "x": 0,
        "y": -40
      },
      "projectile_radius": 8,
      "impact_radius": 30,
      "max_targets": 1,
      "min_duration_ms": 180,
      "max_duration_ms": 1800,
      "trajectory": "ballistic",
      "travel_time_ms": 140,
      "arc_height": 90,
      "target_policy": "nearest_unique_enemy",
      "projectile_visual_mode": "falling_arrow",
      "projectile_speed_damage_conversion_percent": 25,
      "allow_same_target_projectile_hits": true,
      "shotgun_falloff_coeff": 0.7
    },
    "presentation_keys": {
      "vfx": "skill_event.rain_of_arrows.vfx",
      "cast_vfx_key": "skill_event.rain_of_arrows.vfx",
      "projectile_vfx_key": "skill_event.rain_of_arrows.vfx",
      "hit_vfx_key": "skill_event.rain_of_arrows.vfx",
      "sfx": "skill_event.rain_of_arrows.sfx",
      "floating_text": "skill_event.rain_of_arrows.floating_text",
      "floating_text_style": "skill_event.rain_of_arrows.floating_text",
      "screen_feedback": "skill_event.rain_of_arrows.screen_feedback",
      "hit_stop_ms": 0,
      "camera_shake": 0
    },
    "source_context": {
      "active_gem_instance_id": "web_seed_active_14_active_rain_of_arrows",
      "base_gem_id": "active_rain_of_arrows",
      "gem_kind": "active_skill",
      "sudoku_digit": 1,
      "base_gem_level": 1,
      "effective_gem_level": 1,
      "tlidb_source_values": {
        "source": "tlidb",
        "tlidb_id": "Rain_of_Arrows",
        "display_level": 20,
        "raw_lines": [
          "释放该技能向空中发射 15 个投射物，投射物落下时随机攻击一定范围内的敌人，造成 134% 武器攻击伤害。",
          "投射物速度使该技能伤害额外增加。",
          "箭雨：",
          "造成 134% 武器攻击伤害",
          "基础发射 1 个投射物",
          "该技能 +14 投射物数量",
          "对该技能投射物速度加成的 25% 同样作用于该技能额外伤害",
          "该技能发射的投射物可以命中同一个敌人",
          "该技能的霰弹效应衰减系数为 70%"
        ],
        "parsed_values": {
          "base_damage": 134,
          "mana_cost": 5,
          "release_interval_ms": 1000
        },
        "anchors": {
          "base_damage": {
            "20": 134
          }
        }
      },
      "level_values": {
        "base_damage": 13.4,
        "mana_cost": 5,
        "release_interval_ms": 1000
      },
      "auto_release": {
        "policy": "target_cluster",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "damage_basis": "weapon_attack",
      "damage_form": "attack",
      "weapon_attack_base_damage": 100.0,
      "added_damage_effectiveness_percent": 100.0
    },
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Rain_of_Arrows",
        "display_level": 20,
        "raw_lines": [
          "释放该技能向空中发射 15 个投射物，投射物落下时随机攻击一定范围内的敌人，造成 134% 武器攻击伤害。",
          "投射物速度使该技能伤害额外增加。",
          "箭雨：",
          "造成 134% 武器攻击伤害",
          "基础发射 1 个投射物",
          "该技能 +14 投射物数量",
          "对该技能投射物速度加成的 25% 同样作用于该技能额外伤害",
          "该技能发射的投射物可以命中同一个敌人",
          "该技能的霰弹效应衰减系数为 70%"
        ],
        "parsed_values": {
          "base_damage": 134,
          "mana_cost": 5,
          "release_interval_ms": 1000
        },
        "anchors": {
          "base_damage": {
            "20": 134
          }
        }
      },
      "level_values": {
        "base_damage": 13.4,
        "mana_cost": 5,
        "release_interval_ms": 1000
      },
      "auto_release": {
        "policy": "target_cluster",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "routed_modifiers": [],
      "final_values": {
        "base_damage": 13.4,
        "final_damage": 13.4,
        "actual_interval_ms": 980,
        "mana_cost": 5,
        "projectile_count": 15,
        "area_multiplier": 1.0,
        "speed_multiplier": 1.02
      }
    },
    "shape_effects": [],
    "labels": {
      "base_damage": "基础伤害",
      "final_damage": "最终伤害",
      "expected_hit_damage": "期望击中伤害",
      "preview_dps": "预览 DPS",
      "base_release_interval_ms": "基础释放间隔",
      "release_interval_ms": "释放间隔",
      "base_cooldown_ms": "基础冷却",
      "final_cooldown_ms": "最终冷却",
      "actual_interval_ms": "实际释放间隔",
      "trigger_interval_ms": "触发间隔",
      "mana_cost": "魔力消耗",
      "projectile_count": "投射物数量",
      "area_multiplier": "范围倍率",
      "speed_multiplier": "速度倍率"
    },
    "base_damage": 13.4,
    "final_damage": 13.4,
    "non_crit_damage": 13.4,
    "increase_pool": 0.0,
    "final_pool": 0.0,
    "crit_chance": 0.05,
    "crit_multiplier": 3.0,
    "expected_hit_damage": 14.740000000000002,
    "uses_per_second": 1.0204081632653061,
    "hit_coverage_factor": 1.0,
    "preview_dps": 15.040816326530615,
    "base_release_interval_ms": 1000,
    "release_interval_ms": 980,
    "base_cooldown_ms": 0,
    "final_cooldown_ms": 0,
    "actual_interval_ms": 980,
    "trigger_interval_ms": 0,
    "mana_cost": 5,
    "projectile_count": 15,
    "area_multiplier": 1.0,
    "speed_multiplier": 1.02,
    "tags": [
      {
        "id": "area",
        "text": "范围"
      },
      {
        "id": "attack",
        "text": "攻击"
      },
      {
        "id": "bow",
        "text": "弓"
      },
      {
        "id": "physical",
        "text": "物理"
      },
      {
        "id": "projectile",
        "text": "投射物"
      },
      {
        "id": "ranged",
        "text": "远程"
      }
    ],
    "applied_modifiers": [],
    "skill_stats": {
      "life_regen_flat": 10.0,
      "max_mana": 100.0,
      "max_energy_shield": 0.0,
      "physical_damage_add_percent": 0.0,
      "fire_damage_add_percent": 0.0,
      "cold_damage_add_percent": 0.0,
      "lightning_damage_add_percent": 0.0,
      "chaos_damage_add_percent": 0.0,
      "elemental_damage_add_percent": 0.0,
      "all_damage_type_add_percent": 0.0,
      "hit_damage_add_percent": 0.0,
      "dot_damage_add_percent": 0.0,
      "attack_damage_add_percent": 0.0,
      "spell_damage_add_percent": 0.0,
      "melee_damage_add_percent": 2.0,
      "ranged_damage_add_percent": 0.0,
      "projectile_damage_add_percent": 0.0,
      "area_damage_add_percent": 0.0,
      "chain_damage_add_percent": 0.0,
      "pierce_damage_add_percent": 0.0,
      "damage_add_percent": 0.0,
      "damage_final_percent": 0.0,
      "hit_damage_final_percent": 0.0,
      "double_damage_chance_percent": 0.0,
      "conversion_physical_to_fire_percent": 0.0,
      "conversion_physical_to_cold_percent": 0.0,
      "conversion_physical_to_lightning_percent": 0.0,
      "conversion_physical_to_chaos_percent": 0.0,
      "conversion_lightning_to_cold_percent": 0.0,
      "conversion_lightning_to_fire_percent": 0.0,
      "conversion_lightning_to_chaos_percent": 0.0,
      "conversion_cold_to_fire_percent": 0.0,
      "conversion_cold_to_chaos_percent": 0.0,
      "conversion_fire_to_chaos_percent": 0.0,
      "attack_speed_add_percent": 2.0,
      "cast_speed_add_percent": 2.0,
      "skill_speed_final_percent": 0.0,
      "cooldown_recovery_add_percent": 0.0,
      "added_cooldown_ms": 0.0,
      "projectile_speed_add_percent": 0.0,
      "base_crit_chance_percent": 5.0,
      "crit_chance_add_percent": 0.0,
      "crit_rating": 0.0,
      "crit_damage_rating": 0.0,
      "crit_damage_add_percent": 0.0,
      "derived_crit_chance_percent": 5.0,
      "derived_crit_damage_percent": 300.0,
      "cannot_crit": false,
      "prevent_elemental_ailments": false,
      "area_add_percent": 0.0,
      "slash_chance_add_percent": 0.0,
      "projectile_count_add": 0.0,
      "split_projectile_chance_percent": 0.0,
      "split_projectile_count_add": 0.0,
      "chain_count_add": 0.0,
      "bounce_count_add": 0.0,
      "pierce_count_add": 0.0,
      "duration_add_percent": 0.0,
      "status_chance_add_percent": 0.0,
      "ignite_chance_add_percent": 0.0,
      "guard_trigger_count": 0.0,
      "guard_internal_cooldown_ms": 0.0,
      "added_damage_effectiveness_percent": 100.0
    }
  },
  "skill_sparkle": {
    "active_gem_instance_id": "web_seed_active_15_active_sparkle",
    "name_text": "电火花",
    "skill_template_id": "skill_sparkle",
    "skill_package_id": "active_sparkle",
    "skill_package_version": "1.0.0",
    "template_text": "电火花",
    "damage_type": "lightning",
    "behavior_type": "projectile",
    "behavior_template": "projectile",
    "visual_effect": "skill_event.sparkle.vfx",
    "cast": {
      "mode": "spell",
      "target_selector": "nearest_enemy",
      "search_range": 420,
      "cooldown_ms": 0,
      "release_interval_ms": 650,
      "base_cooldown_ms": 0,
      "trigger_interval_ms": 0,
      "mana_cost": 8,
      "windup_ms": 0,
      "recovery_ms": 0
    },
    "hit": {
      "base_damage": 42.65,
      "can_crit": true,
      "can_apply_status": true,
      "damage_timing": "on_projectile_hit",
      "hit_delay_ms": 160,
      "hit_radius": 20,
      "target_policy": "selected_target"
    },
    "runtime_params": {
      "projectile_count": 1,
      "spread_angle_deg": 0,
      "projectile_speed": 520.0,
      "projectile_width": 36,
      "projectile_height": 26,
      "max_distance": 380,
      "hit_policy": "pierce",
      "pierce_count": 0,
      "collision_radius": 14,
      "spawn_offset": {
        "x": 0,
        "y": 0
      },
      "projectile_radius": 10,
      "impact_radius": 20,
      "max_targets": 4,
      "min_duration_ms": 120,
      "max_duration_ms": 1500,
      "duration_ms": 1500,
      "tick_interval_ms": 250,
      "sustained_ticks": true
    },
    "presentation_keys": {
      "vfx": "skill_event.sparkle.vfx",
      "cast_vfx_key": "skill_event.sparkle.vfx",
      "projectile_vfx_key": "skill_event.sparkle.vfx",
      "hit_vfx_key": "skill_event.sparkle.vfx",
      "sfx": "skill_event.sparkle.sfx",
      "floating_text": "skill_event.sparkle.floating_text",
      "floating_text_style": "skill_event.sparkle.floating_text",
      "screen_feedback": "skill_event.sparkle.screen_feedback",
      "hit_stop_ms": 0,
      "camera_shake": 0
    },
    "source_context": {
      "active_gem_instance_id": "web_seed_active_15_active_sparkle",
      "base_gem_id": "active_sparkle",
      "gem_kind": "active_skill",
      "sudoku_digit": 1,
      "base_gem_level": 1,
      "effective_gem_level": 1,
      "tlidb_source_values": {
        "source": "tlidb",
        "tlidb_id": "Sparkle",
        "display_level": 20,
        "raw_lines": [
          "释放该技能向前发射 1 个电火花，持续打击其范围内的敌人，每次造成 43-810 法术闪电伤害。电火花的速度逐渐降低。",
          "电火花：",
          "造成 43-810 法术闪电伤害",
          "投射物每 0.25 秒打击一次",
          "投射物持续 1.5 秒"
        ],
        "parsed_values": {
          "base_damage": 426.5,
          "mana_cost": 8,
          "release_interval_ms": 650
        },
        "anchors": {
          "base_damage": {
            "20": 426.5
          }
        }
      },
      "level_values": {
        "base_damage": 42.65,
        "mana_cost": 8,
        "release_interval_ms": 650
      },
      "auto_release": {
        "policy": "target_cluster",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "damage_basis": "flat",
      "damage_form": "spell",
      "weapon_attack_base_damage": 100.0,
      "added_damage_effectiveness_percent": 100.0
    },
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Sparkle",
        "display_level": 20,
        "raw_lines": [
          "释放该技能向前发射 1 个电火花，持续打击其范围内的敌人，每次造成 43-810 法术闪电伤害。电火花的速度逐渐降低。",
          "电火花：",
          "造成 43-810 法术闪电伤害",
          "投射物每 0.25 秒打击一次",
          "投射物持续 1.5 秒"
        ],
        "parsed_values": {
          "base_damage": 426.5,
          "mana_cost": 8,
          "release_interval_ms": 650
        },
        "anchors": {
          "base_damage": {
            "20": 426.5
          }
        }
      },
      "level_values": {
        "base_damage": 42.65,
        "mana_cost": 8,
        "release_interval_ms": 650
      },
      "auto_release": {
        "policy": "target_cluster",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "routed_modifiers": [],
      "final_values": {
        "base_damage": 42.65,
        "final_damage": 42.65,
        "actual_interval_ms": 637,
        "mana_cost": 8,
        "projectile_count": 1,
        "area_multiplier": 1.0,
        "speed_multiplier": 1.02
      }
    },
    "shape_effects": [],
    "labels": {
      "base_damage": "基础伤害",
      "final_damage": "最终伤害",
      "expected_hit_damage": "期望击中伤害",
      "preview_dps": "预览 DPS",
      "base_release_interval_ms": "基础释放间隔",
      "release_interval_ms": "释放间隔",
      "base_cooldown_ms": "基础冷却",
      "final_cooldown_ms": "最终冷却",
      "actual_interval_ms": "实际释放间隔",
      "trigger_interval_ms": "触发间隔",
      "mana_cost": "魔力消耗",
      "projectile_count": "投射物数量",
      "area_multiplier": "范围倍率",
      "speed_multiplier": "速度倍率"
    },
    "base_damage": 42.65,
    "final_damage": 42.65,
    "non_crit_damage": 42.65,
    "increase_pool": 0.0,
    "final_pool": 0.0,
    "crit_chance": 0.05,
    "crit_multiplier": 3.0,
    "expected_hit_damage": 46.915,
    "uses_per_second": 1.5698587127158556,
    "hit_coverage_factor": 1.0,
    "preview_dps": 73.64992150706436,
    "base_release_interval_ms": 650,
    "release_interval_ms": 637,
    "base_cooldown_ms": 0,
    "final_cooldown_ms": 0,
    "actual_interval_ms": 637,
    "trigger_interval_ms": 0,
    "mana_cost": 8,
    "projectile_count": 1,
    "area_multiplier": 1.0,
    "speed_multiplier": 1.02,
    "tags": [
      {
        "id": "lightning",
        "text": "闪电"
      },
      {
        "id": "projectile",
        "text": "投射物"
      },
      {
        "id": "spell",
        "text": "法术"
      }
    ],
    "applied_modifiers": [],
    "skill_stats": {
      "life_regen_flat": 10.0,
      "max_mana": 100.0,
      "max_energy_shield": 0.0,
      "physical_damage_add_percent": 0.0,
      "fire_damage_add_percent": 0.0,
      "cold_damage_add_percent": 0.0,
      "lightning_damage_add_percent": 0.0,
      "chaos_damage_add_percent": 0.0,
      "elemental_damage_add_percent": 0.0,
      "all_damage_type_add_percent": 0.0,
      "hit_damage_add_percent": 0.0,
      "dot_damage_add_percent": 0.0,
      "attack_damage_add_percent": 0.0,
      "spell_damage_add_percent": 0.0,
      "melee_damage_add_percent": 2.0,
      "ranged_damage_add_percent": 0.0,
      "projectile_damage_add_percent": 0.0,
      "area_damage_add_percent": 0.0,
      "chain_damage_add_percent": 0.0,
      "pierce_damage_add_percent": 0.0,
      "damage_add_percent": 0.0,
      "damage_final_percent": 0.0,
      "hit_damage_final_percent": 0.0,
      "double_damage_chance_percent": 0.0,
      "conversion_physical_to_fire_percent": 0.0,
      "conversion_physical_to_cold_percent": 0.0,
      "conversion_physical_to_lightning_percent": 0.0,
      "conversion_physical_to_chaos_percent": 0.0,
      "conversion_lightning_to_cold_percent": 0.0,
      "conversion_lightning_to_fire_percent": 0.0,
      "conversion_lightning_to_chaos_percent": 0.0,
      "conversion_cold_to_fire_percent": 0.0,
      "conversion_cold_to_chaos_percent": 0.0,
      "conversion_fire_to_chaos_percent": 0.0,
      "attack_speed_add_percent": 2.0,
      "cast_speed_add_percent": 2.0,
      "skill_speed_final_percent": 0.0,
      "cooldown_recovery_add_percent": 0.0,
      "added_cooldown_ms": 0.0,
      "projectile_speed_add_percent": 0.0,
      "base_crit_chance_percent": 5.0,
      "crit_chance_add_percent": 0.0,
      "crit_rating": 0.0,
      "crit_damage_rating": 0.0,
      "crit_damage_add_percent": 0.0,
      "derived_crit_chance_percent": 5.0,
      "derived_crit_damage_percent": 300.0,
      "cannot_crit": false,
      "prevent_elemental_ailments": false,
      "area_add_percent": 0.0,
      "slash_chance_add_percent": 0.0,
      "projectile_count_add": 0.0,
      "split_projectile_chance_percent": 0.0,
      "split_projectile_count_add": 0.0,
      "chain_count_add": 0.0,
      "bounce_count_add": 0.0,
      "pierce_count_add": 0.0,
      "duration_add_percent": 0.0,
      "status_chance_add_percent": 0.0,
      "ignite_chance_add_percent": 0.0,
      "guard_trigger_count": 0.0,
      "guard_internal_cooldown_ms": 0.0,
      "added_damage_effectiveness_percent": 100.0
    }
  },
  "skill_black_hole": {
    "active_gem_instance_id": "web_seed_active_16_active_black_hole",
    "name_text": "黑洞",
    "skill_template_id": "skill_black_hole",
    "skill_package_id": "active_black_hole",
    "skill_package_version": "1.0.0",
    "template_text": "黑洞",
    "damage_type": "chaos",
    "behavior_type": "damage_zone",
    "behavior_template": "damage_zone",
    "visual_effect": "skill_event.black_hole.vfx",
    "cast": {
      "mode": "spell",
      "target_selector": "nearest_enemy",
      "search_range": 420,
      "cooldown_ms": 0,
      "release_interval_ms": 800,
      "base_cooldown_ms": 10000,
      "trigger_interval_ms": 0,
      "mana_cost": 15,
      "windup_ms": 0,
      "recovery_ms": 0
    },
    "hit": {
      "base_damage": 24.9,
      "ailments": [],
      "can_crit": false,
      "can_apply_status": true,
      "damage_timing": "on_damage_zone_hit",
      "hit_delay_ms": 160,
      "hit_radius": 125,
      "target_policy": "selected_target"
    },
    "runtime_params": {
      "shape": "circle",
      "origin_policy": "target_position",
      "facing_policy": "none",
      "hit_at_ms": 200,
      "max_targets": 10,
      "status_chance_scale": 1.0,
      "zone_vfx_key": "skill_event.black_hole.vfx",
      "radius": 125.0,
      "expand_duration_ms": 200,
      "ring_width": 90,
      "duration_ms": 4000,
      "tick_interval_ms": 500,
      "max_hits": 80,
      "max_hits_per_target": 8,
      "knockback_policy": "reverse",
      "knockback_interval_ms": 100,
      "knockback_distance": 12,
      "aggravation_value": 100,
      "aggravation_cooldown_ms": 1000,
      "dot_damage_bonus_per_10_aggravation_percent": 3.5,
      "projectile_count": 1
    },
    "presentation_keys": {
      "vfx": "skill_event.black_hole.vfx",
      "cast_vfx_key": "skill_event.black_hole.vfx",
      "projectile_vfx_key": "skill_event.black_hole.vfx",
      "hit_vfx_key": "skill_event.black_hole.vfx",
      "sfx": "skill_event.black_hole.sfx",
      "floating_text": "skill_event.black_hole.floating_text",
      "floating_text_style": "skill_event.black_hole.floating_text",
      "screen_feedback": "skill_event.black_hole.screen_feedback",
      "hit_stop_ms": 0,
      "camera_shake": 0
    },
    "source_context": {
      "active_gem_instance_id": "web_seed_active_16_active_black_hole",
      "base_gem_id": "active_black_hole",
      "gem_kind": "active_skill",
      "sudoku_digit": 1,
      "base_gem_level": 1,
      "effective_gem_level": 1,
      "tlidb_source_values": {
        "source": "tlidb",
        "tlidb_id": "Black_Hole",
        "display_level": 20,
        "raw_lines": [
          "释放该技能在指定位置形成黑洞，对一定范围内敌人造成每秒 249 持续混沌伤害，且周期性反向击退其中的敌人，持续 4 秒。受到该技能伤害的敌人被施加 100 点加剧值，冷却时间为 1 秒。",
          "释放该技能获得亢奋：",
          "黑洞中的敌人每有 10 点加剧值，你对其额外造成 3.5% 持续伤害,持续 4 秒",
          "黑洞：",
          "造成 249-249 持续混沌伤害",
          "该技能具有反向击退",
          "该技能造成持续伤害时，对敌人施加 100 点加剧值，该效果冷却时间为 1 秒",
          "黑洞每间隔 0.5 秒击退其中的敌人",
          "持续 4 秒",
          "释放该技能获得亢奋：",
          "黑洞中的敌人每有 10 点加剧值，你对其额外造成 3.5% 持续伤害,持续 4 秒"
        ],
        "parsed_values": {
          "base_damage": 249,
          "mana_cost": 15,
          "release_interval_ms": 800
        },
        "anchors": {
          "base_damage": {
            "20": 249
          }
        }
      },
      "level_values": {
        "base_damage": 24.9,
        "mana_cost": 15,
        "release_interval_ms": 800
      },
      "auto_release": {
        "policy": "target_cluster",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "damage_basis": "flat",
      "damage_form": "damage_over_time",
      "weapon_attack_base_damage": 100.0,
      "added_damage_effectiveness_percent": 100.0
    },
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Black_Hole",
        "display_level": 20,
        "raw_lines": [
          "释放该技能在指定位置形成黑洞，对一定范围内敌人造成每秒 249 持续混沌伤害，且周期性反向击退其中的敌人，持续 4 秒。受到该技能伤害的敌人被施加 100 点加剧值，冷却时间为 1 秒。",
          "释放该技能获得亢奋：",
          "黑洞中的敌人每有 10 点加剧值，你对其额外造成 3.5% 持续伤害,持续 4 秒",
          "黑洞：",
          "造成 249-249 持续混沌伤害",
          "该技能具有反向击退",
          "该技能造成持续伤害时，对敌人施加 100 点加剧值，该效果冷却时间为 1 秒",
          "黑洞每间隔 0.5 秒击退其中的敌人",
          "持续 4 秒",
          "释放该技能获得亢奋：",
          "黑洞中的敌人每有 10 点加剧值，你对其额外造成 3.5% 持续伤害,持续 4 秒"
        ],
        "parsed_values": {
          "base_damage": 249,
          "mana_cost": 15,
          "release_interval_ms": 800
        },
        "anchors": {
          "base_damage": {
            "20": 249
          }
        }
      },
      "level_values": {
        "base_damage": 24.9,
        "mana_cost": 15,
        "release_interval_ms": 800
      },
      "auto_release": {
        "policy": "target_cluster",
        "notes": [
          "??????????TLIDB ???? Lv20 ???"
        ]
      },
      "routed_modifiers": [],
      "final_values": {
        "base_damage": 24.9,
        "final_damage": 24.9,
        "actual_interval_ms": 10000,
        "mana_cost": 15,
        "projectile_count": 1,
        "area_multiplier": 1.0,
        "speed_multiplier": 1.02
      }
    },
    "shape_effects": [],
    "labels": {
      "base_damage": "基础伤害",
      "final_damage": "最终伤害",
      "expected_hit_damage": "期望击中伤害",
      "preview_dps": "预览 DPS",
      "base_release_interval_ms": "基础释放间隔",
      "release_interval_ms": "释放间隔",
      "base_cooldown_ms": "基础冷却",
      "final_cooldown_ms": "最终冷却",
      "actual_interval_ms": "实际释放间隔",
      "trigger_interval_ms": "触发间隔",
      "mana_cost": "魔力消耗",
      "projectile_count": "投射物数量",
      "area_multiplier": "范围倍率",
      "speed_multiplier": "速度倍率"
    },
    "base_damage": 24.9,
    "final_damage": 24.9,
    "non_crit_damage": 24.9,
    "increase_pool": 0.0,
    "final_pool": 0.0,
    "crit_chance": 0.0,
    "crit_multiplier": 3.0,
    "expected_hit_damage": 24.9,
    "uses_per_second": 0.1,
    "hit_coverage_factor": 1.0,
    "preview_dps": 2.49,
    "base_release_interval_ms": 800,
    "release_interval_ms": 784,
    "base_cooldown_ms": 10000,
    "final_cooldown_ms": 10000,
    "actual_interval_ms": 10000,
    "trigger_interval_ms": 0,
    "mana_cost": 15,
    "projectile_count": 1,
    "area_multiplier": 1.0,
    "speed_multiplier": 1.02,
    "tags": [
      {
        "id": "area",
        "text": "范围"
      },
      {
        "id": "chaos",
        "text": "混沌"
      },
      {
        "id": "dot",
        "text": "持续伤害"
      },
      {
        "id": "spell",
        "text": "法术"
      }
    ],
    "applied_modifiers": [],
    "skill_stats": {
      "life_regen_flat": 10.0,
      "max_mana": 100.0,
      "max_energy_shield": 0.0,
      "physical_damage_add_percent": 0.0,
      "fire_damage_add_percent": 0.0,
      "cold_damage_add_percent": 0.0,
      "lightning_damage_add_percent": 0.0,
      "chaos_damage_add_percent": 0.0,
      "elemental_damage_add_percent": 0.0,
      "all_damage_type_add_percent": 0.0,
      "hit_damage_add_percent": 0.0,
      "dot_damage_add_percent": 0.0,
      "attack_damage_add_percent": 0.0,
      "spell_damage_add_percent": 0.0,
      "melee_damage_add_percent": 2.0,
      "ranged_damage_add_percent": 0.0,
      "projectile_damage_add_percent": 0.0,
      "area_damage_add_percent": 0.0,
      "chain_damage_add_percent": 0.0,
      "pierce_damage_add_percent": 0.0,
      "damage_add_percent": 0.0,
      "damage_final_percent": 0.0,
      "hit_damage_final_percent": 0.0,
      "double_damage_chance_percent": 0.0,
      "conversion_physical_to_fire_percent": 0.0,
      "conversion_physical_to_cold_percent": 0.0,
      "conversion_physical_to_lightning_percent": 0.0,
      "conversion_physical_to_chaos_percent": 0.0,
      "conversion_lightning_to_cold_percent": 0.0,
      "conversion_lightning_to_fire_percent": 0.0,
      "conversion_lightning_to_chaos_percent": 0.0,
      "conversion_cold_to_fire_percent": 0.0,
      "conversion_cold_to_chaos_percent": 0.0,
      "conversion_fire_to_chaos_percent": 0.0,
      "attack_speed_add_percent": 2.0,
      "cast_speed_add_percent": 2.0,
      "skill_speed_final_percent": 0.0,
      "cooldown_recovery_add_percent": 0.0,
      "added_cooldown_ms": 0.0,
      "projectile_speed_add_percent": 0.0,
      "base_crit_chance_percent": 5.0,
      "crit_chance_add_percent": 0.0,
      "crit_rating": 0.0,
      "crit_damage_rating": 0.0,
      "crit_damage_add_percent": 0.0,
      "derived_crit_chance_percent": 5.0,
      "derived_crit_damage_percent": 300.0,
      "cannot_crit": false,
      "prevent_elemental_ailments": false,
      "area_add_percent": 0.0,
      "slash_chance_add_percent": 0.0,
      "projectile_count_add": 0.0,
      "split_projectile_chance_percent": 0.0,
      "split_projectile_count_add": 0.0,
      "chain_count_add": 0.0,
      "bounce_count_add": 0.0,
      "pierce_count_add": 0.0,
      "duration_add_percent": 0.0,
      "status_chance_add_percent": 0.0,
      "ignite_chance_add_percent": 0.0,
      "guard_trigger_count": 0.0,
      "guard_internal_cooldown_ms": 0.0,
      "added_damage_effectiveness_percent": 100.0
    }
  }
} as const;
