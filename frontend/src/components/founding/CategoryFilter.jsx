// V2.2 — Reusable "Technical Category Filter" bar.
// Sharp monospaced pill chips above card grids; click to filter.
// Matches the Engineering Workbench aesthetic.
export const CATEGORIES = [
    { key: "ALL", label: "ALL" },
    { key: "HIGH-RISE", label: "HIGH-RISE" },
    { key: "RESIDENTIAL", label: "RESIDENTIAL" },
    { key: "COMMERCIAL", label: "COMMERCIAL" },
    { key: "WAREHOUSE", label: "WAREHOUSE" },
    { key: "OH1/OH2", label: "OH1/OH2" },
    { key: "LIGHT HAZARD", label: "LIGHT HAZARD" },
];

export default function CategoryFilter({
    active,
    onChange,
    counts = {},
    testid = "category-filter",
}) {
    return (
        <nav
            className="mb-8 border border-white/10 bg-black/60"
            aria-label="Filter by category"
            data-testid={testid}
        >
            <div className="flex items-center gap-px overflow-x-auto bg-white/[0.04]">
                <span className="fsrs-label text-slate-500 px-4 py-2.5 shrink-0 bg-black/80">
                    /&nbsp;FILTER
                </span>
                {CATEGORIES.map((c) => {
                    const isActive = active === c.key;
                    const count = counts[c.key];
                    return (
                        <button
                            key={c.key}
                            type="button"
                            onClick={() => onChange(c.key)}
                            aria-pressed={isActive}
                            className={`fsrs-mono text-lg tracking-wider font-bold uppercase px-3 py-2.5 whitespace-nowrap transition-all duration-150 bg-black hover:bg-white/[0.05] ${
                                isActive
                                    ? "text-white border-x border-red-500 bg-red-500/[0.08] shadow-[inset_0_0_0_1px_rgba(239,68,68,0.55),0_0_18px_-6px_rgba(239,68,68,0.7)]"
                                    : "text-slate-400 hover:text-white"
                            }`}
                            data-testid={`${testid}-tag-${slugify(c.key)}`}
                        >
                            <span>{c.label}</span>
                            {count != null && (
                                <span
                                    className={`ml-2 fsrs-mono text-lg ${isActive ? "text-red-300" : "text-slate-600"}`}
                                >
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}

function slugify(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
