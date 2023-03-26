import { faEdit, faFilter } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { Alert, Button, ButtonGroup, Dropdown, Form, InputGroup, Table } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Item, Quest, Region, Shop } from "@atlasacademy/api-connector";

import ItemIcon from "../../Component/ItemIcon";
import CondTargetNumDescriptor from "../../Descriptor/CondTargetNumDescriptor";
import { gemIds, magicGemIds, monumentIds, pieceIds, secretGemIds } from "../../Descriptor/MultipleDescriptors";
import ScriptDescriptor from "../../Descriptor/ScriptDescriptor";
import ShopPurchaseDescriptor from "../../Descriptor/ShopPurchaseDescriptor";
import { FGOText } from "../../Helper/StringHelper";
import Manager, { lang } from "../../Setting/Manager";

import "../../Helper/StringHelper.css";
import "./Shop.css";

const ScriptLink = (props: { region: Region; shop: Shop.Shop }) => {
    const { region, shop } = props;
    if (shop.scriptId === undefined) return null;
    return (
        <>
            <br />
            <ScriptDescriptor
                region={region}
                scriptId={shop.scriptId}
                scriptName={shop.scriptName}
                scriptType="Valentine Script"
            />
        </>
    );
};

const IconLink = ({ region, item }: { region: Region; item: Item.Item }) => (
    <Link to={`/${region}/item/${item.id}`}>
        <ItemIcon region={region} item={item} height={40} />
    </Link>
);

interface IProps {
    region: Region;
    shops: Shop.Shop[];
    itemCache: Map<number, Item.Item>;
    filters: Map<number, number>;
    onChange?: (record: Map<number, number>) => void;
    questCache?: Map<number, Quest.QuestBasic>;
}

