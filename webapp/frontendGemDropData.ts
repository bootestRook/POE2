// Generated frontend gem drop pool. Source: configs/skills and localization.

export const FRONTEND_GEM_DROP_POOL = [
  {
    "instance_id": "active_chromatic_shot",
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
    },
    "base_gem_id": "active_chromatic_shot"
  },
  {
    "instance_id": "active_corrosive_shot",
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
    },
    "base_gem_id": "active_corrosive_shot"
  },
  {
    "instance_id": "active_ring_of_ice",
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
    },
    "base_gem_id": "active_ring_of_ice"
  },
  {
    "instance_id": "active_ice_shot",
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
    },
    "base_gem_id": "active_ice_shot"
  },
  {
    "instance_id": "active_whirlwind",
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
    },
    "base_gem_id": "active_whirlwind"
  },
  {
    "instance_id": "active_blizzard",
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
    },
    "base_gem_id": "active_blizzard"
  },
  {
    "instance_id": "active_flame_slash",
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
    },
    "base_gem_id": "active_flame_slash"
  },
  {
    "instance_id": "active_burning_shot",
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
    },
    "base_gem_id": "active_burning_shot"
  },
  {
    "instance_id": "active_sparkle",
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
    },
    "base_gem_id": "active_sparkle"
  },
  {
    "instance_id": "active_stoneskin",
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
    },
    "base_gem_id": "active_stoneskin"
  },
  {
    "instance_id": "active_rain_of_arrows",
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
    },
    "base_gem_id": "active_rain_of_arrows"
  },
  {
    "instance_id": "active_split_firebolt",
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
    },
    "base_gem_id": "active_split_firebolt"
  },
  {
    "instance_id": "active_lightning_shot",
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
    },
    "base_gem_id": "active_lightning_shot"
  },
  {
    "instance_id": "active_chain_lightning",
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
    },
    "base_gem_id": "active_chain_lightning"
  },
  {
    "instance_id": "active_thundercloud",
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
    },
    "base_gem_id": "active_thundercloud"
  },
  {
    "instance_id": "active_black_hole",
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
    },
    "base_gem_id": "active_black_hole"
  },
  {
    "instance_id": "passive_rejuvenation",
    "name_text": "再生",
    "description_text": "激活光环，自身和一定范围内的所有友军获得增益：",
    "category_text": "被动技能宝石",
    "gem_type": {
      "id": "gem_type_2",
      "number": 2,
      "display_text": "2号宝石",
      "identity_text": "二号预留辅助身份",
      "color_key": "blue"
    },
    "gem_kind": "passive_skill",
    "gem_kind_text": "被动技能宝石",
    "sudoku_digit": 2,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "aura",
        "text": "光环"
      },
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_2",
        "text": "2号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "passive_skill_gem",
        "text": "被动技能宝石"
      }
    ],
    "base_effect": {
      "title_text": "被动持续效果",
      "modifiers": [
        {
          "stat": {
            "id": "life_regen_flat",
            "text": "每秒生命回复"
          },
          "value": 4.0,
          "layer_text": "加算修正",
          "target_text": "影响玩家属性"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动技能",
      "target_kinds": [
        "主动技能宝石"
      ],
      "tags_any": [
        {
          "id": "attack",
          "text": "攻击"
        },
        {
          "id": "spell",
          "text": "法术"
        }
      ],
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
    "visual_effect": "passive_rejuvenation",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Rejuvenation",
        "display_level": 20,
        "raw_lines": [
          "激活光环，自身和一定范围内的所有友军获得增益：",
          "2 生命每秒自然回复。",
          "激活光环，自身和一定范围内的所有友军获得增益：",
          "+227 生命每秒自然回复"
        ],
        "parsed_values": {
          "life_regen_flat": 40
        },
        "anchors": {
          "life_regen_flat": {
            "20": 40
          }
        }
      },
      "level_values": {
        "life_regen_flat": 4.0
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "passive",
      "icon_text": "再",
      "icon_color_key": "blue",
      "icon_sprite": "",
      "name_text": "再生",
      "subtitle_text": "蓝色、宝石、光环",
      "type_identity_text": "",
      "tags": [
        {
          "id": "gem",
          "text": "宝石"
        },
        {
          "id": "aura",
          "text": "光环"
        }
      ],
      "sections": {
        "description": {
          "title_text": "描述",
          "lines": [
            "激活光环，自身和一定范围内的所有友军获得增益："
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
              "label_text": "影响玩家属性：每秒生命回复（加算修正）",
              "value_text": "+4"
            }
          ]
        },
        "tlidb_source": {
          "title_text": "TLIDB 源数值",
          "lines": [
            "TLIDB ID: Rejuvenation",
            "Lv20 source card",
            "Source: life_regen_flat=40"
          ]
        },
        "tlidb_level": {
          "title_text": "等级表",
          "lines": [
            "life_regen_flat=4"
          ]
        },
        "bonuses": {
          "title_text": "当前加成",
          "lines": [
            "影响玩家属性：每秒生命回复 +4",
            "同数独数字宝石不能位于同一行、列或宫格"
          ]
        }
      }
    },
    "base_gem_id": "passive_rejuvenation"
  },
  {
    "instance_id": "passive_frigid_domain",
    "name_text": "冰寒领域",
    "description_text": "激活光环，自身和一定范围内的所有友军获得增益：",
    "category_text": "被动技能宝石",
    "gem_type": {
      "id": "gem_type_2",
      "number": 2,
      "display_text": "2号宝石",
      "identity_text": "二号预留辅助身份",
      "color_key": "blue"
    },
    "gem_kind": "passive_skill",
    "gem_kind_text": "被动技能宝石",
    "sudoku_digit": 2,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "aura",
        "text": "光环"
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
        "id": "gem_type_2",
        "text": "2号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "passive_skill_gem",
        "text": "被动技能宝石"
      }
    ],
    "base_effect": {
      "title_text": "被动持续效果",
      "modifiers": [
        {
          "stat": {
            "id": "cold_damage_add_percent",
            "text": "冰霜伤害提高"
          },
          "value": 1.6,
          "layer_text": "加算修正",
          "target_text": "影响主动技能"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动技能",
      "target_kinds": [
        "主动技能宝石"
      ],
      "tags_any": [
        {
          "id": "cold",
          "text": "冰霜"
        }
      ],
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
    "visual_effect": "passive_frigid_domain",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Frigid_Domain",
        "display_level": 20,
        "raw_lines": [
          "激活光环，自身和一定范围内的所有友军获得增益：",
          "额外 16% 冰霜伤害。",
          "激活光环，自身和一定范围内的所有友军获得增益：",
          "额外 +35% 冰霜伤害"
        ],
        "parsed_values": {
          "cold_damage_add_percent": 16
        },
        "anchors": {
          "cold_damage_add_percent": {
            "20": 16
          }
        }
      },
      "level_values": {
        "cold_damage_add_percent": 1.6
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "passive",
      "icon_text": "冰",
      "icon_color_key": "blue",
      "icon_sprite": "",
      "name_text": "冰寒领域",
      "subtitle_text": "蓝色、宝石、冰霜、光环",
      "type_identity_text": "",
      "tags": [
        {
          "id": "gem",
          "text": "宝石"
        },
        {
          "id": "cold",
          "text": "冰霜"
        },
        {
          "id": "aura",
          "text": "光环"
        }
      ],
      "sections": {
        "description": {
          "title_text": "描述",
          "lines": [
            "激活光环，自身和一定范围内的所有友军获得增益："
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
              "label_text": "影响主动技能：冰霜伤害提高（加算修正）",
              "value_text": "+1.6"
            }
          ]
        },
        "tlidb_source": {
          "title_text": "TLIDB 源数值",
          "lines": [
            "TLIDB ID: Frigid_Domain",
            "Lv20 source card",
            "Source: cold_damage_add_percent=16"
          ]
        },
        "tlidb_level": {
          "title_text": "等级表",
          "lines": [
            "cold_damage_add_percent=1.6"
          ]
        },
        "bonuses": {
          "title_text": "当前加成",
          "lines": [
            "影响主动技能：冰霜伤害提高 +1.6%",
            "同数独数字宝石不能位于同一行、列或宫格"
          ]
        }
      }
    },
    "base_gem_id": "passive_frigid_domain"
  },
  {
    "instance_id": "passive_weapon_amplification",
    "name_text": "武器增幅",
    "description_text": "激活光环，自身和一定范围内的所有友军获得增益：",
    "category_text": "被动技能宝石",
    "gem_type": {
      "id": "gem_type_2",
      "number": 2,
      "display_text": "2号宝石",
      "identity_text": "二号预留辅助身份",
      "color_key": "blue"
    },
    "gem_kind": "passive_skill",
    "gem_kind_text": "被动技能宝石",
    "sudoku_digit": 2,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "attack",
        "text": "攻击"
      },
      {
        "id": "aura",
        "text": "光环"
      },
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_2",
        "text": "2号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "passive_skill_gem",
        "text": "被动技能宝石"
      },
      {
        "id": "physical",
        "text": "物理"
      }
    ],
    "base_effect": {
      "title_text": "被动持续效果",
      "modifiers": [
        {
          "stat": {
            "id": "physical_damage_add_percent",
            "text": "物理伤害提高"
          },
          "value": 1.6,
          "layer_text": "加算修正",
          "target_text": "影响主动技能"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动技能",
      "target_kinds": [
        "主动技能宝石"
      ],
      "tags_any": [
        {
          "id": "attack",
          "text": "攻击"
        },
        {
          "id": "physical",
          "text": "物理"
        }
      ],
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
    "visual_effect": "passive_weapon_amplification",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Weapon_Amplification",
        "display_level": 20,
        "raw_lines": [
          "激活光环，自身和一定范围内的所有友军获得增益：",
          "额外 16% 物理伤害。",
          "激活光环，自身和一定范围内的所有友军获得增益：",
          "额外 +35% 物理伤害"
        ],
        "parsed_values": {
          "physical_damage_add_percent": 16
        },
        "anchors": {
          "physical_damage_add_percent": {
            "20": 16
          }
        }
      },
      "level_values": {
        "physical_damage_add_percent": 1.6
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "passive",
      "icon_text": "武",
      "icon_color_key": "blue",
      "icon_sprite": "",
      "name_text": "武器增幅",
      "subtitle_text": "蓝色、宝石、攻击、物理、光环",
      "type_identity_text": "",
      "tags": [
        {
          "id": "gem",
          "text": "宝石"
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
          "id": "aura",
          "text": "光环"
        }
      ],
      "sections": {
        "description": {
          "title_text": "描述",
          "lines": [
            "激活光环，自身和一定范围内的所有友军获得增益："
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
              "label_text": "影响主动技能：物理伤害提高（加算修正）",
              "value_text": "+1.6"
            }
          ]
        },
        "tlidb_source": {
          "title_text": "TLIDB 源数值",
          "lines": [
            "TLIDB ID: Weapon_Amplification",
            "Lv20 source card",
            "Source: physical_damage_add_percent=16"
          ]
        },
        "tlidb_level": {
          "title_text": "等级表",
          "lines": [
            "physical_damage_add_percent=1.6"
          ]
        },
        "bonuses": {
          "title_text": "当前加成",
          "lines": [
            "影响主动技能：物理伤害提高 +1.6%",
            "同数独数字宝石不能位于同一行、列或宫格"
          ]
        }
      }
    },
    "base_gem_id": "passive_weapon_amplification"
  },
  {
    "instance_id": "passive_spell_amplification",
    "name_text": "法术增幅",
    "description_text": "激活光环，自身和一定范围内的所有友军获得增益：",
    "category_text": "被动技能宝石",
    "gem_type": {
      "id": "gem_type_2",
      "number": 2,
      "display_text": "2号宝石",
      "identity_text": "二号预留辅助身份",
      "color_key": "blue"
    },
    "gem_kind": "passive_skill",
    "gem_kind_text": "被动技能宝石",
    "sudoku_digit": 2,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "aura",
        "text": "光环"
      },
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_2",
        "text": "2号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "passive_skill_gem",
        "text": "被动技能宝石"
      },
      {
        "id": "spell",
        "text": "法术"
      }
    ],
    "base_effect": {
      "title_text": "被动持续效果",
      "modifiers": [
        {
          "stat": {
            "id": "spell_damage_add_percent",
            "text": "法术伤害提高"
          },
          "value": 1.6,
          "layer_text": "加算修正",
          "target_text": "影响主动技能"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动技能",
      "target_kinds": [
        "主动技能宝石"
      ],
      "tags_any": [
        {
          "id": "spell",
          "text": "法术"
        }
      ],
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
    "visual_effect": "passive_spell_amplification",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Spell_Amplification",
        "display_level": 20,
        "raw_lines": [
          "激活光环，自身和一定范围内的所有友军获得增益：",
          "法术技能额外 16% 伤害。",
          "激活光环，自身和一定范围内的所有友军获得增益：",
          "额外 +35% 法术伤害"
        ],
        "parsed_values": {
          "spell_damage_add_percent": 16
        },
        "anchors": {
          "spell_damage_add_percent": {
            "20": 16
          }
        }
      },
      "level_values": {
        "spell_damage_add_percent": 1.6
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "passive",
      "icon_text": "法",
      "icon_color_key": "blue",
      "icon_sprite": "",
      "name_text": "法术增幅",
      "subtitle_text": "蓝色、宝石、法术、光环",
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
          "id": "aura",
          "text": "光环"
        }
      ],
      "sections": {
        "description": {
          "title_text": "描述",
          "lines": [
            "激活光环，自身和一定范围内的所有友军获得增益："
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
              "label_text": "影响主动技能：法术伤害提高（加算修正）",
              "value_text": "+1.6"
            }
          ]
        },
        "tlidb_source": {
          "title_text": "TLIDB 源数值",
          "lines": [
            "TLIDB ID: Spell_Amplification",
            "Lv20 source card",
            "Source: spell_damage_add_percent=16"
          ]
        },
        "tlidb_level": {
          "title_text": "等级表",
          "lines": [
            "spell_damage_add_percent=1.6"
          ]
        },
        "bonuses": {
          "title_text": "当前加成",
          "lines": [
            "影响主动技能：法术伤害提高 +1.6%",
            "同数独数字宝石不能位于同一行、列或宫格"
          ]
        }
      }
    },
    "base_gem_id": "passive_spell_amplification"
  },
  {
    "instance_id": "passive_fearless",
    "name_text": "狂猛",
    "description_text": "激活光环，自身和一定范围内的所有友军获得增益：",
    "category_text": "被动技能宝石",
    "gem_type": {
      "id": "gem_type_8",
      "number": 8,
      "display_text": "8???",
      "identity_text": "????????",
      "color_key": "cyan"
    },
    "gem_kind": "passive_skill",
    "gem_kind_text": "被动技能宝石",
    "sudoku_digit": 8,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem_type_8",
        "text": "8???"
      },
      {
        "id": "aura",
        "text": "光环"
      },
      {
        "id": "gem",
        "text": "宝石"
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
        "id": "passive_skill_gem",
        "text": "被动技能宝石"
      }
    ],
    "base_effect": {
      "title_text": "被动持续效果",
      "modifiers": [
        {
          "stat": {
            "id": "crit_rating",
            "text": "暴击值"
          },
          "value": 6.1,
          "layer_text": "加算修正",
          "target_text": "影响主动技能"
        },
        {
          "stat": {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          "value": 11.0,
          "layer_text": "最终修正",
          "target_text": "影响主动技能"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动技能",
      "target_kinds": [
        "主动技能宝石"
      ],
      "tags_any": [
        {
          "id": "melee",
          "text": "近战"
        }
      ],
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
    "visual_effect": "passive_fearless",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Fearless",
        "display_level": 20,
        "raw_lines": [
          "激活光环，自身和一定范围内的所有友军获得增益：",
          "近战技能 61% 暴击值，额外 11% 伤害。",
          "激活光环，自身和一定范围内的所有友军获得增益：",
          "近战技能 +80% 暴击值",
          "近战技能额外 +30% 伤害"
        ],
        "parsed_values": {
          "crit_rating": 61
        },
        "anchors": {
          "crit_rating": {
            "20": 61
          }
        }
      },
      "level_values": {
        "crit_rating": 6.1
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "passive",
      "icon_text": "狂",
      "icon_color_key": "cyan",
      "icon_sprite": "",
      "name_text": "狂猛",
      "subtitle_text": "蓝色、宝石、近战、光环",
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
          "id": "aura",
          "text": "光环"
        }
      ],
      "sections": {
        "description": {
          "title_text": "描述",
          "lines": [
            "激活光环，自身和一定范围内的所有友军获得增益："
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
              "label_text": "影响主动技能：暴击值（加算修正）",
              "value_text": "+6.1"
            },
            {
              "label_text": "影响主动技能：最终伤害修正（最终修正）",
              "value_text": "+11"
            }
          ]
        },
        "tlidb_source": {
          "title_text": "TLIDB 源数值",
          "lines": [
            "TLIDB ID: Fearless",
            "Lv20 source card",
            "Source: crit_rating=61"
          ]
        },
        "tlidb_level": {
          "title_text": "等级表",
          "lines": [
            "crit_rating=6.1"
          ]
        },
        "bonuses": {
          "title_text": "当前加成",
          "lines": [
            "影响主动技能：暴击值 +6.1",
            "影响主动技能：最终伤害修正 +11%",
            "同数独数字宝石不能位于同一行、列或宫格"
          ]
        }
      }
    },
    "base_gem_id": "passive_fearless"
  },
  {
    "instance_id": "passive_electric_conversion",
    "name_text": "电能转化",
    "description_text": "激活光环，自身和一定范围内的所有友军获得增益：",
    "category_text": "被动技能宝石",
    "gem_type": {
      "id": "gem_type_2",
      "number": 2,
      "display_text": "2号宝石",
      "identity_text": "二号预留辅助身份",
      "color_key": "blue"
    },
    "gem_kind": "passive_skill",
    "gem_kind_text": "被动技能宝石",
    "sudoku_digit": 2,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "aura",
        "text": "光环"
      },
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_2",
        "text": "2号宝石"
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
        "id": "passive_skill_gem",
        "text": "被动技能宝石"
      }
    ],
    "base_effect": {
      "title_text": "被动持续效果",
      "modifiers": [
        {
          "stat": {
            "id": "lightning_damage_add_percent",
            "text": "闪电伤害提高"
          },
          "value": 1.6,
          "layer_text": "加算修正",
          "target_text": "影响主动技能"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动技能",
      "target_kinds": [
        "主动技能宝石"
      ],
      "tags_any": [
        {
          "id": "lightning",
          "text": "闪电"
        }
      ],
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
    "visual_effect": "passive_electric_conversion",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Electric_Conversion",
        "display_level": 20,
        "raw_lines": [
          "激活光环，自身和一定范围内的所有友军获得增益：",
          "额外 16% 闪电伤害。",
          "激活光环，自身和一定范围内的所有友军获得增益：",
          "额外 +35% 闪电伤害"
        ],
        "parsed_values": {
          "lightning_damage_add_percent": 16
        },
        "anchors": {
          "lightning_damage_add_percent": {
            "20": 16
          }
        }
      },
      "level_values": {
        "lightning_damage_add_percent": 1.6
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "passive",
      "icon_text": "电",
      "icon_color_key": "blue",
      "icon_sprite": "",
      "name_text": "电能转化",
      "subtitle_text": "蓝色、宝石、闪电、光环",
      "type_identity_text": "",
      "tags": [
        {
          "id": "gem",
          "text": "宝石"
        },
        {
          "id": "lightning",
          "text": "闪电"
        },
        {
          "id": "aura",
          "text": "光环"
        }
      ],
      "sections": {
        "description": {
          "title_text": "描述",
          "lines": [
            "激活光环，自身和一定范围内的所有友军获得增益："
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
              "label_text": "影响主动技能：闪电伤害提高（加算修正）",
              "value_text": "+1.6"
            }
          ]
        },
        "tlidb_source": {
          "title_text": "TLIDB 源数值",
          "lines": [
            "TLIDB ID: Electric_Conversion",
            "Lv20 source card",
            "Source: lightning_damage_add_percent=16"
          ]
        },
        "tlidb_level": {
          "title_text": "等级表",
          "lines": [
            "lightning_damage_add_percent=1.6"
          ]
        },
        "bonuses": {
          "title_text": "当前加成",
          "lines": [
            "影响主动技能：闪电伤害提高 +1.6%",
            "同数独数字宝石不能位于同一行、列或宫格"
          ]
        }
      }
    },
    "base_gem_id": "passive_electric_conversion"
  },
  {
    "instance_id": "passive_precise_projectiles",
    "name_text": "精准投射",
    "description_text": "激活光环，自身和一定范围内的所有友军获得增益：",
    "category_text": "被动技能宝石",
    "gem_type": {
      "id": "gem_type_2",
      "number": 2,
      "display_text": "2号宝石",
      "identity_text": "二号预留辅助身份",
      "color_key": "blue"
    },
    "gem_kind": "passive_skill",
    "gem_kind_text": "被动技能宝石",
    "sudoku_digit": 2,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "aura",
        "text": "光环"
      },
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_2",
        "text": "2号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "passive_skill_gem",
        "text": "被动技能宝石"
      },
      {
        "id": "projectile",
        "text": "投射物"
      }
    ],
    "base_effect": {
      "title_text": "被动持续效果",
      "modifiers": [
        {
          "stat": {
            "id": "projectile_damage_add_percent",
            "text": "投射物伤害提高"
          },
          "value": 1.6,
          "layer_text": "加算修正",
          "target_text": "影响主动技能"
        },
        {
          "stat": {
            "id": "projectile_speed_add_percent",
            "text": "投射物速度提高"
          },
          "value": 10.0,
          "layer_text": "加算修正",
          "target_text": "影响主动技能"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动技能",
      "target_kinds": [
        "主动技能宝石"
      ],
      "tags_any": [
        {
          "id": "projectile",
          "text": "投射物"
        }
      ],
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
    "visual_effect": "passive_precise_projectiles",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Precise_Projectiles",
        "display_level": 20,
        "raw_lines": [
          "激活光环，自身和一定范围内的所有友军获得增益：",
          "额外 16% 投射物伤害，额外 16% 投射物造成的异常伤害， 10% 投射物速度。",
          "激活光环，自身和一定范围内的所有友军获得增益：",
          "额外 +35% 投射物伤害",
          "额外 +35% 投射物造成的异常伤害",
          "+10% 投射物速度"
        ],
        "parsed_values": {
          "projectile_damage_add_percent": 16
        },
        "anchors": {
          "projectile_damage_add_percent": {
            "20": 16
          }
        }
      },
      "level_values": {
        "projectile_damage_add_percent": 1.6
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "passive",
      "icon_text": "精",
      "icon_color_key": "blue",
      "icon_sprite": "",
      "name_text": "精准投射",
      "subtitle_text": "蓝色、宝石、投射物、光环",
      "type_identity_text": "",
      "tags": [
        {
          "id": "gem",
          "text": "宝石"
        },
        {
          "id": "projectile",
          "text": "投射物"
        },
        {
          "id": "aura",
          "text": "光环"
        }
      ],
      "sections": {
        "description": {
          "title_text": "描述",
          "lines": [
            "激活光环，自身和一定范围内的所有友军获得增益："
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
              "label_text": "影响主动技能：投射物伤害提高（加算修正）",
              "value_text": "+1.6"
            },
            {
              "label_text": "影响主动技能：投射物速度提高（加算修正）",
              "value_text": "+10"
            }
          ]
        },
        "tlidb_source": {
          "title_text": "TLIDB 源数值",
          "lines": [
            "TLIDB ID: Precise_Projectiles",
            "Lv20 source card",
            "Source: projectile_damage_add_percent=16"
          ]
        },
        "tlidb_level": {
          "title_text": "等级表",
          "lines": [
            "projectile_damage_add_percent=1.6"
          ]
        },
        "bonuses": {
          "title_text": "当前加成",
          "lines": [
            "影响主动技能：投射物伤害提高 +1.6%",
            "影响主动技能：投射物速度提高 +10%",
            "同数独数字宝石不能位于同一行、列或宫格"
          ]
        }
      }
    },
    "base_gem_id": "passive_precise_projectiles"
  },
  {
    "instance_id": "passive_energy_fortress",
    "name_text": "能量壁垒",
    "description_text": "激活光环，自身和一定范围内的所有友军获得增益：",
    "category_text": "被动技能宝石",
    "gem_type": {
      "id": "gem_type_2",
      "number": 2,
      "display_text": "2号宝石",
      "identity_text": "二号预留辅助身份",
      "color_key": "blue"
    },
    "gem_kind": "passive_skill",
    "gem_kind_text": "被动技能宝石",
    "sudoku_digit": 2,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "aura",
        "text": "光环"
      },
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_2",
        "text": "2号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "passive_skill_gem",
        "text": "被动技能宝石"
      }
    ],
    "base_effect": {
      "title_text": "被动持续效果",
      "modifiers": [
        {
          "stat": {
            "id": "max_energy_shield",
            "text": "最大能量护盾"
          },
          "value": 12.0,
          "layer_text": "加算修正",
          "target_text": "影响玩家属性"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动技能",
      "target_kinds": [
        "主动技能宝石"
      ],
      "tags_any": [
        {
          "id": "attack",
          "text": "攻击"
        },
        {
          "id": "spell",
          "text": "法术"
        }
      ],
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
    "visual_effect": "passive_energy_fortress",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Energy_Fortress",
        "display_level": 20,
        "raw_lines": [
          "激活光环，自身和一定范围内的所有友军获得增益：",
          "67 最大护盾，额外 3.2% 最大护盾。",
          "激活光环，自身和一定范围内的所有友军获得增益：",
          "319.7 最大护盾",
          "额外 13.37% 最大护盾"
        ],
        "parsed_values": {
          "max_energy_shield": 120
        },
        "anchors": {
          "max_energy_shield": {
            "20": 120
          }
        }
      },
      "level_values": {
        "max_energy_shield": 12.0
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "passive",
      "icon_text": "能",
      "icon_color_key": "blue",
      "icon_sprite": "",
      "name_text": "能量壁垒",
      "subtitle_text": "蓝色、宝石、光环",
      "type_identity_text": "",
      "tags": [
        {
          "id": "gem",
          "text": "宝石"
        },
        {
          "id": "aura",
          "text": "光环"
        }
      ],
      "sections": {
        "description": {
          "title_text": "描述",
          "lines": [
            "激活光环，自身和一定范围内的所有友军获得增益："
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
              "label_text": "影响玩家属性：最大能量护盾（加算修正）",
              "value_text": "+12"
            }
          ]
        },
        "tlidb_source": {
          "title_text": "TLIDB 源数值",
          "lines": [
            "TLIDB ID: Energy_Fortress",
            "Lv20 source card",
            "Source: max_energy_shield=120"
          ]
        },
        "tlidb_level": {
          "title_text": "等级表",
          "lines": [
            "max_energy_shield=12"
          ]
        },
        "bonuses": {
          "title_text": "当前加成",
          "lines": [
            "影响玩家属性：最大能量护盾 +12",
            "同数独数字宝石不能位于同一行、列或宫格"
          ]
        }
      }
    },
    "base_gem_id": "passive_energy_fortress"
  },
  {
    "instance_id": "passive_magical_source",
    "name_text": "魔源",
    "description_text": "激活光环，自身和一定范围内的所有友军获得增益：",
    "category_text": "被动技能宝石",
    "gem_type": {
      "id": "gem_type_8",
      "number": 8,
      "display_text": "8???",
      "identity_text": "????????",
      "color_key": "cyan"
    },
    "gem_kind": "passive_skill",
    "gem_kind_text": "被动技能宝石",
    "sudoku_digit": 8,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem_type_8",
        "text": "8???"
      },
      {
        "id": "aura",
        "text": "光环"
      },
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "passive_skill_gem",
        "text": "被动技能宝石"
      },
      {
        "id": "spell",
        "text": "法术"
      }
    ],
    "base_effect": {
      "title_text": "被动持续效果",
      "modifiers": [
        {
          "stat": {
            "id": "max_mana",
            "text": "最大魔力"
          },
          "value": 5.0,
          "layer_text": "加算修正",
          "target_text": "影响玩家属性"
        },
        {
          "stat": {
            "id": "cast_speed_add_percent",
            "text": "施法速度提高"
          },
          "value": 10.0,
          "layer_text": "加算修正",
          "target_text": "影响主动技能"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动技能",
      "target_kinds": [
        "主动技能宝石"
      ],
      "tags_any": [
        {
          "id": "spell",
          "text": "法术"
        }
      ],
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
    "visual_effect": "passive_magical_source",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Magical_Source",
        "display_level": 20,
        "raw_lines": [
          "激活光环，自身和一定范围内的所有友军获得增益：",
          "5 魔力每秒自然回复。",
          "激活光环，自身和一定范围内的所有友军获得增益：",
          "+140 魔力每秒自然回复"
        ],
        "parsed_values": {
          "max_mana": 50
        },
        "anchors": {
          "max_mana": {
            "20": 50
          }
        }
      },
      "level_values": {
        "max_mana": 5.0
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "passive",
      "icon_text": "魔",
      "icon_color_key": "cyan",
      "icon_sprite": "",
      "name_text": "魔源",
      "subtitle_text": "蓝色、宝石、法术、光环",
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
          "id": "aura",
          "text": "光环"
        }
      ],
      "sections": {
        "description": {
          "title_text": "描述",
          "lines": [
            "激活光环，自身和一定范围内的所有友军获得增益："
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
              "label_text": "影响玩家属性：最大魔力（加算修正）",
              "value_text": "+5"
            },
            {
              "label_text": "影响主动技能：施法速度提高（加算修正）",
              "value_text": "+10"
            }
          ]
        },
        "tlidb_source": {
          "title_text": "TLIDB 源数值",
          "lines": [
            "TLIDB ID: Magical_Source",
            "Lv20 source card",
            "Source: max_mana=50"
          ]
        },
        "tlidb_level": {
          "title_text": "等级表",
          "lines": [
            "max_mana=5"
          ]
        },
        "bonuses": {
          "title_text": "当前加成",
          "lines": [
            "影响玩家属性：最大魔力 +5",
            "影响主动技能：施法速度提高 +10%",
            "同数独数字宝石不能位于同一行、列或宫格"
          ]
        }
      }
    },
    "base_gem_id": "passive_magical_source"
  },
  {
    "instance_id": "support_cooldown_reduction",
    "name_text": "加速冷却",
    "description_text": "辅助任意技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_3",
      "number": 3,
      "display_text": "3号宝石",
      "identity_text": "三号通用辅助身份",
      "color_key": "green"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 3,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_3",
        "text": "3号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_cooldown",
        "text": "冷却辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "cooldown_recovery_add_percent",
            "text": "冷却回复速度提高"
          },
          "value": 13,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "area",
          "text": "范围"
        },
        {
          "id": "attack",
          "text": "攻击"
        },
        {
          "id": "aura",
          "text": "光环"
        },
        {
          "id": "melee",
          "text": "近战"
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
          "id": "spell",
          "text": "法术"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Cooldown_Reduction",
        "display_level": 20,
        "raw_lines": [
          "辅助任意技能。",
          "被辅助技能 +13% 冷却回复速度 (Lv1:13) (Lv21:23) (Lv41:33)",
          "被辅助技能 +13% 冷却回复速度 (Lv1:13) (Lv21:23) (Lv41:33)"
        ],
        "parsed_values": {
          "cooldown_recovery_add_percent": 13
        },
        "anchors": {
          "cooldown_recovery_add_percent": {
            "20": 13
          }
        }
      },
      "level_values": {
        "cooldown_recovery_add_percent": 13
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "加",
      "icon_color_key": "green",
      "icon_sprite": "",
      "name_text": "加速冷却",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "绿色",
            "tone": "color-green"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助任意技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "范围",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "攻击",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "光环",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "近战",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "投射物",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "远程",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "法术",
                "tone": "body"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "冷却回复速度提高 13%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Cooldown_Reduction",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: cooldown_recovery_add_percent=13",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "cooldown_recovery_add_percent=13",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_cooldown_reduction"
  },
  {
    "instance_id": "support_critical_strike_damage_increase",
    "name_text": "提高暴击伤害",
    "description_text": "辅助击中敌人的技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_3",
      "number": 3,
      "display_text": "3号宝石",
      "identity_text": "三号通用辅助身份",
      "color_key": "green"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 3,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_3",
        "text": "3号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_crit",
        "text": "暴击辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "crit_damage_add_percent",
            "text": "暴击伤害提高"
          },
          "value": 26,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "area",
          "text": "范围"
        },
        {
          "id": "attack",
          "text": "攻击"
        },
        {
          "id": "aura",
          "text": "光环"
        },
        {
          "id": "melee",
          "text": "近战"
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
          "id": "spell",
          "text": "法术"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Critical_Strike_Damage_Increase",
        "display_level": 20,
        "raw_lines": [
          "辅助击中敌人的技能。",
          "被辅助技能暴击时，额外 +26% 伤害 (Lv1:26) (Lv21:36) (Lv41:46)",
          "被辅助技能暴击时，额外 +26% 伤害 (Lv1:26) (Lv21:36) (Lv41:46)"
        ],
        "parsed_values": {
          "crit_damage_add_percent": 26
        },
        "anchors": {
          "crit_damage_add_percent": {
            "20": 26
          }
        }
      },
      "level_values": {
        "crit_damage_add_percent": 26
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "提",
      "icon_color_key": "green",
      "icon_sprite": "",
      "name_text": "提高暴击伤害",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "绿色",
            "tone": "color-green"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助击中敌人的技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "范围",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "攻击",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "光环",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "近战",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "投射物",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "远程",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "法术",
                "tone": "body"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "暴击伤害提高 26%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Critical_Strike_Damage_Increase",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: crit_damage_add_percent=26",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "crit_damage_add_percent=26",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_critical_strike_damage_increase"
  },
  {
    "instance_id": "support_critical_strike_rating_increase",
    "name_text": "提高暴击值",
    "description_text": "辅助击中敌人的技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_3",
      "number": 3,
      "display_text": "3号宝石",
      "identity_text": "三号通用辅助身份",
      "color_key": "green"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 3,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_3",
        "text": "3号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_crit",
        "text": "暴击辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "crit_rating",
            "text": "暴击值"
          },
          "value": 135,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "area",
          "text": "范围"
        },
        {
          "id": "attack",
          "text": "攻击"
        },
        {
          "id": "aura",
          "text": "光环"
        },
        {
          "id": "melee",
          "text": "近战"
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
          "id": "spell",
          "text": "法术"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Critical_Strike_Rating_Increase",
        "display_level": 20,
        "raw_lines": [
          "辅助击中敌人的技能。",
          "被辅助技能 +135% 暴击值 (Lv1:135) (Lv21:235) (Lv41:335)",
          "被辅助技能 +135% 暴击值 (Lv1:135) (Lv21:235) (Lv41:335)"
        ],
        "parsed_values": {
          "crit_rating": 135
        },
        "anchors": {
          "crit_rating": {
            "20": 135
          }
        }
      },
      "level_values": {
        "crit_rating": 135
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "提",
      "icon_color_key": "green",
      "icon_sprite": "",
      "name_text": "提高暴击值",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "绿色",
            "tone": "color-green"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助击中敌人的技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "范围",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "攻击",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "光环",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "近战",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "投射物",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "远程",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "法术",
                "tone": "body"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "暴击值 135",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Critical_Strike_Rating_Increase",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: crit_rating=135",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "crit_rating=135",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_critical_strike_rating_increase"
  },
  {
    "instance_id": "support_control_spell",
    "name_text": "法术控制",
    "description_text": "辅助法术技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_3",
      "number": 3,
      "display_text": "3号宝石",
      "identity_text": "三号通用辅助身份",
      "color_key": "green"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 3,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_3",
        "text": "3号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_crit",
        "text": "暴击辅助"
      },
      {
        "id": "support_damage",
        "text": "伤害辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "crit_rating",
            "text": "暴击值"
          },
          "value": 28,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          "value": 28,
          "layer_text": "最终修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "spell",
          "text": "法术"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Control_Spell",
        "display_level": 20,
        "raw_lines": [
          "辅助法术技能。",
          "被辅助技能 -100% 暴击值",
          "被辅助技能额外 +28% 伤害 (Lv1:28) (Lv21:38) (Lv41:48)",
          "被辅助技能 -100% 暴击值",
          "被辅助技能额外 +28% 伤害 (Lv1:28) (Lv21:38) (Lv41:48)"
        ],
        "parsed_values": {
          "crit_rating": -100
        },
        "anchors": {
          "crit_rating": {
            "20": -100
          }
        }
      },
      "level_values": {
        "crit_rating": 28,
        "damage_final_percent": 28
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "法",
      "icon_color_key": "green",
      "icon_sprite": "",
      "name_text": "法术控制",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "绿色",
            "tone": "color-green"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助法术技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "法术",
                "tone": "body"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "暴击值 28",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "最终伤害修正 28%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Control_Spell",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: crit_rating=-100",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "crit_rating=28, damage_final_percent=28",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_control_spell"
  },
  {
    "instance_id": "support_overload",
    "name_text": "过载",
    "description_text": "辅助法术技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_3",
      "number": 3,
      "display_text": "3号宝石",
      "identity_text": "三号通用辅助身份",
      "color_key": "green"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 3,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_3",
        "text": "3号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_damage",
        "text": "伤害辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "energy_blessing_damage_per_stack_percent",
            "text": "未配置文案：stat.energy_blessing_damage_per_stack_percent.name"
          },
          "value": 3.05,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "spell",
          "text": "法术"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Overload",
        "display_level": 20,
        "raw_lines": [
          "辅助法术技能。",
          "每有 1 层聚能祝福，被辅助技能额外 3.05% 伤害，上限 8 层 (Lv1:61/20) (Lv21:81/20) (Lv41:101/20)",
          "每有 1 层聚能祝福，被辅助技能额外 3.05% 伤害，上限 8 层 (Lv1:61/20) (Lv21:81/20) (Lv41:101/20)"
        ],
        "parsed_values": {
          "energy_blessing_damage_per_stack_percent": 3.05,
          "energy_blessing_max_stacks": 8
        },
        "anchors": {
          "energy_blessing_damage_per_stack_percent": 3.05,
          "energy_blessing_max_stacks": 8
        }
      },
      "level_values": {
        "energy_blessing_damage_per_stack_percent": 3.05,
        "energy_blessing_max_stacks": 8
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "过",
      "icon_color_key": "green",
      "icon_sprite": "",
      "name_text": "过载",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "绿色",
            "tone": "color-green"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助法术技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "法术",
                "tone": "body"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "未配置文案：stat.energy_blessing_damage_per_stack_percent.name 3.05%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Overload",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: energy_blessing_damage_per_stack_percent=3.05, energy_blessing_max_stacks=8",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "energy_blessing_damage_per_stack_percent=3.05, energy_blessing_max_stacks=8",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_overload"
  },
  {
    "instance_id": "support_melee_knockback",
    "name_text": "近战击退",
    "description_text": "辅助近战攻击技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_8",
      "number": 8,
      "display_text": "8???",
      "identity_text": "????????",
      "color_key": "cyan"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 8,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_8",
        "text": "8???"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_damage",
        "text": "伤害辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          "value": 15.5,
          "layer_text": "最终修正"
        },
        {
          "stat": {
            "id": "knockback_chance_percent",
            "text": "击退几率"
          },
          "value": 20,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "knockback_distance_add_percent",
            "text": "击退距离提高"
          },
          "value": 40,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "melee",
          "text": "近战"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Melee_Knockback",
        "display_level": 20,
        "raw_lines": [
          "辅助近战攻击技能。",
          "被辅助技能 +20% 几率造成击退 (Lv1:20) (Lv21:40) (Lv41:60)",
          "被辅助技能额外 15.5% 伤害 (Lv1:31/2) (Lv21:51/2) (Lv41:71/2)",
          "被辅助技能 +40% 击退距离 (Lv1:40) (Lv21:60) (Lv41:80)",
          "被辅助技能 +20% 几率造成击退 (Lv1:20) (Lv21:40) (Lv41:60)",
          "被辅助技能额外 15.5% 伤害 (Lv1:31/2) (Lv21:51/2) (Lv41:71/2)",
          "被辅助技能 +40% 击退距离 (Lv1:40) (Lv21:60) (Lv41:80)"
        ],
        "parsed_values": {
          "knockback_chance_percent": 20,
          "damage_final_percent": 15.5,
          "knockback_distance_add_percent": 40
        },
        "anchors": {
          "knockback_chance_percent": 20,
          "damage_final_percent": {
            "20": 15.5
          },
          "knockback_distance_add_percent": 40
        }
      },
      "level_values": {
        "knockback_chance_percent": 20,
        "damage_final_percent": 15.5,
        "knockback_distance_add_percent": 40
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "近",
      "icon_color_key": "cyan",
      "icon_sprite": "",
      "name_text": "近战击退",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "??",
            "tone": "color-cyan"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助近战攻击技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "近战",
                "tone": "body"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "最终伤害修正 15.5%",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "未配置文案：stat.knockback_chance_percent.name 20%",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "未配置文案：stat.knockback_distance_add_percent.name 40%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Melee_Knockback",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: damage_final_percent=15.5, knockback_chance_percent=20, knockback_distance_add_percent=40",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "damage_final_percent=15.5, knockback_chance_percent=20, knockback_distance_add_percent=40",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_melee_knockback"
  },
  {
    "instance_id": "support_multistrike",
    "name_text": "连续攻击",
    "description_text": "辅助攻击技能。无法辅助位移和引导技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_3",
      "number": 3,
      "display_text": "3号宝石",
      "identity_text": "三号通用辅助身份",
      "color_key": "green"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 3,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_3",
        "text": "3号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_damage",
        "text": "伤害辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      },
      {
        "id": "support_speed",
        "text": "速度辅助"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "continuous_attack_chance_percent",
            "text": "连续攻击几率"
          },
          "value": 101,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "continuous_attack_damage_step_percent",
            "text": "连续攻击伤害递增"
          },
          "value": 101,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "attack",
          "text": "攻击"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Multistrike",
        "display_level": 20,
        "raw_lines": [
          "辅助攻击技能。无法辅助位移和引导技能。",
          "被辅助技能 +101% 几率触发连续攻击 (Lv1:101) (Lv21:121) (Lv41:141)",
          "被辅助技能连续攻击时，伤害递增 27%",
          "被辅助技能 +101% 几率触发连续攻击 (Lv1:101) (Lv21:121) (Lv41:141)",
          "被辅助技能连续攻击时，伤害递增 27%"
        ],
        "parsed_values": {
          "continuous_attack_chance_percent": 101,
          "continuous_attack_damage_step_percent": 27
        },
        "anchors": {
          "continuous_attack_chance_percent": {
            "20": 101
          },
          "continuous_attack_damage_step_percent": {
            "20": 27
          }
        }
      },
      "level_values": {
        "continuous_attack_chance_percent": 101,
        "continuous_attack_damage_step_percent": 101
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "连",
      "icon_color_key": "green",
      "icon_sprite": "",
      "name_text": "连续攻击",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "绿色",
            "tone": "color-green"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助攻击技能。无法辅助位移和引导技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "攻击",
                "tone": "body"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "连续攻击几率 101%",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "连续攻击伤害递增 101%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Multistrike",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: continuous_attack_chance_percent=101, continuous_attack_damage_step_percent=27",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "continuous_attack_chance_percent=101, continuous_attack_damage_step_percent=101",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_multistrike"
  },
  {
    "instance_id": "support_quick_decision",
    "name_text": "速决",
    "description_text": "辅助攻击或法术技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_3",
      "number": 3,
      "display_text": "3号宝石",
      "identity_text": "三号通用辅助身份",
      "color_key": "green"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 3,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_3",
        "text": "3号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      },
      {
        "id": "support_speed",
        "text": "速度辅助"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "attack_speed_add_percent",
            "text": "攻击速度提高"
          },
          "value": 15,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "cast_speed_add_percent",
            "text": "施法速度提高"
          },
          "value": 15,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "attack",
          "text": "攻击"
        },
        {
          "id": "spell",
          "text": "法术"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Quick_Decision",
        "display_level": 20,
        "raw_lines": [
          "辅助攻击或法术技能。",
          "无法辅助位移技能。",
          "被辅助技能额外 +15% 攻击和施法速度 (Lv1:15) (Lv21:25) (Lv41:35)",
          "被辅助技能额外 +15% 攻击和施法速度 (Lv1:15) (Lv21:25) (Lv41:35)"
        ],
        "parsed_values": {
          "attack_speed_add_percent": 15
        },
        "anchors": {
          "attack_speed_add_percent": {
            "20": 15
          }
        }
      },
      "level_values": {
        "attack_speed_add_percent": 15,
        "cast_speed_add_percent": 15
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "速",
      "icon_color_key": "green",
      "icon_sprite": "",
      "name_text": "速决",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "绿色",
            "tone": "color-green"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助攻击或法术技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "攻击",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "法术",
                "tone": "body"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "攻击速度提高 15%",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "施法速度提高 15%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Quick_Decision",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: attack_speed_add_percent=15",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "attack_speed_add_percent=15, cast_speed_add_percent=15",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_quick_decision"
  },
  {
    "instance_id": "support_channel_preparation",
    "name_text": "预备引导",
    "description_text": "辅助引导技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_8",
      "number": 8,
      "display_text": "8???",
      "identity_text": "????????",
      "color_key": "cyan"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 8,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_8",
        "text": "8???"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_channel",
        "text": "未配置文案：tag.support_channel.name"
      },
      {
        "id": "support_damage",
        "text": "伤害辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          "value": 4,
          "layer_text": "最终修正"
        },
        {
          "stat": {
            "id": "channel_min_stacks_add",
            "text": "引导层数下限"
          },
          "value": 1,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "channel",
          "text": "引导"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Channel_Preparation",
        "display_level": 20,
        "raw_lines": [
          "辅助引导技能。",
          "被辅助技能额外 +4% 伤害 (Lv1:4) (Lv21:12) (Lv41:20)",
          "被辅助技能 +1 引导层数下限 (Lv1:1) (Lv9:1) (Lv10:2) (Lv29:2) (Lv30:3)",
          "被辅助技能额外 +4% 伤害 (Lv1:4) (Lv21:12) (Lv41:20)",
          "被辅助技能 +1 引导层数下限 (Lv1:1) (Lv9:1) (Lv10:2) (Lv29:2) (Lv30:3)"
        ],
        "parsed_values": {
          "damage_final_percent": 4,
          "channel_min_stacks_add": 2
        },
        "anchors": {
          "damage_final_percent": {
            "20": 4
          },
          "channel_min_stacks_add": {
            "20": 2
          }
        }
      },
      "level_values": {
        "damage_final_percent": 4,
        "channel_min_stacks_add": 1
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "预",
      "icon_color_key": "cyan",
      "icon_sprite": "",
      "name_text": "预备引导",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "??",
            "tone": "color-cyan"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助引导技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "引导",
                "tone": "body"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "最终伤害修正 4%",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "引导层数下限 1",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Channel_Preparation",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: channel_min_stacks_add=2, damage_final_percent=4",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "channel_min_stacks_add=1, damage_final_percent=4",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_channel_preparation"
  },
  {
    "instance_id": "support_elemental_fusion",
    "name_text": "元素融合",
    "description_text": "辅助能造成伤害的技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_4",
      "number": 4,
      "display_text": "4号宝石",
      "identity_text": "四号风险收益身份",
      "color_key": "pink"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 4,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_4",
        "text": "4号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_damage",
        "text": "伤害辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "elemental_damage_add_percent",
            "text": "元素伤害提高"
          },
          "value": 25.5,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "prevent_elemental_ailments",
            "text": "无法造成点燃/冰结/麻痹"
          },
          "value": 1.0,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动技能",
      "target_kinds": [
        "主动技能宝石"
      ],
      "tags_any": [
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
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Elemental_Fusion",
        "display_level": 20,
        "raw_lines": [
          "辅助能造成伤害的技能。",
          "被辅助技能无法造成点燃、冰结和麻痹",
          "被辅助技能额外 25.5% 元素伤害 (Lv1:51/2) (Lv21:71/2) (Lv41:91/2)",
          "被辅助技能无法造成点燃、冰结和麻痹",
          "被辅助技能额外 25.5% 元素伤害 (Lv1:51/2) (Lv21:71/2) (Lv41:91/2)"
        ],
        "parsed_values": {
          "elemental_damage_add_percent": 25.5,
          "prevent_elemental_ailments": true
        },
        "anchors": {
          "elemental_damage_add_percent": {
            "20": 25.5
          },
          "prevent_elemental_ailments": {
            "20": true
          }
        }
      },
      "level_values": {
        "elemental_damage_add_percent": 25.5,
        "prevent_elemental_ailments": true
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "元",
      "icon_color_key": "pink",
      "icon_sprite": "",
      "name_text": "元素融合",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "粉色",
            "tone": "color-pink"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助能造成伤害的技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "冰霜",
                "tone": "damage-cold"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "火焰",
                "tone": "damage-fire"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "闪电",
                "tone": "damage-lightning"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "元素伤害提高 25.5%",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "无法造成点燃/冰结/麻痹 1",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Elemental_Fusion",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: elemental_damage_add_percent=25.5, prevent_elemental_ailments=True",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "elemental_damage_add_percent=25.5, prevent_elemental_ailments=True",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_elemental_fusion"
  },
  {
    "instance_id": "support_glacial_freeze",
    "name_text": "凛冽冰冻",
    "description_text": "辅助能造成伤害的技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_4",
      "number": 4,
      "display_text": "4号宝石",
      "identity_text": "四号风险收益身份",
      "color_key": "pink"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 4,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_4",
        "text": "4号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_damage",
        "text": "伤害辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      },
      {
        "id": "support_status",
        "text": "状态辅助"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "cold_damage_add_percent",
            "text": "冰霜伤害提高"
          },
          "value": 10.3,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "cold",
          "text": "冰霜"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Glacial_Freeze",
        "display_level": 20,
        "raw_lines": [
          "辅助能造成伤害的技能。",
          "被辅助技能额外 10.3% 冰冷伤害 (Lv1:103/10) (Lv21:163/10) (Lv41:183/10)",
          "被辅助技能造成击中冰冷伤害时，施加冰结",
          "被辅助技能额外 10.3% 冰冷伤害 (Lv1:103/10) (Lv21:163/10) (Lv41:183/10)",
          "被辅助技能造成击中冰冷伤害时，施加冰结"
        ],
        "parsed_values": {
          "cold_damage_add_percent": 10.3
        },
        "anchors": {
          "cold_damage_add_percent": {
            "20": 10.3
          }
        }
      },
      "level_values": {
        "cold_damage_add_percent": 10.3
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "凛",
      "icon_color_key": "pink",
      "icon_sprite": "",
      "name_text": "凛冽冰冻",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "粉色",
            "tone": "color-pink"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助能造成伤害的技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "冰霜",
                "tone": "damage-cold"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "冰霜伤害提高 10.3%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Glacial_Freeze",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: cold_damage_add_percent=10.3",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "cold_damage_add_percent=10.3",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_glacial_freeze"
  },
  {
    "instance_id": "support_improved_corrosion",
    "name_text": "强烈侵蚀",
    "description_text": "辅助击中敌人的技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_4",
      "number": 4,
      "display_text": "4号宝石",
      "identity_text": "四号风险收益身份",
      "color_key": "pink"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 4,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_4",
        "text": "4号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_damage",
        "text": "伤害辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      },
      {
        "id": "support_status",
        "text": "状态辅助"
      }
    ],
    "base_effect": {
      "title_text": "??????",
      "modifiers": [
        {
          "stat": {
            "id": "deterioration_extra_stack_chance_percent",
            "text": "额外凋零层数几率"
          },
          "value": 23,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "deterioration_chance_add_percent",
            "text": "凋零几率提高"
          },
          "value": 15,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "chaos",
          "text": "混沌"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Improved_Corrosion",
        "display_level": 20,
        "raw_lines": [
          "辅助击中敌人的技能。",
          "被辅助技能 +23% 几率额外造成 1 层凋零 (Lv1:23) (Lv21:33) (Lv41:39)",
          "被辅助技能 +15% 凋零几率",
          "被辅助技能 +23% 几率额外造成 1 层凋零 (Lv1:23) (Lv21:33) (Lv41:39)",
          "被辅助技能 +15% 凋零几率"
        ],
        "parsed_values": "{}",
        "anchors": "{}"
      },
      "level_values": {
        "deterioration_extra_stack_chance_percent": 23,
        "deterioration_chance_add_percent": 15
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "强",
      "icon_color_key": "pink",
      "icon_sprite": "",
      "name_text": "强烈侵蚀",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "粉色",
            "tone": "color-pink"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助击中敌人的技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "混沌",
                "tone": "damage-chaos"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "额外凋零层数几率 23%",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "凋零几率提高 15%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Improved_Corrosion",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "deterioration_extra_stack_chance_percent=23, deterioration_chance_add_percent=15",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_improved_corrosion"
  },
  {
    "instance_id": "support_tendonslicer",
    "name_text": "断筋锋刃",
    "description_text": "辅助能造成伤害的技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_4",
      "number": 4,
      "display_text": "4号宝石",
      "identity_text": "四号风险收益身份",
      "color_key": "pink"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 4,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_4",
        "text": "4号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_damage",
        "text": "伤害辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      },
      {
        "id": "support_status",
        "text": "状态辅助"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "physical_damage_add_percent",
            "text": "物理伤害提高"
          },
          "value": 7.5,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "physical",
          "text": "物理"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Tendonslicer",
        "display_level": 20,
        "raw_lines": [
          "辅助能造成伤害的技能。",
          "被辅助技能额外 7.5% 物理伤害 (Lv1:15/2) (Lv21:35/2) (Lv41:55/2)",
          "被辅助技能造成伤害时，有 40% 几率施加减益，使敌人 +10% 受到的被辅助技能的伤害，持续 2 秒",
          "被辅助技能额外 7.5% 物理伤害 (Lv1:15/2) (Lv21:35/2) (Lv41:55/2)",
          "被辅助技能造成伤害时，有 40% 几率施加减益，使敌人 +10% 受到的被辅助技能的伤害，持续 2 秒"
        ],
        "parsed_values": {
          "physical_damage_add_percent": 7.5
        },
        "anchors": {
          "physical_damage_add_percent": {
            "20": 7.5
          }
        }
      },
      "level_values": {
        "physical_damage_add_percent": 7.5
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "断",
      "icon_color_key": "pink",
      "icon_sprite": "",
      "name_text": "断筋锋刃",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "粉色",
            "tone": "color-pink"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助能造成伤害的技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "物理",
                "tone": "damage-physical"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "物理伤害提高 7.5%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Tendonslicer",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: physical_damage_add_percent=7.5",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "physical_damage_add_percent=7.5",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_tendonslicer"
  },
  {
    "instance_id": "support_physical_to_fire",
    "name_text": "物理转火焰",
    "description_text": "辅助击中敌人的技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_4",
      "number": 4,
      "display_text": "4号宝石",
      "identity_text": "四号风险收益身份",
      "color_key": "pink"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 4,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_4",
        "text": "4号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_damage",
        "text": "伤害辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "conversion_physical_to_fire_percent",
            "text": "物理转火焰"
          },
          "value": 100,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "added_fire_damage_from_physical_percent",
            "text": "未配置文案：stat.added_fire_damage_from_physical_percent.name"
          },
          "value": 15.5,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "fire",
          "text": "火焰"
        },
        {
          "id": "physical",
          "text": "物理"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Physical_to_Fire",
        "display_level": 20,
        "raw_lines": [
          "辅助击中敌人的技能。",
          "被辅助技能 100% 物理伤害转化为火焰伤害",
          "被辅助技能附加 15.5% 物理伤害的火焰伤害 (Lv1:31/2) (Lv21:51/2) (Lv41:71/2)",
          "被辅助技能 100% 物理伤害转化为火焰伤害",
          "被辅助技能附加 15.5% 物理伤害的火焰伤害 (Lv1:31/2) (Lv21:51/2) (Lv41:71/2)"
        ],
        "parsed_values": {
          "conversion_physical_to_fire_percent": 100,
          "added_fire_damage_from_physical_percent": 15.5
        },
        "anchors": {
          "conversion_physical_to_fire_percent": {
            "20": 100
          },
          "added_fire_damage_from_physical_percent": {
            "20": 15.5
          }
        }
      },
      "level_values": {
        "conversion_physical_to_fire_percent": 100,
        "added_fire_damage_from_physical_percent": 15.5
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "物",
      "icon_color_key": "pink",
      "icon_sprite": "",
      "name_text": "物理转火焰",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "粉色",
            "tone": "color-pink"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助击中敌人的技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "火焰",
                "tone": "damage-fire"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "物理",
                "tone": "damage-physical"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "物理转火焰 100%",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "未配置文案：stat.added_fire_damage_from_physical_percent.name 15.5%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Physical_to_Fire",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: added_fire_damage_from_physical_percent=15.5, conversion_physical_to_fire_percent=100",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "added_fire_damage_from_physical_percent=15.5, conversion_physical_to_fire_percent=100",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_physical_to_fire"
  },
  {
    "instance_id": "support_lightning_to_cold",
    "name_text": "闪电转冰霜",
    "description_text": "辅助击中敌人的技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_4",
      "number": 4,
      "display_text": "4号宝石",
      "identity_text": "四号风险收益身份",
      "color_key": "pink"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 4,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_4",
        "text": "4号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_damage",
        "text": "伤害辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "conversion_lightning_to_cold_percent",
            "text": "闪电转冰霜"
          },
          "value": 50,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "lightning_damage_add_percent",
            "text": "闪电伤害提高"
          },
          "value": 5.5,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "cold",
          "text": "冰霜"
        },
        {
          "id": "lightning",
          "text": "闪电"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Lightning_to_Cold",
        "display_level": 20,
        "raw_lines": [
          "辅助击中敌人的技能。",
          "被辅助技能 50% 闪电伤害转化为冰冷伤害",
          "被辅助技能额外 5.5% 闪电伤害 (Lv1:11/2) (Lv21:31/2) (Lv41:51/2)",
          "被辅助技能 50% 闪电伤害转化为冰冷伤害",
          "被辅助技能额外 5.5% 闪电伤害 (Lv1:11/2) (Lv21:31/2) (Lv41:51/2)"
        ],
        "parsed_values": {
          "conversion_lightning_to_cold_percent": 50,
          "lightning_damage_add_percent": 5.5
        },
        "anchors": {
          "conversion_lightning_to_cold_percent": {
            "20": 50
          },
          "lightning_damage_add_percent": {
            "20": 5.5
          }
        }
      },
      "level_values": {
        "conversion_lightning_to_cold_percent": 50,
        "lightning_damage_add_percent": 5.5
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "闪",
      "icon_color_key": "pink",
      "icon_sprite": "",
      "name_text": "闪电转冰霜",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "粉色",
            "tone": "color-pink"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助击中敌人的技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "冰霜",
                "tone": "damage-cold"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "闪电",
                "tone": "damage-lightning"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "闪电转冰霜 50%",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "闪电伤害提高 5.5%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Lightning_to_Cold",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: conversion_lightning_to_cold_percent=50, lightning_damage_add_percent=5.5",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "conversion_lightning_to_cold_percent=50, lightning_damage_add_percent=5.5",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_lightning_to_cold"
  },
  {
    "instance_id": "support_added_cold_damage",
    "name_text": "附加冰霜伤害",
    "description_text": "辅助击中敌人的技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_4",
      "number": 4,
      "display_text": "4号宝石",
      "identity_text": "四号风险收益身份",
      "color_key": "pink"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 4,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_4",
        "text": "4号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_damage",
        "text": "伤害辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "added_cold_damage",
            "text": "未配置文案：stat.added_cold_damage.name"
          },
          "value": 2.5,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动技能",
      "target_kinds": [
        "主动技能宝石"
      ],
      "tags_any": [
        {
          "id": "attack",
          "text": "攻击"
        },
        {
          "id": "spell",
          "text": "法术"
        }
      ],
      "tags_all": [],
      "tags_none": [
        {
          "id": "dot",
          "text": "持续伤害"
        },
        {
          "id": "guard",
          "text": "守护"
        }
      ]
    },
    "current_effective_targets": [
      {
        "instance_id": "",
        "name_text": "当前盘面暂无实际生效对象",
        "status_text": "当前盘面暂无实际生效对象"
      }
    ],
    "board_relations": [],
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Added_Cold_Damage",
        "display_level": 20,
        "raw_lines": [
          "辅助击中敌人的技能。",
          "被辅助技能附加 2 - 3 点冰冷伤害 (Lv1:2) (Lv2:2) (Lv3:3) (Lv4:4) (Lv5:5) (Lv6:6) (Lv7:6) (Lv8:7) (Lv9:9) (Lv10:10) (Lv11:12) (Lv12:14) (Lv13:16) (Lv14:20) (Lv15:28) (Lv16:40) (Lv17:48) (Lv18:56) (Lv19:68) (Lv20:83) (Lv21:84) (Lv22:85) (Lv23:86) (Lv24:87) (Lv25:88) (Lv26:88) (Lv27:89) (Lv28:90) (Lv29:91) (Lv30:92) (Lv31:93) (Lv32:94) (Lv33:95) (Lv34:96) (Lv35:97) (Lv36:98) (Lv37:99) (Lv38:100) (Lv39:101) (Lv40:102) (Lv1:3) (Lv2:4) (Lv3:5) (Lv4:6) (Lv5:7) (Lv6:8) (Lv7:10) (Lv8:11) (Lv9:13) (Lv10:16) (Lv11:18) (Lv12:20) (Lv13:24) (Lv14:30) (Lv15:42) (Lv16:60) (Lv17:72) (Lv18:84) (Lv19:102) (Lv20:125) (Lv21:126) (Lv22:128) (Lv23:129) (Lv24:130) (Lv25:131) (Lv26:133) (Lv27:134) (Lv28:135) (Lv29:137) (Lv30:138) (Lv31:139) (Lv32:141) (Lv33:142) (Lv34:144) (Lv35:145) (Lv36:147) (Lv37:148) (Lv38:150) (Lv39:151) (Lv40:153)",
          "被辅助技能附加 2 - 3 点冰冷伤害 (Lv1:2) (Lv2:2) (Lv3:3) (Lv4:4) (Lv5:5) (Lv6:6) (Lv7:6) (Lv8:7) (Lv9:9) (Lv10:10) (Lv11:12) (Lv12:14) (Lv13:16) (Lv14:20) (Lv15:28) (Lv16:40) (Lv17:48) (Lv18:56) (Lv19:68) (Lv20:83) (Lv21:84) (Lv22:85) (Lv23:86) (Lv24:87) (Lv25:88) (Lv26:88) (Lv27:89) (Lv28:90) (Lv29:91) (Lv30:92) (Lv31:93) (Lv32:94) (Lv33:95) (Lv34:96) (Lv35:97) (Lv36:98) (Lv37:99) (Lv38:100) (Lv39:101) (Lv40:102) (Lv1:3) (Lv2:4) (Lv3:5) (Lv4:6) (Lv5:7) (Lv6:8) (Lv7:10) (Lv8:11) (Lv9:13) (Lv10:16) (Lv11:18) (Lv12:20) (Lv13:24) (Lv14:30) (Lv15:42) (Lv16:60) (Lv17:72) (Lv18:84) (Lv19:102) (Lv20:125) (Lv21:126) (Lv22:128) (Lv23:129) (Lv24:130) (Lv25:131) (Lv26:133) (Lv27:134) (Lv28:135) (Lv29:137) (Lv30:138) (Lv31:139) (Lv32:141) (Lv33:142) (Lv34:144) (Lv35:145) (Lv36:147) (Lv37:148) (Lv38:150) (Lv39:151) (Lv40:153)"
        ],
        "parsed_values": {
          "added_cold_damage_min": 83,
          "added_cold_damage_max": 125,
          "added_cold_damage": 104
        },
        "anchors": {
          "added_cold_damage_min": 83,
          "added_cold_damage_max": 125,
          "added_cold_damage": 104
        }
      },
      "level_values": {
        "added_cold_damage_min": 2,
        "added_cold_damage_max": 3,
        "added_cold_damage": 2.5
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "附",
      "icon_color_key": "pink",
      "icon_sprite": "",
      "name_text": "附加冰霜伤害",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "粉色",
            "tone": "color-pink"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助击中敌人的技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "攻击",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "法术",
                "tone": "body"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "未配置文案：stat.added_cold_damage.name 2.5",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Added_Cold_Damage",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: added_cold_damage=104, added_cold_damage_max=125, added_cold_damage_min=83",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "added_cold_damage=2.5, added_cold_damage_max=3, added_cold_damage_min=2",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_added_cold_damage"
  },
  {
    "instance_id": "support_added_erosion_damage",
    "name_text": "附加混沌伤害",
    "description_text": "辅助击中敌人的技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_4",
      "number": 4,
      "display_text": "4号宝石",
      "identity_text": "四号风险收益身份",
      "color_key": "pink"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 4,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_4",
        "text": "4号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_damage",
        "text": "伤害辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "added_chaos_damage",
            "text": "未配置文案：stat.added_chaos_damage.name"
          },
          "value": 2,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动技能",
      "target_kinds": [
        "主动技能宝石"
      ],
      "tags_any": [
        {
          "id": "attack",
          "text": "攻击"
        },
        {
          "id": "spell",
          "text": "法术"
        }
      ],
      "tags_all": [],
      "tags_none": [
        {
          "id": "dot",
          "text": "持续伤害"
        },
        {
          "id": "guard",
          "text": "守护"
        }
      ]
    },
    "current_effective_targets": [
      {
        "instance_id": "",
        "name_text": "当前盘面暂无实际生效对象",
        "status_text": "当前盘面暂无实际生效对象"
      }
    ],
    "board_relations": [],
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Added_Erosion_Damage",
        "display_level": 20,
        "raw_lines": [
          "辅助击中敌人的技能。",
          "被辅助技能附加 2 - 2 点腐蚀伤害 (Lv1:2) (Lv2:3) (Lv3:4) (Lv4:5) (Lv5:6) (Lv6:7) (Lv7:8) (Lv8:9) (Lv9:11) (Lv10:13) (Lv11:15) (Lv12:17) (Lv13:20) (Lv14:25) (Lv15:35) (Lv16:50) (Lv17:60) (Lv18:70) (Lv19:85) (Lv20:104) (Lv21:105) (Lv22:106) (Lv23:107) (Lv24:108) (Lv25:109) (Lv26:111) (Lv27:112) (Lv28:113) (Lv29:114) (Lv30:115) (Lv31:116) (Lv32:117) (Lv33:119) (Lv34:120) (Lv35:121) (Lv36:122) (Lv37:123) (Lv38:125) (Lv39:126) (Lv40:127) (Lv1:2) (Lv2:3) (Lv3:4) (Lv4:5) (Lv5:6) (Lv6:7) (Lv7:8) (Lv8:9) (Lv9:11) (Lv10:13) (Lv11:15) (Lv12:17) (Lv13:20) (Lv14:25) (Lv15:35) (Lv16:50) (Lv17:60) (Lv18:70) (Lv19:85) (Lv20:104) (Lv21:105) (Lv22:106) (Lv23:107) (Lv24:108) (Lv25:109) (Lv26:111) (Lv27:112) (Lv28:113) (Lv29:114) (Lv30:115) (Lv31:116) (Lv32:117) (Lv33:119) (Lv34:120) (Lv35:121) (Lv36:122) (Lv37:123) (Lv38:125) (Lv39:126) (Lv40:127)",
          "被辅助技能附加 2 - 2 点腐蚀伤害 (Lv1:2) (Lv2:3) (Lv3:4) (Lv4:5) (Lv5:6) (Lv6:7) (Lv7:8) (Lv8:9) (Lv9:11) (Lv10:13) (Lv11:15) (Lv12:17) (Lv13:20) (Lv14:25) (Lv15:35) (Lv16:50) (Lv17:60) (Lv18:70) (Lv19:85) (Lv20:104) (Lv21:105) (Lv22:106) (Lv23:107) (Lv24:108) (Lv25:109) (Lv26:111) (Lv27:112) (Lv28:113) (Lv29:114) (Lv30:115) (Lv31:116) (Lv32:117) (Lv33:119) (Lv34:120) (Lv35:121) (Lv36:122) (Lv37:123) (Lv38:125) (Lv39:126) (Lv40:127) (Lv1:2) (Lv2:3) (Lv3:4) (Lv4:5) (Lv5:6) (Lv6:7) (Lv7:8) (Lv8:9) (Lv9:11) (Lv10:13) (Lv11:15) (Lv12:17) (Lv13:20) (Lv14:25) (Lv15:35) (Lv16:50) (Lv17:60) (Lv18:70) (Lv19:85) (Lv20:104) (Lv21:105) (Lv22:106) (Lv23:107) (Lv24:108) (Lv25:109) (Lv26:111) (Lv27:112) (Lv28:113) (Lv29:114) (Lv30:115) (Lv31:116) (Lv32:117) (Lv33:119) (Lv34:120) (Lv35:121) (Lv36:122) (Lv37:123) (Lv38:125) (Lv39:126) (Lv40:127)"
        ],
        "parsed_values": {
          "added_chaos_damage_min": 104,
          "added_chaos_damage_max": 104,
          "added_chaos_damage": 104
        },
        "anchors": {
          "added_chaos_damage_min": 104,
          "added_chaos_damage_max": 104,
          "added_chaos_damage": 104
        }
      },
      "level_values": {
        "added_chaos_damage": 2
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "附",
      "icon_color_key": "pink",
      "icon_sprite": "",
      "name_text": "附加混沌伤害",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "粉色",
            "tone": "color-pink"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助击中敌人的技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "攻击",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "法术",
                "tone": "body"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "未配置文案：stat.added_chaos_damage.name 2",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Added_Erosion_Damage",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: added_chaos_damage=104, added_chaos_damage_max=104, added_chaos_damage_min=104",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "added_chaos_damage=2",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_added_erosion_damage"
  },
  {
    "instance_id": "support_added_fire_damage",
    "name_text": "附加火焰伤害",
    "description_text": "辅助击中敌人的技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_4",
      "number": 4,
      "display_text": "4号宝石",
      "identity_text": "四号风险收益身份",
      "color_key": "pink"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 4,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_4",
        "text": "4号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_damage",
        "text": "伤害辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "added_fire_damage",
            "text": "未配置文案：stat.added_fire_damage.name"
          },
          "value": 2,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动技能",
      "target_kinds": [
        "主动技能宝石"
      ],
      "tags_any": [
        {
          "id": "attack",
          "text": "攻击"
        },
        {
          "id": "spell",
          "text": "法术"
        }
      ],
      "tags_all": [],
      "tags_none": [
        {
          "id": "dot",
          "text": "持续伤害"
        },
        {
          "id": "guard",
          "text": "守护"
        }
      ]
    },
    "current_effective_targets": [
      {
        "instance_id": "",
        "name_text": "当前盘面暂无实际生效对象",
        "status_text": "当前盘面暂无实际生效对象"
      }
    ],
    "board_relations": [],
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Added_Fire_Damage",
        "display_level": 20,
        "raw_lines": [
          "辅助击中敌人的技能。",
          "被辅助技能附加 1 - 3 点火焰伤害 (Lv1:1) (Lv2:2) (Lv3:3) (Lv4:4) (Lv5:4) (Lv6:5) (Lv7:6) (Lv8:6) (Lv9:8) (Lv10:9) (Lv11:11) (Lv12:12) (Lv13:14) (Lv14:18) (Lv15:25) (Lv16:35) (Lv17:42) (Lv18:49) (Lv19:60) (Lv20:73) (Lv21:74) (Lv22:74) (Lv23:75) (Lv24:76) (Lv25:77) (Lv26:77) (Lv27:78) (Lv28:79) (Lv29:80) (Lv30:81) (Lv31:81) (Lv32:82) (Lv33:83) (Lv34:84) (Lv35:85) (Lv36:86) (Lv37:86) (Lv38:87) (Lv39:88) (Lv40:89) (Lv1:3) (Lv2:4) (Lv3:5) (Lv4:7) (Lv5:8) (Lv6:9) (Lv7:10) (Lv8:12) (Lv9:14) (Lv10:17) (Lv11:20) (Lv12:22) (Lv13:26) (Lv14:33) (Lv15:46) (Lv16:65) (Lv17:78) (Lv18:91) (Lv19:111) (Lv20:135) (Lv21:137) (Lv22:138) (Lv23:140) (Lv24:141) (Lv25:142) (Lv26:144) (Lv27:145) (Lv28:147) (Lv29:148) (Lv30:150) (Lv31:151) (Lv32:153) (Lv33:154) (Lv34:156) (Lv35:157) (Lv36:159) (Lv37:160) (Lv38:162) (Lv39:164) (Lv40:165)",
          "被辅助技能附加 1 - 3 点火焰伤害 (Lv1:1) (Lv2:2) (Lv3:3) (Lv4:4) (Lv5:4) (Lv6:5) (Lv7:6) (Lv8:6) (Lv9:8) (Lv10:9) (Lv11:11) (Lv12:12) (Lv13:14) (Lv14:18) (Lv15:25) (Lv16:35) (Lv17:42) (Lv18:49) (Lv19:60) (Lv20:73) (Lv21:74) (Lv22:74) (Lv23:75) (Lv24:76) (Lv25:77) (Lv26:77) (Lv27:78) (Lv28:79) (Lv29:80) (Lv30:81) (Lv31:81) (Lv32:82) (Lv33:83) (Lv34:84) (Lv35:85) (Lv36:86) (Lv37:86) (Lv38:87) (Lv39:88) (Lv40:89) (Lv1:3) (Lv2:4) (Lv3:5) (Lv4:7) (Lv5:8) (Lv6:9) (Lv7:10) (Lv8:12) (Lv9:14) (Lv10:17) (Lv11:20) (Lv12:22) (Lv13:26) (Lv14:33) (Lv15:46) (Lv16:65) (Lv17:78) (Lv18:91) (Lv19:111) (Lv20:135) (Lv21:137) (Lv22:138) (Lv23:140) (Lv24:141) (Lv25:142) (Lv26:144) (Lv27:145) (Lv28:147) (Lv29:148) (Lv30:150) (Lv31:151) (Lv32:153) (Lv33:154) (Lv34:156) (Lv35:157) (Lv36:159) (Lv37:160) (Lv38:162) (Lv39:164) (Lv40:165)"
        ],
        "parsed_values": {
          "added_fire_damage_min": 73,
          "added_fire_damage_max": 135,
          "added_fire_damage": 104
        },
        "anchors": {
          "added_fire_damage_min": 73,
          "added_fire_damage_max": 135,
          "added_fire_damage": 104
        }
      },
      "level_values": {
        "added_fire_damage_min": 1,
        "added_fire_damage_max": 3,
        "added_fire_damage": 2
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "附",
      "icon_color_key": "pink",
      "icon_sprite": "",
      "name_text": "附加火焰伤害",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "粉色",
            "tone": "color-pink"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助击中敌人的技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "攻击",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "法术",
                "tone": "body"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "未配置文案：stat.added_fire_damage.name 2",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Added_Fire_Damage",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: added_fire_damage=104, added_fire_damage_max=135, added_fire_damage_min=73",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "added_fire_damage=2, added_fire_damage_max=3, added_fire_damage_min=1",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_added_fire_damage"
  },
  {
    "instance_id": "support_added_lightning_damage",
    "name_text": "附加闪电伤害",
    "description_text": "辅助击中敌人的技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_4",
      "number": 4,
      "display_text": "4号宝石",
      "identity_text": "四号风险收益身份",
      "color_key": "pink"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 4,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_4",
        "text": "4号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_damage",
        "text": "伤害辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "added_lightning_damage",
            "text": "未配置文案：stat.added_lightning_damage.name"
          },
          "value": 2.5,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动技能",
      "target_kinds": [
        "主动技能宝石"
      ],
      "tags_any": [
        {
          "id": "attack",
          "text": "攻击"
        },
        {
          "id": "spell",
          "text": "法术"
        }
      ],
      "tags_all": [],
      "tags_none": [
        {
          "id": "dot",
          "text": "持续伤害"
        },
        {
          "id": "guard",
          "text": "守护"
        }
      ]
    },
    "current_effective_targets": [
      {
        "instance_id": "",
        "name_text": "当前盘面暂无实际生效对象",
        "status_text": "当前盘面暂无实际生效对象"
      }
    ],
    "board_relations": [],
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Added_Lightning_Damage",
        "display_level": 20,
        "raw_lines": [
          "辅助击中敌人的技能。",
          "被辅助技能附加 1 - 4 点闪电伤害 (Lv1:1) (Lv2:1) (Lv3:1) (Lv4:1) (Lv5:1) (Lv6:1) (Lv7:1) (Lv8:1) (Lv9:1) (Lv10:1) (Lv11:2) (Lv12:2) (Lv13:2) (Lv14:3) (Lv15:4) (Lv16:5) (Lv17:6) (Lv18:7) (Lv19:9) (Lv20:10) (Lv21:11) (Lv22:11) (Lv23:11) (Lv24:11) (Lv25:11) (Lv26:11) (Lv27:11) (Lv28:11) (Lv29:11) (Lv30:12) (Lv31:12) (Lv32:12) (Lv33:12) (Lv34:12) (Lv35:12) (Lv36:12) (Lv37:12) (Lv38:12) (Lv39:13) (Lv40:13) (Lv1:4) (Lv2:6) (Lv3:8) (Lv4:10) (Lv5:11) (Lv6:13) (Lv7:15) (Lv8:17) (Lv9:21) (Lv10:25) (Lv11:29) (Lv12:32) (Lv13:38) (Lv14:48) (Lv15:67) (Lv16:95) (Lv17:114) (Lv18:133) (Lv19:162) (Lv20:198) (Lv21:200) (Lv22:202) (Lv23:204) (Lv24:206) (Lv25:208) (Lv26:210) (Lv27:212) (Lv28:214) (Lv29:216) (Lv30:219) (Lv31:221) (Lv32:223) (Lv33:225) (Lv34:228) (Lv35:230) (Lv36:232) (Lv37:234) (Lv38:237) (Lv39:239) (Lv40:241)",
          "被辅助技能附加 1 - 4 点闪电伤害 (Lv1:1) (Lv2:1) (Lv3:1) (Lv4:1) (Lv5:1) (Lv6:1) (Lv7:1) (Lv8:1) (Lv9:1) (Lv10:1) (Lv11:2) (Lv12:2) (Lv13:2) (Lv14:3) (Lv15:4) (Lv16:5) (Lv17:6) (Lv18:7) (Lv19:9) (Lv20:10) (Lv21:11) (Lv22:11) (Lv23:11) (Lv24:11) (Lv25:11) (Lv26:11) (Lv27:11) (Lv28:11) (Lv29:11) (Lv30:12) (Lv31:12) (Lv32:12) (Lv33:12) (Lv34:12) (Lv35:12) (Lv36:12) (Lv37:12) (Lv38:12) (Lv39:13) (Lv40:13) (Lv1:4) (Lv2:6) (Lv3:8) (Lv4:10) (Lv5:11) (Lv6:13) (Lv7:15) (Lv8:17) (Lv9:21) (Lv10:25) (Lv11:29) (Lv12:32) (Lv13:38) (Lv14:48) (Lv15:67) (Lv16:95) (Lv17:114) (Lv18:133) (Lv19:162) (Lv20:198) (Lv21:200) (Lv22:202) (Lv23:204) (Lv24:206) (Lv25:208) (Lv26:210) (Lv27:212) (Lv28:214) (Lv29:216) (Lv30:219) (Lv31:221) (Lv32:223) (Lv33:225) (Lv34:228) (Lv35:230) (Lv36:232) (Lv37:234) (Lv38:237) (Lv39:239) (Lv40:241)"
        ],
        "parsed_values": {
          "added_lightning_damage_min": 10,
          "added_lightning_damage_max": 198,
          "added_lightning_damage": 104
        },
        "anchors": {
          "added_lightning_damage_min": 10,
          "added_lightning_damage_max": 198,
          "added_lightning_damage": 104
        }
      },
      "level_values": {
        "added_lightning_damage_min": 1,
        "added_lightning_damage_max": 4,
        "added_lightning_damage": 2.5
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "附",
      "icon_color_key": "pink",
      "icon_sprite": "",
      "name_text": "附加闪电伤害",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "粉色",
            "tone": "color-pink"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助击中敌人的技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "攻击",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "法术",
                "tone": "body"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "未配置文案：stat.added_lightning_damage.name 2.5",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Added_Lightning_Damage",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: added_lightning_damage=104, added_lightning_damage_max=198, added_lightning_damage_min=10",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "added_lightning_damage=2.5, added_lightning_damage_max=4, added_lightning_damage_min=1",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_added_lightning_damage"
  },
  {
    "instance_id": "support_additional_ignite",
    "name_text": "额外点燃",
    "description_text": "辅助击中敌人的技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_4",
      "number": 4,
      "display_text": "4号宝石",
      "identity_text": "四号风险收益身份",
      "color_key": "pink"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 4,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_4",
        "text": "4号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_damage",
        "text": "伤害辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      },
      {
        "id": "support_status",
        "text": "状态辅助"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "ignite_chance_add_percent",
            "text": "点燃概率提高"
          },
          "value": 15,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "ignite_stacks_add",
            "text": "未配置文案：stat.ignite_stacks_add.name"
          },
          "value": 1,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "ignite_damage_bonus_per_stack_percent",
            "text": "未配置文案：stat.ignite_damage_bonus_per_stack_percent.name"
          },
          "value": 2.7,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "ignite_damage_bonus_max_percent",
            "text": "未配置文案：stat.ignite_damage_bonus_max_percent.name"
          },
          "value": 10.8,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "fire",
          "text": "火焰"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Additional_Ignite",
        "display_level": 20,
        "raw_lines": [
          "辅助击中敌人的技能。",
          "被辅助技能能够额外造成 1 层点燃",
          "敌人每有 1 层点燃，被辅助技能额外 2.7% 对其造成的点燃伤害，最多额外 10.8% (Lv1:27/10) (Lv21:67/10) (Lv41:87/10) (Lv1:54/5) (Lv21:134/5) (Lv41:174/5)",
          "被辅助技能 +15% 点燃几率",
          "被辅助技能能够额外造成 1 层点燃",
          "敌人每有 1 层点燃，被辅助技能额外 2.7% 对其造成的点燃伤害，最多额外 10.8% (Lv1:27/10) (Lv21:67/10) (Lv41:87/10) (Lv1:54/5) (Lv21:134/5) (Lv41:174/5)",
          "被辅助技能 +15% 点燃几率"
        ],
        "parsed_values": {
          "ignite_stacks_add": 1,
          "ignite_damage_bonus_per_stack_percent": 2.7,
          "ignite_damage_bonus_max_percent": 10.8,
          "ignite_chance_add_percent": 15
        },
        "anchors": {
          "ignite_stacks_add": 1,
          "ignite_damage_bonus_per_stack_percent": 2.7,
          "ignite_damage_bonus_max_percent": 10.8,
          "ignite_chance_add_percent": {
            "20": 15
          }
        }
      },
      "level_values": {
        "ignite_stacks_add": 1,
        "ignite_damage_bonus_per_stack_percent": 2.7,
        "ignite_damage_bonus_max_percent": 10.8,
        "ignite_chance_add_percent": 15
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "额",
      "icon_color_key": "pink",
      "icon_sprite": "",
      "name_text": "额外点燃",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "粉色",
            "tone": "color-pink"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助击中敌人的技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "火焰",
                "tone": "damage-fire"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "点燃概率提高 15%",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "未配置文案：stat.ignite_stacks_add.name 1",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "未配置文案：stat.ignite_damage_bonus_per_stack_percent.name 2.7%",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "未配置文案：stat.ignite_damage_bonus_max_percent.name 10.8%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Additional_Ignite",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: ignite_chance_add_percent=15, ignite_damage_bonus_max_percent=10.8, ignite_damage_bonus_per_stack_percent=2.7, ignite_stacks_add=1",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "ignite_chance_add_percent=15, ignite_damage_bonus_max_percent=10.8, ignite_damage_bonus_per_stack_percent=2.7, ignite_stacks_add=1",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_additional_ignite"
  },
  {
    "instance_id": "support_high_voltage",
    "name_text": "高压电",
    "description_text": "辅助击中敌人的技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_4",
      "number": 4,
      "display_text": "4号宝石",
      "identity_text": "四号风险收益身份",
      "color_key": "pink"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 4,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_4",
        "text": "4号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_damage",
        "text": "伤害辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      },
      {
        "id": "support_status",
        "text": "状态辅助"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "lightning_damage_add_percent",
            "text": "闪电伤害提高"
          },
          "value": 10.3,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "lightning",
          "text": "闪电"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "High_Voltage",
        "display_level": 20,
        "raw_lines": [
          "辅助击中敌人的技能。",
          "被辅助技能额外 10.3% 闪电伤害 (Lv1:103/10) (Lv21:163/10) (Lv41:183/10)",
          "被辅助技能造成击中闪电伤害时，施加麻痹",
          "被辅助技能额外 10.3% 闪电伤害 (Lv1:103/10) (Lv21:163/10) (Lv41:183/10)",
          "被辅助技能造成击中闪电伤害时，施加麻痹"
        ],
        "parsed_values": {
          "lightning_damage_add_percent": 10.3
        },
        "anchors": {
          "lightning_damage_add_percent": {
            "20": 10.3
          }
        }
      },
      "level_values": {
        "lightning_damage_add_percent": 10.3
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "高",
      "icon_color_key": "pink",
      "icon_sprite": "",
      "name_text": "高压电",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "粉色",
            "tone": "color-pink"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助击中敌人的技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "闪电",
                "tone": "damage-lightning"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "闪电伤害提高 10.3%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: High_Voltage",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: lightning_damage_add_percent=10.3",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "lightning_damage_add_percent=10.3",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_high_voltage"
  },
  {
    "instance_id": "support_jump",
    "name_text": "弹射",
    "description_text": "辅助直射投射物技能或连锁技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_5",
      "number": 5,
      "display_text": "5号宝石",
      "identity_text": "五号伤害类型身份",
      "color_key": "yellow"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 5,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_5",
        "text": "5号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      },
      {
        "id": "support_projectile",
        "text": "投射物辅助"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "bounce_count_add",
            "text": "弹射次数增加"
          },
          "value": 2,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          "value": 4,
          "layer_text": "最终修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "chain",
          "text": "连锁"
        },
        {
          "id": "projectile",
          "text": "投射物"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Jump",
        "display_level": 20,
        "raw_lines": [
          "辅助直射投射物技能或连锁技能。",
          "被辅助技能 +2 弹射次数",
          "被辅助技能额外 +4% 伤害 (Lv1:4) (Lv21:8) (Lv41:12)",
          "被辅助技能 +2 弹射次数",
          "被辅助技能额外 +4% 伤害 (Lv1:4) (Lv21:8) (Lv41:12)"
        ],
        "parsed_values": {
          "bounce_count_add": 2,
          "damage_final_percent": 4
        },
        "anchors": {
          "bounce_count_add": {
            "20": 2
          },
          "damage_final_percent": {
            "20": 4
          }
        }
      },
      "level_values": {
        "bounce_count_add": 2,
        "damage_final_percent": 4
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "弹",
      "icon_color_key": "yellow",
      "icon_sprite": "",
      "name_text": "弹射",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "黄色",
            "tone": "color-yellow"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助直射投射物技能或连锁技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "连锁",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "投射物",
                "tone": "body"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "弹射次数增加 2",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "最终伤害修正 4%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Jump",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: bounce_count_add=2, damage_final_percent=4",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "bounce_count_add=2, damage_final_percent=4",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_jump"
  },
  {
    "instance_id": "support_projectile_split",
    "name_text": "投射物分裂",
    "description_text": "辅助抛射投射物技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_5",
      "number": 5,
      "display_text": "5号宝石",
      "identity_text": "五号伤害类型身份",
      "color_key": "yellow"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 5,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_5",
        "text": "5号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      },
      {
        "id": "support_projectile",
        "text": "投射物辅助"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "split_projectile_chance_percent",
            "text": "分裂触发几率"
          },
          "value": 50,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "split_projectile_count_add",
            "text": "分裂数量增加"
          },
          "value": 2,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          "value": 8.2,
          "layer_text": "最终修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "projectile",
          "text": "投射物"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Projectile_Split",
        "display_level": 20,
        "raw_lines": [
          "辅助抛射投射物技能。",
          "释放被辅助技能时，+50% 几率使该次技能 +2 分裂数量",
          "被辅助技能额外 8.2% 伤害 (Lv1:41/5) (Lv21:61/5) (Lv41:71/5)",
          "释放被辅助技能时，+50% 几率使该次技能 +2 分裂数量",
          "被辅助技能额外 8.2% 伤害 (Lv1:41/5) (Lv21:61/5) (Lv41:71/5)"
        ],
        "parsed_values": {
          "split_projectile_chance_percent": 50,
          "split_projectile_count_add": 2,
          "damage_final_percent": 8.2
        },
        "anchors": {
          "split_projectile_chance_percent": {
            "20": 50
          },
          "split_projectile_count_add": {
            "20": 2
          },
          "damage_final_percent": {
            "20": 8.2
          }
        }
      },
      "level_values": {
        "split_projectile_chance_percent": 50,
        "split_projectile_count_add": 2,
        "damage_final_percent": 8.2
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "投",
      "icon_color_key": "yellow",
      "icon_sprite": "",
      "name_text": "投射物分裂",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "黄色",
            "tone": "color-yellow"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助抛射投射物技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "投射物",
                "tone": "body"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "分裂触发几率 50%",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "分裂数量增加 2",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "最终伤害修正 8.2%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Projectile_Split",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: damage_final_percent=8.2, split_projectile_chance_percent=50, split_projectile_count_add=2",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "damage_final_percent=8.2, split_projectile_chance_percent=50, split_projectile_count_add=2",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_projectile_split"
  },
  {
    "instance_id": "support_multiple_projectiles",
    "name_text": "散射",
    "description_text": "辅助投射物技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_5",
      "number": 5,
      "display_text": "5号宝石",
      "identity_text": "五号伤害类型身份",
      "color_key": "yellow"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 5,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_5",
        "text": "5号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_damage",
        "text": "伤害辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      },
      {
        "id": "support_projectile",
        "text": "投射物辅助"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "projectile_count_add",
            "text": "投射物数量增加"
          },
          "value": 2,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          "value": 7.4,
          "layer_text": "最终修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "projectile",
          "text": "投射物"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Multiple_Projectiles",
        "display_level": 20,
        "raw_lines": [
          "辅助投射物技能。",
          "被辅助技能 +2 投射物数量",
          "被辅助技能额外 7.4% 伤害 (Lv1:37/5) (Lv21:77/5) (Lv41:117/5)",
          "被辅助技能 +2 投射物数量",
          "被辅助技能额外 7.4% 伤害 (Lv1:37/5) (Lv21:77/5) (Lv41:117/5)"
        ],
        "parsed_values": {
          "projectile_count_add": 2
        },
        "anchors": {
          "projectile_count_add": {
            "20": 2
          }
        }
      },
      "level_values": {
        "projectile_count_add": 2,
        "damage_final_percent": 7.4
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "散",
      "icon_color_key": "yellow",
      "icon_sprite": "",
      "name_text": "散射",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "黄色",
            "tone": "color-yellow"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助投射物技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "投射物",
                "tone": "body"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "投射物数量增加 2",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "最终伤害修正 7.4%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Multiple_Projectiles",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: projectile_count_add=2",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "damage_final_percent=7.4, projectile_count_add=2",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_multiple_projectiles"
  },
  {
    "instance_id": "support_increased_area",
    "name_text": "范围扩大",
    "description_text": "辅助范围技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_5",
      "number": 5,
      "display_text": "5号宝石",
      "identity_text": "五号伤害类型身份",
      "color_key": "yellow"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 5,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_5",
        "text": "5号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_area",
        "text": "范围辅助"
      },
      {
        "id": "support_damage",
        "text": "伤害辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "area_add_percent",
            "text": "范围提高"
          },
          "value": 20,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          "value": 16,
          "layer_text": "最终修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "area",
          "text": "范围"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Increased_Area",
        "display_level": 20,
        "raw_lines": [
          "辅助范围技能。",
          "被辅助技能 +20% 技能范围 (Lv1:20) (Lv21:20) (Lv41:20)",
          "被辅助技能额外 +16% 伤害 (Lv1:16) (Lv21:20) (Lv41:24)",
          "被辅助技能 +20% 技能范围 (Lv1:20) (Lv21:20) (Lv41:20)",
          "被辅助技能额外 +16% 伤害 (Lv1:16) (Lv21:20) (Lv41:24)"
        ],
        "parsed_values": {
          "area_add_percent": 20
        },
        "anchors": {
          "area_add_percent": {
            "20": 20
          }
        }
      },
      "level_values": {
        "area_add_percent": 20,
        "damage_final_percent": 16
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "范",
      "icon_color_key": "yellow",
      "icon_sprite": "",
      "name_text": "范围扩大",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "黄色",
            "tone": "color-yellow"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助范围技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "范围",
                "tone": "body"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "范围提高 20%",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "最终伤害修正 16%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Increased_Area",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: area_add_percent=20",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "area_add_percent=20, damage_final_percent=16",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_increased_area"
  },
  {
    "instance_id": "support_guard",
    "name_text": "守护",
    "description_text": "辅助引导技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_6",
      "number": 6,
      "display_text": "6号宝石",
      "identity_text": "六号预留辅助身份",
      "color_key": "white"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 6,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_6",
        "text": "6号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_damage",
        "text": "伤害辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          "value": 15.5,
          "layer_text": "最终修正"
        },
        {
          "stat": {
            "id": "guard_trigger_count",
            "text": "守护触发次数"
          },
          "value": 5,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "guard_internal_cooldown_ms",
            "text": "守护内置冷却"
          },
          "value": 6000,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "area",
          "text": "范围"
        },
        {
          "id": "attack",
          "text": "攻击"
        },
        {
          "id": "aura",
          "text": "光环"
        },
        {
          "id": "melee",
          "text": "近战"
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
          "id": "spell",
          "text": "法术"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Guard",
        "display_level": 20,
        "raw_lines": [
          "辅助引导技能。",
          "被辅助技能额外 15.5% 伤害 (Lv1:31/2) (Lv21:51/2) (Lv41:71/2)",
          "每使用 5 次被辅助技能，如果没有屏障则获得屏障，触发该效果的间隔为 6 秒",
          "被辅助技能额外 15.5% 伤害 (Lv1:31/2) (Lv21:51/2) (Lv41:71/2)",
          "每使用 5 次被辅助技能，如果没有屏障则获得屏障，触发该效果的间隔为 6 秒"
        ],
        "parsed_values": {
          "damage_final_percent": 15.5,
          "guard_trigger_count": 5,
          "guard_internal_cooldown_ms": 6000
        },
        "anchors": {
          "damage_final_percent": {
            "20": 15.5
          },
          "guard_trigger_count": {
            "20": 5
          },
          "guard_internal_cooldown_ms": {
            "20": 6000
          }
        }
      },
      "level_values": {
        "damage_final_percent": 15.5,
        "guard_trigger_count": 5,
        "guard_internal_cooldown_ms": 6000
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "守",
      "icon_color_key": "white",
      "icon_sprite": "",
      "name_text": "守护",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "白色",
            "tone": "color-white"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助引导技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "范围",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "攻击",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "光环",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "近战",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "投射物",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "远程",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "法术",
                "tone": "body"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "最终伤害修正 15.5%",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "守护触发次数 5",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "守护内置冷却 6000",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Guard",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: damage_final_percent=15.5, guard_internal_cooldown_ms=6000, guard_trigger_count=5",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "damage_final_percent=15.5, guard_internal_cooldown_ms=6000, guard_trigger_count=5",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_guard"
  },
  {
    "instance_id": "support_slow_projectile",
    "name_text": "慢速投射",
    "description_text": "辅助投射物技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_6",
      "number": 6,
      "display_text": "6号宝石",
      "identity_text": "六号预留辅助身份",
      "color_key": "white"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 6,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_6",
        "text": "6号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_damage",
        "text": "伤害辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      },
      {
        "id": "support_projectile",
        "text": "投射物辅助"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "projectile_speed_add_percent",
            "text": "投射物速度提高"
          },
          "value": 19.5,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          "value": 19.5,
          "layer_text": "最终修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "projectile",
          "text": "投射物"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Slow_Projectile",
        "display_level": 20,
        "raw_lines": [
          "辅助投射物技能。",
          "被辅助技能额外 -30% 投射物速度",
          "被辅助技能额外 19.5% 伤害 (Lv1:39/2) (Lv21:59/2) (Lv41:79/2)",
          "被辅助技能额外 -30% 投射物速度",
          "被辅助技能额外 19.5% 伤害 (Lv1:39/2) (Lv21:59/2) (Lv41:79/2)"
        ],
        "parsed_values": {
          "projectile_speed_add_percent": -30
        },
        "anchors": {
          "projectile_speed_add_percent": {
            "20": -30
          }
        }
      },
      "level_values": {
        "projectile_speed_add_percent": 19.5,
        "damage_final_percent": 19.5
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "慢",
      "icon_color_key": "white",
      "icon_sprite": "",
      "name_text": "慢速投射",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "白色",
            "tone": "color-white"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助投射物技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "投射物",
                "tone": "body"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "投射物速度提高 19.5%",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "最终伤害修正 19.5%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Slow_Projectile",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: projectile_speed_add_percent=-30",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "damage_final_percent=19.5, projectile_speed_add_percent=19.5",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_slow_projectile"
  },
  {
    "instance_id": "support_shortened_duration",
    "name_text": "持续时间缩短",
    "description_text": "辅助持续或能造成异常状态的技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_6",
      "number": 6,
      "display_text": "6号宝石",
      "identity_text": "六号预留辅助身份",
      "color_key": "white"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 6,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_6",
        "text": "6号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_damage",
        "text": "伤害辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "duration_add_percent",
            "text": "持续时间提高"
          },
          "value": -10,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "dot_damage_add_percent",
            "text": "持续伤害提高"
          },
          "value": 20,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "dot",
          "text": "持续伤害"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Shortened_Duration",
        "display_level": 20,
        "raw_lines": [
          "辅助持续或能造成异常状态的技能。",
          "被辅助技能 -10% 持续时间 (Lv1:-10) (Lv21:-8) (Lv41:-6)",
          "被辅助技能额外 +20% 持续伤害 (Lv1:20) (Lv21:30) (Lv41:40)",
          "被辅助技能 -10% 持续时间 (Lv1:-10) (Lv21:-8) (Lv41:-6)",
          "被辅助技能额外 +20% 持续伤害 (Lv1:20) (Lv21:30) (Lv41:40)"
        ],
        "parsed_values": {
          "duration_add_percent": -10
        },
        "anchors": {
          "duration_add_percent": {
            "20": -10
          }
        }
      },
      "level_values": {
        "duration_add_percent": -10,
        "dot_damage_add_percent": 20
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "持",
      "icon_color_key": "white",
      "icon_sprite": "",
      "name_text": "持续时间缩短",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "白色",
            "tone": "color-white"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助持续或能造成异常状态的技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "持续伤害",
                "tone": "body"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "持续时间提高 -10%",
                "tone": "bonus-negative"
              }
            ],
            [
              {
                "text": "持续伤害提高 20%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Shortened_Duration",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: duration_add_percent=-10",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "dot_damage_add_percent=20, duration_add_percent=-10",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_shortened_duration"
  },
  {
    "instance_id": "support_spell_concentration",
    "name_text": "法术集中",
    "description_text": "辅助范围法术技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_6",
      "number": 6,
      "display_text": "6号宝石",
      "identity_text": "六号预留辅助身份",
      "color_key": "white"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 6,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_6",
        "text": "6号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_area",
        "text": "范围辅助"
      },
      {
        "id": "support_damage",
        "text": "伤害辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "area_add_percent",
            "text": "范围提高"
          },
          "value": -30,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          "value": 22.5,
          "layer_text": "最终修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "area",
          "text": "范围"
        },
        {
          "id": "spell",
          "text": "法术"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Spell_Concentration",
        "display_level": 20,
        "raw_lines": [
          "辅助范围法术技能。",
          "被辅助技能 -30% 技能范围 (Lv1:-30) (Lv99:-30)",
          "被辅助技能额外 22.5% 伤害 (Lv1:45/2) (Lv21:65/2) (Lv41:85/2)",
          "被辅助技能 -30% 技能范围 (Lv1:-30) (Lv99:-30)",
          "被辅助技能额外 22.5% 伤害 (Lv1:45/2) (Lv21:65/2) (Lv41:85/2)"
        ],
        "parsed_values": {
          "area_add_percent": -30
        },
        "anchors": {
          "area_add_percent": {
            "20": -30
          }
        }
      },
      "level_values": {
        "area_add_percent": -30,
        "damage_final_percent": 22.5
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "法",
      "icon_color_key": "white",
      "icon_sprite": "",
      "name_text": "法术集中",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "白色",
            "tone": "color-white"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助范围法术技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "范围",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "法术",
                "tone": "body"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "范围提高 -30%",
                "tone": "bonus-negative"
              }
            ],
            [
              {
                "text": "最终伤害修正 22.5%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Spell_Concentration",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: area_add_percent=-30",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "area_add_percent=-30, damage_final_percent=22.5",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_spell_concentration"
  },
  {
    "instance_id": "support_nova_shot",
    "name_text": "坠星射击",
    "description_text": "辅助坠落投射物技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_7",
      "number": 7,
      "display_text": "7号宝石",
      "identity_text": "七号预留辅助身份",
      "color_key": "black"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 7,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_7",
        "text": "7号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_falling",
        "text": "未配置文案：tag.support_falling.name"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      },
      {
        "id": "support_projectile",
        "text": "投射物辅助"
      },
      {
        "id": "support_shape",
        "text": "形态辅助"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "damage_final_percent",
            "text": "最终伤害修正"
          },
          "value": 17.5,
          "layer_text": "最终修正"
        },
        {
          "stat": {
            "id": "area_add_percent",
            "text": "范围提高"
          },
          "value": -15,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "projectile_speed_add_percent",
            "text": "投射物速度提高"
          },
          "value": 15,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动技能",
      "target_kinds": [
        "主动技能宝石"
      ],
      "tags_any": [],
      "tags_all": [
        {
          "id": "area",
          "text": "范围"
        },
        {
          "id": "projectile",
          "text": "投射物"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Nova_Shot",
        "display_level": 20,
        "raw_lines": [
          "辅助坠落投射物技能",
          "被辅助技能额外 17.5% 伤害 (Lv1:35/2) (Lv21:55/2) (Lv41:75/2)",
          "被辅助技能 -15% 技能范围 (Lv1:-15) (Lv21:-25) (Lv41:-35)",
          "被辅助技能额外 +15% 投射物速度 (Lv1:15) (Lv21:25) (Lv41:35)",
          "被辅助技能额外 17.5% 伤害 (Lv1:35/2) (Lv21:55/2) (Lv41:75/2)",
          "被辅助技能 -15% 技能范围 (Lv1:-15) (Lv21:-25) (Lv41:-35)",
          "被辅助技能额外 +15% 投射物速度 (Lv1:15) (Lv21:25) (Lv41:35)"
        ],
        "parsed_values": {
          "damage_final_percent": 17.5,
          "area_add_percent": -15,
          "projectile_speed_add_percent": 15
        },
        "anchors": {
          "damage_final_percent": {
            "20": 17.5
          },
          "area_add_percent": {
            "20": -15
          },
          "projectile_speed_add_percent": {
            "20": 15
          }
        }
      },
      "level_values": {
        "damage_final_percent": 17.5,
        "area_add_percent": -15,
        "projectile_speed_add_percent": 15
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "坠",
      "icon_color_key": "black",
      "icon_sprite": "",
      "name_text": "坠星射击",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "黑色",
            "tone": "color-black"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助坠落投射物技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "范围",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "投射物",
                "tone": "body"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "最终伤害修正 17.5%",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "范围提高 -15%",
                "tone": "bonus-negative"
              }
            ],
            [
              {
                "text": "投射物速度提高 15%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Nova_Shot",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: area_add_percent=-15, damage_final_percent=17.5, projectile_speed_add_percent=15",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "area_add_percent=-15, damage_final_percent=17.5, projectile_speed_add_percent=15",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_nova_shot"
  },
  {
    "instance_id": "support_raging_slash",
    "name_text": "怒斩",
    "description_text": "辅助近战挥斩技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_7",
      "number": 7,
      "display_text": "7号宝石",
      "identity_text": "七号预留辅助身份",
      "color_key": "black"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 7,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_7",
        "text": "7号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      },
      {
        "id": "support_shape",
        "text": "形态辅助"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "slash_chance_add_percent",
            "text": "斩击几率提高"
          },
          "value": 21,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "melee",
          "text": "近战"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Raging_Slash",
        "display_level": 20,
        "raw_lines": [
          "辅助近战挥斩技能。",
          "被辅助技能 +21% 斩击几率 (Lv1:21) (Lv21:41) (Lv41:51)",
          "被辅助技能 +21% 斩击几率 (Lv1:21) (Lv21:41) (Lv41:51)"
        ],
        "parsed_values": {
          "slash_chance_add_percent": 21
        },
        "anchors": {
          "slash_chance_add_percent": {
            "20": 21
          }
        }
      },
      "level_values": {
        "slash_chance_add_percent": 21
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "怒",
      "icon_color_key": "black",
      "icon_sprite": "",
      "name_text": "怒斩",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "黑色",
            "tone": "color-black"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助近战挥斩技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "近战",
                "tone": "body"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "斩击几率提高 21%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Raging_Slash",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: slash_chance_add_percent=21",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "slash_chance_add_percent=21",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_raging_slash"
  },
  {
    "instance_id": "support_steamroll",
    "name_text": "碾压",
    "description_text": "辅助近战攻击技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_7",
      "number": 7,
      "display_text": "7号宝石",
      "identity_text": "七号预留辅助身份",
      "color_key": "black"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 7,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_7",
        "text": "7号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_area",
        "text": "范围辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      },
      {
        "id": "support_melee",
        "text": "未配置文案：tag.support_melee.name"
      },
      {
        "id": "support_shape",
        "text": "形态辅助"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "melee_damage_add_percent",
            "text": "近战伤害提高"
          },
          "value": 31,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "ailment_damage_add_percent",
            "text": "异常伤害提高"
          },
          "value": 31,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "attack_speed_add_percent",
            "text": "攻击速度提高"
          },
          "value": 31,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动技能",
      "target_kinds": [
        "主动技能宝石"
      ],
      "tags_any": [],
      "tags_all": [
        {
          "id": "area",
          "text": "范围"
        },
        {
          "id": "melee",
          "text": "近战"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Steamroll",
        "display_level": 20,
        "raw_lines": [
          "辅助近战攻击技能。",
          "被辅助技能额外 +31% 近战伤害 (Lv1:31) (Lv21:41) (Lv41:51)",
          "被辅助技能额外 +31% 异常伤害 (Lv1:31) (Lv21:41) (Lv41:51)",
          "被辅助技能 -15% 攻击速度",
          "被辅助技能额外 +31% 近战伤害 (Lv1:31) (Lv21:41) (Lv41:51)",
          "被辅助技能额外 +31% 异常伤害 (Lv1:31) (Lv21:41) (Lv41:51)",
          "被辅助技能 -15% 攻击速度"
        ],
        "parsed_values": {
          "melee_damage_add_percent": 31,
          "ailment_damage_add_percent": 31,
          "attack_speed_add_percent": -15
        },
        "anchors": {
          "melee_damage_add_percent": {
            "20": 31
          },
          "ailment_damage_add_percent": {
            "20": 31
          },
          "attack_speed_add_percent": {
            "20": -15
          }
        }
      },
      "level_values": {
        "melee_damage_add_percent": 31,
        "ailment_damage_add_percent": 31,
        "attack_speed_add_percent": 31
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "碾",
      "icon_color_key": "black",
      "icon_sprite": "",
      "name_text": "碾压",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "黑色",
            "tone": "color-black"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助近战攻击技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "范围",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "近战",
                "tone": "body"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "近战伤害提高 31%",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "异常伤害提高 31%",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "攻击速度提高 31%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Steamroll",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: ailment_damage_add_percent=31, attack_speed_add_percent=-15, melee_damage_add_percent=31",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "ailment_damage_add_percent=31, attack_speed_add_percent=31, melee_damage_add_percent=31",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_steamroll"
  },
  {
    "instance_id": "support_precision_strike",
    "name_text": "精确打击",
    "description_text": "辅助近战攻击技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_7",
      "number": 7,
      "display_text": "7号宝石",
      "identity_text": "七号预留辅助身份",
      "color_key": "black"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 7,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_7",
        "text": "7号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_area",
        "text": "范围辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      },
      {
        "id": "support_melee",
        "text": "未配置文案：tag.support_melee.name"
      },
      {
        "id": "support_shape",
        "text": "形态辅助"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "area_add_percent",
            "text": "范围提高"
          },
          "value": 11.5,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "area_damage_add_percent",
            "text": "范围伤害提高"
          },
          "value": 10,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "ailment_damage_add_percent",
            "text": "异常伤害提高"
          },
          "value": 0.575,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "attack_speed_add_percent",
            "text": "攻击速度提高"
          },
          "value": 0.5,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动技能",
      "target_kinds": [
        "主动技能宝石"
      ],
      "tags_any": [],
      "tags_all": [
        {
          "id": "area",
          "text": "范围"
        },
        {
          "id": "melee",
          "text": "近战"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Precision_Strike",
        "display_level": 20,
        "raw_lines": [
          "辅助近战攻击技能。",
          "被辅助技能 -30% 技能范围",
          "被辅助技能额外 11.5% 范围伤害 (Lv1:23/2) (Lv21:43/2) (Lv41:63/2)",
          "被辅助技能额外 11.5% 异常伤害 (Lv1:23/2) (Lv21:43/2) (Lv41:63/2)",
          "被辅助技能 +10% 攻击速度 (Lv1:10) (Lv21:14) (Lv41:18)",
          "被辅助技能 -30% 技能范围",
          "被辅助技能额外 11.5% 范围伤害 (Lv1:23/2) (Lv21:43/2) (Lv41:63/2)",
          "被辅助技能额外 11.5% 异常伤害 (Lv1:23/2) (Lv21:43/2) (Lv41:63/2)",
          "被辅助技能 +10% 攻击速度 (Lv1:10) (Lv21:14) (Lv41:18)"
        ],
        "parsed_values": {
          "area_add_percent": -30,
          "area_damage_add_percent": 11.5,
          "ailment_damage_add_percent": 11.5,
          "attack_speed_add_percent": 10
        },
        "anchors": {
          "area_add_percent": {
            "20": -30
          },
          "area_damage_add_percent": {
            "20": 11.5
          },
          "ailment_damage_add_percent": {
            "20": 11.5
          },
          "attack_speed_add_percent": {
            "20": 10
          }
        }
      },
      "level_values": {
        "area_add_percent": 11.5,
        "area_damage_add_percent": 10,
        "ailment_damage_add_percent": 0.575,
        "attack_speed_add_percent": 0.5
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "精",
      "icon_color_key": "black",
      "icon_sprite": "",
      "name_text": "精确打击",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "黑色",
            "tone": "color-black"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助近战攻击技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "范围",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "近战",
                "tone": "body"
              },
              {
                "text": " ",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "范围提高 11.5%",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "范围伤害提高 10%",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "异常伤害提高 0.575%",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "攻击速度提高 0.5%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": [
            [
              {
                "text": "TLIDB ID: Precision_Strike",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Lv20 source card",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "Source: ailment_damage_add_percent=11.5, area_add_percent=-30, area_damage_add_percent=11.5, attack_speed_add_percent=10",
                "tone": "muted"
              }
            ]
          ]
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "ailment_damage_add_percent=0.575, area_add_percent=11.5, area_damage_add_percent=10, attack_speed_add_percent=0.5",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_precision_strike"
  },
  {
    "instance_id": "support_column_conduit",
    "name_text": "列导管",
    "description_text": "使同列连接的技能等级提高，1-5 级分别 +1/+2/+3/+4/+5。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_9",
      "number": 9,
      "display_text": "9号宝石",
      "identity_text": "九号盘面导管身份",
      "color_key": "orange"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 9,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_9",
        "text": "9号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_conduit",
        "text": "导管辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      },
      {
        "id": "support_relation",
        "text": "盘面关系辅助"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": []
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "active_skill_gem",
          "text": "主动技能宝石"
        },
        {
          "id": "passive_skill_gem",
          "text": "被动技能宝石"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {},
      "level_values": {
        "skill_level_add": 1
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "列",
      "icon_color_key": "orange",
      "icon_sprite": "",
      "name_text": "列导管",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "橙色",
            "tone": "color-orange"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "使同列连接的技能等级提高，1-5 级分别 +1/+2/+3/+4/+5。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "宝石",
                "tone": "muted"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": []
        },
        "tlidb_source": {
          "rich_lines": []
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "skill_level_add=1",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_column_conduit"
  },
  {
    "instance_id": "support_box_conduit",
    "name_text": "宫导管",
    "description_text": "使同宫连接的技能等级提高，1-5 级分别 +1/+2/+3/+4/+5。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_9",
      "number": 9,
      "display_text": "9号宝石",
      "identity_text": "九号盘面导管身份",
      "color_key": "orange"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 9,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_9",
        "text": "9号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_conduit",
        "text": "导管辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      },
      {
        "id": "support_relation",
        "text": "盘面关系辅助"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": []
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "active_skill_gem",
          "text": "主动技能宝石"
        },
        {
          "id": "passive_skill_gem",
          "text": "被动技能宝石"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {},
      "level_values": {
        "skill_level_add": 1
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "宫",
      "icon_color_key": "orange",
      "icon_sprite": "",
      "name_text": "宫导管",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "橙色",
            "tone": "color-orange"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "使同宫连接的技能等级提高，1-5 级分别 +1/+2/+3/+4/+5。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "宝石",
                "tone": "muted"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": []
        },
        "tlidb_source": {
          "rich_lines": []
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "skill_level_add=1",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_box_conduit"
  },
  {
    "instance_id": "support_row_conduit",
    "name_text": "行导管",
    "description_text": "使同行连接的技能等级提高，1-5 级分别 +1/+2/+3/+4/+5。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_9",
      "number": 9,
      "display_text": "9号宝石",
      "identity_text": "九号盘面导管身份",
      "color_key": "orange"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 9,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_9",
        "text": "9号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_conduit",
        "text": "导管辅助"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      },
      {
        "id": "support_relation",
        "text": "盘面关系辅助"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": []
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "active_skill_gem",
          "text": "主动技能宝石"
        },
        {
          "id": "passive_skill_gem",
          "text": "被动技能宝石"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {},
      "level_values": {
        "skill_level_add": 1
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "行",
      "icon_color_key": "orange",
      "icon_sprite": "",
      "name_text": "行导管",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "橙色",
            "tone": "color-orange"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "使同行连接的技能等级提高，1-5 级分别 +1/+2/+3/+4/+5。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "宝石",
                "tone": "muted"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "宝石",
                "tone": "muted"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": []
        },
        "tlidb_source": {
          "rich_lines": []
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "skill_level_add=1",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_row_conduit"
  },
  {
    "instance_id": "support_extended_duration",
    "name_text": "持续时间延长",
    "description_text": "辅助持续技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_8",
      "number": 8,
      "display_text": "8号宝石",
      "identity_text": "八号功能辅助身份",
      "color_key": "cyan"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 8,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_8",
        "text": "8号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      },
      {
        "id": "support_utility",
        "text": "功能辅助"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "duration_add_percent",
            "text": "持续时间提高"
          },
          "value": 13,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "dot",
          "text": "持续伤害"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {},
      "level_values": {
        "duration_add_percent": 13
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "持",
      "icon_color_key": "cyan",
      "icon_sprite": "",
      "name_text": "持续时间延长",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "青色",
            "tone": "color-cyan"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助持续技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "持续伤害",
                "tone": "body"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "持续时间提高 13%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": []
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "duration_add_percent=13",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_extended_duration"
  },
  {
    "instance_id": "support_enhanced_ailment",
    "name_text": "强化异常",
    "description_text": "辅助击中敌人的技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_8",
      "number": 8,
      "display_text": "8号宝石",
      "identity_text": "八号功能辅助身份",
      "color_key": "cyan"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 8,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "宝石"
      },
      {
        "id": "gem_type_8",
        "text": "8号宝石"
      },
      {
        "id": "loot_gem",
        "text": "可掉落宝石"
      },
      {
        "id": "support_gem",
        "text": "辅助宝石"
      },
      {
        "id": "support_utility",
        "text": "功能辅助"
      },
      {
        "id": "support_status",
        "text": "状态辅助"
      }
    ],
    "base_effect": {
      "title_text": "辅助基础效果",
      "modifiers": [
        {
          "stat": {
            "id": "status_chance_add_percent",
            "text": "状态施加概率提高"
          },
          "value": 40,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "ailment_damage_add_percent",
            "text": "异常伤害提高"
          },
          "value": 0.3,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "按标签影响匹配的主动或被动技能",
      "target_kinds": [
        "主动技能宝石",
        "被动技能宝石"
      ],
      "tags_any": [
        {
          "id": "attack",
          "text": "攻击"
        },
        {
          "id": "spell",
          "text": "法术"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {},
      "level_values": {
        "status_chance_add_percent": 40,
        "ailment_damage_add_percent": 0.3
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "强",
      "icon_color_key": "cyan",
      "icon_sprite": "",
      "name_text": "强化异常",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "青色",
            "tone": "color-cyan"
          },
          {
            "text": "、",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助击中敌人的技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "攻击",
                "tone": "body"
              },
              {
                "text": "、",
                "tone": "muted"
              },
              {
                "text": "法术",
                "tone": "body"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "状态施加概率提高 40%",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "异常伤害提高 0.3%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": []
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "status_chance_add_percent=40, ailment_damage_add_percent=0.3",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_enhanced_ailment"
  },
  {
    "instance_id": "support_quick_mobility",
    "name_text": "急速位移",
    "description_text": "辅助位移技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_8",
      "number": 8,
      "display_text": "8号宝石",
      "identity_text": "八号功能辅助身份",
      "color_key": "cyan"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 8,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "??"
      },
      {
        "id": "gem_type_8",
        "text": "8???"
      },
      {
        "id": "loot_gem",
        "text": "?????"
      },
      {
        "id": "support_gem",
        "text": "????"
      },
      {
        "id": "support_utility",
        "text": "????"
      },
      {
        "id": "support_speed",
        "text": "速度辅助"
      },
      {
        "id": "support_cooldown",
        "text": "冷却辅助"
      }
    ],
    "base_effect": {
      "title_text": "??????",
      "modifiers": [
        {
          "stat": {
            "id": "attack_speed_add_percent",
            "text": "攻击速度提高"
          },
          "value": 10.5,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "cast_speed_add_percent",
            "text": "施法速度提高"
          },
          "value": 10.5,
          "layer_text": "加算修正"
        },
        {
          "stat": {
            "id": "cooldown_recovery_add_percent",
            "text": "冷却回复速度提高"
          },
          "value": 20.5,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "???????????????",
      "target_kinds": [
        "??????",
        "??????"
      ],
      "tags_any": [
        {
          "id": "movement",
          "text": "位移"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Quick_Mobility",
        "display_level": 20
      },
      "level_values": {
        "attack_speed_add_percent": 10.5,
        "cast_speed_add_percent": 10.5,
        "cooldown_recovery_add_percent": 20.5
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "辅",
      "icon_color_key": "cyan",
      "icon_sprite": "",
      "name_text": "急速位移",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "青色",
            "tone": "color-cyan"
          },
          {
            "text": " ? ",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助位移技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "位移",
                "tone": "body"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "攻击速度提高 10.5%",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "施法速度提高 10.5%",
                "tone": "bonus-positive"
              }
            ],
            [
              {
                "text": "冷却回复速度提高 20.5%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": []
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "attack_speed_add_percent=10.5, cast_speed_add_percent=10.5, cooldown_recovery_add_percent=20.5",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_quick_mobility"
  },
  {
    "instance_id": "support_utility_cooldown_reduction",
    "name_text": "加速冷却",
    "description_text": "辅助任意技能。",
    "category_text": "辅助宝石",
    "gem_type": {
      "id": "gem_type_8",
      "number": 8,
      "display_text": "8号宝石",
      "identity_text": "八号功能辅助身份",
      "color_key": "cyan"
    },
    "gem_kind": "support",
    "gem_kind_text": "辅助宝石",
    "sudoku_digit": 8,
    "rarity_text": "普通",
    "level": 1,
    "locked": false,
    "board_position": null,
    "tags": [
      {
        "id": "gem",
        "text": "??"
      },
      {
        "id": "gem_type_8",
        "text": "8???"
      },
      {
        "id": "loot_gem",
        "text": "?????"
      },
      {
        "id": "support_gem",
        "text": "????"
      },
      {
        "id": "support_utility",
        "text": "????"
      },
      {
        "id": "support_cooldown",
        "text": "冷却辅助"
      }
    ],
    "base_effect": {
      "title_text": "??????",
      "modifiers": [
        {
          "stat": {
            "id": "cooldown_recovery_add_percent",
            "text": "冷却回复速度提高"
          },
          "value": 13,
          "layer_text": "加算修正"
        }
      ]
    },
    "can_affect": {
      "summary_text": "???????????????",
      "target_kinds": [
        "??????",
        "??????"
      ],
      "tags_any": [
        {
          "id": "attack",
          "text": "攻击"
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
          "id": "melee",
          "text": "近战"
        },
        {
          "id": "ranged",
          "text": "远程"
        },
        {
          "id": "movement",
          "text": "位移"
        },
        {
          "id": "dot",
          "text": "持续伤害"
        }
      ],
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
    "visual_effect": "",
    "shape_effect": "",
    "shape_effect_text": "",
    "tlidb": {
      "source_values": {
        "source": "tlidb",
        "tlidb_id": "Cooldown_Reduction",
        "display_level": 20
      },
      "level_values": {
        "cooldown_recovery_add_percent": 13
      },
      "auto_release": {}
    },
    "tooltip_view": {
      "variant": "support",
      "icon_text": "辅",
      "icon_color_key": "cyan",
      "icon_sprite": "",
      "name_text": "加速冷却",
      "subtitle_text": "",
      "type_identity_text": "",
      "tags": [],
      "summary_lines": [
        [
          {
            "text": "青色",
            "tone": "color-cyan"
          },
          {
            "text": " ? ",
            "tone": "muted"
          },
          {
            "text": "宝石",
            "tone": "muted"
          }
        ]
      ],
      "sections": {
        "description": {
          "rich_lines": [
            [
              {
                "text": "辅助任意技能。",
                "tone": "body"
              }
            ]
          ]
        },
        "conditions": {
          "rich_lines": [
            [
              {
                "text": "辅助：",
                "tone": "label"
              },
              {
                "text": "攻击、法术、范围、近战、远程、位移、持续伤害",
                "tone": "body"
              }
            ],
            [
              {
                "text": "连接：",
                "tone": "label"
              },
              {
                "text": "行、列、宫格",
                "tone": "muted"
              }
            ]
          ]
        },
        "support_rules": {
          "rich_lines": [
            [
              {
                "text": "同数独数字宝石不能位于同一行、列或宫格",
                "tone": "rule"
              }
            ]
          ]
        },
        "base_bonuses": {
          "rich_lines": [
            [
              {
                "text": "冷却回复速度提高 13%",
                "tone": "bonus-positive"
              }
            ]
          ]
        },
        "tlidb_source": {
          "rich_lines": []
        },
        "tlidb_level": {
          "rich_lines": [
            [
              {
                "text": "cooldown_recovery_add_percent=13",
                "tone": "muted"
              }
            ]
          ]
        }
      }
    },
    "base_gem_id": "support_utility_cooldown_reduction"
  }
] as const;
