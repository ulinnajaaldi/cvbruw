import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { moveItem, removeAt, updateAt } from "../lib/array-utils";
import type { TimelineItem } from "../lib/types";

export function TimelineItemEditor({
	item,
	onChange,
	onRemove,
	onMoveUp,
	onMoveDown,
}: {
	item: TimelineItem;
	onChange: (item: TimelineItem) => void;
	onRemove: () => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
}) {
	function set<K extends keyof TimelineItem>(key: K, value: TimelineItem[K]) {
		onChange({ ...item, [key]: value });
	}

	function updateHighlight(i: number, value: string) {
		set("highlights", updateAt(item.highlights, i, value));
	}

	function addHighlight() {
		set("highlights", [...item.highlights, ""]);
	}

	function removeHighlight(i: number) {
		set("highlights", removeAt(item.highlights, i));
	}

	function moveHighlight(i: number, dir: -1 | 1) {
		set("highlights", moveItem(item.highlights, i, dir));
	}

	return (
		<div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
			<div className="flex justify-end gap-1 -mt-1 -mr-1">
				<Button
					variant="ghost"
					size="icon-xs"
					onClick={onMoveUp}
					aria-label="Move up"
				>
					<ArrowUp />
				</Button>
				<Button
					variant="ghost"
					size="icon-xs"
					onClick={onMoveDown}
					aria-label="Move down"
				>
					<ArrowDown />
				</Button>
				<Button variant="ghost" size="sm" onClick={onRemove}>
					Remove entry
				</Button>
			</div>

			<div className="grid grid-cols-2 gap-2">
				<Field>
					<FieldLabel>Organization</FieldLabel>
					<Input
						value={item.organization}
						onChange={(e) => set("organization", e.target.value)}
					/>
				</Field>
				<Field>
					<FieldLabel>Location</FieldLabel>
					<Input
						value={item.location ?? ""}
						onChange={(e) => set("location", e.target.value)}
					/>
				</Field>
			</div>

			<div className="grid grid-cols-2 gap-2">
				<Field>
					<FieldLabel>Start date</FieldLabel>
					<Input
						value={item.dateStart}
						onChange={(e) => set("dateStart", e.target.value)}
						placeholder="Jan 2024"
					/>
				</Field>
				<Field>
					<FieldLabel>End date</FieldLabel>
					<Input
						value={item.dateEnd}
						onChange={(e) => set("dateEnd", e.target.value)}
						placeholder="Present"
					/>
				</Field>
			</div>

			<Field>
				<FieldLabel>Role / title</FieldLabel>
				<Input
					value={item.role}
					onChange={(e) => set("role", e.target.value)}
				/>
			</Field>

			<Field>
				<FieldLabel>Highlights</FieldLabel>
				<div className="space-y-1.5">
					{item.highlights.map((h, i) => (
						<div key={i} className="flex gap-1.5 items-start">
							<Textarea
								value={h}
								onChange={(e) => updateHighlight(i, e.target.value)}
							/>
							<div className="flex flex-col shrink-0">
								<Button
									variant="ghost"
									size="icon-xs"
									onClick={() => moveHighlight(i, -1)}
								>
									<ArrowUp />
								</Button>
								<Button
									variant="ghost"
									size="icon-xs"
									onClick={() => moveHighlight(i, 1)}
								>
									<ArrowDown />
								</Button>
								<Button
									variant="ghost"
									size="icon-xs"
									onClick={() => removeHighlight(i)}
								>
									<Trash2 />
								</Button>
							</div>
						</div>
					))}
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={addHighlight}
					className="mt-1.5"
				>
					+ Add highlight
				</Button>
			</Field>
		</div>
	);
}
