import type { ReactNode } from "react";
import type {
  ResumeData,
  ResumeBasics,
  ResumeSection,
  TimelineItem,
  FreeformItem,
} from "../lib/types";

/**
 * Mirrors ../../../src/template.js exactly (same Tailwind classes, same
 * structure). That file renders to an HTML string for Puppeteer; this
 * renders the same layout as JSX for the live, in-browser preview.
 *
 * IMPORTANT: if you change the visual design here, mirror the change in
 * src/template.js too (and vice versa) -- these two are intentionally kept
 * in lockstep so the preview never lies about what the PDF will look like.
 */

function ContactLine({ basics }: { basics: ResumeBasics }) {
  const parts: ReactNode[] = [];
  if (basics.phone) parts.push(basics.phone);
  if (basics.email) parts.push(basics.email);
  for (const link of basics.links ?? []) {
    parts.push(
      <a key={link.url} href={link.url} className="text-black no-underline">
        {link.label}
      </a>
    );
  }

  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-2">|</span>}
          {part}
        </span>
      ))}
    </>
  );
}

function TimelineItemView({ item }: { item: TimelineItem }) {
  return (
    <div className="mb-2 break-inside-avoid">
      <div className="flex justify-between text-[10.5pt] font-bold">
        <span>
          {item.organization}
          {item.location ? ` - ${item.location}` : ""}
        </span>
        <span>
          {item.dateStart} - {item.dateEnd}
        </span>
      </div>
      <div className="text-[10.5pt] italic mb-[2pt]">{item.role}</div>
      <ul className="list-disc pl-[14pt] text-[10.5pt] leading-[1.22]">
        {item.highlights.map((h, i) => (
          <li key={i} className="mb-[2pt]">
            {h}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FreeformItemView({ item }: { item: FreeformItem }) {
  return (
    <div className="mb-[4pt] text-[10.5pt] leading-[1.22]">
      <span className="font-bold">{item.label}:</span> <span>{item.text}</span>
    </div>
  );
}

function SectionView({ section }: { section: ResumeSection }) {
  return (
    <section className="mt-[8pt]">
      <h2 className="text-[11pt] font-bold border-b border-black pb-[2pt] mb-2">
        {section.title}
      </h2>
      {section.type === "freeform"
        ? section.items.map((item, i) => <FreeformItemView key={i} item={item} />)
        : section.items.map((item, i) => <TimelineItemView key={i} item={item} />)}
    </section>
  );
}

export function ResumePreview({ data }: { data: ResumeData }) {
  return (
    <div className="font-sans text-black w-[210mm] min-h-[297mm] px-[7mm] pt-[12mm] pb-[13mm] mx-auto bg-white shadow-lg">
      <header className="text-center">
        <h1 className="text-[19pt] font-bold uppercase tracking-[0.5pt]">
          {data.basics.name || "Your Name"}
        </h1>
        <div className="text-[10.5pt] mt-[4pt]">
          <ContactLine basics={data.basics} />
        </div>
        <div className="text-[10.5pt]">{data.basics.location}</div>
      </header>

      <hr className="border-black mt-2 mb-2" />

      <p className="text-[10.5pt] text-justify leading-[1.22]">{data.basics.summary}</p>

      {data.sections.map((section) => (
        <SectionView key={section.id} section={section} />
      ))}
    </div>
  );
}
