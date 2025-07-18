import axios from "axios";
import { createRef, useEffect, useState } from "react";
import { Button, ButtonGroup, ButtonToolbar, Dropdown, DropdownButton } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import { Region, Script } from "@atlasacademy/api-connector";

import Api, { AssetHost } from "../Api";
import ErrorStatus from "../Component/ErrorStatus";
import Loading from "../Component/Loading";
import RawDataViewer from "../Component/RawDataViewer";
import {
    CompareRegion,
    ScriptComponent,
    ScriptComponentType,
    ScriptComponentWrapper,
    areComparableScripts,
    countWord,
    parseScript,
} from "../Component/Script";
import ScriptTable from "../Component/ScriptTable";
import VoiceLinePlayer from "../Descriptor/VoiceLinePlayer";
import LoadStatus from "../Helper/LoadStatus";
import { getCurrentPosition } from "../Hooks/useScroll";
import Manager from "../Setting/Manager";
import ScriptMainData from "./Script/ScriptMainData";
import ShowScriptLineContext from "./Script/ShowScriptLineContext";

import classes from "./ScriptPage.module.css";
import localScriptText from "../../../../localdata/scripts/0300080010_translated.txt?raw";

const getScriptAssetURL = (region: Region, scriptId: string) => {
    let scriptPath = "";
    if (scriptId === "WarEpilogue108") {
        scriptPath = "01/WarEpilogue108";
    } else if (scriptId[0] === "0" || scriptId[0] === "9") {
        if (scriptId.slice(0, 2) === "94") {
            scriptPath = `94/${scriptId.slice(0, 4)}/${scriptId}`;
        } else {
            scriptPath = `${scriptId.slice(0, 2)}/${scriptId}`;
        }
    } else {
        scriptPath = `Common/${scriptId}`;
    }
    return `${AssetHost}/${region}/Script/${scriptPath}.txt`;
};

const getRayshiftScriptAssetURL = (scriptId: string) => {
    return `https://rayshift.io/api/v1/translate/script-ingame/${scriptId}`;
};

const getRayshiftScriptCheckURL = (scriptId: string) => {
    return `https://rayshift.io/api/v1/translate/check-ingame/${scriptId}`;
};

const getRegion = (queryData: string | null): CompareRegion | undefined => {
    if (Object.values(Region).includes(queryData as Region)) {
        return queryData as Region;
    }

    if (queryData === "rayshift") return "rayshift";

    return undefined;
};

interface ScriptLoadStatus extends LoadStatus<Script.Script> {
    script?: string;
}

