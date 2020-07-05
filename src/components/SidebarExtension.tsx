import * as React from 'react';
import { SidebarExtensionSDK } from 'contentful-ui-extensions-sdk';
import { EditorCheckout } from './EditorCheckout';
import { Button } from '@contentful/forma-36-react-components';

interface SidebarExtensionProps {
  sdk: SidebarExtensionSDK;
}

export function SidebarExtension(props: SidebarExtensionProps) {
  const { sdk } = props;

  return (
    <>
      <EditorCheckout sdk={sdk} />
      <Button
        style={{ marginTop: '1em' }}
        buttonType="muted"
        isFullWidth={true}
        onClick={() => {
          sdk.navigator.openCurrentAppPage();
        }}>
        Revisions
      </Button>
    </>
  );
}
