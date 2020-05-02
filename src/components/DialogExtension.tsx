import * as React from "react";
import {DialogExtensionSDK} from "contentful-ui-extensions-sdk";
import tokens from '@contentful/forma-36-tokens';
import {Button} from "@contentful/forma-36-react-components";

interface DialogExtensionProps {
    sdk: DialogExtensionSDK
}

export function DialogExtension(props: DialogExtensionProps) {
    const {sdk} = props;

    return (
        <div style={{margin: tokens.spacingL}}>
            You are viewing the current entry in read only mode!
            <Button
                testId="close-dialog"
                buttonType="primary"
                onClick={() => {
                    sdk.close('data from modal dialog');
                }}>
                Ok
            </Button>
        </div>
    );
}