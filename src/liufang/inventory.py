from __future__ import annotations

from dataclasses import dataclass
from enum import IntEnum

from .config import GemDefinition


@dataclass(frozen=True)
class BoardPosition:
    row: int
    column: int


@dataclass(frozen=True)
class AffixRoll:
    affix_id: str
    stat: str
    value: int | float
    gen: str
    group: str


class RarityRank(IntEnum):
    normal = 0
    magic = 1
    rare = 2


@dataclass
class GemInstance:
    instance_id: str
    base_gem_id: str
    gem_type: str
    tags: frozenset[str]
    gem_kind: str = ""
    sudoku_digit: int = 0
    rarity: str = "normal"
    level: int = 1
    prefix_affixes: tuple[AffixRoll, ...] = ()
    suffix_affixes: tuple[AffixRoll, ...] = ()
    implicit_affixes: tuple[AffixRoll, ...] = ()
    locked: bool = False
    board_position: BoardPosition | None = None
    acquired_order: int = 0

    @property
    def is_active_skill(self) -> bool:
        return self.gem_kind == "active_skill"

    @property
    def is_passive_skill(self) -> bool:
        return self.gem_kind == "passive_skill"

    @property
    def is_support(self) -> bool:
        return self.gem_kind == "support"

    @property
    def random_affixes(self) -> tuple[AffixRoll, ...]:
        return self.prefix_affixes + self.suffix_affixes


class GemInventory:
    def __init__(self, definitions: dict[str, GemDefinition]) -> None:
        self._definitions = definitions
        self._instances: dict[str, GemInstance] = {}
        self._next_order = 0

    def add_instance(
        self,
        instance_id: str,
        base_gem_id: str,
        *,
        rarity: str = "normal",
        level: int = 1,
        prefix_affixes: tuple[AffixRoll, ...] = (),
        suffix_affixes: tuple[AffixRoll, ...] = (),
        implicit_affixes: tuple[AffixRoll, ...] = (),
        locked: bool = False,
        board_position: BoardPosition | None = None,
    ) -> GemInstance:
        if instance_id in self._instances:
            raise ValueError(f"宝石实例已存在：{instance_id}")
        definition = self._definitions.get(base_gem_id)
        if definition is None:
            raise ValueError(f"宝石基础定义不存在：{base_gem_id}")
        if level < 1 or level > 20:
            raise ValueError(f"宝石等级必须在 1-20 之间：{level}")
        order = self._next_order
        self._next_order += 1
        instance = GemInstance(
            instance_id=instance_id,
            base_gem_id=base_gem_id,
            gem_type=definition.gem_type,
            gem_kind=definition.gem_kind,
            sudoku_digit=definition.sudoku_digit,
            rarity=rarity,
            level=level,
            prefix_affixes=prefix_affixes,
            suffix_affixes=suffix_affixes,
            implicit_affixes=implicit_affixes,
            locked=locked,
            tags=definition.tags,
            board_position=board_position,
            acquired_order=order,
        )
        self._instances[instance_id] = instance
        return instance

    def add_existing_instance(self, instance: GemInstance) -> GemInstance:
        if instance.instance_id in self._instances:
            raise ValueError(f"宝石实例已存在：{instance.instance_id}")
        definition = self._definitions.get(instance.base_gem_id)
        if definition is None:
            raise ValueError(f"宝石基础定义不存在：{instance.base_gem_id}")
        if instance.level < 1 or instance.level > 20:
            raise ValueError(f"宝石等级必须在 1-20 之间：{instance.level}")
        if not instance.gem_kind:
            instance.gem_kind = definition.gem_kind
        if not instance.sudoku_digit:
            instance.sudoku_digit = definition.sudoku_digit
        if not instance.gem_type:
            instance.gem_type = definition.gem_type
        instance.acquired_order = self._next_order
        self._next_order += 1
        self._instances[instance.instance_id] = instance
        return instance

    def update_definitions(self, definitions: dict[str, GemDefinition]) -> None:
        self._definitions = definitions
        for instance in self._instances.values():
            definition = self._definitions.get(instance.base_gem_id)
            if definition is None:
                continue
            instance.gem_type = definition.gem_type
            instance.gem_kind = definition.gem_kind
            instance.sudoku_digit = definition.sudoku_digit
            instance.tags = definition.tags

    def clear(self) -> None:
        self._instances.clear()
        self._next_order = 0

    def get(self, instance_id: str) -> GemInstance | None:
        return self._instances.get(instance_id)

    def require(self, instance_id: str) -> GemInstance:
        instance = self.get(instance_id)
        if instance is None:
            raise ValueError(f"宝石实例不存在：{instance_id}")
        return instance

    def set_board_position(self, instance_id: str, position: BoardPosition | None) -> None:
        self.require(instance_id).board_position = position

    def mounted_instances(self) -> list[GemInstance]:
        return [instance for instance in self._instances.values() if instance.board_position is not None]

    def set_locked(self, instance_id: str, locked: bool) -> None:
        self.require(instance_id).locked = locked

    def all_instances(self) -> list[GemInstance]:
        return list(self._instances.values())

    def filter_instances(
        self,
        *,
        base_gem_id: str | None = None,
        rarity: str | None = None,
        gem_type: str | None = None,
        gem_kind: str | None = None,
        sudoku_digit: int | None = None,
        tag: str | None = None,
    ) -> list[GemInstance]:
        result = self.all_instances()
        if base_gem_id is not None:
            result = [instance for instance in result if instance.base_gem_id == base_gem_id]
        if rarity is not None:
            result = [instance for instance in result if instance.rarity == rarity]
        if gem_type is not None:
            result = [instance for instance in result if instance.gem_type == gem_type]
        if gem_kind is not None:
            result = [instance for instance in result if instance.gem_kind == gem_kind]
        if sudoku_digit is not None:
            result = [instance for instance in result if instance.sudoku_digit == sudoku_digit]
        if tag is not None:
            result = [instance for instance in result if tag in instance.tags]
        return result

    def sort_instances(self, by: str) -> list[GemInstance]:
        if by == "rarity":
            return sorted(self.all_instances(), key=lambda instance: (RarityRank[instance.rarity], instance.acquired_order))
        if by == "base_gem_id":
            return sorted(self.all_instances(), key=lambda instance: (instance.base_gem_id, instance.acquired_order))
        if by == "acquired_order":
            return sorted(self.all_instances(), key=lambda instance: instance.acquired_order)
        raise ValueError(f"不支持的排序方式：{by}")
