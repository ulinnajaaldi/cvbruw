import { type IDBPDatabase, openDB } from "idb";
import type { ResumeData } from "./types";

const DB_NAME = "cv-ats-maker";
const DB_VERSION = 2;
const STORE_NAME = "resume";

export interface SavedResume {
	id: string;
	name: string;
	data: ResumeData;
	updatedAt: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
	if (!dbPromise) {
		dbPromise = openDB(DB_NAME, DB_VERSION, {
			upgrade(db, oldVersion) {
				if (!db.objectStoreNames.contains(STORE_NAME)) {
					db.createObjectStore(STORE_NAME);
				}
				if (oldVersion < 2) {
					const tx = db.transaction(STORE_NAME, "readwrite");
					const store = tx.objectStore(STORE_NAME);
					store.get("current").then((oldData) => {
						if (oldData) {
							const migrated: SavedResume = {
								id: "current",
								name: (oldData as ResumeData).basics?.name || "Resume",
								data: oldData as ResumeData,
								updatedAt: Date.now(),
							};
							store.put(migrated, "current");
						}
					});
				}
			},
		});
	}
	// biome-ignore lint/style/noNonNullAssertion: <go for it>
	return dbPromise!;
}

export async function listResumes(): Promise<SavedResume[]> {
	const db = await getDB();
	const all = await db.getAll(STORE_NAME);
	return (all as SavedResume[])
		.filter((r) => r.id !== "current")
		.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function loadResume(id: string): Promise<SavedResume | null> {
	const db = await getDB();
	const value = await db.get(STORE_NAME, id);
	return (value as SavedResume) ?? null;
}

export async function saveResume(
	data: ResumeData,
	name?: string,
	id?: string,
): Promise<SavedResume> {
	const db = await getDB();
	const resumeId = id ?? crypto.randomUUID();
	const record: SavedResume = {
		id: resumeId,
		name: name || data.basics.name || "Untitled",
		data,
		updatedAt: Date.now(),
	};
	await db.put(STORE_NAME, record, resumeId);
	return record;
}

export async function deleteResume(id: string): Promise<void> {
	const db = await getDB();
	await db.delete(STORE_NAME, id);
}

/** @deprecated Use loadResume("current") instead */
export async function loadResumeData(): Promise<ResumeData | null> {
	const resume = await loadResume("current");
	return resume?.data ?? null;
}

/** @deprecated Use saveResume(data, name, id) instead */
export async function saveResumeData(data: ResumeData): Promise<void> {
	await saveResume(data, data.basics.name, "current");
}

/** @deprecated Use deleteResume("current") instead */
export async function clearResumeData(): Promise<void> {
	await deleteResume("current");
}
