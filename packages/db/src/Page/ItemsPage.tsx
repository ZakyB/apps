import { AxiosError } from "axios";
import Fuse from "fuse.js";
import React from "react";
import { Col, Form, Pagination, Row, Tab, Table, Tabs } from "react-bootstrap";
import { WithTranslation, withTranslation } from "react-i18next";
import { withRouter } from "react-router";
import { Link, RouteComponentProps } from "react-router-dom";

import { Item, Region } from "@atlasacademy/api-connector";

import Api from "../Api";
import ErrorStatus from "../Component/ErrorStatus";
import ItemIcon from "../Component/ItemIcon";
import Loading from "../Component/Loading";
import { preventDefault } from "../Helper/Form";
import { fuseGetFn, removeDiacriticalMarks } from "../Helper/StringHelper";
import Manager, { lang } from "../Setting/Manager";

import "./ItemsPage.css";
import "./ListingPage.css";

interface ChangeEvent extends React.ChangeEvent<HTMLInputElement> {}

interface IProps extends RouteComponentProps, WithTranslation {
    region: Region;
    tab?: string;
}

interface IState {
    error?: AxiosError;
    loading: boolean;
    itemList: Item.Item[];
    perPage: number;
    page: number;
    search?: string;
    tabs: PaginatedTab[];
    fuse: Fuse<Item.Item>;
}

interface PaginatedTab {
    key: string;
    title: string;
    items: Item.Item[];
}

let EVENT_ITEM_TYPES = [
    Item.ItemType.EVENT_ITEM,
    Item.ItemType.EVENT_POINT,
    Item.ItemType.RP_ADD,
    Item.ItemType.BOOST_ITEM,
    Item.ItemType.DICE,
];

