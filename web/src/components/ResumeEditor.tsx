import { ArrowLeft, ArrowRight, Plus, Sparkles } from "lucide-react";
import { useCallback, useState } from "react";
import type { AISuggestion } from "#/server/ai-generate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectItem,
	SelectPopup,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { moveItem, removeAt, updateAt } from "../lib/array-utils";
import type { ResumeData, ResumeSection } from "../lib/types";
import { AIPanel } from "./AIPanel";
import { BasicsEditor } from "./BasicsEditor";
import { SectionEditor } from "./SectionEditor";

const sectionTypes = [
	{ label: "Timeline (org + dates + bullets)", value: "timeline" },
	{ label: "Freeform (label + text)", value: "freeform" },
];

function slugify(title: string): string {
	const base = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
	return base || `section-${Date.now()}`;
}

type StepEntry =
	| { kind: "basics" }
	| { kind: "section"; id: string; title: string }
	| { kind: "add" };

export type ActiveStep =
	| { kind: "basics" }
	| {
			kind: "section";
			id: string;
			title: string;
			sectionType: "timeline" | "freeform";
			itemCount: number;
	  }
	| { kind: "add" };

export function ResumeEditor({
	data,
	onChange,
}: {
	data: ResumeData;
	onChange: (data: ResumeData) => void;
}) {
	const [newSectionType, setNewSectionType] = useState<"timeline" | "freeform">(
		"timeline",
	);
	const [newSectionTitle, setNewSectionTitle] = useState("");
	const [currentStep, setCurrentStep] = useState(0);
	const [showAIPanel, setShowAIPanel] = useState(false);
	const [aiItemContext, setAiItemContext] = useState<string | null>(null);

	const steps: StepEntry[] = [
		{ kind: "basics" },
		...data.sections.map((s) => ({
			kind: "section" as const,
			id: s.id,
			title: s.title,
		})),
		{ kind: "add" },
	];

	const totalSteps = steps.length;
	const atEnd = currentStep >= totalSteps - 1;
	const atStart = currentStep <= 0;

	function clampStep(n: number) {
		return Math.max(0, Math.min(n, totalSteps - 1));
	}

	function goToStep(n: number) {
		setCurrentStep(clampStep(n));
	}

	function addSection() {
		const title = newSectionTitle.trim() || "New Section";
		const section: ResumeSection =
			newSectionType === "timeline"
				? { id: slugify(title), title, type: "timeline", items: [] }
				: { id: slugify(title), title, type: "freeform", items: [] };
		onChange({ ...data, sections: [...data.sections, section] });
		setNewSectionTitle("");
		setCurrentStep(data.sections.length + 1);
	}

	function removeSection(index: number) {
		onChange({ ...data, sections: removeAt(data.sections, index) });
		if (currentStep > index + 1) {
			setCurrentStep((s) => s - 1);
		} else if (currentStep === index + 1 && currentStep >= totalSteps - 1) {
			setCurrentStep(clampStep(totalSteps - 2));
		}
	}

	function handleAIImproveItem(itemIndex: number) {
		if (!step || step.kind !== "section") return;
		const sec = data.sections.find((s) => s.id === step.id);
		if (!sec || sec.type !== "timeline") return;
		const item = sec.items[itemIndex];
		if (!item) return;

		const highlights = item.highlights.filter(Boolean).join("\n");
		const context = `Focus on this specific work experience entry at ${item.organization || "unknown organization"}:

Organization: ${item.organization || "(empty)"}
Location: ${item.location || "(empty)"}
Role: ${item.role || "(empty)"} (${item.dateStart || "?"} - ${item.dateEnd || "?"})
Highlights:
${highlights || "(no highlights yet)"}

Improve the bullet points using the XYZ formula: "Accomplished [X] as measured by [Y] by doing [Z]". Add quantified metrics where possible. Ensure each bullet starts with a strong action verb.`;

		setAiItemContext(context);
		setShowAIPanel(true);
	}

	const handleApplyAISuggestions = useCallback(
		(suggestions: AISuggestion[]) => {
			let newData = { ...data };
			for (const suggestion of suggestions) {
				const sectionIdx = newData.sections.findIndex(
					(s) => s.id === suggestion.sectionId,
				);
				if (sectionIdx === -1) continue;

				const section = newData.sections[sectionIdx];
				if (section.type === "timeline" && suggestion.itemId !== undefined) {
					const item = section.items[suggestion.itemId];
					if (!item) continue;

					if (
						suggestion.field === "highlights" &&
						Array.isArray(item.highlights)
					) {
						const highlightIdx = item.highlights.indexOf(
							suggestion.currentValue,
						);
						if (highlightIdx >= 0) {
							const newItems = [...section.items];
							const newItem = { ...item, highlights: [...item.highlights] };
							newItem.highlights[highlightIdx] = suggestion.suggestedValue;
							newItems[suggestion.itemId] = newItem;
							newData = {
								...newData,
								sections: updateAt(newData.sections, sectionIdx, {
									...section,
									items: newItems,
								}),
							};
						}
					}
				} else if (
					section.type === "freeform" &&
					suggestion.itemId !== undefined
				) {
					const item = section.items[suggestion.itemId];
					if (!item) continue;

					if (suggestion.field === "text") {
						const newItems = [...section.items];
						newItems[suggestion.itemId] = {
							...item,
							text: suggestion.suggestedValue,
						};
						newData = {
							...newData,
							sections: updateAt(newData.sections, sectionIdx, {
								...section,
								items: newItems,
							}),
						};
					}
				}
			}
			onChange(newData);
		},
		[data, onChange],
	);

	const step = steps[currentStep];

	const activeStep: ActiveStep =
		step?.kind === "section"
			? (() => {
					const sec = data.sections.find((s) => s.id === step.id);
					return sec
						? {
								kind: "section",
								id: sec.id,
								title: sec.title,
								sectionType: sec.type,
								itemCount: sec.items.length,
							}
						: {
								kind: "section",
								id: step.id,
								title: step.title,
								sectionType: "timeline",
								itemCount: 0,
							};
				})()
			: step?.kind === "basics"
				? { kind: "basics" }
				: { kind: "add" };

	return (
		<div className="flex flex-col h-full overflow-hidden">
			{/* Stepper */}
			<ScrollArea className="shrink-0 h-auto max-h-24">
				<div className="flex items-center gap-1 px-1 py-2">
					{steps.map((s, i) => {
						const active = i === currentStep;
						const label =
							s.kind === "basics"
								? "Basics"
								: s.kind === "add"
									? "Add"
									: s.title || "Section";
						return (
							<button
								key={s.kind === "section" ? s.id : s.kind}
								type="button"
								onClick={() => goToStep(i)}
								className={[
									"shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
									"inline-flex items-center gap-1",
									active
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground hover:bg-muted/80",
								].join(" ")}
							>
								{s.kind === "add" ? (
									<Plus className="size-3" />
								) : (
									<span className="opacity-60">{i + 1}</span>
								)}
								<span>{label}</span>
							</button>
						);
					})}
				</div>
			</ScrollArea>

			{/* AI button */}
			<div className="shrink-0 px-1 py-1">
				<Button variant="ghost" size="sm" onClick={() => setShowAIPanel(true)}>
					<Sparkles className="size-3.5" />
					AI Improve
				</Button>
			</div>

			{/* Step content */}
			<ScrollArea className="flex-1 min-h-0 px-1 pb-4">
				{step?.kind === "basics" && (
					<BasicsEditor
						basics={data.basics}
						onChange={(basics) => onChange({ ...data, basics })}
					/>
				)}

				{step?.kind === "section" &&
					(() => {
						const idx = data.sections.findIndex((s) => s.id === step.id);
						const sec = data.sections[idx];
						if (!sec) return null;
						return (
							<SectionEditor
								section={sec}
								onChange={(updated) =>
									onChange({
										...data,
										sections: updateAt(data.sections, idx, updated),
									})
								}
								onRemove={() => removeSection(idx)}
								onMoveUp={() =>
									onChange({
										...data,
										sections: moveItem(data.sections, idx, -1),
									})
								}
								onMoveDown={() =>
									onChange({
										...data,
										sections: moveItem(data.sections, idx, 1),
									})
								}
								onAIImproveItem={
									sec.type === "timeline" ? handleAIImproveItem : undefined
								}
							/>
						);
					})()}

				{step?.kind === "add" && (
					<div className="rounded-2xl border border-dashed p-4 flex flex-col gap-3">
						<h3 className="text-sm font-semibold">Add a new section</h3>
						<Input
							placeholder="Section title, e.g. Certifications"
							value={newSectionTitle}
							onChange={(e) => setNewSectionTitle(e.target.value)}
						/>
						<Select
							items={sectionTypes}
							value={newSectionType}
							onValueChange={(v) =>
								setNewSectionType(v as "timeline" | "freeform")
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectPopup>
								{sectionTypes.map((item) => (
									<SelectItem key={item.value} value={item}>
										{item.label}
									</SelectItem>
								))}
							</SelectPopup>
						</Select>
						<Button onClick={addSection} className="w-full">
							<Plus className="size-4" />
							Add section
						</Button>
					</div>
				)}
			</ScrollArea>

			{/* Nav buttons — always pinned to bottom */}
			<div className="shrink-0 flex items-center justify-between gap-2 pt-2 border-t px-1">
				<Button
					variant="outline"
					size="sm"
					disabled={atStart}
					onClick={() => goToStep(currentStep - 1)}
				>
					<ArrowLeft className="size-3.5" />
					Previous
				</Button>
				<span className="text-xs text-muted-foreground tabular-nums">
					{currentStep + 1} / {totalSteps}
				</span>
				<Button
					variant="outline"
					size="sm"
					disabled={atEnd}
					onClick={() => goToStep(currentStep + 1)}
				>
					Next
					<ArrowRight className="size-3.5" />
				</Button>
			</div>

			{/* AI Panel */}
			{showAIPanel && (
				<AIPanel
					resumeData={data}
					activeStep={activeStep}
					initialContext={aiItemContext}
					onApplySuggestions={handleApplyAISuggestions}
					onClose={() => {
						setShowAIPanel(false);
						setAiItemContext(null);
					}}
				/>
			)}
		</div>
	);
}
