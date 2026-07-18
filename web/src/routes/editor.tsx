import { createFileRoute } from "@tanstack/react-router";
import HomeFeature from "#/features/Home";

export const Route = createFileRoute("/editor")({ component: HomeFeature });
