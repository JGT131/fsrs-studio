// V2.1 — Florida Checklist refinement.
// Authoritative 4-phase compliance article with deep-link nav,
// FSRS native integration block in early evaluation, and a
// prominent PE-review warning pill.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "@/components/founding/PageShell";
import SeoHead from "@/components/seo/SeoHead";
import { SITE_URL, organizationSchema, softwareApplicationSchema } from "@/lib/seo";
import {
    ChevronLeft,
    ShieldAlert,
    Building2,
    Sparkles,
    ArrowRight,
    Cpu,
    Boxes,
    FileCheck2,
    ClipboardList,
    Hammer,
    ShieldCheck,
    AlertTriangle,
} from "lucide-react";

const SLUG = "florida-high-rise-fire-code-retrofit-checklist-2026";
const PUBLISHED = "2026-02-26";

const PHASES = [
    {
        id: "phase-1-assessment",
        num: "01",
        title: "Assessment",
        icon: ClipboardList,
        intro:
            "Before any engineering decision, confirm scope and obligations under <b>SB 4-D</b> (structural integrity) and <b>SB 154</b> (sprinkler retrofit).",
        items: [
            "Confirm the building exceeds <b>75 feet</b> in habitable height (the SB 154 high-rise trigger) and is regulated by <b>SB 4-D</b> milestone inspections.",
            "Pull the most recent milestone inspection report and structural integrity reserve study (SIRS) per <b>SB 4-D</b>.",
            "Inventory existing fire suppression assets: classify the system as <b>none / 13R / 13</b> per the local edition of <b>NFPA 13</b>.",
            "Verify the locally adopted edition of the <b>Florida Building Code 8th Edition</b> and the <b>Florida Fire Prevention Code</b> in force at your AHJ.",
            "Document occupancy mix (residential / hospitality / parking-garage podium) — each zone requires its own hazard classification.",
        ],
    },
    {
        id: "phase-2-design",
        num: "02",
        title: "Design & Engineering",
        icon: Boxes,
        intro:
            "Translate the assessment into a buildable retrofit design under <b>NFPA 13</b>, while keeping every output PE-reviewable.",
        items: [
            "Assign design density (gpm/sqft) and design area (sqft) per hazard class under <b>NFPA 13</b>.",
            "Run hydraulic feasibility against the available municipal water supply; document the need for a fire pump or on-site storage where required.",
            "Coordinate ceiling, soffit, chase, and post-tension slab routing constraints common to 1970s–1990s Florida high-rises.",
            "Produce a draft head count, branch / main sizing, and a preliminary hydraulic summary for PE review.",
            "Flag rated walls / shafts that will require sleeves, fire-stopping, and 2-hour penetrations under the <b>Florida Building Code 8th Edition</b>.",
        ],
    },
    {
        id: "phase-3-permitting",
        num: "03",
        title: "Permitting & Construction",
        icon: Hammer,
        intro:
            "Submit, install, and inspect — keeping the PE of record in the loop on every change.",
        items: [
            "Prepare PE-stamped drawings, hydraulic calculations, and equipment cut sheets per the <b>Florida Fire Prevention Code</b> and <b>NFPA 13</b>.",
            "Submit through the local fire-marshal portal (e.g., Miami-Dade RER, City of Orlando Building Permitting, City of Tampa Construction Services).",
            "Coordinate phased construction with the condo board to minimize occupant disruption; document bypass and shutoff plans in writing.",
            "Field-verify head placement, hanger schedule, and fire-stopping during installation; record any PE-approved field deviations.",
            "Conduct hydrostatic and operational acceptance testing per <b>NFPA 13</b> Chapter 28; record signatures from contractor, PE, and AHJ.",
        ],
    },
    {
        id: "phase-4-documentation",
        num: "04",
        title: "Documentation",
        icon: FileCheck2,
        intro:
            "Close the loop with auditable records — the AHJ, the board, and your firm all need them.",
        items: [
            "Retain a PE-stamped as-built set, full hydraulic calc file, and the acceptance test report for the building&apos;s lifetime.",
            "File the <b>SB 4-D</b> milestone inspection update with the condo association and update the SIRS to reflect the new sprinkler assets.",
            "Provide the condo board with a plain-language retrofit summary memo and a maintenance / inspection schedule.",
            "Archive every FSRS-assisted draft (watermarked PRELIMINARY) separately from the final PE-stamped construction documents.",
            "Confirm full compliance is achieved by <b>January 1, 2027</b>; permits must be on file by <b>January 1, 2026</b>.",
        ],
    },
];

