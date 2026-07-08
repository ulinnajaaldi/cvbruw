import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FreeformItem } from "../lib/types";

export function FreeformItemEditor({
	item,
	onChange,
	onRemove,
}: {
	item: FreeformItem;
	onChange: (item: FreeformItem) => void;
	onRemove: () => void;
}) {
	function set<K extends keyof FreeformItem>(key: K, value: FreeformItem[K]) {
		onChange({ ...item, [key]: value });
	}

	return (
		<div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
			<div className="flex justify-end -mt-1 -mr-1">
				<Button variant="ghost" size="sm" onClick={onRemove}>
					Remove entry
				</Button>
			</div>
			<Field>
				<FieldLabel>Label</FieldLabel>
				<Input
					value={item.label}
					onChange={(e) => set("label", e.target.value)}
					placeholder="Technical Skills"
				/>
			</Field>
			<Field>
				<FieldLabel>Text</FieldLabel>
				<Textarea
					value={item.text}
					onChange={(e) => set("text", e.target.value)}
				/>
			</Field>
		</div>
	);
}
