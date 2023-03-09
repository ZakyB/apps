import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { ClassName, Gift, Item, Quest, Region, Servant, War } from "@atlasacademy/api-connector";
import { toTitleCase } from "@atlasacademy/api-descriptor";

import Api from "../Api";
import { CollapsibleLight } from "../Component/CollapsibleContent";
import { areIdenticalArrays, isSubset } from "../Helper/ArrayHelper";
import { Renderable, mergeElements } from "../Helper/OutputHelper";
import useEnumList from "../Hooks/useEnumList";
import BuffTypeDescription from "./BuffTypeDescription";
import { funcDescriptions } from "./Func/handleActionSection";
import GiftDescriptor from "./GiftDescriptor";
import { IconDescriptorMap, ItemDescriptorId } from "./ItemDescriptor";
import { QuestDescriptorId } from "./QuestDescriptor";
import ServantDescriptorId from "./ServantDescriptorId";
import TraitDescription from "./TraitDescription";
import WarDescriptor from "./WarDescriptor";

export const missionRange = (missions: number[]) => {
    const max = Math.max(...missions);
    const min = Math.min(...missions);
    const missionSet = new Set(missions);
    let ranges: number[][] = [];
    let currentRange: number[] = [min];
    for (let i = min + 1; i <= max; i++) {
        if (missionSet.has(i)) {
            if (currentRange.length > 0) {
                currentRange.push(i);
            } else {
                currentRange = [i];
            }
        } else {
            if (currentRange.length > 0) {
                ranges.push(currentRange);
                currentRange = [];
            }
        }
    }
    ranges.push(currentRange);
    return ranges
        .map((range) => {
            const first = range[0];
            const last = range[range.length - 1];
            if (first === last) {
                return `${first}`;
            } else {
                return `${first}–${last}`;
            }
        })
        .join(", ");
};

export const MergeElementsOr = (props: { elements: Renderable[]; lastJoinWord: string }) => {
    const { elements, lastJoinWord } = props;
    if (elements.length === 1) return <>{elements[0]}</>;

    return (
        <>
            {mergeElements(elements.slice(0, elements.length - 1), ", ")} {lastJoinWord} {elements[elements.length - 1]}
        </>
    );
};

export const MultipleQuests = (props: {
    region: Region;
    questIds: number[];
    quests?: Map<number, Quest.QuestBasic>;
    maxNumQuestsShown?: number;
}) => {
    const numQuest = props.questIds.length,
        maxNumQuestsShown = props.maxNumQuestsShown ?? 10;
    if (numQuest === 1) {
        return (
            <QuestDescriptorId
                region={props.region}
                questId={props.questIds[0]}
                quests={props.quests}
                showType={false}
            />
        );
    } else {
        const questList = (
            <ul style={{ marginBottom: 0 }}>
                {props.questIds.map((questId) => {
                    return (
                        <li key={questId}>
                            <QuestDescriptorId
                                region={props.region}
                                questId={questId}
                                quests={props.quests}
                                showType={false}
                            />
                        </li>
                    );
                })}
            </ul>
        );
        if (numQuest < maxNumQuestsShown) {
            return questList;
        } else {
            return (
                <CollapsibleLight
                    title={`These ${numQuest} quests`}
                    content={questList}
                    eventKey={props.questIds.map((q) => q.toString()).join("-")}
                    defaultActiveKey={""}
                />
            );
        }
    }
};

export const MultipleTraits = (props: { region: Region; traitIds: number[]; lastJoinWord?: string }) => {
    const renderedTraits = props.traitIds.map((traitId) => (
        <TraitDescription key={traitId} region={props.region} trait={traitId} />
    ));
    return <MergeElementsOr elements={renderedTraits} lastJoinWord={props.lastJoinWord ?? "and"} />;
};

