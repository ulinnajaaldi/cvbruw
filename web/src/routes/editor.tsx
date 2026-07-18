import { createFileRoute } from "@tanstack/react-router";
import HomeFeature from "#/features/Home";

interface EditorSearch {
	resumeId?: string;
}

export const Route = createFileRoute("/editor")({
	validateSearch: (search: Record<string, unknown>): EditorSearch => ({
		resumeId: typeof search.resumeId === "string" ? search.resumeId : undefined,
	}),
	component: HomeFeature,
});
