import { DataVal, Func } from "@atlasacademy/api-connector";

import { default as describeBuffValue } from "../Buff/describeValue";
import { BasePartial, Descriptor, ParticlePartial, TextPartial, ValuePartial, ValueType } from "../Descriptor";
import describeGainHpFromTargetsValue from "./Value/describeGainHpFromTargetsValue";
import describeGainNpFromTargets from "./Value/describeGainNpFromTargets";
import describeNpAbsorbValue from "./Value/describeNpAbsorbValue";

export default function (
    func: Func.BasicFunc,
    staticDataVal: DataVal.DataVal,
    dataVal: DataVal.DataVal,
    ignoreRate?: boolean,
    dependFunc?: Func.BasicFunc
): Descriptor | undefined {
    const partials: BasePartial[] = [],
        addPartials = (additional: BasePartial[]) => {
            if (partials.length && additional.length) partials.push(new ParticlePartial(" + "));

            partials.push(...additional);
        };

    const addPartialCount = () => {
        if (dataVal.Count !== undefined) {
            addPartials([
                new ValuePartial(ValueType.NUMBER, dataVal.Count),
                new TextPartial(" Time" + (dataVal.Count > 1 ? "s" : "")),
            ]);
        }
    };

    const addPartialUseRate = () => {
        if (dataVal.UseRate !== undefined) {
            addPartials([new TextPartial("Chance: "), new ValuePartial(ValueType.PERCENT, dataVal.UseRate / 10)]);
        }
    };

    if (!ignoreRate && dataVal.Rate !== undefined) {
        partials.push(new ValuePartial(ValueType.PERCENT, dataVal.Rate / 10), new TextPartial(" Chance"));
    }

    if (func.funcType === Func.FuncType.ADD_STATE || func.funcType === Func.FuncType.ADD_STATE_SHORT) {
        addPartialCount();
        addPartialUseRate();

        const valueDescriptor = describeBuffValue(func.buffs[0], dataVal),
            valuePartials = valueDescriptor?.partials() ?? [];

        addPartials(valuePartials);
    } else if (func.funcType === Func.FuncType.ABSORB_NPTURN && dependFunc !== undefined) {
        addPartials(describeNpAbsorbValue(staticDataVal, dataVal, dependFunc));
    } else if (func.funcType === Func.FuncType.GAIN_HP_FROM_TARGETS) {
        addPartials(describeGainHpFromTargetsValue(staticDataVal, dataVal));
    } else if (func.funcType === Func.FuncType.GAIN_NP_FROM_TARGETS && dependFunc !== undefined) {
        addPartials(describeGainNpFromTargets(staticDataVal, dataVal, dependFunc));
    } else if (
        [
            Func.FuncType.EXTEND_BUFFCOUNT,
            Func.FuncType.SHORTEN_BUFFCOUNT,
            Func.FuncType.EXTEND_BUFFTURN,
            Func.FuncType.SHORTEN_BUFFTURN,
            Func.FuncType.SHORTEN_SKILL,
        ].includes(func.funcType)
    ) {
        if (dataVal.Value !== undefined) {
            partials.push(new TextPartial(`${dataVal.Value}`));
        }
    } else {
        if (dataVal.Value !== undefined) {
            switch (func.funcType) {
                case Func.FuncType.DAMAGE_NP:
                case Func.FuncType.DAMAGE_NP_HPRATIO_LOW:
                case Func.FuncType.DAMAGE_NP_INDIVIDUAL:
                case Func.FuncType.DAMAGE_NP_INDIVIDUAL_SUM:
                case Func.FuncType.DAMAGE_NP_PIERCE:
                case Func.FuncType.DAMAGE_NP_RARE:
                case Func.FuncType.DAMAGE_NP_STATE_INDIVIDUAL_FIX:
                case Func.FuncType.DAMAGE_NP_COUNTER:
                case Func.FuncType.DAMAGE_NP_BATTLE_POINT_PHASE:
                case Func.FuncType.DAMAGE_NP_AND_OR_CHECK_INDIVIDUALITY:
                case Func.FuncType.GAIN_HP_PER:
                case Func.FuncType.QP_DROP_UP:
                case Func.FuncType.GAIN_MULTIPLY_NP:
                case Func.FuncType.LOSS_MULTIPLY_NP:
                    addPartials([new ValuePartial(ValueType.PERCENT, dataVal.Value / 10)]);
                    break;
                case Func.FuncType.GAIN_NP:
                case Func.FuncType.GAIN_NP_BUFF_INDIVIDUAL_SUM:
                case Func.FuncType.GAIN_NP_INDIVIDUAL_SUM:
                case Func.FuncType.GAIN_NP_TARGET_SUM:
                case Func.FuncType.LOSS_NP:
                    addPartials([new ValuePartial(ValueType.PERCENT, dataVal.Value / 100)]);
                    break;
                default:
                    addPartials([new ValuePartial(ValueType.NUMBER, dataVal.Value)]);
            }
        }

        if (dataVal.Value2 !== undefined) {
            switch (func.funcType) {
                case Func.FuncType.DAMAGE_NP_INDIVIDUAL_SUM:
                    let preposition = dataVal.Value ? "" : "with";
                    addPartials([
                        new TextPartial(` ${preposition} supereffective damage of `),
                        new ValuePartial(ValueType.PERCENT, dataVal.Value2 / 10),
                    ]);
            }
        }

        if (dataVal.Correction !== undefined) {
            switch (func.funcType) {
                case Func.FuncType.DAMAGE_NP_BATTLE_POINT_PHASE:
                    if (dataVal.Value2 !== undefined) {
                        partials.push(new TextPartial(" times bonus of "));

                        if (
                            dataVal.DamageRateBattlePointPhase !== undefined &&
                            dataVal.DamageRateBattlePointPhase.length === 1 &&
                            dataVal.Value2 - dataVal.Correction === dataVal.DamageRateBattlePointPhase[0].value
                        ) {
                            partials.push(
                                new ValuePartial(ValueType.PERCENT, (dataVal.Value2 - dataVal.Correction) / 10),
                                new TextPartial(" + "),
                                new ValuePartial(ValueType.PERCENT, dataVal.Correction / 10),
                                new TextPartial(" × Master Affection lvl")
                            );
                        } else {
                            if (dataVal.DamageRateBattlePointPhase) {
                                dataVal.DamageRateBattlePointPhase.forEach((bp) => {
                                    partials.push(
                                        new ValuePartial(ValueType.PERCENT, bp.value / 10),
                                        new TextPartial(` at Master Affection lvl `),
                                        new ValuePartial(ValueType.NUMBER, bp.battlePointPhase),
                                        new TextPartial(` or `)
                                    );
                                });
                            }

                            partials.push(
                                new TextPartial(dataVal.DamageRateBattlePointPhase ? ` else ` : ""),
                                new ValuePartial(ValueType.PERCENT, dataVal.Value2 / 10),
                                new TextPartial(" + "),
                                new ValuePartial(ValueType.PERCENT, dataVal.Correction / 10),
                                new TextPartial(" × max(Master Affection lvl - 1, 0)")
                            );
                        }
                    }
                    break;
                case Func.FuncType.DAMAGE_NP_INDIVIDUAL:
                case Func.FuncType.DAMAGE_NP_RARE:
                case Func.FuncType.DAMAGE_NP_STATE_INDIVIDUAL_FIX:
                case Func.FuncType.DAMAGE_NP_AND_OR_CHECK_INDIVIDUALITY:
                    if (dataVal.Rate !== undefined) {
                        // Full detailed in NP page
                        addPartials([
                            new TextPartial("supereffective damage of "),
                            new ValuePartial(ValueType.PERCENT, dataVal.Correction / 10),
                        ]);
                    } else {
                        // Summary table values
                        addPartials([new ValuePartial(ValueType.PERCENT, dataVal.Correction / 10)]);
                    }
                    break;
                case Func.FuncType.DAMAGE_NP_INDIVIDUAL_SUM:
                    if (dataVal.Correction !== 0) {
                        addPartials([
                            new TextPartial("additional "),
                            new ValuePartial(ValueType.PERCENT, dataVal.Correction / 10),
                            new TextPartial(" SE "),
                        ]);
                    }
                    break;
                default:
                    addPartials([new ValuePartial(ValueType.NUMBER, dataVal.Correction)]);
            }
        }

        for (const targetVal of [staticDataVal.Target, dataVal.Target]) {
            if (targetVal !== undefined) {
                switch (func.funcType) {
                    case Func.FuncType.DAMAGE_NP_HPRATIO_LOW:
                        addPartials([new ValuePartial(ValueType.PERCENT, targetVal / 10)]);
                        break;
                    case Func.FuncType.DAMAGE_NP_INDIVIDUAL:
                    case Func.FuncType.DAMAGE_NP_RARE:
                    case Func.FuncType.DAMAGE_NP_STATE_INDIVIDUAL_FIX:
                    case Func.FuncType.DAMAGE_NP_AND_OR_CHECK_INDIVIDUALITY:
                    case Func.FuncType.DAMAGE_NP_INDIVIDUAL_SUM:
                    case Func.FuncType.DAMAGE_NP_BATTLE_POINT_PHASE:
                    case Func.FuncType.SERVANT_FRIENDSHIP_UP:
                    case Func.FuncType.ADD_FIELD_CHANGE_TO_FIELD:
                    case Func.FuncType.GAIN_NP_INDIVIDUAL_SUM:
                    case Func.FuncType.GAIN_NP_TARGET_SUM:
                        break;
                    default:
                        addPartials([new ValuePartial(ValueType.UNKNOWN, targetVal)]);
                }
                break;
            }
        }

        if (dataVal.AddCount !== undefined) {
            addPartials([new ValuePartial(ValueType.NUMBER, dataVal.AddCount)]);
        }

        addPartialUseRate();

        if (dataVal.RateCount !== undefined) {
            switch (func.funcType) {
                case Func.FuncType.QP_DROP_UP:
                case Func.FuncType.SERVANT_FRIENDSHIP_UP:
                case Func.FuncType.USER_EQUIP_EXP_UP:
                case Func.FuncType.EXP_UP:
                    addPartials([new ValuePartial(ValueType.PERCENT, dataVal.RateCount / 10)]);
                    break;
                default:
                    addPartials([new ValuePartial(ValueType.UNKNOWN, dataVal.RateCount)]);
            }
        }

        if (dataVal.DropRateCount !== undefined) {
            addPartials([new ValuePartial(ValueType.PERCENT, dataVal.DropRateCount / 10)]);
        }

        addPartialCount();
    }

    return partials.length ? new Descriptor(partials) : undefined;
}
