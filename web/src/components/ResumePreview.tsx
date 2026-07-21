import type { ReactNode } from "react";
import type { ChangeSet } from "../lib/changes";
import {
	hasBasicsChanged,
	hasItemChanged,
	hasSectionChanged,
} from "../lib/changes";
import type {
	FreeformItem,
	ResumeBasics,
	ResumeData,
	ResumeSection,
	TimelineItem,
} from "../lib/types";

/**
 * Mirrors ../../../src/template.js exactly (same Tailwind classes, same
 * structure). That file renders to an HTML string for Puppeteer; this
 * renders the same layout as JSX for the live, in-browser preview.
 *
 * IMPORTANT: if you change the visual design here, mirror the change in
 * src/template.js too (and vice versa) -- these two are intentionally kept
 * in lockstep so the preview never lies about what the PDF will look like.
 */

function ContactLine({ basics }: { basics: ResumeBasics }) {
	const parts: ReactNode[] = [];
	if (basics.phone) parts.push(basics.phone);
	if (basics.email) parts.push(basics.email);
	for (const link of basics.links ?? []) {
		parts.push(
			<a key={link.url} href={link.url} className="text-black no-underline">
				{link.label}
			</a>,
		);
	}

	return (
		<>
			{parts.map((part, i) => (
				<span key={i}>
					{i > 0 && <span className="mx-2">|</span>}
					{part}
				</span>
			))}
		</>
	);
}

function TimelineItemView({
	item,
	changed,
}: {
	item: TimelineItem;
	changed?: boolean;
}) {
	return (
		<div
			className={`mb-2 break-inside-avoid ${changed ? "pl-2 border-l-2 border-amber-400" : ""}`}
		>
			<div className="flex justify-between text-[10.5pt] font-bold">
				<span>
					{item.organization}
					{item.location ? ` - ${item.location}` : ""}
				</span>
				<span>
					{item.dateStart} - {item.dateEnd}
				</span>
			</div>
			<div className="text-[10.5pt] italic mb-[2pt]">{item.role}</div>
			<ul className="list-disc pl-[14pt] text-[10.5pt] leading-[1.22]">
				{item.highlights.map((h, i) => (
					<li key={i} className="mb-[2pt]">
						{h}
					</li>
				))}
			</ul>
		</div>
	);
}

function FreeformItemView({
	item,
	changed,
}: {
	item: FreeformItem;
	changed?: boolean;
}) {
	return (
		<div
			className={`mb-[4pt] text-[10.5pt] leading-[1.22] ${changed ? "pl-2 border-l-2 border-amber-400" : ""}`}
		>
			<span className="font-bold">{item.label}:</span> <span>{item.text}</span>
		</div>
	);
}

function SectionView({
	section,
	changes,
}: {
	section: ResumeSection;
	changes?: ChangeSet;
}) {
	const sectionChanged = changes
		? hasSectionChanged(changes, section.id)
		: false;

	return (
		<section
			className={`mt-[8pt] ${sectionChanged ? "bg-amber-50 -mx-2 px-2 py-1 rounded" : ""}`}
		>
			<h2 className="text-[11pt] font-bold border-b border-black pb-[2pt] mb-2">
				{section.title}
			</h2>
			{section.type === "freeform"
				? section.items.map((item, i) => (
						<FreeformItemView
							key={i}
							item={item}
							changed={changes ? hasItemChanged(changes, section.id, i) : false}
						/>
					))
				: section.items.map((item, i) => (
						<TimelineItemView
							key={i}
							item={item}
							changed={changes ? hasItemChanged(changes, section.id, i) : false}
						/>
					))}
		</section>
	);
}

export function ResumePreview({
	data,
	changes,
}: {
	data: ResumeData;
	changes?: ChangeSet;
}) {
	const basicsChanged = changes ? hasBasicsChanged(changes) : false;

	return (
		<div className="font-sans text-black w-[210mm] min-h-[297mm] px-[7mm] pt-[12mm] pb-[13mm] mx-auto bg-white shadow-lg">
			<header
				className={`text-center ${basicsChanged ? "bg-amber-50 -mx-[7mm] px-[7mm] py-1 rounded" : ""}`}
			>
				<h1 className="text-[19pt] font-bold uppercase tracking-[0.5pt]">
					{data.basics.name || "Your Name"}
				</h1>
				<div className="text-[10.5pt] mt-[4pt]">
					<ContactLine basics={data.basics} />
				</div>
				<div className="text-[10.5pt]">{data.basics.location}</div>
			</header>

			<hr className="border-black mt-2 mb-2" />

			<p className="text-[10.5pt] text-justify leading-[1.22]">
				{data.basics.summary}
			</p>

			{data.sections.map((section) => (
				<SectionView key={section.id} section={section} changes={changes} />
			))}
		</div>
	);
}