export const gemIds = [6001, 6002, 6003, 6004, 6005, 6006, 6007];
export const magicGemIds = [6101, 6102, 6103, 6104, 6105, 6106, 6107];
export const secretGemIds = [6201, 6202, 6203, 6204, 6205, 6206, 6207];
export const pieceIds = [7001, 7002, 7003, 7004, 7005, 7006, 7007];
export const monumentIds = [7101, 7102, 7103, 7104, 7105, 7106, 7107];

const shortItemNames = [
    {
        ids: gemIds,
        name: "Gem",
    },
    {
        ids: magicGemIds,
        name: "Magic Gem",
    },
    {
        ids: secretGemIds,
        name: "Secret Gem",
    },
    {
        ids: pieceIds,
        name: "Piece",
    },
    {
        ids: monumentIds,
        name: "Monument",
    },
];

export const MultipleItems = (props: { region: Region; itemIds: number[]; items?: Map<number, Item.Item> }) => {
    let toRenderItemIds = props.itemIds;
    const shortNames: Renderable[] = [];
    for (const shortItemName of shortItemNames) {
        if (isSubset(props.itemIds, shortItemName.ids)) {
            shortNames.push(shortItemName.name);
            toRenderItemIds = toRenderItemIds.filter((itemId) => !shortItemName.ids.includes(itemId));
        }
    }
    const renderedItems = toRenderItemIds.map((itemId) => {
        if (props.items !== undefined) {
            return <IconDescriptorMap region={props.region} itemId={itemId} items={props.items} />;
        } else {
            return <ItemDescriptorId region={props.region} itemId={itemId} />;
        }
    });
    return <MergeElementsOr elements={shortNames.concat(renderedItems)} lastJoinWord="or" />;
};

export const MultipleServants = (props: {
    region: Region;
    servantIds: number[];
    servants?: Map<number, Servant.ServantBasic>;
}) => {
    const renderedServants = props.servantIds.map((servantId) => (
        <ServantDescriptorId key={servantId} region={props.region} id={servantId} servants={props.servants} />
    ));
    return <MergeElementsOr elements={renderedServants} lastJoinWord="or" />;
};

const EMBER_IDS = [
    { svtIds: [9701500, 9701400, 9701300, 9701200, 9701100], class: ClassName.SABER },
    { svtIds: [9702500, 9702400, 9702300, 9702200, 9702100], class: ClassName.LANCER },
    { svtIds: [9703500, 9703400, 9703300, 9703200, 9703100], class: ClassName.ARCHER },
    { svtIds: [9704500, 9704400, 9704300, 9704200, 9704100], class: ClassName.RIDER },
    { svtIds: [9705500, 9705400, 9705300, 9705200, 9705100], class: ClassName.CASTER },
    { svtIds: [9706500, 9706400, 9706300, 9706200, 9706100], class: ClassName.ASSASSIN },
    {
        svtIds: [9707500, 9707400, 9707300, 9707200, 9707100],
        class: ClassName.BERSERKER,
    },
    { svtIds: [9770500, 9770400, 9770300, 9770200, 9770100], class: ClassName.ALL },
];

const ALL_EMBERS_STRING = "Hellfire of Wisdom, Blaze of Wisdom, Fire of Wisdom, Light of Wisdom, or Ember of Wisdom";

export const MultipleEmbers = (props: { region: Region; svtIds: number[] }) => {
    const { region, svtIds } = props;
    const emberClasses: ClassName[] = [];
    for (const emberId of EMBER_IDS) {
        if (isSubset(svtIds, emberId.svtIds)) {
            emberClasses.push(emberId.class);
        }
    }
    if (
        emberClasses.length === EMBER_IDS.length &&
        svtIds.length === EMBER_IDS.map((e) => e.svtIds.length).reduce((a, b) => a + b, 0)
    ) {
        return <>{ALL_EMBERS_STRING}</>;
    }
    if (svtIds.length === 4 * emberClasses.length) {
        const classNames = emberClasses.map((className) =>
            className === ClassName.ALL ? "All" : toTitleCase(className.toString()) + "s"
        );
        return (
            <>
                {ALL_EMBERS_STRING} of <MergeElementsOr elements={classNames} lastJoinWord="or" />
            </>
        );
    }
    return <MultipleServants region={region} servantIds={svtIds} />;
};

