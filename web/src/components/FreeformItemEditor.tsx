import type { FreeformItem } from "../lib/types";

const inputClass =
  "w-full rounded border border-zinc-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400";
const labelClass = "block text-xs font-medium text-zinc-500 mb-1";

export function FreeformItemEditor({
  item,
  onChange,
  onRemove,
}: {
  item: FreeformItem;
  onChange: (item: FreeformItem) => void;
  onRemove: () => void;
}) {
  function set<K extends keyof FreeformItem>(key: K, value: FreeformItem[K]) {
    onChange({ ...item, [key]: value });
  }

  return (
    <div className="rounded border border-zinc-200 p-3 space-y-2 bg-zinc-50">
      <div className="flex justify-end -mt-1 -mr-1">
        <button
          type="button"
          className="text-xs text-red-600 hover:text-red-800 px-1.5 py-0.5"
          onClick={onRemove}
        >
          Remove entry
        </button>
      </div>
      <div>
        <label className={labelClass}>Label</label>
        <input
          className={inputClass}
          value={item.label}
          onChange={(e) => set("label", e.target.value)}
          placeholder="Technical Skills"
        />
      </div>
      <div>
        <label className={labelClass}>Text</label>
        <textarea
          className={inputClass}
          rows={3}
          value={item.text}
          onChange={(e) => set("text", e.target.value)}
        />
      </div>
    </div>
  );
}
