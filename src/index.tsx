import * as React from 'react';
import { render } from 'react-dom';
import {
    AppExtensionSDK,
    DialogExtensionSDK,
    init,
    locations,
    SidebarExtensionSDK
} from 'contentful-ui-extensions-sdk';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.css';
import { Config, DialogExtension, SidebarExtension } from './components';

init(sdk => {
    let comp = <SidebarExtension sdk={sdk as SidebarExtensionSDK} />;
    if (sdk.location.is(locations.LOCATION_DIALOG)) {
        comp = <DialogExtension sdk={sdk as DialogExtensionSDK} />;
    } else if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
        comp = <Config sdk={sdk as AppExtensionSDK} />;
    }
    render(comp, document.getElementById('root'));
});

/**
 * By default, iframe of the extension is fully reloaded on every save of a source file.
 * If you want to use HMR (hot module reload) instead of full reload, uncomment the following lines
 */
// if (module.hot) {
//   module.hot.accept();
// }