class ItemsPage extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            loading: true,
            itemList: [],
            perPage: 100,
            tabs: [],
            page: 0,
            fuse: new Fuse([]),
        };
    }

    componentDidMount() {
        Manager.setRegion(this.props.region);
        document.title = `[${this.props.region}] Items - Atlas Academy DB`;

        Api.itemList()
            .then((itemList) =>
                this.setState({
                    itemList,
                    tabs: this.createTabs(itemList),
                    loading: false,
                    fuse: new Fuse([...itemList], {
                        keys: ["id", "name"],
                        threshold: 0.2,
                        getFn: fuseGetFn,
                        ignoreLocation: true,
                    }),
                })
            )
            .catch((error) => this.setState({ error }));
    }

    componentDidUpdate(prevProps: Readonly<IProps>, prevState: Readonly<IState>) {
        // reset the search page, should the tab or search term change
        if (prevProps.tab !== this.props.tab || prevState.search !== this.state.search) this.setPage(0);
    }

    private pageItem(label: string, page: number, key: string | number, active: boolean, disabled: boolean) {
        return (
            <li key={key} className={"page-item" + (active ? " active" : "") + (disabled ? " disabled" : "")}>
                {disabled ? (
                    <span className={"page-link"}>{label}</span>
                ) : (
                    <button
                        className={"page-link"}
                        onClick={(e) => {
                            e.preventDefault();
                            this.setPage(page);
                        }}
                    >
                        {label}
                    </button>
                )}
            </li>
        );
    }

    private paginator(count: number): JSX.Element {
        const items = [],
            maxPage = Math.ceil(count / this.state.perPage) - 1,
            bounds = 2,
            nearbyPrev = [],
            nearbyNext = [],
            nearbyCount = bounds * 2 + 1;

        for (let i = 0; i < bounds * 2; i++) {
            const prev = this.state.page - i - 1;
            if (prev >= 0) {
                nearbyPrev.unshift(prev);
            }

            const next = this.state.page + i + 1;
            if (next <= maxPage) {
                nearbyNext.push(next);
            }
        }

        while (nearbyPrev.length + nearbyNext.length + 1 > nearbyCount) {
            if (nearbyNext.length > nearbyPrev.length) {
                nearbyNext.pop();
            } else {
                nearbyPrev.shift();
            }
        }

        const pages = nearbyPrev.concat([this.state.page], nearbyNext);

        items.push(this.pageItem("<", this.state.page - 1, "prev", false, this.state.page <= 0));

        if (pages[0] > 0) {
            items.push(this.pageItem("1", 0, "first", false, false));

            if (pages[0] > 1) items.push(this.pageItem("…", 0, "firstEllipsis", false, true));
        }

        items.push(...pages.map((i) => this.pageItem((i + 1).toString(), i, i, i === this.state.page, false)));

        if (pages[pages.length - 1] < maxPage) {
            items.push(this.pageItem("…", maxPage, "lastEllipsis", false, true));

            if (pages[pages.length - 1] < maxPage)
                items.push(this.pageItem((maxPage + 1).toString(), maxPage, "last", false, false));
        }

        items.push(this.pageItem(">", this.state.page + 1, "next", false, this.state.page >= maxPage));

        return <Pagination>{items}</Pagination>;
    }

    private setPage(page: number) {
        this.setState({ page });
    }

    private isServantMaterial(itemType: Item.ItemType, itemUses: Item.ItemUse[]): boolean {
        return (
            (itemType === Item.ItemType.SKILL_LV_UP &&
                (itemUses.includes(Item.ItemUse.SKILL) || itemUses.includes(Item.ItemUse.APPEND_SKILL))) ||
            ((itemType === Item.ItemType.TD_LV_UP || itemType === Item.ItemType.EVENT_ITEM) &&
                itemUses.includes(Item.ItemUse.ASCENSION))
        );
    }

    private getServantMaterials(itemList: Item.Item[]): Item.Item[] {
        return itemList.filter((item) => this.isServantMaterial(item.type, item.uses));
    }

    private isEventItem(itemType: Item.ItemType, itemUses: Item.ItemUse[]): boolean {
        return EVENT_ITEM_TYPES.includes(itemType) && !itemUses.includes(Item.ItemUse.ASCENSION);
    }

    private getEventItems(itemList: Item.Item[]): Item.Item[] {
        return itemList
            .filter((item) => this.isEventItem(item.type, item.uses))
            .sort((a, b) => b.priority - a.priority);
    }

    private getServantCoins(itemList: Item.Item[]): Item.Item[] {
        return itemList.filter((item) => item.type === Item.ItemType.SVT_COIN).sort((a, b) => b.priority - a.priority);
    }

    private getOtherItems(itemList: Item.Item[]): Item.Item[] {
        return itemList.filter(
            (item) =>
                !this.isServantMaterial(item.type, item.uses) &&
                !this.isEventItem(item.type, item.uses) &&
                item.type !== Item.ItemType.SVT_COIN
        );
    }

    private applySearch(items: Item.Item[], searchTerm?: string): Item.Item[] {
        let list = items;
        if (searchTerm) {
            const matchedFuzzyIds = new Set(
                this.state.fuse.search(removeDiacriticalMarks(searchTerm)).map((item) => item.item.id)
            );
            list = list.filter((entity) => matchedFuzzyIds.has(entity.id));
        }
        return list;
    }

    private createTabs(itemList: Item.Item[]): PaginatedTab[] {
        let items = itemList.sort((a, b) => a.priority - b.priority || a.id - b.id);
        const t = this.props.t;
        return [
            {
                key: "servant-materials",
                title: t("Servant Materials"),
                items: this.getServantMaterials(items),
            },
            {
                key: "event-items",
                title: t("Event Items"),
                items: this.getEventItems(items),
            },
            {
                key: "servant-coins",
                title: t("Servant Coins"),
                items: this.getServantCoins(items),
            },
            {
                key: "items",
                title: t("Other Items"),
                items: this.getOtherItems(items),
            },
        ];
    }

    private renderTab(index: number): JSX.Element {
        const tab = this.state.tabs[index],
            items = this.applySearch(tab.items, this.state.search ?? ""),
            results = items.slice(this.state.perPage * this.state.page, this.state.perPage * (this.state.page + 1));
        const t = this.props.t;
        return (
            <Tab key={tab.key} eventKey={tab.key} title={tab.title}>
                <br />
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th className="text-center w-1px">#</th>
                            <th className="text-center w-1px">{t("Thumbnail")}</th>
                            <th>{t("Name")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((item, i) => {
                            const route = `/${this.props.region}/item/${item.id}`;

                            return (
                                <tr key={i}>
                                    <td className="col-center">
                                        <Link to={route}>{item.id}</Link>
                                    </td>
                                    <td className="col-center">
                                        <Link to={route}>
                                            <ItemIcon region={this.props.region} item={item} height={50} />
                                        </Link>
                                    </td>
                                    <td>
                                        <Link to={route} lang={lang(this.props.region)}>
                                            {item.name}
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </Tab>
        );
    }

    render() {
        if (this.state.error) return <ErrorStatus error={this.state.error} />;

        if (this.state.loading) return <Loading />;

        const t = this.props.t;

        const tabProperty = this.props.tab ?? "servant-materials",
            index = this.state.tabs.findIndex((tab) => tab.key === tabProperty);

        const tab = index < 0 ? { items: [] } : this.state.tabs[index],
            items = this.applySearch(tab.items, this.state.search ?? ""),
            hasPaginator = items.length > this.state.perPage;

        return (
            <div id="items" className="listing-page">
                <Row>
                    <Col xs={12} sm={6} md={9}>
                        {hasPaginator && <div>{this.paginator(items.length)}</div>}
                    </Col>
                    <Col xs={12} sm={6} md={3} id="item-search">
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

                <Tabs
                    id={"items-tabs"}
                    defaultActiveKey={this.props.tab ?? "servant-materials"}
                    mountOnEnter={true}
                    onSelect={(key: string | null) => {
                        this.props.history.replace(`/${this.props.region}/items/${key}`);
                    }}
                >
                    {this.state.tabs.map((_, index) => this.renderTab(index))}
                </Tabs>
                {hasPaginator && <div>{this.paginator(items.length)}</div>}
            </div>
        );
    }
}

export default withRouter(withTranslation()(ItemsPage));
