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
        // noinspection JSIgnoredPromiseFromCall
        sdk.dialogs.openAlert({
            title: 'Warning!',
            message: "You are viewing the current entry in read only mode!",
            shouldCloseOnEscapePress: true,
            shouldCloseOnOverlayClick: true
        });
    }, []);

    useEffect(() => {
        const detachFieldHandlers: Array<Function> = [];
        for (let fieldsKey in sdk.entry.fields) {
            const field = sdk.entry.fields[fieldsKey];
            initialFieldStates[fieldsKey] = field.getValue();
            console.log(`Currently setting initial state for ${fieldsKey}`);
            console.log(initialFieldStates[fieldsKey]);
            detachFieldHandlers.push(field.onValueChanged(value => {
                console.log(`Detected change in ${fieldsKey}`);
                console.log(`New value is ${value}`);
                console.log(`Old value is ${initialFieldStates[fieldsKey]}`);
                console.log(`Entry state is ${entryState}`);
                // if we are in a readonly state, don't save any changes
                if (entryState == EntryState.READ_ONLY && value != initialFieldStates[fieldsKey]) {
                    console.log(`Uh oh, resetting the value!`);
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
        buttonComp.push(<Button
            key={"checkin-btn"}
            testId="checkin-btn"
            buttonType="positive"
            isFullWidth={true}
            onClick={() => setEntryState(EntryState.READ_ONLY)}>
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
                Promise.all(setFieldPromises).then(() => setEntryState(EntryState.READ_ONLY));
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