import React, {useEffect, useState} from 'react';
import {AppExtensionSDK} from 'contentful-ui-extensions-sdk';
import {Form, Heading, Note, TextField} from "@contentful/forma-36-react-components";
import _ from "lodash";

interface ConfigProps {
    sdk: AppExtensionSDK
}

export function Config(props: ConfigProps) {
    console.log("In Config screen");

    const [table, setTable] = useState('');
    const [accessId, setAccessId] = useState('');
    const [secretAccessId, setSecretAccessId] = useState('');
    const {sdk} = props;
    const app = sdk.app;

    useEffect(() => {
        async function getParams() {
            const p: any = await app.getParameters();
            console.log(`Fetched app params are ${p}`);
            if (!_.isEmpty(p)) {
                setTable(p.table);
                setTable(p.accessId);
                setTable(p.secretAccessId);
            }
            console.log(`Setting app ready`);
            app.setReady();
        }

        getParams();
    }, []);

    useEffect(() => {
        const parameters = {table, accessId, secretAccessId}
        console.log(`Saving app params as: ${JSON.stringify(parameters)}`);
        app.onConfigure(() => {
            return {
                parameters: parameters
            }
        });
    }, [table, accessId, secretAccessId]);


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
                name="tableInput"
                id="tableInput"
                labelText={"Table name"}
                value={table}
                onChange={e => {
                    setTable(e.currentTarget.value);
                }}
                textInputProps={{
                    withCopyButton: true,
                    placeholder: 'ContentfulDB',
                }}
                helpText={"This is the table name in DynamoDB"}
            />
            <TextField
                required
                name="accessIdInput"
                id="accessIdInput"
                labelText={"Access Id"}
                value={accessId}
                onChange={e => {
                    setAccessId(e.currentTarget.value);
                }}
                textInputProps={{
                    withCopyButton: true,
                    placeholder: 'Placeholder text',
                }}
                helpText={"This is the access key id"}
            />
            <TextField
                required
                name="secretKeyIdInput"
                id="secretKeyIdInput"
                labelText={"Secret Access Key Id"}
                value={secretAccessId}
                onChange={e => {
                    setSecretAccessId(e.currentTarget.value);
                }}
                textInputProps={{
                    withCopyButton: true,
                    placeholder: 'Placeholder text',
                }}
                helpText={"This is the secret access key id"}
            />
        </Form>
    );
}