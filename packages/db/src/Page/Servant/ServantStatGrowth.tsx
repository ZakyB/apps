import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";

import { Region, Servant } from "@atlasacademy/api-connector";

import { formatNumber } from "../../Helper/OutputHelper";

import "./ServantStatGrowth.css";

interface IProps extends WithTranslation {
    region: Region;
    servant: Servant.Servant;
}

class ServantStatGrowth extends React.Component<IProps> {
    render() {
        const t = this.props.t;
        let { hpGrowth, lvMax, atkGrowth, growthCurve } = this.props.servant,
            growthCurveName: string;
        switch (growthCurve) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 9999:
                growthCurveName = t("Curve Linear");
                break;
            case 6:
            case 7:
            case 8:
            case 9:
            case 10:
                growthCurveName = t("Curve Reverse S");
                break;
            case 11:
            case 12:
            case 13:
            case 14:
            case 15:
                growthCurveName = t("Curve S");
                break;
            case 21:
            case 22:
            case 23:
            case 24:
            case 25:
                growthCurveName = t("Curve Semi Reverse S");
                break;
            case 26:
            case 27:
            case 28:
            case 29:
            case 30:
                growthCurveName = t("Curve Semi S");
                break;
            default:
                growthCurveName = t("Unknown");
        }
        return (
            <div>
                <div className="growth-curve-name">
                    <b>{t("Growth Curve")}:</b> {growthCurveName}
                </div>
                <HighchartsReact
                    highcharts={Highcharts}
                    options={{
                        title: { text: `` },
                        plotOptions: {
                            line: {
                                crisp: false,
                                getExtremesFromAll: true,
                                marker: { enabled: false },
                            },
                        },
                        series: [
                            {
                                type: "line",
                                data: hpGrowth,
                                name: t("HP"),
                                yAxis: 0,
                                tooltip: {
                                    pointFormatter: function () {
                                        let { x, y } = this as any;
                                        return (
                                            `${t("HP")}: <b>${formatNumber(y)}</b>` +
                                            (x > lvMax ? ` (${t("Grailed")})` : "") +
                                            `<br/>`
                                        );
                                    },
                                },
                                zones: [
                                    {
                                        value: hpGrowth[lvMax],
                                    },
                                    { color: "#C70039" },
                                ],
                                pointStart: 1,
                            },
                            {
                                type: "line",
                                data: atkGrowth,
                                name: t("ATK"),
                                yAxis: 0,
                                tooltip: {
                                    pointFormatter: function () {
                                        let { x, y } = this as any;
                                        return (
                                            `${t("ATK")}: <b>${formatNumber(y)}</b>` +
                                            (x > lvMax ? ` (${t("Grailed")})` : "") +
                                            `<br/>`
                                        );
                                    },
                                },
                                zones: [
                                    {
                                        value: atkGrowth[lvMax],
                                    },
                                    { color: "#C70039" },
                                ],
                                pointStart: 1,
                            },
                        ],
                        credits: false,
                        chart: { zoomType: "x" },
                        xAxis: [
                            {
                                title: { text: t("Level") },
                                crosshair: {
                                    dashStyle: "Dash",
                                },
                            },
                        ],
                        yAxis: [
                            {
                                title: { text: undefined },
                                min: 0,
                            },
                        ],
                        tooltip: {
                            shared: true,
                            useHTML: true,
                            headerFormat: `<span style="font-size: 12px">${t("Level")} <b>{point.key}</b></span><br/>`,
                        },
                    }}
                />
            </div>
        );
    }
}

export default withTranslation()(ServantStatGrowth);
