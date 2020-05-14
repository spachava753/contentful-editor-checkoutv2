import * as React from "react";
import {useEffect, useState} from "react";
import {SidebarExtensionSDK} from "contentful-ui-extensions-sdk";
import {Button} from "@contentful/forma-36-react-components";
import tokens from "@contentful/forma-36-tokens";
import _ from "lodash";
import {EntryState} from "../util";
import {getEntryStatus, lockEntry, unlockEntry} from "../db";

interface SidebarExtensionProps {
    sdk: SidebarExtensionSDK
}

// TODO: properly define type later
let initialFieldStates: any = {};


export function SidebarExtension(props: SidebarExtensionProps) {
    const {sdk} = props;

    const [entryState, setEntryState] = useState(EntryState.UNLOCKED);

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
                if (entryState == EntryState.UNLOCKED && !_.isEqual(value, initialFieldStates[fieldsKey])) {
                    console.log(`Uh oh, resetting the field ${fieldsKey}!`);
                    // noinspection JSIgnoredPromiseFromCall
                    sdk.dialogs.openAlert({
                        title: 'Warning!',
                        message: "You are viewing the current entry in read only mode!",
                        shouldCloseOnEscapePress: true,
                        shouldCloseOnOverlayClick: true
                    });
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
            let initialEntryState = EntryState.UNLOCKED;
            try {
                const response = await getEntryStatus(sdk.entry.getSys().id);
                const data = await response.data;

                if (!_.isEmpty(data) && data.entryState == 'Locked')
                    initialEntryState = EntryState.LOCKED;

                console.log(`The initial entry state is ${initialEntryState}`);
                setEntryState(initialEntryState);
            } catch (e) {
                console.error(`There was an error getting entry state: ${e}`);
            }

            if (initialEntryState == EntryState.UNLOCKED) {
                sdk.dialogs.openAlert({
                    title: 'Warning!',
                    message: "You are viewing the current entry in read only mode!",
                    shouldCloseOnEscapePress: true,
                    shouldCloseOnOverlayClick: true
                });
            }
        }

        initExt();
    }, []);

    const buttonComp = [];
    if (entryState == EntryState.UNLOCKED) {
        buttonComp.push(<Button
            key={"checkout-btn"}
            testId="checkout-btn"
            buttonType="primary"
            isFullWidth={true}
            onClick={() => {
                lockEntry(sdk.user.sys.id, sdk.entry.getSys().id)
                    .then(() => setEntryState(EntryState.LOCKED));
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
                    .then(() => setEntryState(EntryState.UNLOCKED));
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
                        .then(() => setEntryState(EntryState.UNLOCKED))
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