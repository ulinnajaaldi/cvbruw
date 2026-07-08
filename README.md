# CV ATS Maker

ATS-friendly resume generator: JSON data → HTML/Tailwind template → PDF via headless Chrome.

## Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js 18+
- Chromium (bundled via Puppeteer)

## Setup

```bash
bun install
```

If Puppeteer's bundled Chromium fails to launch (common on minimal servers):

```bash
npx puppeteer browsers install chrome
```

## Generate PDF

```bash
# Uses data/resume-data.json → <name>-resume.pdf
bun run generate

# Or specify input/output explicitly
bun scripts/generate.js data/resume-data.json output.pdf
```

## Edit Resume

Edit `data/resume-data.json` — no need to touch template or CSS.

### Data structure

```json
{
  "basics": {
    "name": "Your Name",
    "phone": "+...",
    "email": "...",
    "links": [{ "label": "...", "url": "..." }],
    "location": "...",
    "title": "...",
    "summary": "..."
  },
  "sections": [
    {
      "id": "work",
      "title": "Work Experience",
      "type": "timeline",
      "items": [
        {
          "organization": "Company",
          "location": "City",
          "dateStart": "Mon YYYY",
          "dateEnd": "Mon YYYY",
          "role": "Title",
          "highlights": ["Accomplishment 1", "..."]
        }
      ]
    }
  ]
}
```

Section types: `timeline` (work/education) or `freeform` (skills/achievements).

## Project structure

```
data/resume-data.json   # resume content (JSON)
src/template.js         # HTML markup (Tailwind classes)
src/input.css           # Tailwind directives
src/render.js           # renderResumeHtml() + renderResumePdf()
scripts/generate.js     # CLI: JSON → PDF
```
