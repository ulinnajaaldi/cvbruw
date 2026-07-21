import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ResumeEditor } from "#/components/ResumeEditor";
import { ResumePreview } from "#/components/ResumePreview";
import type { ChangeSet } from "#/lib/changes";
import { computeChanges } from "#/lib/changes";
import type { SavedResume } from "#/lib/db";
import {
	clearResumeData,
	deleteResume,
	listResumes,
	loadResume,
	saveResume,
} from "#/lib/db";
import sampleData from "#/lib/sample-resume-data.json";
import type { ResumeData } from "#/lib/types";
import { Route as EditorRoute } from "#/routes/editor";
import { generatePdf } from "#/server/generate-pdf";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";
import { ScrollArea } from "@/components/ui/scroll-area";

type SaveStatus = "idle" | "saving" | "saved";

const HomeFeature = () => {
	const { resumeId } = useSearch({ from: EditorRoute.fullPath });
	const navigate = useNavigate({ from: EditorRoute.fullPath });

	const [data, setData] = useState<ResumeData>(sampleData as ResumeData);
	const [baselineData, setBaselineData] = useState<ResumeData | null>(null);
	const [loaded, setLoaded] = useState(false);
	const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
	const [downloading, setDownloading] = useState(false);
	const [downloadError, setDownloadError] = useState<string | null>(null);
	const [resumes, setResumes] = useState<SavedResume[]>([]);
	const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const changes: ChangeSet = useMemo(() => {
		if (!baselineData) return { paths: new Set(), hasChanges: false };
		return computeChanges(baselineData, data);
	}, [baselineData, data]);

	useEffect(() => {
		listResumes().then(setResumes);
	}, []);

	useEffect(() => {
		let cancelled = false;
		async function load() {
			let loadedData: ResumeData | null = null;
			if (resumeId) {
				const resume = await loadResume(resumeId);
				if (!cancelled && resume) loadedData = resume.data;
			} else {
				const resume = await loadResume("current");
				if (!cancelled && resume) loadedData = resume.data;
			}
			if (!cancelled && loadedData) {
				setData(loadedData);
				setBaselineData(structuredClone(loadedData));
			}
			if (!cancelled) setLoaded(true);
		}
		load();
		return () => {
			cancelled = true;
		};
	}, [resumeId]);

	useEffect(() => {
		if (!loaded) return;
		setSaveStatus("saving");
		if (saveTimer.current) clearTimeout(saveTimer.current);
		saveTimer.current = setTimeout(async () => {
			const saved = await saveResume(
				data,
				data.basics.name,
				resumeId || "current",
			);
			if (!resumeId) {
				navigate({ search: { resumeId: saved.id }, replace: true });
			}
			setSaveStatus("saved");
			listResumes().then(setResumes);
		}, 500);
		return () => {
			if (saveTimer.current) clearTimeout(saveTimer.current);
		};
	}, [data, loaded, resumeId, navigate]);

	async function handleDownload() {
		setDownloading(true);
		setDownloadError(null);
		try {
			const { pdf } = await generatePdf({ data });
			const bytes = Uint8Array.from(atob(pdf), (c) => c.charCodeAt(0));
			const blob = new Blob([bytes], { type: "application/pdf" });
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
		if (!confirm("Delete this resume and return to upload?")) return;
		if (resumeId) {
			await deleteResume(resumeId);
		} else {
			await clearResumeData();
		}
		listResumes().then(setResumes);
		navigate({ to: "/" });
	}

	async function handleNewResume() {
		if (!confirm("Create a new blank resume? Current changes are auto-saved."))
			return;
		const saved = await saveResume(sampleData as ResumeData, "New Resume");
		navigate({ to: "/editor", search: { resumeId: saved.id } });
		setData(sampleData as ResumeData);
		setBaselineData(structuredClone(sampleData as ResumeData));
	}

	function handleMarkReviewed() {
		setBaselineData(structuredClone(data));
	}

	return (
		<div className="h-auto lg:h-dvh flex flex-col">
			<header className="shrink-0 border-b px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
				<div className="flex items-center gap-3">
					<Link
						to="/"
						className="text-xs text-muted-foreground hover:text-foreground transition-colors"
					>
						← Upload
					</Link>
					<div>
						<h1 className="text-sm font-semibold">CVBRUW: The ATS Maker</h1>
						<p className="text-xs text-muted-foreground">
							{saveStatus === "saving" && "Saving…"}
							{saveStatus === "saved" && "Saved"}
							{saveStatus === "idle" && "Not saved yet"}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-1.5 flex-wrap justify-end">
					<Menu>
						<MenuTrigger render={<Button variant="ghost" size="sm" />}>
							Switch
						</MenuTrigger>
						<MenuPopup align="start">
							{resumes.length === 0 && (
								<MenuItem disabled>No saved resumes</MenuItem>
							)}
							{resumes.map((r) => (
								<MenuItem
									key={r.id}
									onClick={() => {
										navigate({
											to: "/editor",
											search: { resumeId: r.id },
										});
									}}
									className="min-w-28"
								>
									<div className="flex flex-col min-w-0">
										<span className="truncate">{r.name}</span>
										<span className="text-xs text-muted-foreground">
											{new Date(r.updatedAt).toLocaleDateString()}
										</span>
									</div>
								</MenuItem>
							))}
						</MenuPopup>
					</Menu>
					<Button variant="ghost" size="sm" onClick={handleNewResume}>
						New
					</Button>
					<Button variant="ghost" size="sm" onClick={handleReset}>
						Reset
					</Button>
					{changes.hasChanges && (
						<Button variant="ghost" size="sm" onClick={handleMarkReviewed}>
							Mark reviewed
						</Button>
					)}
					<Button onClick={handleDownload} disabled={downloading}>
						{downloading ? "Generating…" : "Download PDF"}
					</Button>
				</div>
			</header>

			{downloadError && (
				<div className="mx-4 mt-3 shrink-0">
					<Alert variant="error">
						<AlertTitle>{downloadError}</AlertTitle>
					</Alert>
				</div>
			)}

			<main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 h-full">
				<div className="h-full min-h-0">
					<ResumeEditor data={data} onChange={setData} />
				</div>
				<ScrollArea className="h-full">
					<ResumePreview data={data} changes={changes} />
				</ScrollArea>
			</main>
		</div>
	);
};

export default HomeFeature;
