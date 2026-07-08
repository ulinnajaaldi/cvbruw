const fs = require("fs");
const path = require("path");
const { renderHtml } = require("./template");

const CSS_PATH = path.join(__dirname, "..", "dist", "tailwind.css");

/**
 * Build the full, self-contained HTML document for a resume.
 * Self-contained = compiled Tailwind CSS is inlined, so this HTML has
 * zero external network dependencies (no CDN, no relative asset paths).
 * That matters because this is what gets handed to a headless browser
 * running unattended on a VPS.
 */
function renderResumeHtml(data) {
  if (!fs.existsSync(CSS_PATH)) {
    throw new Error(
      `Compiled CSS not found at ${CSS_PATH}. Run "npm run build:css" first.`
    );
  }
  const css = fs.readFileSync(CSS_PATH, "utf-8");
  const bodyHtml = renderHtml(data);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${(data.basics && data.basics.name) || "Resume"}</title>
<style>${css}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

/**
 * Render a resume straight to a PDF file using headless Chrome (Puppeteer).
 * Reuses the exact same HTML/CSS as the web preview, so the PDF is a
 * pixel-accurate print of the template, not a re-implementation.
 *
 * @param {object} data - resume data (see data/resume-data.json for shape)
 * @param {string} outputPath - where to write the .pdf file
 */
async function renderResumePdf(data, outputPath) {
  const puppeteer = require("puppeteer");
  const html = renderResumeHtml(data);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
    });
  } finally {
    await browser.close();
  }
  return outputPath;
}

module.exports = { renderResumeHtml, renderResumePdf };
