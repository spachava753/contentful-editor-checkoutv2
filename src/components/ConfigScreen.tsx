import React, {useEffect, useState} from 'react';
import {AppExtensionSDK} from 'contentful-ui-extensions-sdk';
import {Form, Heading, Note, TextField} from "@contentful/forma-36-react-components";
import _ from "lodash";
import {useAsync} from "react-use";

interface ConfigProps {
    sdk: AppExtensionSDK
}

export function Config(props: ConfigProps) {
    console.log("In Config screen");

    const [setUrl, setSetUrl] = useState('');
    const [getUrl, setGetUrl] = useState('');
    const [apiKey, setApiKey] = useState('');
    const {sdk} = props;
    const app = sdk.app;

    useEffect(() => {
        async function getParams() {
            const p: any = await app.getParameters();
            console.log(`Fetched app params are ${p}`);
            if (!_.isEmpty(p)) {
                setSetUrl(p.setUrl);
                setGetUrl(p.getUrl);
                setApiKey(p.apiKey);
            }
            console.log(`Setting app ready`);
            await app.setReady();
        }

        getParams().then();
    }, []);

    useAsync(async () => {
        const parameters = {setUrl, getUrl, apiKey}
        console.log(`Saving app params as: ${JSON.stringify(parameters)}`);
        await app.onConfigure(async () => {
            const {items: contentTypes} = await sdk.space.getContentTypes();
            // @ts-ignore
            const contentTypeIds = contentTypes.map(ct => ct.sys.id);
            console.log(`Content types to configure: ${contentTypeIds}`)
            const editorInterface = contentTypeIds.reduce((acc, id) => {
                // Insert the app as the first item in sidebars
                // of all content types.
                return {...acc, [id]: {sidebar: {position: 0}}};
            }, {});
            console.log(`Editor Interface: ${JSON.stringify(editorInterface)}`)

            return {
                parameters: parameters,
                targetState: {
                    EditorInterface: editorInterface
                }
            }
        });
    }, [setUrl, getUrl, apiKey]);


    app.onConfigurationCompleted((err: any) => {
        if (err) {
            console.log(`There were errors installing: ${JSON.stringify(err)}`);
        }
    });


    return (
        <Form style={{width: "500px", margin: "50px auto"}}>
            <Heading>Editor Checkout App</Heading>
            <Note noteType="primary" title="About the app">
                The editor will ensure that concurrent editing is not possible.
                However, we need to connect to a database to track an entry's state.
                Enter the access key id and secret access id key of a user that can read and write items to a DynamoDB
                table.
            </Note>
            <TextField
                required
                name="API Gateway Endpoint"
                id="setStateEndpointInput"
                labelText={"API Gateway Endpoint for setting entry state"}
                value={setUrl}
                onChange={e => {
                    // @ts-ignore
                    setSetUrl(e.currentTarget.value);
                }}
                textInputProps={{
                    withCopyButton: true,
                    placeholder: "https://<some-endpoint>.execute-api.<some-region>.amazonaws.com/",
                }}
                helpText={"Editors: Ask your developers to install"}
            />
            <TextField
                required
                name="API Gateway Endpoint"
                id="getStateEndpointInput"
                labelText={"API Gateway Endpoint for getting entry state"}
                value={getUrl}
                onChange={e => {
                    // @ts-ignore
                    setGetUrl(e.currentTarget.value);
                }}
                textInputProps={{
                    withCopyButton: true,
                    placeholder: "https://<some-endpoint>.execute-api.<some-region>.amazonaws.com/",
                }}
                helpText={"Editors: Ask your developers to install"}
            />
            <TextField
                name="API Key"
                id="apiKeyInput"
                labelText={"API Key to use when contacting the endpoints, if there is any API key"}
                value={apiKey}
                onChange={e => {
                    // @ts-ignore
                    setApiKey(e.currentTarget.value);
                }}
                textInputProps={{
                    withCopyButton: false,
                    placeholder: "gn@7N0zJ34q5s^M7%8mXbd6rRFRf%MuXfQLtZSCb",
                }}
                helpText={"Note: the placeholder key is not real"}
            />
        </Form>
    );
}