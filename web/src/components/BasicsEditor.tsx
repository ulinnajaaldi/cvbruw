import type { ResumeBasics } from "../lib/types";

const inputClass =
  "w-full rounded border border-zinc-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400";
const labelClass = "block text-xs font-medium text-zinc-500 mb-1";

export function BasicsEditor({
  basics,
  onChange,
}: {
  basics: ResumeBasics;
  onChange: (basics: ResumeBasics) => void;
}) {
  function set<K extends keyof ResumeBasics>(key: K, value: ResumeBasics[K]) {
    onChange({ ...basics, [key]: value });
  }

  function updateLink(index: number, patch: Partial<ResumeBasics["links"][number]>) {
    const links = basics.links.map((l, i) => (i === index ? { ...l, ...patch } : l));
    set("links", links);
  }

  function addLink() {
    set("links", [...basics.links, { label: "", url: "" }]);
  }

  function removeLink(index: number) {
    set(
      "links",
      basics.links.filter((_, i) => i !== index)
    );
  }

  return (
    <div className="bg-white rounded-lg border border-zinc-200 p-4 space-y-3">
      <h2 className="text-sm font-semibold text-zinc-700">Basics</h2>

      <div>
        <label className={labelClass}>Full name</label>
        <input
          className={inputClass}
          value={basics.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Aldilla Ulinnaja"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Phone</label>
          <input
            className={inputClass}
            value={basics.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+62..."
          />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input
            className={inputClass}
            value={basics.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="name@example.com"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Location</label>
        <input
          className={inputClass}
          value={basics.location}
          onChange={(e) => set("location", e.target.value)}
          placeholder="City, Region."
        />
      </div>

      <div>
        <label className={labelClass}>Summary</label>
        <textarea
          className={inputClass}
          rows={4}
          value={basics.summary}
          onChange={(e) => set("summary", e.target.value)}
          placeholder="2-4 sentence professional summary"
        />
      </div>

      <div>
        <label className={labelClass}>Links</label>
        <div className="space-y-2">
          {basics.links.map((link, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={inputClass}
                value={link.label}
                onChange={(e) => updateLink(i, { label: e.target.value })}
                placeholder="linkedin.com/in/..."
              />
              <input
                className={inputClass}
                value={link.url}
                onChange={(e) => updateLink(i, { url: e.target.value })}
                placeholder="https://..."
              />
              <button
                type="button"
                onClick={() => removeLink(i)}
                className="shrink-0 text-xs text-red-600 hover:text-red-800 px-2"
                aria-label="Remove link"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addLink}
          className="mt-2 text-xs font-medium text-zinc-600 hover:text-zinc-900"
        >
          + Add link
        </button>
      </div>
    </div>
  );
}
