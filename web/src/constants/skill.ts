import type { Skill } from "#/lib/skills";

export const FRONT_END_SKILLS: Skill = {
	id: "frontend-resume-refactor",
	name: "Frontend Resume Refactor",
	description:
		"Reviews and upgrades frontend/software engineer resumes for top tech companies",
	source: "builtin",
	content: `Review a frontend or software engineer resume the way a top-tech recruiter and hiring manager would: 6–30 seconds to decide, ATS parses it first, and every line must prove impact.

## Scoring dimensions (weights)

| # | Dimension | Weight | Core question |
|---|-----------|:------:|---------------|
| 1 | Impact & Quantification | 25% | Does every bullet prove measurable outcomes (XYZ)? |
| 2 | Content Relevance & Signal | 20% | Does it foreground senior, role-relevant achievements over trivia? |
| 3 | Structure & Format / ATS | 20% | Single-column, standard headers, clean parse, 1–2 pages, consistent? |
| 4 | Frontend Technical Depth | 15% | Real signal: CWV, a11y, perf, architecture, scale, testing? |
| 5 | Clarity & Writing | 10% | Tight, active, no fluff, correct grammar, consistent tense/tone? |
| 6 | Tailoring & Keywords | 10% | Mirrors the JD's exact terms, backed by evidence bullets? |

## Non-negotiable rules

- **Single column only.** No tables, text boxes, columns, icons, photos, or skill bars — they break ATS parsers.
- **Standard section headers**: Work Experience, Skills, Education, Projects, Awards.
- **Every experience/project bullet uses the Google XYZ formula**: "Accomplished [X] as measured by [Y] by doing [Z]" — action verb + what you did + technology + quantified result.
- **Quantify everything**; honest approximations beat vague claims. Never fabricate.
- **1 page** for <8 yrs; up to 2 pages only if every line earns its place.

## What to look for

1. Each bullet should start with a strong action verb
2. Each bullet should include measurable outcomes when possible
3. Skills section should list specific technologies, not generic terms
4. Experience should show progression and increasing responsibility
5. Summary should be concise (2-3 sentences) and role-focused
6. No typos, consistent formatting, proper dates`,
};

export const BACK_END_FULLSTACK_SKILLS: Skill = {
	id: "backend-fullstack-resume-refactor",
	name: "Backend/Full-Stack Resume Refactor",
	description:
		"Reviews and upgrades backend and full-stack software engineer resumes for top tech companies",
	source: "builtin",
	content: `Review a backend or full-stack engineer resume the way a top-tech recruiter and hiring manager would: 6–30 seconds to decide, ATS parses it first, and every line must prove impact.

## Scoring dimensions (weights)

| # | Dimension | Weight | Core question |
|---|-----------|:------:|---------------|
| 1 | Impact & Quantification | 25% | Does every bullet prove measurable outcomes (XYZ)? |
| 2 | Content Relevance & Signal | 20% | Does it foreground senior, role-relevant achievements over trivia? |
| 3 | Structure & Format / ATS | 20% | Single-column, standard headers, clean parse, 1–2 pages, consistent? |
| 4 | Backend/Systems Technical Depth | 15% | Real signal: scale (QPS/data volume), latency/reliability, distributed systems, data modeling, infra/cloud, testing/CI-CD? |
| 5 | Clarity & Writing | 10% | Tight, active, no fluff, correct grammar, consistent tense/tone? |
| 6 | Tailoring & Keywords | 10% | Mirrors the JD's exact terms, backed by evidence bullets? |

## Non-negotiable rules

- **Single column only.** No tables, text boxes, columns, icons, photos, or skill bars — they break ATS parsers.
- **Standard section headers**: Work Experience, Skills, Education, Projects, Awards.
- **Every experience/project bullet uses the Google XYZ formula**: "Accomplished [X] as measured by [Y] by doing [Z]" — action verb + what you did + technology + quantified result.
- **Quantify everything**; honest approximations beat vague claims. Never fabricate.
- **1 page** for <8 yrs; up to 2 pages only if every line earns its place.

## What to look for

1. Each bullet should start with a strong action verb
2. Each bullet should include measurable outcomes when possible — throughput, latency, uptime, cost savings, data volume, users served
3. Skills section should list specific technologies (languages, frameworks, databases, cloud/infra tools), not generic terms like "backend development"
4. Look for evidence of system design maturity: scalability decisions, trade-offs made, on-call/reliability ownership, API/data architecture
5. Experience should show progression and increasing responsibility (IC scope, systems owned, mentorship)
6. Summary should be concise (2-3 sentences) and role-focused
7. No typos, consistent formatting, proper dates`,
};
