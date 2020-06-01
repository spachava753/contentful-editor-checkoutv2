import * as React from "react";
import {useEffect, useState} from "react";
import {SidebarExtensionSDK} from "contentful-ui-extensions-sdk";
import {Button} from "@contentful/forma-36-react-components";
import tokens from "@contentful/forma-36-tokens";
import _ from "lodash";
import {EntryState} from "../util";
import {getEntryStatus, lockEntry, setApiKey, setURL, unlockEntry} from "../db";
import {useAsync, useEffectOnce} from "react-use";

interface SidebarExtensionProps {
    sdk: SidebarExtensionSDK
}

let beforeCheckoutFieldValues: any = {};


export function SidebarExtension(props: SidebarExtensionProps) {
    const {sdk} = props;

    const [entryState, setEntryState] = useState(EntryState.EDITABLE);

    useEffectOnce(() => {
        sdk.window.startAutoResizer();
        console.log(`App params: ${JSON.stringify(sdk.parameters.installation)}`);
        const params = sdk.parameters.installation as any;
        setURL(params.url);
        setApiKey(params.apiKey);
    });

    // store the initial field values, which must occur after every checkin
    // different from the initial state of the entry, which is before the checkout action
    if (entryState == EntryState.EDITABLE) {
        for (let fieldsKey in sdk.entry.fields) {
            const field = sdk.entry.fields[fieldsKey];
            beforeCheckoutFieldValues[fieldsKey] = field.getValue();
            console.log(`Currently setting initial state for ${fieldsKey}`);
            console.log(beforeCheckoutFieldValues[fieldsKey]);
        }
    }

    // attach the field handlers to observe changes
    useEffect(() => {
        const detachFieldHandlers: Array<Function> = [];
        for (let fieldsKey in sdk.entry.fields) {
            const field = sdk.entry.fields[fieldsKey];
            detachFieldHandlers.push(
                field.onValueChanged(
                    value => {
                        console.log(`Detected change in field: ${fieldsKey}`);
                        console.log(`New value is ${value}`);
                        console.log(`Old value is ${beforeCheckoutFieldValues[fieldsKey]}`);
                        console.log(`Entry state is ${entryState}`);
                        // if we are in a readonly state, don't save any changes
                        if ((entryState == EntryState.EDITABLE || entryState == EntryState.READ_ONLY) && !_.isEqual(value, beforeCheckoutFieldValues[fieldsKey])) {
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
                                beforeCheckoutFieldValues[field.id] = (beforeCheckoutFieldValues[field.id] as string).substr(9);
                            }

                            field.setValue(beforeCheckoutFieldValues[field.id]);
                        }
                    }
                )
            );
        }

        return () => {
            detachFieldHandlers.forEach(
                detachHandler => {
                    detachHandler();
                }
            );
        }
    }, [entryState]);

    // get the state of the entry
    useAsync(async () => {
        try {
            let initialEntryState = EntryState.EDITABLE;
            const response = await getEntryStatus(sdk.entry.getSys().id);
            const data = await response.data;
            console.log(`Fetched remote data: ${JSON.stringify(data)}`);

            // entry doesn't exist in db
            if (_.isEmpty(data))
                return

            if (data.entryState == 'EDITING') {
                // current user has previously checked out
                if (data.userId == sdk.user.sys.id) {
                    initialEntryState = EntryState.EDITING;
                    beforeCheckoutFieldValues = data.initialValues
                } else {
                    initialEntryState = EntryState.READ_ONLY;
                }
            }

            console.log(`The initial entry state is ${initialEntryState}`);
            setEntryState(initialEntryState);
            if (initialEntryState == EntryState.READ_ONLY) {
                await sdk.dialogs.openAlert({
                    title: 'Warning!',
                    message: "You are viewing the current entry when someone else is editing it. " +
                        "You can view the current entry in read only mode!",
                    shouldCloseOnEscapePress: true,
                    shouldCloseOnOverlayClick: true
                });
            }
        } catch (e) {
            console.error(`There was an error getting entry state: ${e}`);
        }
    }, []);

    const rollback = () => {
        const setFieldPromises = [];
        for (let fieldsKey in sdk.entry.fields) {
            setFieldPromises.push(sdk.entry.fields[fieldsKey].setValue(beforeCheckoutFieldValues[fieldsKey]));
        }
        Promise.all(setFieldPromises)
            .then(() => unlockEntry({userId: sdk.user.sys.id, entryId: sdk.entry.getSys().id})
                .then(() => setEntryState(EntryState.EDITABLE))
            );
    }

    const commit = () => {
        unlockEntry({userId: sdk.user.sys.id, entryId: sdk.entry.getSys().id})
            .then(() => setEntryState(EntryState.EDITABLE));
    }

    const buttonComp = [];
    if (entryState == EntryState.EDITABLE || entryState == EntryState.READ_ONLY) {
        buttonComp.push(<Button
            key={"checkout-btn"}
            testId="checkout-btn"
            buttonType="primary"
            disabled={entryState == EntryState.READ_ONLY}
            isFullWidth={true}
            onClick={() => {
                lockEntry({
                    userId: sdk.user.sys.id,
                    entryId: sdk.entry.getSys().id,
                    initialValues: beforeCheckoutFieldValues
                })
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
                commit()
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
                rollback()
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