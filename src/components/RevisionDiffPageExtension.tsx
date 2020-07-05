import * as React from 'react';
import { PageExtensionSDK } from 'contentful-ui-extensions-sdk';
import { Button } from '@contentful/forma-36-react-components';

interface RevisionDiffPageExtensionProps {
  sdk: PageExtensionSDK;
}

export function RevisionDiffPageExtension(props: RevisionDiffPageExtensionProps) {
  const { sdk } = props;

  console.log(`sdk: ${JSON.stringify(sdk)}`);

  return (
    <>
      <h1>Revisions</h1>

      <p>This is a page</p>
    </>
  );
}
