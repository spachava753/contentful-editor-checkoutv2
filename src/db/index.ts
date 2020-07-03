import { EntryState } from '../util';
import axios from 'axios';

let URL: string, apiKey: string;

export function setURL(url: string) {
    URL = url;
}

export function setApiKey(key: string) {
    apiKey = key;
}

export function submitEntryData(data: object) {
    return axios.post(URL, data, {
        headers: {
            'x-api-key': apiKey
        }
    });
}

export async function lockEntry(data: object) {
    const state: string = EntryState[EntryState.EDITING];
    await submitEntryData({ ...data, details: 'status', entryState: state });
}

export async function unlockEntry(data: object) {
    const state: string = EntryState[EntryState.EDITABLE];
    await submitEntryData({ ...data, details: 'status', entryState: state });
}

export async function getEntryStatus(entryId: string) {
    return await axios.get(URL + `${entryId}/status`, {
        headers: {
            'x-api-key': apiKey
        }
    });
}
