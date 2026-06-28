// V1.9 — Resource Center index. Curated knowledge hub for Florida
// fire protection engineers handling SB 4-D / SB 154 retrofits.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "@/components/founding/PageShell";
import SeoHead from "@/components/seo/SeoHead";
import CategoryFilter, { CATEGORIES } from "@/components/founding/CategoryFilter";
import {
    PAGE_SEO,
    softwareApplicationSchema,
    organizationSchema,
} from "@/lib/seo";
import { BookOpen, ArrowRight, FileText, ShieldCheck } from "lucide-react";

const RESOURCES = [
    {
        slug: "florida-high-rise-fire-code-retrofit-checklist-2026",
        kicker: "FLORIDA · SB 4-D · SB 154 · FBC 8TH ED.",
        title:
            "2026 Florida High-Rise Fire Code Retrofit Checklist",
        excerpt:
            "Essential guidance for condo associations, property managers, and licensed fire protection engineers. Buildings over 75 feet must submit permits by January 1, 2026 and reach full compliance by January 1, 2027 — covered phase-by-phase under SB 4-D, SB 154, NFPA 13, and the Florida Building Code 8th Edition.",
        readMinutes: 9,
        published: "2026-02-26",
        category: "Compliance Checklist",
        cta: "Read the checklist",
        categories: ["HIGH-RISE", "RESIDENTIAL", "COMMERCIAL", "OH1/OH2"],
    },
];

const TEASERS = [
    {
        key: "nfpa13-worksheet",
        title: "NFPA 13 Existing-Building Sprinkler Retrofit Worksheet",
        blurb:
            "A PE-stampable retrofit worksheet covering density / area / coverage assumptions for the most common Florida occupancy classes.",
        categories: ["OH1/OH2", "LIGHT HAZARD", "COMMERCIAL", "RESIDENTIAL"],
    },
    {
        key: "warehouse-storage",
        title: "Warehouse + Storage Retrofit Field Notes (Coming Soon)",
        blurb:
            "Coverage rules, in-rack sprinkler placement, and commodity classification cheat-sheet for warehouse retrofit work.",
        categories: ["WAREHOUSE", "COMMERCIAL"],
    },
];

