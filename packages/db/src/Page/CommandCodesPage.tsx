import { AxiosError } from "axios";
import Fuse from "fuse.js";
import React from "react";
import { Button, ButtonGroup, Col, Form, Row, Table } from "react-bootstrap";
import { WithTranslation, withTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { CommandCode, Region } from "@atlasacademy/api-connector";

import Api from "../Api";
import ErrorStatus from "../Component/ErrorStatus";
import FaceIcon from "../Component/FaceIcon";
import Loading from "../Component/Loading";
import RarityDescriptor from "../Descriptor/RarityDescriptor";
import { preventDefault } from "../Helper/Form";
import { fuseGetFn, removeDiacriticalMarks } from "../Helper/StringHelper";
import Manager, { lang } from "../Setting/Manager";

import "./ListingPage.css";

interface ChangeEvent extends React.ChangeEvent<HTMLInputElement> {}

interface IProps extends WithTranslation {
    region: Region;
}

interface IState {
    error?: AxiosError;
    loading: boolean;
    commandCodes: CommandCode.CommandCodeBasic[];
    activeRarityFilters: number[];
    search?: string;
    fuse: Fuse<CommandCode.CommandCodeBasic>;
}

class CommandCodesPage extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            loading: true,
            commandCodes: [],
            activeRarityFilters: [],
            fuse: new Fuse([]),
        };
    }

    componentDidMount() {
        Manager.setRegion(this.props.region);
        document.title = `[${this.props.region}] Command Codes - Atlas Academy DB`;
        Api.commandCodeList()
            .then((commandCodes) =>
                this.setState({
                    commandCodes,
                    loading: false,
                    fuse: new Fuse([...commandCodes], {
                        keys: ["id", "collectionNo", "name"],
                        threshold: 0.2,
                        getFn: fuseGetFn,
                        ignoreLocation: true,
                    }),
                })
            )
            .catch((error) => this.setState({ error }));
    }

    private toggleRarityFilter(rarity: number): void {
        if (this.state.activeRarityFilters.includes(rarity)) {
            this.setState({
                activeRarityFilters: this.state.activeRarityFilters.filter((activeRarity) => activeRarity !== rarity),
            });
        } else {
            this.setState({
                activeRarityFilters: [...this.state.activeRarityFilters, rarity],
            });
        }
    }

    private commandCodes(): CommandCode.CommandCodeBasic[] {
        let list = this.state.commandCodes.slice().reverse();

        if (this.state.activeRarityFilters.length > 0) {
            list = list.filter((entity) => {
                return this.state.activeRarityFilters.includes(entity.rarity);
            });
        }

        if (this.state.search) {
            const matchedFuzzyIds = new Set(
                this.state.fuse.search(removeDiacriticalMarks(this.state.search)).map((doc) => doc.item.id)
            );
            list = list.filter((entity) => matchedFuzzyIds.has(entity.id));
        }

        return list;
    }

    render() {
        if (this.state.error) return <ErrorStatus error={this.state.error} />;

        if (this.state.loading) return <Loading />;

        const t = this.props.t;
        return (
            <div id="command-codes" className="listing-page">
                <Row>
                    <Col sm={6} md={5} id="item-rarity">
                        <ButtonGroup>
                            {[...new Set(this.state.commandCodes.map((s) => s.rarity))]
                                // deduplicate star counts
                                .sort((a, b) => a - b)
                                // sort
                                .map((rarity) => (
                                    <Button
                                        variant={
                                            this.state.activeRarityFilters.includes(rarity) ? "success" : "outline-dark"
                                        }
                                        key={rarity}
                                        onClick={(_) => this.toggleRarityFilter(rarity)}
                                    >
                                        {rarity} ★
                                    </Button>
                                ))}
                        </ButtonGroup>
                    </Col>
                    <Col sm={6} md={3} id="item-search">
                        <Form inline onSubmit={preventDefault}>
                            <Form.Control
                                placeholder={t("Search")}
                                value={this.state.search ?? ""}
                                onChange={(ev: ChangeEvent) => {
                                    this.setState({ search: ev.target.value });
                                }}
                                lang={lang(this.props.region)}
                            />
                        </Form>
                    </Col>
                </Row>

                <hr />

                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th className="col-center">#</th>
                            <th className="col-center text-nowrap">{t("Thumbnail")}</th>
                            <th>{t("Name")}</th>
                            <th className="rarity-col">{t("Rarity")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.commandCodes().map((commandCode) => {
                            const route = `/${this.props.region}/command-code/${commandCode.collectionNo}`;

                            return (
                                <tr key={commandCode.id}>
                                    <td className="col-center">
                                        <Link to={route}>{commandCode.collectionNo}</Link>
                                    </td>
                                    <td className="col-center">
                                        <Link to={route}>
                                            <FaceIcon
                                                rarity={commandCode.rarity}
                                                location={commandCode.face}
                                                height={50}
                                            />
                                        </Link>
                                    </td>
                                    <td>
                                        <Link to={route} lang={lang(this.props.region)}>
                                            {commandCode.name}
                                        </Link>
                                    </td>
                                    <td className="rarity-col">
                                        <RarityDescriptor rarity={commandCode.rarity} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </div>
        );
    }
}

export default withTranslation()(CommandCodesPage);
