import { useState } from "react";
import type { ResumeData, ResumeSection } from "../lib/types";
import { moveItem, removeAt, updateAt } from "../lib/array-utils";
import { BasicsEditor } from "./BasicsEditor";
import { SectionEditor } from "./SectionEditor";

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || `section-${Date.now()}`;
}

export function ResumeEditor({
  data,
  onChange,
}: {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}) {
  const [newSectionType, setNewSectionType] = useState<"timeline" | "freeform">("timeline");
  const [newSectionTitle, setNewSectionTitle] = useState("");

  function addSection() {
    const title = newSectionTitle.trim() || "New Section";
    const section: ResumeSection =
      newSectionType === "timeline"
        ? { id: slugify(title), title, type: "timeline", items: [] }
        : { id: slugify(title), title, type: "freeform", items: [] };
    onChange({ ...data, sections: [...data.sections, section] });
    setNewSectionTitle("");
  }

  return (
    <div className="space-y-4">
      <BasicsEditor basics={data.basics} onChange={(basics) => onChange({ ...data, basics })} />

      {data.sections.map((section, i) => (
        <SectionEditor
          key={section.id}
          section={section}
          onChange={(updated) => onChange({ ...data, sections: updateAt(data.sections, i, updated) })}
          onRemove={() => onChange({ ...data, sections: removeAt(data.sections, i) })}
          onMoveUp={() => onChange({ ...data, sections: moveItem(data.sections, i, -1) })}
          onMoveDown={() => onChange({ ...data, sections: moveItem(data.sections, i, 1) })}
        />
      ))}

      <div className="bg-white rounded-lg border border-dashed border-zinc-300 p-4">
        <h3 className="text-sm font-semibold text-zinc-700 mb-2">Add a new section</h3>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded border border-zinc-300 px-2 py-1 text-sm"
            placeholder="Section title, e.g. Certifications"
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
          />
          <select
            className="rounded border border-zinc-300 px-2 py-1 text-sm"
            value={newSectionType}
            onChange={(e) => setNewSectionType(e.target.value as "timeline" | "freeform")}
          >
            <option value="timeline">Timeline (org + dates + bullets)</option>
            <option value="freeform">Freeform (label + text)</option>
          </select>
          <button
            type="button"
            onClick={addSection}
            className="rounded bg-zinc-800 text-white text-sm px-3 py-1 hover:bg-zinc-700"
          >
            Add section
          </button>
        </div>
      </div>
    </div>
  );
}
