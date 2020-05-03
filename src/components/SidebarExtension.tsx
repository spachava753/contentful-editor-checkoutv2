import * as React from "react";
import {useEffect, useState} from "react";
import {SidebarExtensionSDK} from "contentful-ui-extensions-sdk";
import {Button} from "@contentful/forma-36-react-components";
import tokens from "@contentful/forma-36-tokens";
import _ from "lodash";
import creds from "../aws-creds";
import AWS from "aws-sdk";

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

    const lockEntry = (sdk: SidebarExtensionSDK, ddb) => {
        const params = {
            TableName: 'ContentfulTableDev',
            Item: {
                'ID': {S: sdk.entry.getSys().id},
                'UserID': {S: sdk.user.sys.id},
                'EntryState': {S: 'Locked'}
            }
        };

        return ddb.putItem(params).promise();
    }

    const unlockEntry = (sdk: SidebarExtensionSDK, ddb) => {
        const params = {
            TableName: 'ContentfulTableDev',
            Item: {
                'ID': {S: sdk.entry.getSys().id},
                'UserID': {S: sdk.user.sys.id},
                'EntryState': {S: 'Unlocked'}
            }
        };

        return ddb.putItem(params).promise();
    }

    const getEntryStatus = (entryId: string, ddb) => {
        const params = {
            TableName: 'ContentfulTableDev',
            Key: {
                // this will be the entry id
                'ID': {S: entryId},
            },
            ProjectionExpression: 'UserID, EntryState'
        };

        return ddb.getItem(params).promise();
    }


    useEffect(() => {
        sdk.window.startAutoResizer();
        console.log(`sdk params are ${JSON.stringify(sdk.parameters)}`)
        // noinspection JSIgnoredPromiseFromCall

        /*sdk.dialogs.openExtension({
            title: 'The same extension rendered in modal window',
            shouldCloseOnOverlayClick: false,
            shouldCloseOnEscapePress: false,
            width: "small",
            position: "center",
            parameters: {
                "entryId": sdk.entry.getSys().id
            }
        }).then(result => {
            console.log(result);
        });*/
        AWS.config.region = creds.region;
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: creds.IdentityPoolId,
        });
        const ddb = new AWS.DynamoDB({
            apiVersion: '2012-08-10', region: "us-eas-1", credentials: new AWS.CognitoIdentityCredentials({
                IdentityPoolId: creds.IdentityPoolId,
            })
        });

        let message = "You are viewing the current entry in read only mode!";
        getEntryStatus(sdk.entry.getSys().id, ddb).then(result => {
            console.log(`Entry status is ${JSON.stringify(result)}`);
            const data = result as any;
            if (!_.isEmpty(data) && _.isEqual(data['Item']['EntryState']['S'], 'Locked')) {
                message = "You are currently checked in!"
                setEntryState(EntryState.CHECKED_IN);
            }

            sdk.dialogs.openAlert({
                title: 'Warning!',
                message: message,
                shouldCloseOnEscapePress: true,
                shouldCloseOnOverlayClick: true
            });
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
                console.log(`Detected change in field: ${fieldsKey}`);
                console.log(`New value is ${value}`);
                console.log(`Old value is ${initialFieldStates[fieldsKey]}`);
                console.log(`Entry state is ${entryState}`);
                // if we are in a readonly state, don't save any changes
                if (entryState == EntryState.READ_ONLY && !_.isEqual(value, initialFieldStates[fieldsKey])) {
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

    const buttonComp = [];
    if (entryState == EntryState.READ_ONLY) {
        buttonComp.push(<Button
            key={"checkout-btn"}
            testId="checkout-btn"
            buttonType="primary"
            isFullWidth={true}
            onClick={() => {
                const ddb = new AWS.DynamoDB({
                    apiVersion: '2012-08-10', region: "us-eas-1", credentials: new AWS.CognitoIdentityCredentials({
                        IdentityPoolId: "us-east-1:27dd6a58-ea6a-47fe-936f-a8229d8fc7e8",
                    })
                });
                lockEntry(sdk, ddb).then(() => {
                    setEntryState(EntryState.CHECKED_IN);
                });
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
                const ddb = new AWS.DynamoDB({
                    apiVersion: '2012-08-10', region: "us-eas-1", credentials: new AWS.CognitoIdentityCredentials({
                        IdentityPoolId: "us-east-1:27dd6a58-ea6a-47fe-936f-a8229d8fc7e8",
                    })
                });
                unlockEntry(sdk, ddb).then(() => {
                    setEntryState(EntryState.READ_ONLY)
                })
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
                Promise.all(setFieldPromises).then(() => {
                    const ddb = new AWS.DynamoDB({
                        apiVersion: '2012-08-10', region: "us-eas-1", credentials: new AWS.CognitoIdentityCredentials({
                            IdentityPoolId: "us-east-1:27dd6a58-ea6a-47fe-936f-a8229d8fc7e8",
                        })
                    });
                    unlockEntry(sdk, ddb).then(() => {
                        setEntryState(EntryState.READ_ONLY)
                    })
                });
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