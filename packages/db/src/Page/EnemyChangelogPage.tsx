import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Quest, Region } from "@atlasacademy/api-connector";

import Api from "../Api";
import ErrorStatus from "../Component/ErrorStatus";
import Loading from "../Component/Loading";
import QuestPhaseTable from "../Component/QuestPhaseTable";
import Manager from "../Setting/Manager";

import "./ListingPage.css";

const EnemyChangelogPage = ({ region }: { region: Region }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<AxiosError | undefined>(undefined);
    const [quests, setQuests] = useState<Quest.QuestPhaseBasic[]>([]);

    useEffect(() => {
        const controller = new AbortController();
        Manager.setRegion(region);
        Api.questEnemyChangelog()
            .then((quests) => {
                if (controller.signal.aborted) return;
                setQuests(quests);
                setLoading(false);
            })
            .catch((error) => {
                if (controller.signal.aborted) return;
                setError(error);
            });
        return () => {
            controller.abort();
        };
    }, [region]);

    if (loading) return <Loading />;

    if (error !== undefined) return <ErrorStatus error={error} />;

    return (
        <div className="listing-page">
            <h3>{t("EnemyChangelogPageTitle")}</h3>
            <br />
            <QuestPhaseTable region={region} quests={quests} />
        </div>
    );
};

export default EnemyChangelogPage;
