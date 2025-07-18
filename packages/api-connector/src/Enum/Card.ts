import { Trait } from "../Schema/Trait";

enum Card {
    NONE = "none",
    BUSTER = "buster",
    ARTS = "arts",
    QUICK = "quick",
    EXTRA = "extra",
    BLANK = "blank",
    WEAK = "weak",
    STRENGTH = "strength",
    WEAKALT1 = "weakalt1",
    WEAKALT2 = "weakalt2",
    BUSTERALT1 = "busteralt1",
    ADDATTACK2 = "addattack2",
}

export enum AttackType {
    ONE = "one",
    ALL = "all",
}

export default Card;

export interface CardConstant {
    individuality: Trait[];
    adjustAtk: number;
    adjustTdGauge: number;
    adjustCritical: number;
    addAtk: number;
    addTdGauge: number;
    addCritical: number;
}

export type CardConstantMap = {
    [key in Card]?: {
        [key in number]?: CardConstant;
    };
};