const FAQS = [
    {
        q: "Which Florida buildings are subject to the 2026–2027 high-rise mandate?",
        a: "Buildings over 75 feet in habitable height are the primary trigger under SB 154. SB 4-D additionally captures most 3-story-and-up residential condominium / co-op structures for structural integrity inspections. Always confirm the exact threshold with the local AHJ.",
    },
    {
        q: "Can FSRS outputs be submitted as final construction documents?",
        a: "No. FSRS produces preliminary, watermarked PRELIMINARY drafts. Every layout, hydraulic summary, and export must be reviewed, modified, and stamped by a licensed PE before any permit submittal, fabrication, or installation.",
    },
    {
        q: "How does FSRS handle multi-occupancy Florida high-rises?",
        a: "The Studio supports zoning the project by occupancy hazard (e.g., residential 13R + podium garage NFPA 13 Ordinary Hazard) and produces separate preliminary classifications per zone. Combined design area and final hydraulics still require PE review.",
    },
    {
        q: "What edition of NFPA does Florida currently enforce?",
        a: "The Florida Fire Prevention Code, 8th Edition adopts NFPA 1 (2021) and NFPA 101 (2021) with Florida-specific amendments. NFPA 13, 13R, and 13D are referenced for sprinkler design. Verify with the AHJ for mid-cycle amendments.",
    },
];

