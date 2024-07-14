import { DataVal, Func, Region } from "@atlasacademy/api-connector";

import { FuncDescriptorSections } from "./FuncDescriptorSections";

export const targetDescriptions = new Map<Func.FuncTargetType, string>([
    [Func.FuncTargetType.SELF, "self"],
    [Func.FuncTargetType.PT_ONE, "one party member"],
    // PT_ANOTHER
    [Func.FuncTargetType.PT_ALL, "party"],
    [Func.FuncTargetType.ENEMY, "one enemy"],
    // ENEMY_ANOTHER
    [Func.FuncTargetType.ENEMY_ALL, "all enemies"],
    [Func.FuncTargetType.PT_FULL, "party (including reserve)"],
    [Func.FuncTargetType.ENEMY_FULL, "all enemies (including reserve)"],
    [Func.FuncTargetType.PT_OTHER, "party except self"],
    [Func.FuncTargetType.PT_ONE_OTHER, "another party member besides target"],
    [Func.FuncTargetType.PT_RANDOM, "one random party member"],
    [Func.FuncTargetType.ENEMY_OTHER, "other enemies besides target"],
    [Func.FuncTargetType.ENEMY_RANDOM, "one random enemy"],
    [Func.FuncTargetType.PT_OTHER_FULL, "party except self (including reserve)"],
    [Func.FuncTargetType.ENEMY_OTHER_FULL, "other enemies (including reserve)"],
    [Func.FuncTargetType.PTSELECT_ONE_SUB, "active party member and reserve party member"],
    [Func.FuncTargetType.PTSELECT_SUB, "reserve party member"],
    [Func.FuncTargetType.PT_ONE_ANOTHER_RANDOM, "another random party member"],
    [Func.FuncTargetType.PT_SELF_ANOTHER_RANDOM, "another random party member (except self)"],
    [Func.FuncTargetType.ENEMY_ONE_ANOTHER_RANDOM, "other random enemy"],
    [Func.FuncTargetType.PT_SELF_ANOTHER_FIRST, "first other party member (except self)"],
    [Func.FuncTargetType.PT_SELF_ANOTHER_LAST, "last other party member (except self)"],
    [Func.FuncTargetType.PT_ONE_HP_LOWEST_VALUE, "party member with the lowest HP"],
    [Func.FuncTargetType.PT_ONE_HP_LOWEST_RATE, "party member with the lowest HP relative to their max HP"],
    // PT_SELF_BEFORE
    // PT_SELF_AFTER
    [Func.FuncTargetType.COMMAND_TYPE_SELF_TREASURE_DEVICE, "target noble phantasm version"],
    [Func.FuncTargetType.FIELD_OTHER, "party and enemies except self"],
    [Func.FuncTargetType.ENEMY_ONE_NO_TARGET_NO_ACTION, "entity that last dealt damage to self"],
]);

export default function handleTargetSection(
    region: Region,
    sections: FuncDescriptorSections,
    func: Func.BasicFunc,
    dataVal: DataVal.DataVal,
    dependFunc?: Func.BasicFunc
): void {
    const section = sections.target,
        parts = section.parts;

    const targetType =
        [
            Func.FuncType.ABSORB_NPTURN,
            Func.FuncType.GAIN_HP_FROM_TARGETS,
            Func.FuncType.GAIN_NP_FROM_TARGETS,
            Func.FuncType.MOVE_STATE,
        ].includes(func.funcType) && dependFunc !== undefined
            ? dependFunc.funcTargetType
            : func.funcTargetType;

    if (func.funcType === Func.FuncType.CHANGE_BGM && dataVal.Value !== undefined) {
        section.showing = false;
    }

    if (targetType) {
        parts.push(targetDescriptions.get(targetType) ?? targetType);
    }
    if (func.funcType === Func.FuncType.MOVE_STATE) {
        parts.push("to self");
    }
}
