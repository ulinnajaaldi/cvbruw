import type { FreeformItem, ResumeData, TimelineItem } from "./types";

export type ChangePath = string;

export interface ChangeSet {
	paths: Set<ChangePath>;
	hasChanges: boolean;
}

function diffbasics(
	baseline: ResumeData["basics"],
	current: ResumeData["basics"],
	prefix: string,
	paths: Set<ChangePath>,
): void {
	if (baseline.name !== current.name) paths.add(`${prefix}name`);
	if (baseline.phone !== current.phone) paths.add(`${prefix}phone`);
	if (baseline.email !== current.email) paths.add(`${prefix}email`);
	if (baseline.location !== current.location) paths.add(`${prefix}location`);
	if (baseline.summary !== current.summary) paths.add(`${prefix}summary`);
	if (baseline.title !== current.title) paths.add(`${prefix}title`);

	const baselineLinks = JSON.stringify(baseline.links);
	const currentLinks = JSON.stringify(current.links);
	if (baselineLinks !== currentLinks) paths.add(`${prefix}links`);
}

function diffTimelineItems(
	baseline: TimelineItem[],
	current: TimelineItem[],
	sectionPrefix: string,
	paths: Set<ChangePath>,
): void {
	const maxLen = Math.max(baseline.length, current.length);
	for (let i = 0; i < maxLen; i++) {
		const prefix = `${sectionPrefix}items[${i}].`;
		const b = baseline[i];
		const c = current[i];
		if (!b) {
			paths.add(`${sectionPrefix}items[${i}]`);
			continue;
		}
		if (!c) {
			paths.add(`${sectionPrefix}items[${i}]`);
			continue;
		}
		if (b.organization !== c.organization) paths.add(`${prefix}organization`);
		if (b.location !== c.location) paths.add(`${prefix}location`);
		if (b.dateStart !== c.dateStart) paths.add(`${prefix}dateStart`);
		if (b.dateEnd !== c.dateEnd) paths.add(`${prefix}dateEnd`);
		if (b.role !== c.role) paths.add(`${prefix}role`);
		const baselineHighlights = JSON.stringify(b.highlights);
		const currentHighlights = JSON.stringify(c.highlights);
		if (baselineHighlights !== currentHighlights)
			paths.add(`${prefix}highlights`);
	}
}

function diffFreeformItems(
	baseline: FreeformItem[],
	current: FreeformItem[],
	sectionPrefix: string,
	paths: Set<ChangePath>,
): void {
	const maxLen = Math.max(baseline.length, current.length);
	for (let i = 0; i < maxLen; i++) {
		const prefix = `${sectionPrefix}items[${i}].`;
		const b = baseline[i];
		const c = current[i];
		if (!b || !c) {
			paths.add(`${sectionPrefix}items[${i}]`);
			continue;
		}
		if (b.label !== c.label) paths.add(`${prefix}label`);
		if (b.text !== c.text) paths.add(`${prefix}text`);
	}
}

export function computeChanges(
	baseline: ResumeData,
	current: ResumeData,
): ChangeSet {
	const paths = new Set<ChangePath>();

	diffbasics(baseline.basics, current.basics, "basics.", paths);

	const baselineById = new Map(baseline.sections.map((s) => [s.id, s]));
	const currentById = new Map(current.sections.map((s) => [s.id, s]));

	for (const [id, sec] of currentById) {
		const base = baselineById.get(id);
		const sectionPrefix = `sections[${id}].`;
		if (!base) {
			paths.add(sectionPrefix);
			continue;
		}
		if (base.title !== sec.title) paths.add(`${sectionPrefix}title`);
		if (base.type !== sec.type) {
			paths.add(`${sectionPrefix}type`);
			continue;
		}
		if (base.type === "timeline" && sec.type === "timeline") {
			diffTimelineItems(base.items, sec.items, sectionPrefix, paths);
		} else if (base.type === "freeform" && sec.type === "freeform") {
			diffFreeformItems(base.items, sec.items, sectionPrefix, paths);
		}
	}

	for (const id of baselineById.keys()) {
		if (!currentById.has(id)) {
			paths.add(`sections[${id}]`);
		}
	}

	return { paths, hasChanges: paths.size > 0 };
}

export function hasSectionChanged(
	changes: ChangeSet,
	sectionId: string,
): boolean {
	const prefix = `sections[${sectionId}]`;
	for (const path of changes.paths) {
		if (path.startsWith(prefix)) return true;
	}
	return false;
}

export function hasItemChanged(
	changes: ChangeSet,
	sectionId: string,
	itemIndex: number,
): boolean {
	const prefix = `sections[${sectionId}].items[${itemIndex}]`;
	for (const path of changes.paths) {
		if (path.startsWith(prefix)) return true;
	}
	return false;
}

export function hasBasicsChanged(changes: ChangeSet): boolean {
	for (const path of changes.paths) {
		if (path.startsWith("basics.")) return true;
	}
	return false;
}
