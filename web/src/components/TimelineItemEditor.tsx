import type { TimelineItem } from "../lib/types";
import { moveItem, removeAt, updateAt } from "../lib/array-utils";

const inputClass =
  "w-full rounded border border-zinc-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400";
const labelClass = "block text-xs font-medium text-zinc-500 mb-1";
const smallBtn = "text-xs text-zinc-500 hover:text-zinc-900 px-1.5 py-0.5";

export function TimelineItemEditor({
  item,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  item: TimelineItem;
  onChange: (item: TimelineItem) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  function set<K extends keyof TimelineItem>(key: K, value: TimelineItem[K]) {
    onChange({ ...item, [key]: value });
  }

  function updateHighlight(i: number, value: string) {
    set("highlights", updateAt(item.highlights, i, value));
  }

  function addHighlight() {
    set("highlights", [...item.highlights, ""]);
  }

  function removeHighlight(i: number) {
    set("highlights", removeAt(item.highlights, i));
  }

  function moveHighlight(i: number, dir: -1 | 1) {
    set("highlights", moveItem(item.highlights, i, dir));
  }

  return (
    <div className="rounded border border-zinc-200 p-3 space-y-2 bg-zinc-50">
      <div className="flex justify-end gap-1 -mt-1 -mr-1">
        <button type="button" className={smallBtn} onClick={onMoveUp} aria-label="Move up">
          ↑
        </button>
        <button type="button" className={smallBtn} onClick={onMoveDown} aria-label="Move down">
          ↓
        </button>
        <button
          type="button"
          className="text-xs text-red-600 hover:text-red-800 px-1.5 py-0.5"
          onClick={onRemove}
        >
          Remove entry
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass}>Organization</label>
          <input
            className={inputClass}
            value={item.organization}
            onChange={(e) => set("organization", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Location</label>
          <input
            className={inputClass}
            value={item.location ?? ""}
            onChange={(e) => set("location", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass}>Start date</label>
          <input
            className={inputClass}
            value={item.dateStart}
            onChange={(e) => set("dateStart", e.target.value)}
            placeholder="Jan 2024"
          />
        </div>
        <div>
          <label className={labelClass}>End date</label>
          <input
            className={inputClass}
            value={item.dateEnd}
            onChange={(e) => set("dateEnd", e.target.value)}
            placeholder="Present"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Role / title</label>
        <input
          className={inputClass}
          value={item.role}
          onChange={(e) => set("role", e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass}>Highlights</label>
        <div className="space-y-1.5">
          {item.highlights.map((h, i) => (
            <div key={i} className="flex gap-1.5 items-start">
              <textarea
                className={inputClass}
                rows={2}
                value={h}
                onChange={(e) => updateHighlight(i, e.target.value)}
              />
              <div className="flex flex-col shrink-0">
                <button type="button" className={smallBtn} onClick={() => moveHighlight(i, -1)}>
                  ↑
                </button>
                <button type="button" className={smallBtn} onClick={() => moveHighlight(i, 1)}>
                  ↓
                </button>
                <button
                  type="button"
                  className="text-xs text-red-600 hover:text-red-800 px-1.5"
                  onClick={() => removeHighlight(i)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addHighlight}
          className="mt-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900"
        >
          + Add highlight
        </button>
      </div>
    </div>
  );
}
