import {EntryState} from "../util";
import creds from "../aws-creds";
import axios from "axios";

function submitEntryState(userId: string, entryId: string, entryState: EntryState) {
    const state = entryState == EntryState.UNLOCKED ? 'Unlocked' : 'Locked';
    return axios.post(creds.endpoint + 'change', {
        entryId: entryId,
        userId: userId,
        entryState: state
    });
}

export async function lockEntry(userId: string, entryId: string) {
    await submitEntryState(userId, entryId, EntryState.LOCKED);
}

export async function unlockEntry(userId: string, entryId: string) {
    await submitEntryState(userId, entryId, EntryState.UNLOCKED);
}

export async function getEntryStatus(entryId: string) {
    return await axios.get(creds.endpoint + 'get/' + `${entryId}`);
}