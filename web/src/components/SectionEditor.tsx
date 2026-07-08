import type { ResumeSection } from "../lib/types";
import { emptyTimelineItem, emptyFreeformItem } from "../lib/types";
import { moveItem, removeAt, updateAt } from "../lib/array-utils";
import { TimelineItemEditor } from "./TimelineItemEditor";
import { FreeformItemEditor } from "./FreeformItemEditor";

const smallBtn = "text-xs text-zinc-500 hover:text-zinc-900 px-1.5 py-0.5";

export function SectionEditor({
  section,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  section: ResumeSection;
  onChange: (section: ResumeSection) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  function addItem() {
    if (section.type === "timeline") {
      onChange({ ...section, items: [...section.items, emptyTimelineItem()] });
    } else {
      onChange({ ...section, items: [...section.items, emptyFreeformItem()] });
    }
  }

  return (
    <div className="bg-white rounded-lg border border-zinc-200 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <input
          className="flex-1 rounded border border-zinc-300 px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-400"
          value={section.title}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
        />
        <div className="flex gap-1 shrink-0">
          <button type="button" className={smallBtn} onClick={onMoveUp} aria-label="Move section up">
            ↑
          </button>
          <button type="button" className={smallBtn} onClick={onMoveDown} aria-label="Move section down">
            ↓
          </button>
          <button
            type="button"
            className="text-xs text-red-600 hover:text-red-800 px-1.5 py-0.5"
            onClick={onRemove}
          >
            Remove section
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {section.type === "timeline"
          ? section.items.map((item, i) => (
              <TimelineItemEditor
                key={i}
                item={item}
                onChange={(updated) =>
                  onChange({ ...section, items: updateAt(section.items, i, updated) })
                }
                onRemove={() => onChange({ ...section, items: removeAt(section.items, i) })}
                onMoveUp={() => onChange({ ...section, items: moveItem(section.items, i, -1) })}
                onMoveDown={() => onChange({ ...section, items: moveItem(section.items, i, 1) })}
              />
            ))
          : section.items.map((item, i) => (
              <FreeformItemEditor
                key={i}
                item={item}
                onChange={(updated) =>
                  onChange({ ...section, items: updateAt(section.items, i, updated) })
                }
                onRemove={() => onChange({ ...section, items: removeAt(section.items, i) })}
              />
            ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
      >
        + Add entry
      </button>
    </div>
  );
}
