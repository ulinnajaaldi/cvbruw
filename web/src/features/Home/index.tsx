import { useEffect, useRef, useState } from "react";
import { ResumeEditor } from "#/components/ResumeEditor";
import { ResumePreview } from "#/components/ResumePreview";
import { clearResumeData, loadResumeData, saveResumeData } from "#/lib/db";
import sampleData from "#/lib/sample-resume-data.json";
import type { ResumeData } from "#/lib/types";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type SaveStatus = "idle" | "saving" | "saved";

const HomeFeature = () => {
	const [data, setData] = useState<ResumeData>(sampleData as ResumeData);
	const [loaded, setLoaded] = useState(false);
	const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
	const [downloading, setDownloading] = useState(false);
	const [downloadError, setDownloadError] = useState<string | null>(null);
	const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Load whatever was previously saved in this browser, once, on mount.
	useEffect(() => {
		let cancelled = false;
		loadResumeData().then((stored) => {
			if (!cancelled && stored) setData(stored);
			if (!cancelled) setLoaded(true);
		});
		return () => {
			cancelled = true;
		};
	}, []);

	// Debounced auto-save to IndexedDB whenever the data changes.
	useEffect(() => {
		if (!loaded) return; // don't save the initial sample over a not-yet-loaded state
		setSaveStatus("saving");
		if (saveTimer.current) clearTimeout(saveTimer.current);
		saveTimer.current = setTimeout(() => {
			saveResumeData(data).then(() => setSaveStatus("saved"));
		}, 500);
		return () => {
			if (saveTimer.current) clearTimeout(saveTimer.current);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data, loaded]);

	async function handleDownload() {
		setDownloading(true);
		setDownloadError(null);
		try {
			const res = await fetch("/api/generate-pdf", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});
			if (!res.ok) {
				const message = await res.text();
				throw new Error(message || `Request failed with status ${res.status}`);
			}
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			const slug = (data.basics.name || "resume")
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-");
			a.href = url;
			a.download = `${slug}-resume.pdf`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		} catch (err) {
			setDownloadError(err instanceof Error ? err.message : String(err));
		} finally {
			setDownloading(false);
		}
	}

	async function handleReset() {
		if (
			!confirm(
				"Reset to the sample resume? This clears what's saved in this browser.",
			)
		)
			return;
		await clearResumeData();
		setData(sampleData as ResumeData);
	}

	return (
		<div className="min-h-full">
			<header className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center justify-between">
				<div>
					<h1 className="text-sm font-semibold">CV ATS Maker</h1>
					<p className="text-xs text-muted-foreground">
						{saveStatus === "saving" && "Saving to this browser…"}
						{saveStatus === "saved" && "Saved in this browser"}
						{saveStatus === "idle" && "Not saved yet"}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm" onClick={handleReset}>
						Reset
					</Button>
					<Button onClick={handleDownload} disabled={downloading}>
						{downloading ? "Generating…" : "Download PDF"}
					</Button>
				</div>
			</header>

			{downloadError && (
				<div className="mx-4 mt-3">
					<Alert variant="error">
						<AlertTitle>{downloadError}</AlertTitle>
					</Alert>
				</div>
			)}

			<main className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
				<div className="max-w-xl mx-auto w-full">
					<ResumeEditor data={data} onChange={setData} />
				</div>
				<div className="overflow-auto max-h-[calc(100vh-5rem)] rounded-lg">
					<ResumePreview data={data} />
				</div>
			</main>
		</div>
	);
};

export default HomeFeature;