const ShopTab = ({ region, shops, filters, onChange, itemCache, questCache }: IProps) => {
    let [forceEnablePlanner, setForceEnablePlanner] = useState<boolean | undefined>(undefined);
    let [itemFilters, setItemFilters] = useState(new Set<number>());

    const { t } = useTranslation();
    const allItems = new Map(shops.map((shop) => [shop.cost.item.id, shop.cost.item]));

    let shopEnabled = forceEnablePlanner === undefined ? Manager.shopPlannerEnabled() : forceEnablePlanner;
    let counted = shops
        .filter((shop) => (shopEnabled ? filters.has(shop.id) : true))
        .map(
            (shop) =>
                [shop.cost.item, (shopEnabled ? filters.get(shop.id)! : shop.limitNum) * shop.cost.amount] as const
        );

    let items = new Map(counted.map((tuple) => [tuple[0].id, tuple[0]]));

    let amounts = new Map<number, number>();
    for (let [item, amount] of counted)
        if (amounts.has(item.id)) amounts.set(item.id, (amounts.get(item.id) ?? 0) + amount);
        else amounts.set(item.id, amount);

    // reset filter if nothing is chosen
    if (!amounts.size && itemFilters.size) setItemFilters(new Set());

    const excludeItemIds = (itemIds: number[]) => {
        return new Map(
            shops
                .filter((shop) => shop.payType !== Shop.PayType.FREE)
                .filter((shop) => shop.limitNum !== 0)
                .filter((shop) => !itemIds.includes(shop.targetIds[0]) || shop.purchaseType !== Shop.PurchaseType.ITEM)
                .map((shop) => [shop.id, shop.limitNum])
        );
    };

    return (
        <>
            <Alert variant="success" style={{ margin: "1em 0", display: "flex" }}>
                <div style={{ flexGrow: 1 }}>
                    {shopEnabled
                        ? amounts.size > 0
                            ? t("EventShopChosenTotal")
                            : t("EventShopChosenNone")
                        : t("EventShopClearTotal")}
                    {[...amounts]
                        .filter(([_, amount]) => amount > 0)
                        .map(([itemId, amount]) => (
                            <span style={{ whiteSpace: "nowrap", paddingRight: "1ch" }} key={itemId}>
                                <IconLink region={region} item={items.get(itemId)!} />
                                <b>×{amount.toLocaleString()}</b>
                            </span>
                        ))}
                </div>
                <div style={{ flexBasis: "auto", paddingLeft: "10px" }}>
                    <Button
                        variant={shopEnabled ? "dark" : "success"}
                        onClick={() => setForceEnablePlanner(!forceEnablePlanner)}
                    >
                        <FontAwesomeIcon icon={faEdit} title={shopEnabled ? "Disable planner" : "Enable planner"} />
                    </Button>
                </div>
            </Alert>
            {shopEnabled && (
                <>
                    <ButtonGroup>
                        <Button disabled variant="outline-dark">
                            {t("Quick toggle")}
                        </Button>
                        <Button variant="outline-success" onClick={() => onChange?.(excludeItemIds([]))}>
                            {t("ToggleAll")}
                        </Button>
                        <Button variant="outline-success" onClick={() => onChange?.(new Map())}>
                            {t("ToggleNone")}
                        </Button>
                        <Dropdown as={ButtonGroup}>
                            <Dropdown.Toggle variant="outline-success">{t("ToggleExclude")}</Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item
                                    as={Button}
                                    onClick={() =>
                                        onChange?.(excludeItemIds([...gemIds, ...magicGemIds, ...secretGemIds]))
                                    }
                                >
                                    {t("Gems")}
                                </Dropdown.Item>
                                <Dropdown.Item
                                    as={Button}
                                    onClick={() => onChange?.(excludeItemIds([...monumentIds, ...pieceIds]))}
                                >
                                    {t("Monuments")} & {t("Pieces")}
                                </Dropdown.Item>
                                <Dropdown.Item as={Button} onClick={() => onChange?.(excludeItemIds(monumentIds))}>
                                    {t("Monuments")}
                                </Dropdown.Item>
                                <Dropdown.Item as={Button} onClick={() => onChange?.(excludeItemIds(pieceIds))}>
                                    {t("Pieces")}
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </ButtonGroup>
                    <div>&nbsp;</div>
                </>
            )}
            <Table hover responsive className="shopTable">
                <thead>
                    <tr>
                        <th style={{ textAlign: "left" }}>{t("Detail")}</th>
                        <th style={{ whiteSpace: "nowrap" }}>
                            {t("EventShopCurrency")}&nbsp;
                            <Dropdown as={ButtonGroup}>
                                <Dropdown.Toggle size="sm">
                                    <FontAwesomeIcon style={{ display: "inline" }} icon={faFilter} />
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    {/* Actually a checkbox is the best here */}
                                    <Dropdown.Item
                                        as={Button}
                                        onClick={() => {
                                            setItemFilters(new Set());
                                        }}
                                    >
                                        {t("Reset")}
                                    </Dropdown.Item>
                                    {[...allItems].map(([itemId, item]) => (
                                        <Dropdown.Item
                                            key={item.id}
                                            as={Button}
                                            onClick={() => {
                                                setItemFilters(new Set([itemId]));
                                            }}
                                        >
                                            <ItemIcon region={region} item={item} height={40} />
                                            {item.name}
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Menu>
                            </Dropdown>
                        </th>
                        <th>{t("EventShopCost")}</th>
                        <th>{t("Item")}</th>
                        <th>{t("EventShopSet")}</th>
                        <th>{t("Limit")}</th>
                        {shopEnabled && <th>{t("Target")}</th>}
                    </tr>
                </thead>
                <tbody>
                    {shops
                        .filter((shop) =>
                            itemFilters.size && amounts.size ? itemFilters.has(shop.cost.item.id) : true
                        )
                        .sort((a, b) => a.priority - b.priority)
                        .map((shop) => {
                            let limitNumIndicator = shopEnabled ? (
                                <Button
                                    variant="light"
                                    onClick={() => {
                                        filters.set(shop.id, shop.limitNum);
                                        onChange?.(filters);
                                    }}
                                >
                                    {shop.limitNum.toLocaleString()}
                                </Button>
                            ) : (
                                <>{shop.limitNum.toLocaleString()}</>
                            );

                            return (
                                <tr key={shop.id}>
                                    <td style={{ minWidth: "10em" }}>
                                        <b lang={lang(region)}>{shop.name}</b>
                                        <div style={{ fontSize: "0.75rem" }} className="newline">
                                            <span lang={lang(region)}>
                                                <FGOText text={shop.detail} />
                                            </span>
                                            <ScriptLink region={region} shop={shop} />
                                            <br />
                                            <div>
                                                {shop.releaseConditions.length ? (
                                                    <ul className="condition-list">
                                                        {shop.releaseConditions.map((cond, index) => (
                                                            <li key={index} style={{ fontSize: "0.75rem" }}>
                                                                {cond.closedMessage && (
                                                                    <span lang={lang(region)}>
                                                                        {cond.closedMessage} —{" "}
                                                                    </span>
                                                                )}
                                                                <CondTargetNumDescriptor
                                                                    region={region}
                                                                    cond={cond.condType}
                                                                    targets={cond.condValues}
                                                                    num={cond.condNum}
                                                                    quests={questCache}
                                                                    items={itemCache}
                                                                />
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    ""
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                        {shop.payType !== Shop.PayType.FREE ? (
                                            <IconLink region={region} item={shop.cost.item} />
                                        ) : null}
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                        {shop.payType !== Shop.PayType.FREE ? shop.cost.amount.toLocaleString() : null}
                                    </td>
                                    <td>
                                        <ShopPurchaseDescriptor region={region} shop={shop} itemMap={itemCache} />
                                    </td>
                                    <td style={{ textAlign: "center" }}>{shop.setNum.toLocaleString()}</td>
                                    <td style={{ textAlign: "center" }}>
                                        {shop.limitNum === 0 ? <>{t("Unlimited")}</> : limitNumIndicator}
                                    </td>
                                    {shopEnabled && (
                                        <>
                                            <td style={{ textAlign: "center", maxWidth: "5em" }}>
                                                <InputGroup size="sm">
                                                    <Form.Control
                                                        type="number"
                                                        value={filters.get(shop.id) ?? 0}
                                                        min={0}
                                                        max={shop.limitNum || undefined}
                                                        onChange={(event) => {
                                                            let value = +event.target.value;
                                                            if (value) filters.set(shop.id, value);
                                                            else filters.delete(shop.id);
                                                            onChange?.(filters);
                                                        }}
                                                    />
                                                </InputGroup>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            );
                        })}
                </tbody>
            </Table>
        </>
    );
};

export default ShopTab;
