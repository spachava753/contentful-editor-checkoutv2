import * as React from "react";
import {SidebarExtensionSDK} from "contentful-ui-extensions-sdk";
import {Button} from "@contentful/forma-36-react-components";
import {useEffect} from "react";

interface SidebarExtensionProps {
    sdk: SidebarExtensionSDK
}


export function SidebarExtension(props: SidebarExtensionProps) {
    const {sdk} = props;

    useEffect(() => {
        sdk.window.startAutoResizer();
    })

    const onButtonClick = async () => {
        const result = await sdk.dialogs.openExtension({
            width: 800,
            title: 'The same extension rendered in modal window'
        });
        // eslint-disable-next-line no-console
        console.log(result);
    };

    return (
        <Button
            testId="open-dialog"
            buttonType="positive"
            isFullWidth={true}
            onClick={onButtonClick}>
            Just Click on me to open dialog extension
        </Button>
    );
}