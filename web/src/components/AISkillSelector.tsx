import { Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { Skill } from "#/lib/skills";
import {
	deleteCustomSkill,
	getBuiltinSkills,
	getCustomSkills,
	parseSkillFromMarkdown,
	saveCustomSkill,
} from "#/lib/skills";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectItem,
	SelectPopup,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface AISkillSelectorProps {
	value: string;
	onChange: (skillId: string) => void;
}

export function AISkillSelector({ value, onChange }: AISkillSelectorProps) {
	const [customSkills, setCustomSkills] = useState<Skill[]>(getCustomSkills);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const builtinSkills = getBuiltinSkills();
	const allSkills = [...builtinSkills, ...customSkills];

	const handleUpload = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			const text = await file.text();
			const skill = parseSkillFromMarkdown(text, file.name);
			if (!skill) {
				return;
			}

			saveCustomSkill(skill);
			setCustomSkills(getCustomSkills());
			onChange(skill.id);
			e.target.value = "";
		},
		[onChange],
	);

	const handleDelete = useCallback(
		(id: string) => {
			deleteCustomSkill(id);
			setCustomSkills(getCustomSkills());
			if (value === id) {
				onChange(builtinSkills[0]?.id || "");
			}
		},
		[value, onChange, builtinSkills],
	);

	const selectedSkill = allSkills.find((s) => s.id === value);

	return (
		<div className="space-y-2">
			<Label className="text-xs font-medium text-muted-foreground">Skill</Label>
			<div className="flex gap-2">
				<Select value={value} onValueChange={(v) => v && onChange(v)}>
					<SelectTrigger className="flex-1">
						<SelectValue />
					</SelectTrigger>
					<SelectPopup>
						{builtinSkills.length > 0 && (
							<>
								<div className="px-2 py-1 text-xs font-medium text-muted-foreground">
									Built-in
								</div>
								{builtinSkills.map((skill) => (
									<SelectItem key={skill.id} value={skill.id}>
										{skill.name}
									</SelectItem>
								))}
							</>
						)}
						{customSkills.length > 0 && (
							<>
								<div className="px-2 py-1 text-xs font-medium text-muted-foreground">
									Custom
								</div>
								{customSkills.map((skill) => (
									<SelectItem key={skill.id} value={skill.id}>
										<span className="flex items-center gap-2">
											{skill.name}
											<button
												type="button"
												className="text-muted-foreground hover:text-foreground"
												onClick={(e) => {
													e.stopPropagation();
													handleDelete(skill.id);
												}}
											>
												<X className="size-3" />
											</button>
										</span>
									</SelectItem>
								))}
							</>
						)}
					</SelectPopup>
				</Select>

				<Button
					variant="outline"
					size="sm"
					onClick={() => fileInputRef.current?.click()}
				>
					<Upload className="size-3.5" />
					Upload
				</Button>
				<input
					ref={fileInputRef}
					type="file"
					accept=".md"
					className="hidden"
					onChange={handleUpload}
				/>
			</div>
			{selectedSkill && (
				<p className="text-xs text-muted-foreground">
					{selectedSkill.description}
				</p>
			)}
		</div>
	);
}
