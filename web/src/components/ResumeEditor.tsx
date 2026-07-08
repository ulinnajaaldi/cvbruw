import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

	function addSection() {
		const title = newSectionTitle.trim() || "New Section";
		const section: ResumeSection =
			newSectionType === "timeline"
				? { id: slugify(title), title, type: "timeline", items: [] }
				: { id: slugify(title), title, type: "freeform", items: [] };
		onChange({ ...data, sections: [...data.sections, section] });
		setNewSectionTitle("");
	}

	return (
		<div className="space-y-4">
			<BasicsEditor
				basics={data.basics}
				onChange={(basics) => onChange({ ...data, basics })}
			/>

			{data.sections.map((section, i) => (
				<SectionEditor
					key={section.id}
					section={section}
					onChange={(updated) =>
						onChange({ ...data, sections: updateAt(data.sections, i, updated) })
					}
					onRemove={() =>
						onChange({ ...data, sections: removeAt(data.sections, i) })
					}
					onMoveUp={() =>
						onChange({ ...data, sections: moveItem(data.sections, i, -1) })
					}
					onMoveDown={() =>
						onChange({ ...data, sections: moveItem(data.sections, i, 1) })
					}
				/>
			))}

			<div className="rounded-2xl border border-dashed p-4">
				<h3 className="text-sm font-semibold mb-2">Add a new section</h3>
				<div className="flex gap-2">
					<Input
						className="flex-1"
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
						<SelectTrigger className="w-auto min-w-48">
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
					<Button onClick={addSection}>Add section</Button>
				</div>
			</div>
		</div>
	);
}
