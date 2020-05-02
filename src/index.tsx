import * as React from 'react';
import {render} from 'react-dom';
import {DialogExtensionSDK, init, locations, SidebarExtensionSDK} from 'contentful-ui-extensions-sdk';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.css';
import {SidebarExtension} from "./components/SidebarExtension";
import {DialogExtension} from "./components/DialogExtension";

init(sdk => {
    if (sdk.location.is(locations.LOCATION_DIALOG)) {
        render(<DialogExtension sdk={sdk as DialogExtensionSDK}/>, document.getElementById('root'));
    } else {
        render(<SidebarExtension sdk={sdk as SidebarExtensionSDK}/>, document.getElementById('root'));
    }
});

/**
 * By default, iframe of the extension is fully reloaded on every save of a source file.
 * If you want to use HMR (hot module reload) instead of full reload, uncomment the following lines
 */
// if (module.hot) {
//   module.hot.accept();
// }
