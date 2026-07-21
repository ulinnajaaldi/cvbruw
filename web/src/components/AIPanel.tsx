import { Check, Sparkles, X } from "lucide-react";
import { useCallback, useState } from "react";
import { getSkillById } from "#/lib/skills";
import type { ResumeData } from "#/lib/types";
import type { AISuggestion } from "#/server/ai-generate";
import { generateAISuggestions } from "#/server/ai-generate";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { AISkillSelector } from "./AISkillSelector";
import type { ActiveStep } from "./ResumeEditor";

interface AIPanelProps {
	resumeData: ResumeData;
	activeStep: ActiveStep;
	initialContext?: string | null;
	onApplySuggestions: (suggestions: AISuggestion[]) => void;
	onClose: () => void;
}

const SETTINGS_KEY = "cvbruw-llm-settings";

function loadSettings() {
	try {
		const raw = localStorage.getItem(SETTINGS_KEY);
		if (raw) return JSON.parse(raw);
	} catch {}
	return { providerId: "openai", apiKey: "", baseUrl: "", model: "" };
}

function generateContextFromStep(
	step: ActiveStep,
	resumeData: ResumeData,
): string {
	if (step.kind === "basics") {
		const parts: string[] = [];
		if (!resumeData.basics.name) parts.push("add a professional name");
		if (!resumeData.basics.summary)
			parts.push("write a compelling professional summary");
		else parts.push("improve the professional summary to be more impactful");
		if (resumeData.basics.links.length === 0)
			parts.push("add relevant links (LinkedIn, portfolio, GitHub)");
		return parts.length > 0
			? `Focus on the Basics section: ${parts.join(", ")}.`
			: "Improve the Basics section — make the summary more concise and role-focused, ensure contact info is complete.";
	}

	if (step.kind === "section") {
		const section = resumeData.sections.find((s) => s.id === step.id);
		if (!section) return `Improve the "${step.title}" section.`;

		if (section.type === "timeline") {
			if (section.items.length === 0) {
				return `The "${section.title}" section is empty. Suggest what entries should be added and how to structure them.`;
			}
			const totalBullets = section.items.reduce(
				(sum, item) => sum + (item.highlights?.length || 0),
				0,
			);
			return `Focus on the "${section.title}" section (${section.items.length} entries, ${totalBullets} bullet points). Improve bullet points using the XYZ formula: "Accomplished [X] as measured by [Y] by doing [Z]". Add quantified metrics where possible. Ensure each bullet starts with a strong action verb.`;
		}

		if (section.type === "freeform") {
			if (section.items.length === 0) {
				return `The "${section.title}" section is empty. Suggest what content should be added.`;
			}
			return `Focus on the "${section.title}" section. Improve clarity, conciseness, and impact of the text. Remove filler words and ensure active voice.`;
		}
	}

	return "Improve the overall resume quality, focusing on impact, clarity, and ATS optimization.";
}

export function AIPanel({
	resumeData,
	activeStep,
	initialContext,
	onApplySuggestions,
	onClose,
}: AIPanelProps) {
	const [selectedSkill, setSelectedSkill] = useState(
		"frontend-resume-refactor",
	);
	const [context, setContext] = useState(
		initialContext || generateContextFromStep(activeStep, resumeData),
	);
	const [loading, setLoading] = useState(false);
	const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());

	const handleGenerate = useCallback(async () => {
		setLoading(true);
		setError(null);
		setSuggestions([]);

		const skill = getSkillById(selectedSkill);
		if (!skill) {
			setError("Selected skill not found");
			setLoading(false);
			return;
		}

		const settings = loadSettings();
		if (!settings.apiKey) {
			setError("Please configure your API key in the Landing page first.");
			setLoading(false);
			return;
		}

		try {
			const result = await generateAISuggestions({
				data: {
					resumeData,
					skillInstructions: skill.content,
					context: context || undefined,
					providerId: settings.providerId || "openai",
					apiKey: settings.apiKey || "",
					baseUrl: settings.baseUrl || "",
					model: settings.model || "",
				},
			});

			if (result.error) {
				setError(result.error);
			} else {
				setSuggestions(result.suggestions);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	}, [selectedSkill, context, resumeData]);

	const handleToggleAccept = useCallback((id: string) => {
		setAcceptedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	}, []);

	const handleApplyAll = useCallback(() => {
		const accepted = suggestions.filter((s) => acceptedIds.has(s.id));
		if (accepted.length > 0) {
			onApplySuggestions(accepted);
		}
		onClose();
	}, [suggestions, acceptedIds, onApplySuggestions, onClose]);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-2xl max-h-[80vh] bg-background rounded-2xl border shadow-lg overflow-hidden flex flex-col">
				<div className="flex items-center justify-between p-4 border-b">
					<div className="flex items-center gap-2">
						<Sparkles className="size-4 text-muted-foreground" />
						<h2 className="text-sm font-semibold">AI Suggestions</h2>
					</div>
					<Button variant="ghost" size="icon-sm" onClick={onClose}>
						<X className="size-4" />
					</Button>
				</div>

				<div className="flex-1 overflow-auto p-4 space-y-4">
					<AISkillSelector value={selectedSkill} onChange={setSelectedSkill} />

					<div className="space-y-2">
						<Label className="text-xs font-medium text-muted-foreground">
							What do you want to improve?
						</Label>
						<textarea
							className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
							rows={2}
							placeholder="Auto-generated from your current step — edit to refine..."
							value={context}
							onChange={(e) => setContext(e.target.value)}
						/>
					</div>

					<Button
						onClick={handleGenerate}
						disabled={loading || !selectedSkill}
						className="w-full"
					>
						{loading ? (
							<>
								<Spinner className="size-4" />
								Generating...
							</>
						) : (
							<>
								<Sparkles className="size-4" />
								Generate Suggestions
							</>
						)}
					</Button>

					{error && (
						<Alert variant="error">
							<AlertTitle>{error}</AlertTitle>
						</Alert>
					)}

					{suggestions.length > 0 && (
						<div className="space-y-3">
							<Label className="text-xs font-medium text-muted-foreground">
								{suggestions.length} suggestion
								{suggestions.length !== 1 ? "s" : ""} found
							</Label>
							{suggestions.map((suggestion) => (
								<Card key={suggestion.id}>
									<CardContent className="p-3 space-y-2">
										<div className="flex items-start justify-between gap-2">
											<div className="flex-1 min-w-0">
												<p className="text-xs text-muted-foreground mb-1">
													{suggestion.reason}
												</p>
												<div className="space-y-1">
													<div className="text-xs text-muted-foreground line-through">
														{suggestion.currentValue}
													</div>
													<div className="text-sm font-medium">
														{suggestion.suggestedValue}
													</div>
												</div>
											</div>
											<Button
												variant={
													acceptedIds.has(suggestion.id) ? "default" : "outline"
												}
												size="icon-xs"
												onClick={() => handleToggleAccept(suggestion.id)}
											>
												<Check className="size-3" />
											</Button>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</div>

				{suggestions.length > 0 && (
					<div className="flex items-center justify-between p-4 border-t">
						<span className="text-xs text-muted-foreground">
							{acceptedIds.size} of {suggestions.length} selected
						</span>
						<div className="flex gap-2">
							<Button variant="outline" onClick={onClose}>
								Cancel
							</Button>
							<Button
								onClick={handleApplyAll}
								disabled={acceptedIds.size === 0}
							>
								Apply Selected
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
