import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ResumeBasics } from "../lib/types";

export function BasicsEditor({
	basics,
	onChange,
}: {
	basics: ResumeBasics;
	onChange: (basics: ResumeBasics) => void;
}) {
	function set<K extends keyof ResumeBasics>(key: K, value: ResumeBasics[K]) {
		onChange({ ...basics, [key]: value });
	}

	function updateLink(
		index: number,
		patch: Partial<ResumeBasics["links"][number]>,
	) {
		const links = basics.links.map((l, i) =>
			i === index ? { ...l, ...patch } : l,
		);
		set("links", links);
	}

	function addLink() {
		set("links", [...basics.links, { label: "", url: "" }]);
	}

	function removeLink(index: number) {
		set(
			"links",
			basics.links.filter((_, i) => i !== index),
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Basics</CardTitle>
			</CardHeader>
			<CardPanel className="space-y-3 pt-0">
				<Field>
					<FieldLabel>Full name</FieldLabel>
					<Input
						value={basics.name}
						onChange={(e) => set("name", e.target.value)}
						placeholder="Aldilla Ulinnaja"
					/>
				</Field>

				<div className="grid grid-cols-2 gap-3">
					<Field>
						<FieldLabel>Phone</FieldLabel>
						<Input
							value={basics.phone}
							onChange={(e) => set("phone", e.target.value)}
							placeholder="+62..."
						/>
					</Field>
					<Field>
						<FieldLabel>Email</FieldLabel>
						<Input
							value={basics.email}
							onChange={(e) => set("email", e.target.value)}
							placeholder="name@example.com"
						/>
					</Field>
				</div>

				<Field>
					<FieldLabel>Location</FieldLabel>
					<Input
						value={basics.location}
						onChange={(e) => set("location", e.target.value)}
						placeholder="City, Region."
					/>
				</Field>

				<Field>
					<FieldLabel>Summary</FieldLabel>
					<Textarea
						value={basics.summary}
						onChange={(e) => set("summary", e.target.value)}
						placeholder="2-4 sentence professional summary"
					/>
				</Field>

				<Field>
					<FieldLabel>Links</FieldLabel>
					<div className="space-y-2">
						{basics.links.map((link, i) => (
							<div key={i} className="flex gap-2 items-center">
								<Input
									value={link.label}
									onChange={(e) => updateLink(i, { label: e.target.value })}
									placeholder="linkedin.com/in/..."
								/>
								<Input
									value={link.url}
									onChange={(e) => updateLink(i, { url: e.target.value })}
									placeholder="https://..."
								/>
								<Button
									variant="ghost"
									size="icon-xs"
									onClick={() => removeLink(i)}
									aria-label="Remove link"
								>
									<Trash2 />
								</Button>
							</div>
						))}
					</div>
					<Button variant="ghost" size="sm" onClick={addLink} className="mt-2">
						+ Add link
					</Button>
				</Field>
			</CardPanel>
		</Card>
	);
}