export const MultipleClasses = (props: { classIds: number[]; classes?: { [key: string]: ClassName } }) => {
    const classNames = props.classIds.map((classId) => {
        const className = props.classes ? props.classes[classId.toString()]?.toString() : undefined;
        return toTitleCase(className ?? classId.toString());
    });
    return (
        <>
            <MergeElementsOr elements={classNames} lastJoinWord="or" /> class
        </>
    );
};

export const MultipleQuestTypes = (props: { questTypeIds: number[]; enums?: { [key: string]: Quest.QuestType } }) => {
    const questTypes = props.questTypeIds.map((questTypeId) => {
        const questType = props.enums ? props.enums[questTypeId.toString()]?.toString() : undefined;
        return toTitleCase(questType ?? `quest type ${questTypeId}`);
    });
    return <MergeElementsOr elements={questTypes} lastJoinWord="or" />;
};

export const MultipleWars = ({ region, warIds }: { region: Region; warIds: number[] }) => {
    const [warList, setWarList] = useState([] as War.WarBasic[]);

    useEffect(() => {
        Api.warList().then((wars) => setWarList(wars));
    }, []);

    const wars = warIds.map((warId) => {
        const war = warList.find((war) => war.id === warId);
        if (war !== undefined) {
            return <WarDescriptor region={region} war={war} />;
        } else {
            return <>War {warId}</>;
        }
    });

    return <MergeElementsOr elements={wars} lastJoinWord="or" />;
};

const PLAYABLE_CLASS_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 23, 25];

export const MultipleClassLevels = (props: {
    targetIds: number[];
    classes?: { [key: string]: ClassName };
    plural?: boolean;
}) => {
    const { targetIds, classes, plural } = props;
    const pluralSuffix = plural ? "s" : "";

    const classIds = targetIds.filter((_, i) => i % 2 === 0),
        levels = new Set(targetIds.filter((_, i) => i % 2 === 1));

    classIds.sort((a, b) => a - b);

    if (areIdenticalArrays(classIds, PLAYABLE_CLASS_IDS) && levels.size === 1) {
        return (
            <>
                servant{pluralSuffix} to level {targetIds[1]}
            </>
        );
    }

    const classLevels: string[] = [];
    for (let i = 0; i < targetIds.length; i += 2) {
        const classId = targetIds[i],
            level = targetIds[i + 1],
            className = classes ? classes[classId.toString()]?.toString() : undefined,
            classString = toTitleCase(className ?? classId.toString());
        classLevels.push(`Lv. ${level} ${classString}${pluralSuffix}`);
    }
    return <MergeElementsOr elements={classLevels} lastJoinWord="or" />;
};

const splitTargetId = (targetId: number) => {
    const targetString = targetId.toString();
    return {
        first: parseInt(targetString.slice(0, targetString.length - 2)),
        second: parseInt(targetString.slice(targetString.length - 2)),
    };
};