export default function FloridaChecklistArticle() {
    const canonical = `/resources/${SLUG}`;
    const [activePhase, setActivePhase] = useState(PHASES[0].id);

    // Scroll-spy for the deep-link nav.
    useEffect(() => {
        const onScroll = () => {
            const top = window.scrollY + 220;
            for (let i = PHASES.length - 1; i >= 0; i--) {
                const el = document.getElementById(PHASES[i].id);
                if (el && el.offsetTop <= top) {
                    setActivePhase(PHASES[i].id);
                    return;
                }
            }
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const articleSchema = {
        id: "ld-article",
        data: {
            "@context": "https://schema.org",
            "@type": "TechArticle",
            headline:
                "2026 Florida High-Rise Fire Code Retrofit Checklist",
            description:
                "Essential guidance for condo associations, property managers, and licensed fire protection engineers on Florida&apos;s 2026–2027 high-rise fire safety mandates under SB 4-D, SB 154, NFPA 13, and the Florida Building Code 8th Edition.",
            datePublished: PUBLISHED,
            dateModified: PUBLISHED,
            inLanguage: "en-US",
            keywords:
                "florida high-rise fire suppression retrofit, sb 4-d, sb 154, nfpa 13, florida building code 8th edition, condo fire safety, florida fire code retrofit deadline 2026",
            mainEntityOfPage: `${SITE_URL}${canonical}`,
            author: {
                "@type": "Organization",
                name: "FSRS — Fire Suppression Retrofit Studio",
            },
            publisher: {
                "@type": "Organization",
                name: "FSRS — Fire Suppression Retrofit Studio",
            },
        },
    };
    const faqLd = {
        id: "ld-faq-article",
        data: {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((q) => ({
                "@type": "Question",
                name: q.q,
                acceptedAnswer: { "@type": "Answer", text: q.a },
            })),
        },
    };

    return (
        <PageShell>
            <SeoHead
                title="2026 Florida High-Rise Fire Code Retrofit Checklist · SB 4-D + SB 154 | FSRS"
                description="Essential guidance for condo associations, property managers, and licensed fire protection engineers on Florida&rsquo;s 2026–2027 high-rise fire safety mandates. Permits by January 1, 2026; full compliance by January 1, 2027."
                keywords="florida high-rise fire code retrofit checklist, sb 4-d, sb 154, nfpa 13, florida building code 8th edition, florida fire code retrofit deadline 2026, condo association fire safety, property manager fire compliance"
                canonical={canonical}
                ogType="article"
                jsonLd={[
                    organizationSchema(),
                    softwareApplicationSchema(),
                    articleSchema,
                    faqLd,
                ]}
            />

            <article
                className="relative border-b border-white/10 bg-black"
                data-testid="resource-article-florida-checklist"
            >
                <div className="mx-auto max-w-[1300px] px-6 lg:px-10 py-16 lg:py-24">
                    <Link
                        to="/resources"
                        className="inline-flex items-center gap-2 fsrs-label text-slate-400 hover:text-emerald-300 mb-10"
                        data-testid="back-to-resources"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
                        BACK&nbsp;TO&nbsp;RESOURCES
                    </Link>

                    <div className="fsrs-overline mb-4 text-red-400 flex items-center gap-3">
                        <span className="fsrs-dot bg-red-500" />
                        FLORIDA&nbsp;·&nbsp;SB&nbsp;4-D&nbsp;·&nbsp;SB&nbsp;154&nbsp;·&nbsp;NFPA&nbsp;13&nbsp;·&nbsp;FBC&nbsp;8TH&nbsp;ED.
                    </div>
                    <h1
                        className="fsrs-heading text-white text-4xl sm:text-5xl lg:text-6xl leading-[0.95]"
                        data-testid="article-headline"
                    >
                        2026 Florida High-Rise
                        <br />
                        <span className="text-red-500">
                            Fire Code Retrofit
                        </span>{" "}
                        Checklist.
                    </h1>
                    <p
                        className="mt-4 max-w-3xl text-slate-300 text-lg leading-relaxed"
                        data-testid="article-subtitle"
                    >
                        Essential Guidance for Condo Associations, Property
                        Managers &amp; Fire Protection Engineers
                    </p>

                    <div className="mt-6 fsrs-label text-slate-500 flex flex-wrap items-center gap-4">
                        <span>PUBLISHED&nbsp;{PUBLISHED}</span>
                        <span>·</span>
                        <span>9&nbsp;MIN&nbsp;READ</span>
                        <span>·</span>
                        <span>
                            SB&nbsp;4-D&nbsp;·&nbsp;SB&nbsp;154&nbsp;·&nbsp;NFPA&nbsp;13&nbsp;·&nbsp;FBC&nbsp;8TH&nbsp;ED.
                        </span>
                    </div>

                    {/* Intro + deadline call-out */}
                    <div className="mt-10 grid lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8">
                            <p
                                className="text-slate-200 text-lg lg:text-xl leading-relaxed"
                                data-testid="article-intro"
                            >
                                Florida&rsquo;s 2026–2027 high-rise fire safety
                                mandates are here. Most buildings over{" "}
                                <span className="text-white font-semibold">
                                    75 feet
                                </span>{" "}
                                must submit permits by{" "}
                                <span className="text-red-400 font-bold">
                                    January 1, 2026
                                </span>{" "}
                                and achieve full compliance by{" "}
                                <span className="text-red-400 font-bold">
                                    January 1, 2027
                                </span>
                                .
                            </p>
                            <p className="mt-4 text-slate-400 text-base leading-relaxed">
                                This checklist consolidates the obligations
                                imposed by{" "}
                                <b className="text-white">SB 4-D</b>,{" "}
                                <b className="text-white">SB 154</b>,{" "}
                                <b className="text-white">NFPA 13</b>, and the{" "}
                                <b className="text-white">
                                    Florida Building Code 8th Edition
                                </b>{" "}
                                into a four-phase workflow that condo boards,
                                property managers, and licensed fire
                                protection engineers can run together.
                            </p>
                        </div>
                        <aside className="lg:col-span-4">
                            <div
                                className="border border-red-500/50 bg-red-500/[0.08] p-5"
                                data-testid="article-deadline-card"
                            >
                                <div className="fsrs-overline mb-3 text-red-400 flex items-center gap-2">
                                    <AlertTriangle
                                        className="w-3.5 h-3.5"
                                        strokeWidth={2}
                                    />
                                    KEY&nbsp;DEADLINES
                                </div>
                                <ul className="space-y-3 fsrs-mono text-lg text-slate-200">
                                    <li className="flex items-baseline justify-between gap-3">
                                        <span className="text-slate-400">PERMITS&nbsp;ON&nbsp;FILE</span>
                                        <span className="text-white">Jan&nbsp;1,&nbsp;2026</span>
                                    </li>
                                    <li className="flex items-baseline justify-between gap-3">
                                        <span className="text-slate-400">FULL&nbsp;COMPLIANCE</span>
                                        <span className="text-white">Jan&nbsp;1,&nbsp;2027</span>
                                    </li>
                                    <li className="flex items-baseline justify-between gap-3">
                                        <span className="text-slate-400">SB&nbsp;154&nbsp;TRIGGER</span>
                                        <span className="text-white">&gt;&nbsp;75&nbsp;ft</span>
                                    </li>
                                </ul>
                            </div>
                        </aside>
                    </div>

                    {/* High-visibility PE warning pill */}
                    <div
                        className="mt-10 border-2 border-amber-400 bg-amber-400/[0.10] px-6 py-5 flex items-start gap-4"
                        data-testid="critical-pe-warning"
                        role="note"
                        aria-label="Critical note — PE review required"
                    >
                        <div className="w-10 h-10 border border-amber-300 bg-amber-400/20 flex items-center justify-center shrink-0">
                            <ShieldAlert
                                className="w-5 h-5 text-amber-200"
                                strokeWidth={2}
                            />
                        </div>
                        <div>
                            <div className="fsrs-overline text-amber-300 mb-1">
                                CRITICAL&nbsp;NOTE&nbsp;//&nbsp;PE&nbsp;REVIEW&nbsp;REQUIRED
                            </div>
                            <p className="text-amber-100 text-base lg:text-lg font-semibold leading-snug">
                                FSRS is a preliminary AI assistant. Every
                                hazard classification, draft layout, hydraulic
                                summary, and exported deliverable from this
                                checklist must be reviewed, modified, and
                                stamped by a Florida-licensed Professional
                                Engineer before permitting, fabrication, or
                                installation. This article is not legal advice.
                            </p>
                        </div>
                    </div>

                    {/* Deep-link nav + phase content */}
                    <div className="mt-14 grid lg:grid-cols-12 gap-10">
                        <nav
                            className="lg:col-span-3 lg:sticky lg:top-24 self-start"
                            aria-label="Checklist phases"
                            data-testid="phase-nav"
                        >
                            <div className="fsrs-overline mb-3 text-emerald-300">
                                /&nbsp;PHASES
                            </div>
                            <ul className="space-y-1.5">
                                {PHASES.map((p) => {
                                    const active = activePhase === p.id;
                                    return (
                                        <li key={p.id}>
                                            <a
                                                href={`#${p.id}`}
                                                className={`group flex items-center gap-3 border px-3 py-2.5 transition-colors ${
                                                    active
                                                        ? "border-red-500 bg-red-500/[0.08] text-white"
                                                        : "border-white/10 text-slate-400 hover:text-white hover:border-white/30"
                                                }`}
                                                data-testid={`phase-nav-link-${p.num}`}
                                            >
                                                <span
                                                    className={`fsrs-mono text-lg tracking-wider ${active ? "text-red-400" : "text-slate-500"}`}
                                                >
                                                    {p.num}
                                                </span>
                                                <span className="fsrs-mono text-base font-semibold">
                                                    {p.title.toUpperCase()}
                                                </span>
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>

                        <div className="lg:col-span-9 space-y-16" data-testid="phase-sections">
                            {PHASES.map((p, pi) => (
                                <section
                                    key={p.id}
                                    id={p.id}
                                    className="scroll-mt-24"
                                    data-testid={`phase-section-${p.num}`}
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-12 h-12 border border-red-500/50 bg-red-500/[0.06] flex items-center justify-center shrink-0">
                                            <p.icon
                                                className="w-5 h-5 text-red-400"
                                                strokeWidth={1.5}
                                            />
                                        </div>
                                        <div>
                                            <div className="fsrs-label text-slate-500 mb-1">
                                                PHASE&nbsp;{p.num}&nbsp;/&nbsp;04
                                            </div>
                                            <h2 className="fsrs-heading text-white text-3xl lg:text-4xl tracking-tight leading-tight">
                                                {p.title}
                                            </h2>
                                        </div>
                                    </div>

                                    <p
                                        className="mt-3 mb-6 text-slate-300 text-base leading-relaxed border-l-2 border-red-500/40 pl-4"
                                        dangerouslySetInnerHTML={{
                                            __html: p.intro,
                                        }}
                                    />

                                    <ul className="space-y-3">
                                        {p.items.map((it, i) => (
                                            <li
                                                key={i}
                                                className="flex gap-3 text-slate-200 text-lg lg:text-base leading-relaxed"
                                                data-testid={`phase-${p.num}-item-${i}`}
                                            >
                                                <span className="fsrs-mono text-red-400 mt-1 shrink-0">
                                                    ▍
                                                </span>
                                                <span
                                                    dangerouslySetInnerHTML={{
                                                        __html: it,
                                                    }}
                                                />
                                            </li>
                                        ))}
                                    </ul>

                                    {/* FSRS native integration block lives inside Phase 1 (Assessment) */}
                                    {pi === 0 && (
                                        <div
                                            className="mt-8 border border-emerald-400/40 bg-emerald-400/[0.05] p-6 lg:p-7"
                                            data-testid="fsrs-help-block"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 border border-emerald-400/50 bg-emerald-400/10 flex items-center justify-center">
                                                        <Cpu
                                                            className="w-4 h-4 text-emerald-300"
                                                            strokeWidth={1.75}
                                                        />
                                                    </div>
                                                    <span className="fsrs-overline text-emerald-300">
                                                        HOW&nbsp;FSRS&nbsp;HELPS&nbsp;LICENSED&nbsp;ENGINEERS
                                                    </span>
                                                </div>
                                                <span className="fsrs-label text-slate-500 hidden sm:inline">
                                                    EARLY&nbsp;EVALUATION&nbsp;PHASE
                                                </span>
                                            </div>
                                            <p className="text-emerald-50 text-base leading-relaxed">
                                                FSRS compresses the
                                                early-evaluation phase: upload
                                                existing-building drawings and
                                                receive AI-generated{" "}
                                                <b className="text-white">
                                                    NFPA 13
                                                </b>{" "}
                                                hazard classifications, draft
                                                3D sprinkler layouts, and
                                                preliminary hydraulic summaries
                                                in minutes. Every output is
                                                watermarked{" "}
                                                <span className="text-amber-200 font-bold">
                                                    PRELIMINARY
                                                </span>{" "}
                                                and intended to give the
                                                licensed Florida PE a clean
                                                starting point — not a final
                                                deliverable.
                                            </p>
                                            <ul className="mt-4 space-y-1.5 fsrs-mono text-emerald-100 text-lg leading-relaxed">
                                                <li>
                                                    &middot; AI hazard
                                                    classification across
                                                    residential, hospitality,
                                                    parking-garage podium
                                                    zones.
                                                </li>
                                                <li>
                                                    &middot; Draft 3D layout +
                                                    head count + branch / main
                                                    sizing for early
                                                    constructability review.
                                                </li>
                                                <li>
                                                    &middot; Watermarked PDF /
                                                    DXF / IFC packages
                                                    ready for PE markup and
                                                    final stamp.
                                                </li>
                                            </ul>
                                            <div className="mt-5 flex flex-wrap items-center gap-3">
                                                <Link
                                                    to="/how-it-works"
                                                    className="fsrs-cta-ghost text-lg tracking-wider py-2 px-3"
                                                    data-testid="fsrs-help-howitworks-link"
                                                >
                                                    See the workflow
                                                    <ArrowRight
                                                        className="w-3 h-3"
                                                        strokeWidth={2}
                                                    />
                                                </Link>
                                                <Link
                                                    to="/studio"
                                                    className="fsrs-cta-ghost text-lg tracking-wider py-2 px-3 border-emerald-400/60 text-emerald-300"
                                                    data-testid="fsrs-help-studio-link"
                                                >
                                                    Open Studio DEMO
                                                    <ArrowRight
                                                        className="w-3 h-3"
                                                        strokeWidth={2}
                                                    />
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            ))}
                        </div>
                    </div>

                    {/* FAQ */}
                    <div
                        className="mt-20 border-t border-white/10 pt-10"
                        data-testid="article-faq"
                    >
                        <h2 className="fsrs-heading text-white text-3xl tracking-tight leading-tight">
                            Frequently asked questions
                        </h2>
                        <div className="mt-6 divide-y divide-white/10 border border-white/10">
                            {FAQS.map((f, i) => (
                                <details
                                    key={i}
                                    className="group px-5 py-4"
                                    data-testid={`article-faq-${i}`}
                                >
                                    <summary className="cursor-pointer fsrs-mono text-white text-lg font-semibold flex items-center justify-between gap-4">
                                        <span>{f.q}</span>
                                        <span className="text-red-400 group-open:rotate-45 transition-transform">
                                            +
                                        </span>
                                    </summary>
                                    <p className="mt-3 text-slate-300 text-lg leading-relaxed">
                                        {f.a}
                                    </p>
                                </details>
                            ))}
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-16 grid lg:grid-cols-12 gap-6 items-center">
                        <div className="lg:col-span-8">
                            <div className="fsrs-overline mb-3 text-emerald-300 flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5" strokeWidth={2} />
                                BUILT&nbsp;FOR&nbsp;FLORIDA&nbsp;FPEs
                            </div>
                            <h3 className="fsrs-heading text-white text-2xl lg:text-3xl tracking-tight leading-tight">
                                Cut 20+ hours per Florida high-rise retrofit —
                                without giving up your PE stamp.
                            </h3>
                            <p className="mt-3 text-slate-400 text-lg leading-relaxed max-w-xl">
                                FSRS handles the preliminary classification,
                                draft 3D layout, and hydraulic summary so you
                                can focus on the engineering judgment that
                                only a PE can sign for.
                            </p>
                        </div>
                        <div className="lg:col-span-4 flex lg:justify-end">
                            <Link
                                to="/app"
                                className="fsrs-cta-claim"
                                data-testid="article-cta"
                            >
                                <Sparkles className="w-4 h-4" strokeWidth={2} />
                                Start Founding Beta — $249 one-time
                                <ArrowRight className="w-4 h-4" strokeWidth={2} />
                            </Link>
                        </div>
                    </div>
                </div>
            </article>
        </PageShell>
    );
}
