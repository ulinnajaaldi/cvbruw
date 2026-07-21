import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { moveItem, removeAt, updateAt } from "../lib/array-utils";
import type { ResumeSection } from "../lib/types";
import { emptyFreeformItem, emptyTimelineItem } from "../lib/types";
import { FreeformItemEditor } from "./FreeformItemEditor";
import { TimelineItemEditor } from "./TimelineItemEditor";

export function SectionEditor({
	section,
	onChange,
	onRemove,
	onMoveUp,
	onMoveDown,
	onAIImproveItem,
}: {
	section: ResumeSection;
	onChange: (section: ResumeSection) => void;
	onRemove: () => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onAIImproveItem?: (itemIndex: number) => void;
}) {
	function addItem() {
		if (section.type === "timeline") {
			onChange({ ...section, items: [...section.items, emptyTimelineItem()] });
		} else {
			onChange({ ...section, items: [...section.items, emptyFreeformItem()] });
		}
	}

	return (
		<div className="rounded-2xl border bg-card p-4 flex flex-col gap-3">
			<div className="flex items-center justify-between gap-2">
				<Input
					className="flex-1 font-semibold"
					value={section.title}
					onChange={(e) => onChange({ ...section, title: e.target.value })}
				/>
				<div className="flex gap-1 shrink-0">
					<Button
						variant="ghost"
						size="icon-xs"
						onClick={onMoveUp}
						aria-label="Move section up"
					>
						<ArrowUp />
					</Button>
					<Button
						variant="ghost"
						size="icon-xs"
						onClick={onMoveDown}
						aria-label="Move section down"
					>
						<ArrowDown />
					</Button>
					<Button variant="ghost" size="sm" onClick={onRemove}>
						Remove section
					</Button>
				</div>
			</div>

			<div className="flex flex-col gap-2">
				{section.type === "timeline"
					? section.items.map((item, i) => (
							<TimelineItemEditor
								key={i}
								item={item}
								onChange={(updated) =>
									onChange({
										...section,
										items: updateAt(section.items, i, updated),
									})
								}
								onRemove={() =>
									onChange({ ...section, items: removeAt(section.items, i) })
								}
								onMoveUp={() =>
									onChange({
										...section,
										items: moveItem(section.items, i, -1),
									})
								}
								onMoveDown={() =>
									onChange({
										...section,
										items: moveItem(section.items, i, 1),
									})
								}
								onAIImprove={
									onAIImproveItem ? () => onAIImproveItem(i) : undefined
								}
							/>
						))
					: section.items.map((item, i) => (
							<FreeformItemEditor
								key={i}
								item={item}
								onChange={(updated) =>
									onChange({
										...section,
										items: updateAt(section.items, i, updated),
									})
								}
								onRemove={() =>
									onChange({ ...section, items: removeAt(section.items, i) })
								}
							/>
						))}
			</div>

			<Button variant="ghost" size="sm" onClick={addItem}>
				+ Add entry
			</Button>
		</div>
	);
}
