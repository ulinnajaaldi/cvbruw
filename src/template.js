/**
 * Resume HTML template.
 * Pure function: (resumeData) => HTML string (body markup only, no <style>/<html> wrapper).
 * Tailwind utility classes below are scanned literally by the Tailwind CLI build step
 * (see tailwind.config.js `content`), so keep class strings static/literal here.
 *
 * Font sizes/margins are matched against the original PDF measurements:
 *  - Page: A4, ~7mm left/right margin, ~12mm top / ~13mm bottom
 *  - Name: ~19pt bold
 *  - Body/contact/headings/entries: ~10.5pt (Arial family throughout, pure black text)
 */

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderContactLine(basics) {
  const parts = [];
  if (basics.phone) parts.push(escapeHtml(basics.phone));
  if (basics.email) parts.push(escapeHtml(basics.email));
  const linkParts = (basics.links || []).map(
    (l) =>
      `<a href="${escapeHtml(l.url)}" class="text-black no-underline">${escapeHtml(
        l.label
      )}</a>`
  );
  return [...parts, ...linkParts].join('<span class="mx-[6pt]">|</span>');
}

function renderTimelineItem(item) {
  const highlights = (item.highlights || [])
    .map(
      (h) => `<li class="mb-[2pt]">${escapeHtml(h)}</li>`
    )
    .join("\n");

  return `
    <div class="mb-[6pt] break-inside-avoid">
      <div class="flex justify-between text-[10.5pt] font-bold">
        <span>${escapeHtml(item.organization)}${
    item.location ? " - " + escapeHtml(item.location) : ""
  }</span>
        <span>${escapeHtml(item.dateStart)} - ${escapeHtml(item.dateEnd)}</span>
      </div>
      <div class="text-[10.5pt] italic mb-[2pt]">${escapeHtml(item.role)}</div>
      <ul class="list-disc pl-[14pt] text-[10.5pt] leading-[1.22]">
        ${highlights}
      </ul>
    </div>
  `;
}

function renderFreeformItem(item) {
  return `
    <div class="mb-[4pt] text-[10.5pt] leading-[1.22]">
      <span class="font-bold">${escapeHtml(item.label)}:</span>
      <span>${escapeHtml(item.text)}</span>
    </div>
  `;
}

function renderSection(section) {
  const itemsHtml =
    section.type === "freeform"
      ? section.items.map(renderFreeformItem).join("\n")
      : section.items.map(renderTimelineItem).join("\n");

  return `
    <section class="mt-[8pt]">
      <h2 class="text-[11pt] font-bold border-b border-black pb-[2pt] mb-[6pt]">${escapeHtml(
        section.title
      )}</h2>
      ${itemsHtml}
    </section>
  `;
}

function renderHtml(data) {
  const { basics, sections } = data;

  return `
    <div class="font-sans text-black w-[210mm] min-h-[297mm] px-[7mm] pt-[12mm] pb-[13mm] mx-auto bg-white">
      <header class="text-center">
        <h1 class="text-[19pt] font-bold uppercase tracking-[0.5pt]">${escapeHtml(
          basics.name
        )}</h1>
        <div class="text-[10.5pt] mt-[4pt]">${renderContactLine(basics)}</div>
        <div class="text-[10.5pt]">${escapeHtml(basics.location)}</div>
      </header>

      <hr class="border-black mt-[6pt] mb-[6pt]" />

      <p class="text-[10.5pt] text-justify leading-[1.22]">${escapeHtml(
        basics.summary
      )}</p>

      ${sections.map(renderSection).join("\n")}
    </div>
  `;
}

module.exports = { renderHtml };
