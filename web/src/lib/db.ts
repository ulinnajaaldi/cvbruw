import { type IDBPDatabase, openDB } from "idb";
import type { ResumeData } from "./types";

/**
 * Browser-side persistence, deliberately simple: one resume, one record.
 * This is a stand-in for "real" storage -- there's no server-side database
 * yet, so if the user clears site data or switches browsers, this is gone.
 * That's an accepted tradeoff for now (per user request), not an oversight.
 */

const DB_NAME = "cv-ats-maker";
const DB_VERSION = 1;
const STORE_NAME = "resume";
const RECORD_KEY = "current";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
	if (!dbPromise) {
		dbPromise = openDB(DB_NAME, DB_VERSION, {
			upgrade(db) {
				if (!db.objectStoreNames.contains(STORE_NAME)) {
					db.createObjectStore(STORE_NAME);
				}
			},
		});
	}
	// biome-ignore lint/style/noNonNullAssertion: <go for it>
	return dbPromise!;
}

export async function loadResumeData(): Promise<ResumeData | null> {
	const db = await getDB();
	const value = await db.get(STORE_NAME, RECORD_KEY);
	return (value as ResumeData) ?? null;
}

export async function saveResumeData(data: ResumeData): Promise<void> {
	const db = await getDB();
	await db.put(STORE_NAME, data, RECORD_KEY);
}

export async function clearResumeData(): Promise<void> {
	const db = await getDB();
	await db.delete(STORE_NAME, RECORD_KEY);
}
