# Editor Checkout

This repo is to contain code for Contentful's extension that disallows concurrent editing. The original repo has been archived after many experiments and mistakes. Also, Contentful has open-sourced the field editors they use in the default editors, so going forward, this extension will try to use and modify the open-sourced field editors instead of creating field editors from scratch.

## Version 1
For the first version, the extension will be a sidebar extension that will simply have a button for checking out the article and resetting the initial values. ALthogh, this might not provide the best visual experience for the editors, the basic functionality could be achieved through this. 

# Todo
 - [x] Create the sidebar extension
 - [ ] Notify the editor that they are currently in the read-only mode initially
 - [ ] Create the "check out" functionality and persist across users
 - [ ] Create the "check in" functionality which will release the lock on the current entry
 - [ ] Create the "discard and check in" functionality which will release the lock on the current entry and discard any new changes made
 - [ ] If the editor leaves while in the "checked in" state, then prompt the editor to save or discard the changes
