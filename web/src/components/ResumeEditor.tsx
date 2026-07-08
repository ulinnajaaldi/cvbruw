import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { useState } from "react";
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

	const step = steps[currentStep];

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
									active
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground hover:bg-muted/80",
								].join(" ")}
							>
								{s.kind === "add" ? (
									<Plus className="size-3" />
								) : (
									<span className="mr-1 opacity-60">{i + 1}</span>
								)}
								{label}
							</button>
						);
					})}
				</div>
			</ScrollArea>

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
							/>
						);
					})()}

				{step?.kind === "add" && (
					<div className="rounded-2xl border border-dashed p-4 space-y-3">
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
		</div>
	);
}
