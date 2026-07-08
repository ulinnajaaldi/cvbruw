---
name: cv-ats-maker
description: Generates an ATS-friendly PDF resume/CV from structured JSON resume data. Use this skill when the user asks to create, update, export, or regenerate a resume/CV as a PDF, or gives/edits resume content (work experience, education, skills) and wants a downloadable document out of it.
license: MIT
compatibility: Requires Bun 1.0+, and Chromium dependencies for Puppeteer (on Debian/Ubuntu: run `npx puppeteer browsers install chrome` once, or install via apt the standard headless-Chromium shared libraries). No internet access is required at generation time once dependencies are installed.
metadata:
  author: cv-ats-maker project
  version: "0.1"
---

# CV ATS Maker

Turns structured resume data (JSON) into a polished, ATS-friendly PDF, using a
single HTML/Tailwind template rendered through headless Chrome. The same
template is reused for both the web preview (if the project's web app is
running) and this PDF export, so there is exactly one visual source of truth.

## When to use this skill

Use this skill whenever the person wants:
- A PDF resume/CV generated or regenerated from resume content they provide.
- An existing resume updated (new job, new bullet points, edited summary) and
  re-exported as PDF.
- Their resume content structured/cleaned up and turned into a document.

Do NOT use this skill for general PDF editing (merging, splitting, forms) —
that's a different, unrelated task.

## How to run it

This is a plain CLI invocation. No web server needs to be running.

```bash
bash scripts/generate.sh <path-to-data.json> <path-to-output.pdf>
```

- `scripts/generate.sh` resolves the actual project location relative to
  itself, so it works regardless of the caller's current directory.
- First run in a fresh environment installs nothing automatically — see
  "First-time setup" below if `npm run generate` fails with a missing
  dependency error.
- The compiled CSS is rebuilt automatically only when the template changed
  since the last build, so repeated calls are fast.

## Input data shape

Write the resume data to a JSON file matching this shape before calling the
script (see `../../data/resume-data.json` in the project for a complete real
example):

```json
{
  "basics": {
    "name": "Full Name",
    "phone": "+62...",
    "email": "name@example.com",
    "links": [{ "label": "linkedin.com/in/...", "url": "https://..." }],
    "location": "City, Region.",
    "summary": "2-4 sentence professional summary."
  },
  "sections": [
    {
      "id": "work",
      "title": "Work Experience",
      "type": "timeline",
      "items": [
        {
          "organization": "Company Name",
          "location": "City",
          "dateStart": "Mon YYYY",
          "dateEnd": "Present",
          "role": "Job Title",
          "highlights": ["Bullet point describing an achievement, in past tense unless current role."]
        }
      ]
    },
    {
      "id": "other",
      "title": "Other",
      "type": "freeform",
      "items": [{ "label": "Technical Skills", "text": "Comma-separated list." }]
    }
  ]
}
```

Two section `type`s are supported:
- `timeline` — for work experience, education, leadership: renders each item
  as organization/location + right-aligned dates, italic role, bullet list.
- `freeform` — for a catch-all section (e.g. "Other" with Technical Skills /
  Achievements): renders each item as a bold inline label followed by text.

When the person gives you resume content in prose or from an uploaded file,
map it into this schema yourself before calling the script — don't ask them
to write JSON by hand.

## Output

The script writes a PDF to the path given as the second argument and prints
that path on success (exit code 0). On failure it prints an error to stderr
and exits non-zero — surface that error rather than guessing what went wrong.

## First-time setup (only needed once per machine)

If the script fails because `puppeteer` or `tailwindcss` aren't installed
yet:

```bash
cd <project-root>   # two levels up from this skill's scripts/ folder
npm install
```

If Puppeteer's bundled Chromium fails to launch (common on a bare VPS due to
missing shared libraries), install the missing system packages Puppeteer's
error message names, or run:

```bash
npx puppeteer browsers install chrome
```

## Common edge cases

- Long resumes that overflow one or two pages: this is expected and fine —
  the template doesn't force a fixed page count, it flows naturally across
  as many pages as the content needs.
- Missing optional fields (e.g. no `links`): omit the key or pass an empty
  array; the template skips rendering what isn't present.
- Special characters in resume content (quotes, ampersands, `<`/`>`) are
  escaped automatically by the template — pass raw text, don't pre-escape it.
