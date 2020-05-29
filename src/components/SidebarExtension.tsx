import * as React from "react";
import {useEffect, useState} from "react";
import {SidebarExtensionSDK} from "contentful-ui-extensions-sdk";
import {Button} from "@contentful/forma-36-react-components";
import tokens from "@contentful/forma-36-tokens";
import _ from "lodash";
import {EntryState} from "../util";
import {getEntryStatus, getURL, lockEntry, setApiKey, setURL, unlockEntry} from "../db";

interface SidebarExtensionProps {
    sdk: SidebarExtensionSDK
}

// TODO: properly define type later
let initialFieldStates: any = {};


export function SidebarExtension(props: SidebarExtensionProps) {
    const {sdk} = props;

    const [entryState, setEntryState] = useState(EntryState.EDITABLE);

    useEffect(() => {
        console.log(`App params: ${JSON.stringify(sdk.parameters.installation)}`);
        const params = sdk.parameters.installation as any;
        setURL(params.setUrl);
        getURL(params.getUrl);
        setApiKey(params.apiKey);
    });

    useEffect(() => {
        const detachFieldHandlers: Array<Function> = [];
        for (let fieldsKey in sdk.entry.fields) {
            const field = sdk.entry.fields[fieldsKey];
            initialFieldStates[fieldsKey] = field.getValue();
            console.log(`Currently setting initial state for ${fieldsKey}`);
            console.log(initialFieldStates[fieldsKey]);
            detachFieldHandlers.push(field.onValueChanged(value => {
                console.log(`Detected change in field: ${fieldsKey}`);
                console.log(`New value is ${value}`);
                console.log(`Old value is ${initialFieldStates[fieldsKey]}`);
                console.log(`Entry state is ${entryState}`);
                // if we are in a readonly state, don't save any changes
                if ((entryState == EntryState.EDITABLE || entryState == EntryState.READ_ONLY) && !_.isEqual(value, initialFieldStates[fieldsKey])) {
                    console.log(`Uh oh, resetting the field ${fieldsKey}!`);
                    // noinspection JSIgnoredPromiseFromCall
                    sdk.dialogs.openAlert({
                        title: 'Warning!',
                        message: "You are viewing the current entry in read only mode!",
                        shouldCloseOnEscapePress: true,
                        shouldCloseOnOverlayClick: true
                    });

                    // special case to deal with slugs in newly created entries
                    if (typeof value == "string" && (value as string).includes("untitled")) {
                        initialFieldStates[field.id] = (value as string).substr(9);
                    }

                    field.setValue(initialFieldStates[field.id]);
                }
            }));
        }

        return () => {
            detachFieldHandlers.forEach(detachHandler => {
                detachHandler();
            });
        }
    }, [entryState]);

    useEffect(() => {
        sdk.window.startAutoResizer();
        // noinspection JSIgnoredPromiseFromCall
        const initExt = async () => {
            let initialEntryState = EntryState.EDITABLE;
            try {
                const response = await getEntryStatus(sdk.entry.getSys().id);
                const data = await response.data;

                if (!_.isEmpty(data) && data.entryState == 'EDITING')
                    if (data.userId == sdk.user.sys.id)
                        initialEntryState = EntryState.EDITING;
                    else
                        initialEntryState = EntryState.READ_ONLY;

                console.log(`The initial entry state is ${initialEntryState}`);
                setEntryState(initialEntryState);
            } catch (e) {
                console.error(`There was an error getting entry state: ${e}`);
            }

            if (initialEntryState == EntryState.READ_ONLY) {
                sdk.dialogs.openAlert({
                    title: 'Warning!',
                    message: "You are viewing the current entry when someone else is editing it. " +
                        "You can view the current entry only in read only mode!",
                    shouldCloseOnEscapePress: true,
                    shouldCloseOnOverlayClick: true
                });
            }
        }

        initExt();
    }, []);

    const buttonComp = [];
    if (entryState == EntryState.EDITABLE || entryState == EntryState.READ_ONLY) {
        buttonComp.push(<Button
            key={"checkout-btn"}
            testId="checkout-btn"
            buttonType="primary"
            disabled={entryState == EntryState.READ_ONLY}
            isFullWidth={true}
            onClick={() => {
                lockEntry(sdk.user.sys.id, sdk.entry.getSys().id)
                    .then(() => setEntryState(EntryState.EDITING));
            }}>
            Checkout
        </Button>);
    } else {
        buttonComp.push(<Button
            key={"checkin-btn"}
            testId="checkin-btn"
            buttonType="positive"
            isFullWidth={true}
            onClick={() => {
                unlockEntry(sdk.user.sys.id, sdk.entry.getSys().id)
                    .then(() => setEntryState(EntryState.EDITABLE));
            }}>
            Checkin changes
        </Button>);
        buttonComp.push(<Button
            key={"discard-btn"}
            testId="discard-btn"
            style={{marginTop: tokens.spacingM}}
            buttonType="negative"
            isFullWidth={true}
            onClick={() => {
                const setFieldPromises = [];
                for (let fieldsKey in sdk.entry.fields) {
                    setFieldPromises.push(sdk.entry.fields[fieldsKey].setValue(initialFieldStates[fieldsKey]));
                }
                Promise.all(setFieldPromises)
                    .then(() => unlockEntry(sdk.user.sys.id, sdk.entry.getSys().id)
                        .then(() => setEntryState(EntryState.EDITABLE))
                    );
            }}>
            Discard changes & Checkin
        </Button>);
    }

    return (
        <>
            {buttonComp}
        </>
    );
}