const ScriptPage = ({ region, scriptId }: { region: Region; scriptId: string }) => {
    const location = useLocation(),
        searchParams = new URLSearchParams(location.search),
        useRayshiftScript = searchParams.get("scriptSource") === "rayshift",
        compareSource = getRegion(searchParams.get("compareSource"));

    const showScriptLine = Manager.showScriptLine();
    const [enableScene, setEnableScene] = useState<boolean>(Manager.scriptSceneEnabled());
    const [{ loading, data: scriptData, script, error }, setLoadStatus] = useState<ScriptLoadStatus>({
        loading: true,
    });
    const [hasRayshiftScript, setHasRayshiftScript] = useState<boolean>(false);
    const [compareScript, setCompareScript] = useState<string | undefined>(undefined);
    const [regionHasScript, setRegionHasScript] = useState<Map<Region, boolean>>(
        new Map(Object.values(Region).map((r) => [r, true]))
    );
    const { t } = useTranslation();

    useEffect(() => {
        setLoadStatus({ loading: true });
        const controller = new AbortController();
        Manager.setRegion(region);

        if (scriptId === "0300080010") {
            document.title = `[${region}] Script ${scriptId} - Atlas Academy DB`;
            Api.script(scriptId)
                .then((scriptData) => {
                    if (controller.signal.aborted) return;
                    setLoadStatus({
                        loading: false,
                        data: scriptData,
                        script: localScriptText,
                    });
                })
                .catch((e) => {
                    if (controller.signal.aborted) return;
                    setLoadStatus({ loading: false, error: e, script: "" });
                });
            return;
        }

        const rawScriptURL = useRayshiftScript
            ? getRayshiftScriptAssetURL(scriptId)
            : getScriptAssetURL(region, scriptId);

        Promise.all([axios.get<string>(rawScriptURL, { timeout: 10000 }), Api.script(scriptId)])
            .then(([rawScript, scriptData]) => {
                if (controller.signal.aborted) return;
                document.title = `[${region}] Script ${scriptId} - Atlas Academy DB`;
                setLoadStatus({ loading: false, data: scriptData, script: rawScript.data });
            })
            .catch((e) => {
                if (controller.signal.aborted) return;
                setLoadStatus({ loading: false, error: e, script: "" });
            });

        return () => {
            controller.abort();
        };
    }, [region, scriptId, useRayshiftScript]);

    useEffect(() => {
        const controller = new AbortController();

        Promise.all(
            Object.values(Region)
                .filter((r) => r !== region)
                .map((region) =>
                    Api.scriptRegion(region, scriptId)
                        .then(() => {
                            return { region, hasScript: true };
                        })
                        .catch(() => {
                            return { region, hasScript: false };
                        })
                )
        ).then((results) => {
            setRegionHasScript(new Map(results.map((r) => [r.region, r.hasScript])));
        });

        if (!useRayshiftScript) {
            axios
                .head(getRayshiftScriptCheckURL(scriptId), { timeout: 10000 })
                .then((r) => {
                    if (controller.signal.aborted) return;
                    if (r.status === 200) setHasRayshiftScript(true);
                })
                .catch(() => {
                    if (controller.signal.aborted) return;
                    setHasRayshiftScript(false);
                });
        }

        return () => {
            controller.abort();
        };
    }, [region, scriptId, useRayshiftScript]);

    useEffect(() => {
        if (compareSource === undefined) return;
        const controller = new AbortController();

        const rawScriptURL =
            compareSource === "rayshift"
                ? getRayshiftScriptAssetURL(scriptId)
                : getScriptAssetURL(compareSource, scriptId);

        axios
            .get<string>(rawScriptURL, { timeout: 10000 })
            .then((rawScript) => {
                if (controller.signal.aborted) return;
                if (rawScript.status === 200) setCompareScript(rawScript.data);
            })
            .catch(() => {
                if (controller.signal.aborted) return;
            });
        return () => {
            controller.abort();
        };
    }, [compareSource, scriptId]);

    useEffect(() => {
        const scroll = () => {
            const currentPosition = getCurrentPosition();
            const elem = document.getElementById("scroll-bar");
            if (elem !== null) elem.style.width = `${currentPosition * 100}%`;
        };
        document.addEventListener("scroll", scroll);

        return () => document.removeEventListener("scroll", scroll);
    }, []);

    if (error !== undefined) return <ErrorStatus error={error} />;

    if (loading) return <Loading />;

    if (script === "" || script === undefined || scriptData === undefined) return null;

    const parsedScript = parseScript(region, script);

    const audioUrls = [] as string[];
    let hasDialogueLines = false;
    const addAudioUrls = (component: ScriptComponent) => {
        switch (component.type) {
            case ScriptComponentType.DIALOGUE:
                if (component.voice !== undefined) audioUrls.push(component.voice.audioAsset);
                if (component.maleVoice !== undefined) audioUrls.push(component.maleVoice.audioAsset);
                hasDialogueLines = true;
                break;
            case ScriptComponentType.SOUND_EFFECT:
                audioUrls.push(component.soundEffect.audioAsset);
                break;
        }
    };

    for (const { content: component } of parsedScript.components) {
        switch (component.type) {
            case ScriptComponentType.CHOICES:
                for (const choice of component.choices) {
                    for (const choiceComponent of choice.results) {
                        addAudioUrls(choiceComponent.content);
                    }
                }
                break;
            default:
                addAudioUrls(component);
        }
    }

    const scrollRefs = new Map(audioUrls.map((url) => [url, createRef<HTMLTableRowElement>()]));
    for (const { content: component } of parsedScript.components) {
        if (component.type === ScriptComponentType.LABEL) {
            scrollRefs.set(component.name, createRef<HTMLTableRowElement>());
        }
    }

    const scrollToRow = (assetUrl: string) => {
        let rowRef = scrollRefs.get(assetUrl);
        if (rowRef !== undefined && rowRef.current !== null) {
            rowRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    const showRawData = new Map<string, ScriptComponentWrapper[]>();
    for (const component of parsedScript.components) {
        const typeName = ScriptComponentType[component.content.type],
            mapEntry = showRawData.get(typeName);
        if (mapEntry !== undefined) {
            mapEntry.push(component);
        } else {
            showRawData.set(typeName, [component]);
        }
    }
    showRawData.set("ALL_COMPONENTS", parsedScript.components);

    const availableCompareRegions: ("none" | CompareRegion)[] = (["none"] as ("none" | CompareRegion)[]).concat(
        Object.values(Region).filter((r) => r !== region && regionHasScript.get(r) === true)
    );
    if (hasRayshiftScript) availableCompareRegions.push("rayshift");

    const parsedCompareScript =
        compareSource !== undefined && compareScript !== undefined
            ? parseScript(compareSource === "rayshift" ? Region.NA : compareSource, compareScript)
            : undefined;
    const compareRegion = compareSource === "rayshift" ? Region.NA : compareSource;
    const comparableScripts =
        parsedCompareScript !== undefined && areComparableScripts(parsedScript, parsedCompareScript);

    return (
        <>
            <div id="scroll-bar" className={classes.scrollBarIndicator} style={{ width: 0 }}></div>
            <h1>
                {t("Script")} {scriptId}
            </h1>
            <br />
            <ScriptMainData
                region={region}
                scriptData={scriptData}
                wordCount={countWord(
                    region,
                    parsedScript.components.map((c) => c.content)
                )}
                goToScriptVersion={useRayshiftScript ? "original" : hasRayshiftScript ? "rayshift" : undefined}
                scriptSource={useRayshiftScript ? "rayshift" : undefined}
                compareSource={compareSource}
            >
                <ButtonToolbar className="justify-content-between">
                    <ButtonGroup className="mb-3 mx-0">
                        {hasDialogueLines ? (
                            <VoiceLinePlayer
                                audioAssetUrls={audioUrls}
                                delay={new Array(audioUrls.length).fill(0).fill(1, 1)}
                                title={t("voice lines")}
                                showTitle
                                handleNavigateAssetUrl={scrollToRow}
                            />
                        ) : null}
                        <Button
                            variant={enableScene ? "success" : "secondary"}
                            onClick={() => setEnableScene(!enableScene)}
                        >
                            {enableScene ? t("Scene Enabled") : t("Scene Disabled")}
                        </Button>
                        <Button
                            variant={showScriptLine ? "success" : "secondary"}
                            onClick={() => Manager.setShowScriptLine(!showScriptLine)}
                        >
                            {showScriptLine ? t("Line number shown") : t("Line number hidden")}
                        </Button>
                    </ButtonGroup>
                    <ButtonGroup className="mb-3 mx-0">
                        <RawDataViewer
                            text={t("Parsed Script")}
                            data={Object.fromEntries(showRawData)}
                            block={false}
                            url={getScriptAssetURL(region, scriptId)}
                        />
                        {availableCompareRegions.length > 1 && (
                            <DropdownButton as={ButtonGroup} id="compare-dropdown" title={t("Compare script")}>
                                {availableCompareRegions.map((r) => (
                                    <Dropdown.Item
                                        key={r}
                                        eventKey={r}
                                        as={Link}
                                        to={`/${region}/script/${scriptId}${r === "none" ? "" : `?compareSource=${r}`}`}
                                        active={compareSource === r || (compareSource === undefined && r === "none")}
                                    >
                                        {r === "none"
                                            ? t("None")
                                            : r === "rayshift"
                                              ? t("Rayshift (Unofficial translation)")
                                              : r}
                                    </Dropdown.Item>
                                ))}
                            </DropdownButton>
                        )}
                    </ButtonGroup>
                </ButtonToolbar>
                <ShowScriptLineContext.Provider value={showScriptLine}>
                    {parsedCompareScript !== undefined && compareRegion !== undefined && !comparableScripts ? (
                        <div className="d-flex">
                            <div className="w-50pct">
                                <ScriptTable
                                    halfWidth
                                    region={region}
                                    script={parsedScript}
                                    showScene={enableScene}
                                    refs={scrollRefs}
                                />
                            </div>
                            <div className="w-50pct">
                                <ScriptTable
                                    halfWidth
                                    region={compareRegion}
                                    script={parsedCompareScript}
                                    showScene={enableScene}
                                    refs={scrollRefs}
                                />
                            </div>
                        </div>
                    ) : (
                        <ScriptTable
                            region={region}
                            script={parsedScript}
                            showScene={enableScene}
                            refs={scrollRefs}
                            compareScript={
                                compareSource !== undefined && compareRegion !== undefined && comparableScripts
                                    ? { region: compareRegion, script: parsedCompareScript }
                                    : undefined
                            }
                        />
                    )}
                </ShowScriptLineContext.Provider>
            </ScriptMainData>
        </>
    );
};

export default ScriptPage;
