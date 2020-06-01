import {EntryState} from "../util";
import axios from "axios";

let URL: string, apiKey: string;

export function setURL(url: string) {
    URL = url;
}

export function setApiKey(key: string) {
    apiKey = key;
}

function submitEntryState(data: object, entryState: EntryState) {
    const state: string = EntryState[entryState];
    return axios.post(URL, {
        ...data,
        entryState: state
    }, {
        headers: {
            'x-api-key': apiKey
        }
    });
}

export async function lockEntry(data: object) {
    await submitEntryState(data, EntryState.EDITING);
}

export async function unlockEntry(data: object) {
    await submitEntryState(data, EntryState.EDITABLE);
}

export async function getEntryStatus(entryId: string) {
    return await axios.get(URL + `${entryId}`, {
        headers: {
            'x-api-key': apiKey
        }
    });
}