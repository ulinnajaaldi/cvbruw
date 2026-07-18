import { Link, useRouter } from "@tanstack/react-router";
import {
	CheckCircle,
	ChevronDown,
	ExternalLink,
	Key,
	Settings,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { listResumes, saveResume } from "#/lib/db";
import { extractTextFromPdf } from "#/lib/extract-pdf-text";
import { extractResumeData } from "#/server/extract-resume";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

interface ProviderPreset {
	id: string;
	label: string;
	baseUrl: string;
	model: string;
}

const PROVIDERS: ProviderPreset[] = [
	{
		id: "openai",
		label: "OpenAI",
		baseUrl: "https://api.openai.com/v1",
		model: "gpt-4o-mini",
	},
	{
		id: "claude",
		label: "Claude (Anthropic)",
		baseUrl: "https://api.anthropic.com/v1",
		model: "claude-sonnet-4-20250514",
	},
	{
		id: "custom",
		label: "Custom (OpenAI-compatible)",
		baseUrl: "",
		model: "",
	},
];

const SETTINGS_KEY = "cvbruw-llm-settings";

interface SavedSettings {
	providerId: string;
	apiKey: string;
	baseUrl: string;
	model: string;
}

function loadSettings(): SavedSettings {
	try {
		const raw = localStorage.getItem(SETTINGS_KEY);
		if (raw) return JSON.parse(raw) as SavedSettings;
	} catch {}
	const legacyKey = localStorage.getItem("cvbruw-openai-key");
	if (legacyKey) {
		return {
			providerId: "openai",
			apiKey: legacyKey,
			baseUrl: PROVIDERS[0].baseUrl,
			model: PROVIDERS[0].model,
		};
	}
	return {
		providerId: "openai",
		apiKey: "",
		baseUrl: PROVIDERS[0].baseUrl,
		model: PROVIDERS[0].model,
	};
}

type Phase = "idle" | "extracting" | "calling-llm" | "saving" | "done";

const phaseLabels: Record<Phase, string> = {
	idle: "",
	extracting: "Extracting text from PDF...",
	"calling-llm": "Analyzing resume with AI...",
	saving: "Saving data...",
	done: "Done!",
};

export default function LandingFeature() {
	const router = useRouter();
	const [providerId, setProviderId] = useState("openai");
	const [apiKey, setApiKey] = useState("");
	const [baseUrl, setBaseUrl] = useState(PROVIDERS[0].baseUrl);
	const [model, setModel] = useState(PROVIDERS[0].model);
	const [saved, setSaved] = useState(false);
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [phase, setPhase] = useState<Phase>("idle");
	const [error, setError] = useState<string | null>(null);
	const [dragOver, setDragOver] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [hasResumes, setHasResumes] = useState(false);

	useEffect(() => {
		listResumes().then((r) => setHasResumes(r.length > 0));
	}, []);

	useEffect(() => {
		const s = loadSettings();
		setProviderId(s.providerId);
		setApiKey(s.apiKey);
		setBaseUrl(s.baseUrl);
		setModel(s.model);
		setSaved(!!s.apiKey);
	}, []);

	const handleProviderChange = useCallback((id: string) => {
		setProviderId(id);
		const preset = PROVIDERS.find((p) => p.id === id);
		if (preset && preset.id !== "custom") {
			setBaseUrl(preset.baseUrl);
			setModel(preset.model);
		}
		setSaved(false);
	}, []);

	const handleSaveSettings = useCallback(() => {
		if (!apiKey.trim()) return;
		const settings: SavedSettings = {
			providerId,
			apiKey: apiKey.trim(),
			baseUrl: baseUrl.trim(),
			model: model.trim(),
		};
		localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
		localStorage.removeItem("cvbruw-openai-key");
		setSaved(true);
	}, [providerId, apiKey, baseUrl, model]);

	const processFile = useCallback(
		async (file: File) => {
			if (file.type !== "application/pdf") {
				setError("Please upload a PDF file.");
				return;
			}

			if (!apiKey.trim()) {
				setError("Please enter your API key first.");
				return;
			}

			if (!baseUrl.trim()) {
				setError("Please enter a base URL.");
				return;
			}

			if (!model.trim()) {
				setError("Please enter a model name.");
				return;
			}

			setError(null);
			setPhase("extracting");

			let text: string;
			try {
				text = await extractTextFromPdf(file);
			} catch {
				setError("Failed to read PDF. Try a different file.");
				setPhase("idle");
				return;
			}

			if (!text) {
				setError(
					"This PDF appears to be a scanned image. Please upload a text-based PDF.",
				);
				setPhase("idle");
				return;
			}

			setPhase("calling-llm");
			const result = await extractResumeData({
				data: {
					text,
					apiKey: apiKey.trim(),
					baseUrl: baseUrl.trim(),
					model: model.trim(),
				},
			});

			if (!result.success) {
				setError(result.error);
				setPhase("idle");
				return;
			}

			setPhase("saving");
			const saved = await saveResume(result.data);
			setPhase("done");
			router.navigate({ to: "/editor", search: { resumeId: saved.id } });
		},
		[apiKey, baseUrl, model, router],
	);

	const handleDrop = useCallback(
		async (e: React.DragEvent) => {
			e.preventDefault();
			setDragOver(false);
			const file = e.dataTransfer.files[0];
			if (file) await processFile(file);
		},
		[processFile],
	);

	const handleFileSelect = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) await processFile(file);
		},
		[processFile],
	);

	const isProcessing = phase !== "idle" && phase !== "done";

	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
			<div className="w-full max-w-lg space-y-8">
				<div className="text-center space-y-2">
					<h1 className="text-3xl font-bold tracking-tight">CVBRUW</h1>
					<p className="text-muted-foreground">
						Upload your resume, get an ATS-friendly version instantly.
					</p>
					{hasResumes && (
						<Link
							to="/editor"
							className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2"
						>
							<ExternalLink className="size-3" />
							Open existing resume
						</Link>
					)}
				</div>

				<div className="space-y-3">
					<label
						htmlFor="api-key"
						className="text-sm font-medium flex items-center gap-1.5"
					>
						<Key className="size-3.5" />
						API Key
					</label>
					<div className="flex gap-2">
						<Input
							id="api-key"
							type="password"
							placeholder="sk-..."
							value={apiKey}
							onChange={(e) => {
								setApiKey(e.target.value);
								setSaved(false);
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleSaveSettings();
							}}
							disabled={isProcessing}
						/>
						<Button
							variant="outline"
							onClick={handleSaveSettings}
							disabled={isProcessing || !apiKey.trim()}
						>
							{saved ? (
								<span className="flex items-center gap-1">
									<CheckCircle className="size-3.5 text-success" />
									Saved
								</span>
							) : (
								"Save"
							)}
						</Button>
					</div>

					<div className="space-y-2">
						<label
							htmlFor="provider"
							className="text-xs font-medium text-muted-foreground"
						>
							Provider
						</label>
						<select
							id="provider"
							value={providerId}
							onChange={(e) => handleProviderChange(e.target.value)}
							disabled={isProcessing}
							className="h-8.5 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/24 transition-shadow focus-visible:border-ring focus-visible:ring-[3px] disabled:opacity-64 sm:h-7.5 dark:bg-input/32"
						>
							{PROVIDERS.map((p) => (
								<option key={p.id} value={p.id}>
									{p.label}
								</option>
							))}
						</select>
					</div>

					<button
						type="button"
						className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
						onClick={() => setShowAdvanced(!showAdvanced)}
					>
						<Settings className="size-3" />
						Advanced settings
						<ChevronDown
							className={`size-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
						/>
					</button>

					{showAdvanced && (
						<div className="space-y-2 rounded-lg border border-border p-3">
							<div className="space-y-1">
								<label
									htmlFor="base-url"
									className="text-xs font-medium text-muted-foreground"
								>
									Base URL
								</label>
								<Input
									id="base-url"
									value={baseUrl}
									onChange={(e) => {
										setBaseUrl(e.target.value);
										setSaved(false);
									}}
									placeholder="https://api.openai.com/v1"
									disabled={isProcessing}
									size="sm"
								/>
								<p className="text-xs text-muted-foreground">
									https://domain.com/v1 — /chat/completions or /messages
									appended automatically
								</p>
							</div>
							<div className="space-y-1">
								<label
									htmlFor="model"
									className="text-xs font-medium text-muted-foreground"
								>
									Model
								</label>
								<Input
									id="model"
									value={model}
									onChange={(e) => {
										setModel(e.target.value);
										setSaved(false);
									}}
									placeholder="gpt-4o-mini"
									disabled={isProcessing}
									size="sm"
								/>
							</div>
						</div>
					)}

					<p className="text-xs text-muted-foreground">
						Stored locally in your browser. Never sent to our servers.
					</p>
				</div>

				<button
					type="button"
					className={`
						relative flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 transition-colors cursor-pointer
						${dragOver ? "border-primary bg-primary/4" : "border-border hover:border-primary/50"}
						${isProcessing ? "pointer-events-none opacity-60" : ""}
					`}
					onDragOver={(e) => {
						e.preventDefault();
						setDragOver(true);
					}}
					onDragLeave={() => setDragOver(false)}
					onDrop={handleDrop}
					onClick={() => fileInputRef.current?.click()}
					disabled={isProcessing}
				>
					<input
						ref={fileInputRef}
						type="file"
						accept=".pdf,application/pdf"
						className="hidden"
						onChange={handleFileSelect}
					/>

					{isProcessing ? (
						<>
							<Spinner className="size-8" />
							<p className="text-sm text-muted-foreground">
								{phaseLabels[phase]}
							</p>
						</>
					) : (
						<div className="text-center">
							<p className="text-sm font-medium">Drop your resume PDF here</p>
							<p className="text-xs text-muted-foreground">
								or click to browse
							</p>
						</div>
					)}
				</button>

				{error && (
					<Alert variant="error">
						<AlertTitle>{error}</AlertTitle>
					</Alert>
				)}

				<div className="text-center">
					<Link
						to="/editor"
						className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						Already have a resume? Open editor
						<ExternalLink className="size-3" />
					</Link>
				</div>
			</div>
		</div>
	);
}
