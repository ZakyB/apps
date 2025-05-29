import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Quest, Region, Script } from "@atlasacademy/api-connector";

import { CompareRegion, ScriptSource } from "../../Component/Script";
import { QuestDescriptionNoApi } from "../../Descriptor/QuestDescriptor";
import ScriptDescriptor, { getScriptType } from "../../Descriptor/ScriptDescriptor";
import { lang } from "../../Setting/Manager";
import localScript from "../../../../../localdata/scripts/0300080010.json";
interface QuestWarDescriptorProps {
    region: Region;
    quest: Quest.Quest;
    questPhase: number;
}

const QuestWarDescriptor = ({ region, quest, questPhase }: QuestWarDescriptorProps) => {
    const { t } = useTranslation();
    return (
        <>
            <Link to={`/${region}/war/${quest.warId}`}>
                {t("War")} {quest.warId} <span lang={lang(region)}>{quest.warLongName}</span>
            </Link>
            {" — "}
            <QuestDescriptionNoApi region={region} quest={quest} questPhase={questPhase} showType={false} />
        </>
    );
};

interface questListComponentProps {
    scriptData: Script.Script;
    scriptPhase: number | undefined;
    region: Region;
    scriptId: string;
    previousScript?: string;
    nextScript?: string;
    firstScriptInWar?: boolean;
    lastScriptInWar?: boolean;
    scriptSource?: ScriptSource;
    compareSource?: CompareRegion;
}

export const QuestListComponent = ({
    scriptData,
    scriptPhase,
    region,
    scriptId,
    previousScript,
    nextScript,
    firstScriptInWar,
    lastScriptInWar,
    scriptSource,
    compareSource,
}: questListComponentProps): JSX.Element => {
    const { t } = useTranslation();
    return (
        <>
            <tr>
                <th>{scriptData.quests.length === 1 ? t("Quest") : t("Quests")}</th>
                <td colSpan={3}>
                    {scriptData.quests.length === 1 ? (
                        <QuestWarDescriptor
                            region={region}
                            quest={scriptData.quests[0]}
                            questPhase={scriptPhase ?? 1}
                        />
                    ) : (
                        <ul className="mb-0">
                            {scriptData.quests.map((quest) => (
                                <li key={quest.id}>
                                    <QuestWarDescriptor region={region} quest={quest} questPhase={scriptPhase ?? 1} />
                                </li>
                            ))}
                        </ul>
                    )}
                </td>
            </tr>
            {scriptPhase === undefined ? null : (
                <tr>
                    <th>{t("Phase")}</th>
                    <td colSpan={3}>{scriptPhase}</td>
                </tr>
            )}
            <tr>
                <th>{t("Script Type")}</th>
                <td colSpan={3}>{getScriptType(scriptId)}</td>
            </tr>
            <tr>
                <th>{t("Previous Script")}</th>
                <td className="script-nav-link">
                    {previousScript === undefined ? (
                        t("N/A") + `${firstScriptInWar ? `: ${t("This is the first script in this war")}` : ""}`
                    ) : (
                        <ScriptDescriptor
                            region={region}
                            scriptId={previousScript}
                            scriptType=""
                            scriptSource={scriptSource}
                            compareSource={compareSource}
                        />
                    )}
                </td>
                <th className="w-25">{t("Next Script")}</th>
                <td className="script-nav-link">
                    {nextScript === undefined ? (
                        t("N/A") + `${lastScriptInWar ? `: ${t("This is the last script in this war")}` : ""}`
                    ) : (
                        <ScriptDescriptor
                            region={region}
                            scriptId={nextScript}
                            scriptType=""
                            scriptSource={scriptSource}
                            compareSource={compareSource}
                        />
                    )}
                </td>
            </tr>
        </>
    );
};
