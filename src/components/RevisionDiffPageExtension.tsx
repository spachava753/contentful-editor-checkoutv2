import React, { useState } from 'react';
import { PageExtensionSDK } from 'contentful-ui-extensions-sdk';
import {
  TextField,
  Form,
  FieldGroup,
  Button,
  Spinner
} from '@contentful/forma-36-react-components';
import { getEntryData, setURL, setApiKey } from '../db';
import styled from 'styled-components';
import { useEffectOnce } from 'react-use';

interface RevisionDiffPageExtensionProps {
  sdk: PageExtensionSDK;
}

const StyledMain = styled.main`
  margin: 1em;
`;

export function RevisionDiffPageExtension(props: RevisionDiffPageExtensionProps) {
  const { sdk } = props;
  const [entryId, setEntryId] = useState('');
  const [entryData, setEntryData] = useState({});
  const [showSpinner, setShowSpinner] = useState(false);

  useEffectOnce(() => {
    console.log(`App params: ${JSON.stringify(sdk.parameters.installation)}`);
    const params = sdk.parameters.installation as any;
    setURL(params.url);
    setApiKey(params.apiKey);
  });

  // console.log(`sdk: ${JSON.stringify(sdk)}`);

  return (
    <StyledMain>
      <h1>Revisions</h1>

      <p>This is a page extensions</p>
      <Form
        onSubmit={() => {
          setShowSpinner(true);
          getEntryData(entryId)
            .then((r: any) => {
              console.log(`fetched entry data: ${JSON.stringify(r.data)}`);
              setShowSpinner(false);
            })
            .catch((err: any) => {
              console.log(`An error occured: ${err}`);
            });
        }}
        spacing="condensed">
        <FieldGroup>
          <TextField
            name="entryIdInput"
            id="entryIdInput"
            labelText="EntryId"
            helpText="Please enter the entry id"
            width="large"
            value={entryId}
            onChange={(e: any) => setEntryId(e.target.value)}
            textInputProps={{ withCopyButton: true }}
            formLabelProps={{ requiredText: 'required' }}
            required
          />
        </FieldGroup>
        <FieldGroup>
          <Button type="submit">
            <span style={{ marginRight: '1em' }}>Get revisions</span>
            {showSpinner && <Spinner size="default" />}
          </Button>
        </FieldGroup>
      </Form>
    </StyledMain>
  );
}
