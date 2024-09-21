import { Button, OverlayTrigger, Popover } from "react-bootstrap";

import { NoblePhantasm, Region } from "@atlasacademy/api-connector";

import EffectBreakdown from "../Breakdown/EffectBreakdown";
import { lang } from "../Setting/Manager";
import NoblePhantasmDescriptor from "./NoblePhantasmDescriptor";

import "./PopOver.css";

const NoblePhantasmPopover = (props: { region: Region; noblePhantasm: NoblePhantasm.NoblePhantasm }) => {
    const { region, noblePhantasm } = props;

    const popOverContent = (
        <Popover id={`np-${noblePhantasm.id}`} className="skill-popover">
            <Popover.Title>
                <NoblePhantasmDescriptor region={region} noblePhantasm={noblePhantasm} />
            </Popover.Title>
            <Popover.Content>
                <EffectBreakdown
                    region={region}
                    funcs={noblePhantasm.functions}
                    gain={noblePhantasm.npGain}
                    levels={noblePhantasm.functions[0]?.svals.length ?? 1}
                    popOver={true}
                    hideEnemyFunctions={false}
                />
            </Popover.Content>
        </Popover>
    );

    return (
        <OverlayTrigger
            trigger="click"
            rootClose
            placement="auto"
            overlay={popOverContent}
            popperConfig={{
                modifiers: [
                    {
                        name: "offset",
                        options: {
                            offset: [0, 10],
                        },
                    },
                ],
            }}
        >
            <Button
                variant="link"
                className="reset-button-style"
                title={`Click to view details of noble phantasm ${noblePhantasm.name}`}
            >
                [<span lang={lang(region)}>{noblePhantasm.name}</span>]
            </Button>
        </OverlayTrigger>
    );
};

export default NoblePhantasmPopover;
