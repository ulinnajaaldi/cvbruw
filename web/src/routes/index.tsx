import { createFileRoute } from "@tanstack/react-router";
import LandingFeature from "#/features/Landing";

export const Route = createFileRoute("/")({ component: LandingFeature });
