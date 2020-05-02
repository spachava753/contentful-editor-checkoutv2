import * as React from "react";
import {useEffect, useState} from "react";
import {SidebarExtensionSDK} from "contentful-ui-extensions-sdk";
import {Button} from "@contentful/forma-36-react-components";
import tokens from "@contentful/forma-36-tokens";

interface SidebarExtensionProps {
    sdk: SidebarExtensionSDK
}

enum EntryState {
    READ_ONLY,
    CHECKED_IN
}

// TODO: properly define type later
let initialFieldStates: any = {};

export function SidebarExtension(props: SidebarExtensionProps) {
    const {sdk} = props;

    const [entryState, setEntryState] = useState(EntryState.READ_ONLY);

    useEffect(() => {
        sdk.window.startAutoResizer();
        const notify = async () => {
            const result = await sdk.dialogs.openExtension({
                width: "small",
                title: 'Warning!',
                position: "center",
                shouldCloseOnEscapePress: true,
                shouldCloseOnOverlayClick: true
            });
            // eslint-disable-next-line no-console
            console.log(result);
        }

        // noinspection JSIgnoredPromiseFromCall
        notify();
    }, []);

    useEffect(() => {
        const detachFieldHandlers: Array<Function> = [];
        for (let fieldsKey in sdk.entry.fields) {
            const field = sdk.entry.fields[fieldsKey];
            initialFieldStates[fieldsKey] = field.getValue();
            console.log(`Currently setting initial state for ${fieldsKey}`);
            console.log(initialFieldStates[fieldsKey]);
            detachFieldHandlers.push(field.onValueChanged(value => {
                //console.log(field.getValue());
                //console.log(value);
                // if we are in a readonly state, don't save any changes
                if (entryState == EntryState.READ_ONLY && value != initialFieldStates[fieldsKey]) {
                    field.setValue(initialFieldStates[field.id]);
                }
            }));
        }

        return () => {
            detachFieldHandlers.forEach(detachHandler => {
                detachHandler();
            });
        }
    }, []);

    const buttonComp = [];
    if (entryState == EntryState.READ_ONLY) {
        buttonComp.push(<Button
            key={"checkout-btn"}
            testId="checkout-btn"
            buttonType="primary"
            isFullWidth={true}
            onClick={() => {
                setEntryState(EntryState.CHECKED_IN);
            }}>
            Checkout
        </Button>);
    } else {
        const onClick = () => {
            setEntryState(EntryState.READ_ONLY);
        }
        buttonComp.push(<Button
            key={"checkin-btn"}
            testId="checkin-btn"
            buttonType="positive"
            isFullWidth={true}
            onClick={onClick}>
            Checkin changes
        </Button>);
        buttonComp.push(<Button
            key={"checkin-btn"}
            testId="checkin-btn"
            style={{marginTop: tokens.spacingM}}
            buttonType="negative"
            isFullWidth={true}
            onClick={onClick}>
            Discard changes & Checkin
        </Button>);
    }

    return (
        <>
            {buttonComp}
        </>
    );
}