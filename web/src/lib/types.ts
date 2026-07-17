/**
 * These types mirror the JSON shape consumed by the render engine in
 * ../../../src/template.js (Fase 1). Keep them in sync -- this is the single
 * data contract shared by: this editor, the render engine, and the Hermes
 * skill's SKILL.md schema description.
 */

export interface ResumeLink {
	label: string;
	url: string;
}

export interface ResumeBasics {
	name: string;
	phone: string;
	email: string;
	links: ResumeLink[];
	location: string;
	/** Optional subtitle/headline under the name (not currently rendered by the PDF template). */
	title?: string;
	summary: string;
}

export interface TimelineItem {
	organization: string;
	location?: string;
	dateStart: string;
	dateEnd: string;
	role: string;
	highlights: string[];
}

export interface FreeformItem {
	label: string;
	text: string;
}

export interface TimelineSection {
	id: string;
	title: string;
	type: "timeline";
	items: TimelineItem[];
}

export interface FreeformSection {
	id: string;
	title: string;
	type: "freeform";
	items: FreeformItem[];
}

export type ResumeSection = TimelineSection | FreeformSection;

export interface ResumeData {
	basics: ResumeBasics;
	sections: ResumeSection[];
}

/** Creates a blank timeline item for "add new entry" actions. */
export function emptyTimelineItem(): TimelineItem {
	return {
		organization: "",
		location: "",
		dateStart: "",
		dateEnd: "",
		role: "",
		highlights: [""],
	};
}

/** Creates a blank freeform item for "add new entry" actions. */
export function emptyFreeformItem(): FreeformItem {
	return { label: "", text: "" };
}

/** Creates a blank resume, used when IndexedDB has nothing stored yet. */
export function emptyResumeData(): ResumeData {
	return {
		basics: {
			name: "",
			phone: "",
			email: "",
			links: [],
			location: "",
			summary: "",
		},
		sections: [
			{ id: "work", title: "Work Experience", type: "timeline", items: [] },
			{
				id: "education",
				title: "Education & Training",
				type: "timeline",
				items: [],
			},
			{ id: "other", title: "Other", type: "freeform", items: [] },
		],
	};
}