export const MultipleClassLimits = (props: {
    targetIds: number[];
    classes?: { [key: string]: ClassName };
    plural?: boolean;
}) => {
    const { targetIds, classes, plural } = props;
    const pluralSuffix = plural ? "s" : "";

    const parsedTargets = targetIds.map((targetId) => {
            const splitted = splitTargetId(targetId);
            return { classId: splitted.first, limit: splitted.second };
        }),
        firstClassLimit = parsedTargets[0].limit,
        classIds = parsedTargets.map((target) => target.classId),
        limits = new Set(parsedTargets.map((target) => target.limit));

    classIds.sort((a, b) => a - b);

    if (areIdenticalArrays(classIds, PLAYABLE_CLASS_IDS) && limits.size === 1) {
        return (
            <>
                servant{pluralSuffix} to ascension {firstClassLimit}
            </>
        );
    }

    if (limits.size === 1) {
        const classNames = classIds.map((classId) => {
            const className = classes ? classes[classId.toString()]?.toString() : undefined;
            return toTitleCase(className ?? classId.toString()) + pluralSuffix;
        });

        return (
            <>
                <MergeElementsOr elements={classNames} lastJoinWord="or" /> to ascension {firstClassLimit}
            </>
        );
    }

    const classLimits = parsedTargets.map((target) => {
        const className = classes ? classes[target.classId.toString()]?.toString() : undefined,
            classString = toTitleCase(className ?? target.classId.toString());
        return `Ascension ${target.limit} ${classString}${pluralSuffix}`;
    });

    return <MergeElementsOr elements={classLimits} lastJoinWord="or" />;
};

export const MultipleEquipRarityLevel = (props: { targetIds: number[]; plural?: boolean }) => {
    const { targetIds, plural } = props;
    const pluralSuffix = plural ? "s" : "";

    const parsedTargets = targetIds.map((targetId) => {
            const splitted = splitTargetId(targetId);
            return { level: splitted.first, rarity: splitted.second };
        }),
        firstLevel = parsedTargets[0].level,
        rarities = parsedTargets.map((target) => target.rarity),
        levels = new Set(parsedTargets.map((target) => target.level));

    rarities.sort((a, b) => a - b);

    if (areIdenticalArrays(rarities, [1, 2, 3, 4, 5]) && levels.size === 1) {
        return (
            <>
                CE{pluralSuffix} to level {firstLevel}
            </>
        );
    }

    if (levels.size === 1) {
        const rarityStrings = rarities.map((rarity) => `${rarity}★`);

        return (
            <>
                <MergeElementsOr elements={rarityStrings} lastJoinWord="or" /> CE
                {pluralSuffix} to level {firstLevel}
            </>
        );
    }

    const classLimits = parsedTargets.map((target) => `Lv. ${target.level} ${target.rarity}★`);

    return (
        <>
            <MergeElementsOr elements={classLimits} lastJoinWord="or" /> CE
            {pluralSuffix}
        </>
    );
};

export const MultipleGifts = ({
    region,
    gifts,
    itemMap,
}: {
    region: Region;
    gifts: Gift.Gift[];
    itemMap: Map<number, Item.Item>;
}) => {
    return (
        <>
            {mergeElements(
                gifts.map((gift) => (
                    <GiftDescriptor
                        key={`${gift.objectId}-${gift.priority}`}
                        region={region}
                        gift={gift}
                        items={itemMap}
                    />
                )),
                ", "
            )}
        </>
    );
};

export const MultipleBuffIds = ({ region, buffTypeIds }: { region: Region; buffTypeIds: number[] }) => {
    const enumList = useEnumList();
    if (enumList === undefined) return null;
    return (
        <MergeElementsOr
            elements={buffTypeIds.map((buffTypeId) => {
                const buffType = enumList.NiceBuffType[buffTypeId];
                const buffTypeName = BuffTypeDescription.get(buffType) ?? buffType ?? buffTypeId.toString();
                return <Link to={`/${region}/buffs?type=${buffType}`}>[{buffTypeName}]</Link>;
            })}
            lastJoinWord="or"
        />
    );
};

export const MultipleFunctionIds = ({ region, funcTypeIds }: { region: Region; funcTypeIds: number[] }) => {
    const enumList = useEnumList();
    if (enumList === undefined) return null;
    return (
        <MergeElementsOr
            elements={funcTypeIds.map((funcTypeId) => {
                const funcType = enumList.NiceFuncType[funcTypeId];
                const funcTypeName = funcDescriptions.get(funcType) ?? funcType ?? funcTypeId.toString();
                return <Link to={`/${region}/funcs?type=${funcType}`}>[{funcTypeName}]</Link>;
            })}
            lastJoinWord="or"
        />
    );
};
