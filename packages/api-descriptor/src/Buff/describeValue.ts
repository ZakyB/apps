import { Buff, DataVal } from "@atlasacademy/api-connector";

import CardReferencePartial from "../Card/CardReferencePartial";
import { BasePartial, Descriptor, ParticlePartial, TextPartial, ValuePartial, ValueType } from "../Descriptor";
import SkillReferencePartial from "../Skill/SkillReferencePartial";
import TraitReferencePartial from "../Trait/TraitReferencePartial";
import { BuffTriggerType, buffTriggerTypes } from "./BuffTypes";
import {
    BuffValueCommandCardType,
    BuffValueTraitType,
    buffValueCommandCardTypes,
    buffValuePercentTypes,
    buffValueTraitTypes,
} from "./BuffValueTypes";

export default function (buff: Buff.Buff, dataVal?: DataVal.DataVal): Descriptor | undefined {
    const buffValuePercentType = buffValuePercentTypes.get(buff.type);
    if (buffValuePercentType) {
        return describeDataVal(
            dataVal ?? {},
            buffValuePercentType.value,
            ValueType.PERCENT,
            Math.pow(10, buffValuePercentType.power)
        );
    }

    const buffTriggerType = buffTriggerTypes.get(buff.type);
    if (buffTriggerType) {
        return describeTriggerValue(dataVal ?? {}, buffTriggerType);
    }

    const buffValueTraitType = buffValueTraitTypes.get(buff.type);
    if (buffValueTraitType) {
        return describeTraitValue(dataVal ?? {}, buffValueTraitType);
    }

    const buffValueCommandCardType = buffValueCommandCardTypes.get(buff.type);
    if (buffValueCommandCardType) {
        return describeCommandcardValue(dataVal ?? {}, buffValueCommandCardType);
    }

    return describeDataVal(dataVal ?? {}, DataVal.DataValField.VALUE, ValueType.NUMBER, 1);
}

function describeCommandcardValue(
    dataVal: DataVal.DataVal,
    commandCardType: BuffValueCommandCardType
): Descriptor | undefined {
    const partials: BasePartial[] = [],
        card = dataVal[commandCardType.card];

    if (typeof card === "number") {
        partials.push(new CardReferencePartial(card));
    }

    return partials.length > 0 ? new Descriptor(partials) : undefined;
}

function describeDataVal(
    dataVal: DataVal.DataVal,
    valueField: DataVal.DataValField,
    valueType: ValueType,
    base: number
): Descriptor | undefined {
    const partials: BasePartial[] = [];

    const value = dataVal[valueField],
        paramAdd = dataVal.ParamAdd,
        paramMax = dataVal.ParamMax;
    if (typeof value === "number" && paramAdd === undefined && paramMax === undefined) {
        partials.push(new ValuePartial(valueType, value / base));
    }

    const maxScaleValue = dataVal.RatioHPLow,
        minScaleValue = dataVal.RatioHPHigh ?? 0;
    if (maxScaleValue !== undefined) {
        if (partials.length) partials.push(new ParticlePartial(" + "));

        partials.push(new ValuePartial(ValueType.NUMBER, minScaleValue / base));
        partials.push(new ParticlePartial("–"));
        partials.push(new ValuePartial(valueType, maxScaleValue / base));
    }

    if (typeof value === "number" && paramAdd !== undefined && paramMax !== undefined) {
        partials.push(new ValuePartial(ValueType.NUMBER, value / base));
        partials.push(new ParticlePartial("–"));
        partials.push(new ValuePartial(valueType, paramMax / base));
        partials.push(new ParticlePartial(", "));
        partials.push(new ValuePartial(valueType, paramAdd / base));
        partials.push(new ParticlePartial("/Turn"));
    }

    if (typeof value !== "number" && paramAdd !== undefined && paramMax !== undefined) {
        partials.push(new ParticlePartial("Up to "));
        partials.push(new ValuePartial(valueType, paramMax / base));
        partials.push(new ParticlePartial(", "));
        partials.push(new ValuePartial(valueType, paramAdd / base));
        partials.push(new ParticlePartial("/Turn"));
    }

    if (
        dataVal.ParamAddValue !== undefined &&
        dataVal.ParamAddSelfIndividuality === undefined &&
        dataVal.ParamAddOpIndividuality === undefined &&
        dataVal.ParamAddFieldIndividuality === undefined
    ) {
        partials.push(new ValuePartial(valueType, dataVal.ParamAddValue / base));
        partials.push(new ParticlePartial(" /Stack"));
    }

    if (dataVal.BattlePointValue) {
        partials.push(dataVal.BattlePointValue);
    }

    return partials.length > 0 ? new Descriptor(partials) : undefined;
}

function describeTraitValue(dataVal: DataVal.DataVal, traitType: BuffValueTraitType): Descriptor | undefined {
    const partials: BasePartial[] = [],
        trait = dataVal[traitType.trait];

    if (typeof trait === "number") {
        partials.push(new TraitReferencePartial(trait));
    }

    return partials.length > 0 ? new Descriptor(partials) : undefined;
}

function describeTriggerValue(dataVal: DataVal.DataVal, triggerType: BuffTriggerType): Descriptor | undefined {
    const partials: BasePartial[] = [],
        skill = dataVal[triggerType.skill ?? DataVal.DataValField.VALUE],
        level = dataVal[triggerType.level ?? DataVal.DataValField.VALUE2];
    // position = triggerType.position ? dataVal[triggerType.position] : undefined,
    // rate = triggerType.rate ? dataVal[triggerType.rate] : undefined;

    if (typeof skill === "number") {
        if (partials.length) partials.push(new ParticlePartial(" + "));

        partials.push(new SkillReferencePartial(skill));
    }

    if (typeof level === "number") {
        if (partials.length) partials.push(new ParticlePartial(" + "));

        partials.push(new TextPartial("Lv.\u00A0"));
        partials.push(new ValuePartial(ValueType.UNKNOWN, level));
    }

    // This section is unneeded now that UseRate description is handled outside.
    // if (typeof rate === "number") {
    //     if (partials.length)
    //         partials.push(new ParticlePartial(' + '));

    //     partials.push(new TextPartial('Chance: '));
    //     partials.push(new ValuePartial(ValueType.PERCENT, rate / 10));
    // }

    return partials.length > 0 ? new Descriptor(partials) : undefined;
}
