import {EntryState} from "../util";
import axios from "axios";

let setUrl = "";
let getUrl = "";
let apiKey = "";

export function setURL(url: string) {
    setUrl = url;
}

export function getURL(url: string) {
    getUrl = url;
}

export function setApiKey(key: string) {
    apiKey = key;
}

function submitEntryState(userId: string, entryId: string, entryState: EntryState) {
    const state: string = EntryState[entryState];
    return axios.post(setUrl, {
        entryId: entryId,
        userId: userId,
        entryState: state
    }, {
        headers: {
            'x-api-key': apiKey
        }
    });
}

export async function lockEntry(userId: string, entryId: string) {
    await submitEntryState(userId, entryId, EntryState.EDITING);
}

export async function unlockEntry(userId: string, entryId: string) {
    await submitEntryState(userId, entryId, EntryState.EDITABLE);
}

export async function getEntryStatus(entryId: string) {
    return await axios.get(getUrl + `${entryId}`, {
        headers: {
            'x-api-key': apiKey
        }
    });
}