export default function ResourcesIndex() {
    const [filter, setFilter] = useState("ALL");

    const allItems = useMemo(
        () => [
            ...RESOURCES.map((r) => ({ ...r, kind: "article" })),
            ...TEASERS.map((t) => ({ ...t, kind: "teaser" })),
        ],
        [],
    );

    const matches = (it) =>
        filter === "ALL" ||
        (it.categories || []).includes(filter);

    const filtered = useMemo(() => allItems.filter(matches), [allItems, filter]);

    const counts = useMemo(() => {
        const c = {};
        for (const cat of CATEGORIES) {
            c[cat.key] =
                cat.key === "ALL"
                    ? allItems.length
                    : allItems.filter((it) => (it.categories || []).includes(cat.key)).length;
        }
        return c;
    }, [allItems]);

    return (
        <PageShell>
            <SeoHead
                {...PAGE_SEO.resources}
                jsonLd={[softwareApplicationSchema(), organizationSchema()]}
            />
            <section
                className="relative border-b border-white/10 bg-black"
                data-testid="resources-index"
            >
                <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-20 lg:py-28">
                    <div className="fsrs-overline mb-4 flex items-center gap-3 text-emerald-300">
                        <span className="fsrs-dot" />
                        /&nbsp;RESOURCE&nbsp;CENTER
                    </div>
                    <h1
                        className="fsrs-heading text-white text-4xl sm:text-5xl lg:text-6xl leading-[0.95]"
                        data-testid="resources-title"
                    >
                        FIELD-GRADE
                        <br />
                        <span className="text-red-500">RETROFIT</span> KNOWLEDGE.
                    </h1>
                    <p className="mt-6 max-w-2xl text-slate-300 text-base leading-relaxed">
                        Practical checklists, code summaries, and PE worksheets
                        for{" "}
                        <span className="text-white">
                            Florida high-rise fire suppression retrofit
                        </span>{" "}
                        and{" "}
                        <span className="text-white">
                            NFPA 13 existing-building retrofit
                        </span>{" "}
                        projects. Updated for the{" "}
                        <span className="text-red-400">
                            Florida fire code retrofit deadline 2026
                        </span>{" "}
                        — covering SB 4-D structural integrity inspections and
                        SB 154 sprinkler retrofit mandates.
                    </p>

                    <div className="mt-10">
                        <CategoryFilter
                            active={filter}
                            onChange={setFilter}
                            counts={counts}
                            testid="resources-category-filter"
                        />
                    </div>

                    <div
                        className="grid lg:grid-cols-2 gap-6"
                        data-testid="resources-list"
                    >
                        {filtered.length === 0 && (
                            <div
                                className="lg:col-span-2 border border-dashed border-white/15 bg-black/40 p-10 text-center"
                                data-testid="resources-empty-state"
                            >
                                <p className="fsrs-mono text-slate-400 text-lg">
                                    No resources match the{" "}
                                    <span className="text-white">{filter}</span> filter yet.
                                </p>
                                <button
                                    onClick={() => setFilter("ALL")}
                                    className="fsrs-cta-ghost mt-5 text-lg"
                                    data-testid="resources-empty-reset"
                                >
                                    Reset filter
                                </button>
                            </div>
                        )}
                        {filtered.map((r) =>
                            r.kind === "article" ? (
                                <Link
                                    key={r.slug}
                                    to={`/resources/${r.slug}`}
                                    className="group relative border border-white/10 bg-black hover:bg-white/[0.03] transition-colors p-7 flex flex-col"
                                    data-testid={`resource-card-${r.slug}`}
                                >
                                    <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red-500" />
                                    <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-red-500" />
                                    <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-red-500" />
                                    <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-red-500" />

                                    <div className="flex items-center justify-between mb-5">
                                        <div className="w-10 h-10 border border-emerald-400/40 bg-emerald-400/10 flex items-center justify-center">
                                            <BookOpen
                                                className="w-5 h-5 text-emerald-300"
                                                strokeWidth={1.5}
                                            />
                                        </div>
                                        <span className="fsrs-label text-slate-500">
                                            {r.category}
                                        </span>
                                    </div>

                                    <div className="fsrs-overline text-red-400 mb-3">
                                        {r.kicker}
                                    </div>
                                    <h2 className="fsrs-heading text-white text-2xl leading-tight tracking-tight">
                                        {r.title}
                                    </h2>
                                    <p className="mt-4 text-slate-300 text-lg leading-relaxed">
                                        {r.excerpt}
                                    </p>

                                    {r.categories?.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-1.5">
                                            {r.categories.map((c) => (
                                                <span
                                                    key={c}
                                                    className="fsrs-mono text-[9px] tracking-wider text-slate-400 border border-white/15 px-1.5 py-0.5"
                                                >
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mt-7 pt-5 border-t border-white/10 flex items-center justify-between fsrs-label text-slate-500">
                                        <span>
                                            {r.readMinutes}&nbsp;MIN&nbsp;READ&nbsp;·&nbsp;{r.published}
                                        </span>
                                        <span className="inline-flex items-center gap-2 text-emerald-300 group-hover:text-emerald-200 transition-colors">
                                            {r.cta}
                                            <ArrowRight
                                                className="w-3.5 h-3.5"
                                                strokeWidth={2}
                                            />
                                        </span>
                                    </div>
                                </Link>
                            ) : (
                                <div
                                    key={r.key}
                                    className="border border-dashed border-white/10 bg-black/40 p-7 flex flex-col"
                                    data-testid={`resource-teaser-${r.key}`}
                                >
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="w-10 h-10 border border-white/15 flex items-center justify-center">
                                            <FileText
                                                className="w-5 h-5 text-slate-500"
                                                strokeWidth={1.5}
                                            />
                                        </div>
                                        <span className="fsrs-label text-slate-600">
                                            COMING&nbsp;SOON
                                        </span>
                                    </div>
                                    <h3 className="fsrs-heading text-slate-300 text-xl leading-tight tracking-tight">
                                        {r.title}
                                    </h3>
                                    <p className="mt-3 fsrs-mono text-slate-500 text-base leading-relaxed">
                                        {r.blurb}
                                    </p>
                                    {r.categories?.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-1.5">
                                            {r.categories.map((c) => (
                                                <span
                                                    key={c}
                                                    className="fsrs-mono text-[9px] tracking-wider text-slate-500 border border-white/10 px-1.5 py-0.5"
                                                >
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ),
                        )}
                    </div>

                    <div
                        className="mt-12 border-l-4 border-amber-400 bg-amber-400/[0.08] px-6 py-5"
                        data-testid="resources-disclaimer"
                    >
                        <div className="fsrs-overline mb-2 text-amber-300 flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />
                            ENGINEERING&nbsp;NOTE
                        </div>
                        <p className="text-amber-100 text-lg leading-snug">
                            All resources are educational summaries — not
                            substitutes for direct review of NFPA 13, Florida
                            Statutes Ch. 553 / 633, or the local AHJ. Anything
                            you generate via FSRS still requires licensed PE
                            review and stamping before submittal.
                        </p>
                    </div>
                </div>
            </section>
        </PageShell>
    );
}
