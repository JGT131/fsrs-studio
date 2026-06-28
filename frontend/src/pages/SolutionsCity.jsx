// V1.9 — Local SEO landing pages. Data-driven by useParams.
import { useParams, Link } from "react-router-dom";
import PageShell from "@/components/founding/PageShell";
import SeoHead from "@/components/seo/SeoHead";
import {
    SITE_URL,
    organizationSchema,
    softwareApplicationSchema,
    localBusinessSchema,
    faqSchema,
} from "@/lib/seo";
import {
    Building2,
    ShieldCheck,
    ArrowRight,
    Sparkles,
    MapPin,
} from "lucide-react";

const SOLUTIONS = {
    "miami-high-rise-retrofit": {
        city: "Miami",
        region: "FL",
        kicker: "MIAMI · MIAMI-DADE · COASTAL",
        title:
            "Miami high-rise fire suppression retrofit — AI-assisted drafts for the Magic City backlog.",
        intro:
            "Miami&apos;s 1970s–1990s coastal high-rise inventory carries the heaviest concentration of SB 4-D and SB 154 retrofit obligations in Florida. FSRS is the AI fire suppression design assistant licensed Miami fire protection engineers use to compress NFPA 13 existing-building sprinkler retrofit drafts from days into hours.",
        seo: {
            title:
                "Miami High-Rise Fire Suppression Retrofit · AI Assistant for Miami-Dade FPEs | FSRS",
            description:
                "AI fire suppression design assistant for Miami high-rise fire suppression retrofit and Miami-Dade NFPA 13 existing-building sprinkler retrofit projects. Built for licensed FPEs handling SB 4-D / SB 154 backlog.",
            keywords:
                "miami high-rise fire suppression retrofit, miami-dade fire protection engineer software, nfpa 13 existing building sprinkler retrofit miami, sb 4-d retrofit miami, high-rise condo fire code compliance florida",
        },
        contextStats: [
            { k: "SB 4-D milestone scope", v: "30+ year coastal high-rises" },
            { k: "SB 154 sprinkler retrofit", v: "Pre-1994 R-occupancy" },
            { k: "Local AHJ portal", v: "Miami-Dade RER" },
            { k: "Adopted code", v: "Florida Fire Prevention Code 8th Ed." },
        ],
        bullets: [
            "AI hazard classification tuned for coastal Miami occupancy mixes (residential / mixed-use / parking-garage podiums).",
            "Watermarked DXF/IFC outputs ready for early Miami-Dade RER pre-application coordination.",
            "PE-stamp acknowledgment required on every export — FSRS never bypasses your licensed review.",
            "Tier pricing (Starter $99 · Founding $249 · Professional $399 · Firm $1,499) — no monthly subscription.",
        ],
        faqs: [
            {
                q: "Does FSRS cover Miami-Dade-specific amendments to the Florida Fire Prevention Code?",
                a: "FSRS generates preliminary NFPA 13 layouts using the national reference text. Your PE review must overlay any Miami-Dade RER / local fire marshal amendments before stamping. We surface the AHJ context (e.g., Miami-Dade RER portal) but do not auto-merge local amendments.",
            },
            {
                q: "Can FSRS handle Miami coastal high-rise multi-occupancy layouts (residential over podium garage)?",
                a: "Yes. The Studio supports zoning the project by occupancy hazard (residential 13R + podium garage NFPA 13 Ordinary Hazard) and produces separate preliminary hazard classifications for each zone. Final hydraulic calcs and combined design area still require PE review.",
            },
        ],
    },
    "orlando-condo-fire-safety": {
        city: "Orlando",
        region: "FL",
        kicker: "ORLANDO · ORANGE COUNTY · CENTRAL FL",
        title:
            "Orlando condo fire safety — AI-assisted NFPA 13 retrofit drafts for Central Florida boards.",
        intro:
            "Orlando&apos;s mid-rise condo and tourism-corridor inventory is moving rapidly through SB 154 sprinkler retrofit reviews. FSRS gives Central Florida fire protection engineers an AI fire suppression design assistant tuned for high-rise condo fire code compliance — without ever replacing PE judgment.",
        seo: {
            title:
                "Orlando Condo Fire Safety · AI NFPA 13 Retrofit Assistant for Orange County FPEs | FSRS",
            description:
                "AI fire suppression design assistant for Orlando condo fire safety and Orange County NFPA 13 existing-building sprinkler retrofit projects. Tuned for Central Florida high-rise condo fire code compliance.",
            keywords:
                "orlando condo fire safety, orange county fire protection engineer software, nfpa 13 existing building sprinkler retrofit orlando, high-rise condo fire code compliance florida, sb 154 sprinkler retrofit orlando",
        },
        contextStats: [
            { k: "Inventory focus", v: "Mid-rise condo + tourism-corridor" },
            { k: "SB 154 sprinkler retrofit", v: "Pre-1994 R-occupancy" },
            { k: "Local AHJ portal", v: "City of Orlando Building Permitting" },
            { k: "Adopted code", v: "Florida Fire Prevention Code 8th Ed." },
        ],
        bullets: [
            "AI hazard classification for typical Central Florida condo + hospitality occupancies.",
            "Watermarked PDF / DXF deliverables for Orange County / City of Orlando pre-permit packages.",
            "Workflow built for Florida condo boards balancing SB 4-D reserves and SB 154 retrofit budgets.",
            "Optional Professional Support & Updates ($149/year) keeps Orlando firms current as the AHJ adopts new amendments.",
        ],
        faqs: [
            {
                q: "Can FSRS help an Orlando condo board scope a multi-phase retrofit budget?",
                a: "FSRS gives PEs the preliminary head-count, main / branch sizing, and hydraulic summary that drive an order-of-magnitude budget. Phasing, financing, and reserves are board / financial-advisor responsibilities; the PE still owns the engineering judgment and stamp.",
            },
            {
                q: "Does FSRS integrate with the City of Orlando permitting portal?",
                a: "Not directly. FSRS produces watermarked PDF / DXF / IFC packages that you can attach to your City of Orlando Building Permitting submission. All submittals must be stamped by a licensed PE.",
            },
        ],
    },
    "tampa-fire-code-compliance": {
        city: "Tampa",
        region: "FL",
        kicker: "TAMPA · HILLSBOROUGH · GULF COAST",
        title:
            "Tampa fire code compliance — AI fire suppression design assistant for Gulf Coast FPEs.",
        intro:
            "Tampa and the broader Hillsborough County market are clearing a long backlog of NFPA 13 existing-building sprinkler retrofit work alongside the post-SB 4-D structural integrity cycle. FSRS gives Gulf Coast fire protection engineers an AI fire suppression design assistant focused on Tampa fire code compliance velocity.",
        seo: {
            title:
                "Tampa Fire Code Compliance · AI Fire Suppression Design Assistant for Gulf Coast FPEs | FSRS",
            description:
                "AI fire suppression design assistant for Tampa fire code compliance and Hillsborough County NFPA 13 existing-building sprinkler retrofit projects. Tuned for the Gulf Coast high-rise condo fire code compliance backlog.",
            keywords:
                "tampa fire code compliance, hillsborough county fire protection engineer software, nfpa 13 existing building sprinkler retrofit tampa, high-rise condo fire code compliance florida, sb 4-d retrofit tampa",
        },
        contextStats: [
            { k: "Inventory focus", v: "Gulf Coast residential + hospitality" },
            { k: "SB 154 sprinkler retrofit", v: "Pre-1994 R-occupancy" },
            { k: "Local AHJ portal", v: "City of Tampa Construction Services" },
            { k: "Adopted code", v: "Florida Fire Prevention Code 8th Ed." },
        ],
        bullets: [
            "AI hazard classification calibrated for Gulf Coast residential + light-commercial mixes.",
            "Watermarked deliverables ready for City of Tampa Construction Services pre-permit conversations.",
            "Backlog-friendly: SRU-based pricing means a small Tampa firm can run 5–10 retrofits at predictable cost.",
            "Firm Plan ($1,499 one-time / 100 SRUs / 5 seats) for multi-engineer Hillsborough teams.",
        ],
        faqs: [
            {
                q: "Is FSRS suitable for Tampa Bay coastal mixed-use retrofits?",
                a: "Yes — the AI hazard classifier supports separate zones (residential, parking garage, light-commercial podium) on the same project. Coastal wind/structural integrity issues are out of scope and must be handled by the structural engineer of record.",
            },
            {
                q: "Can a Tampa firm share a project dashboard across multiple engineers?",
                a: "Yes. The Firm Plan ($1,499 one-time) includes a shared project dashboard for up to 5 engineers, plus priority exports. Add Firm Support & Updates ($349/year) if you want continuous AHJ-amendment context.",
            },
        ],
    },
};

export default function SolutionsCity() {
    const { slug } = useParams();
    const sol = SOLUTIONS[slug];

    if (!sol) {
        return (
            <PageShell>
                <SeoHead
                    title="Solution not found | FSRS"
                    description="The requested local solution page was not found."
                />
                <section className="bg-black border-b border-white/10 py-24">
                    <div className="mx-auto max-w-[1100px] px-6 lg:px-10 text-center">
                        <h1 className="fsrs-heading text-white text-4xl">
                            Solution not found.
                        </h1>
                        <p className="mt-3 text-slate-400">
                            Try{" "}
                            <Link
                                to="/solutions/miami-high-rise-retrofit"
                                className="text-emerald-300 underline"
                            >
                                Miami
                            </Link>
                            ,{" "}
                            <Link
                                to="/solutions/orlando-condo-fire-safety"
                                className="text-emerald-300 underline"
                            >
                                Orlando
                            </Link>
                            , or{" "}
                            <Link
                                to="/solutions/tampa-fire-code-compliance"
                                className="text-emerald-300 underline"
                            >
                                Tampa
                            </Link>
                            .
                        </p>
                    </div>
                </section>
            </PageShell>
        );
    }

    const canonical = `/solutions/${slug}`;

    return (
        <PageShell>
            <SeoHead
                {...sol.seo}
                canonical={canonical}
                ogType="website"
                jsonLd={[
                    organizationSchema(),
                    softwareApplicationSchema(),
                    localBusinessSchema({
                        city: sol.city,
                        region: sol.region,
                        slug,
                    }),
                    faqSchema(sol.faqs),
                ]}
            />

            <section
                className="relative border-b border-white/10 bg-black"
                data-testid={`solutions-page-${slug}`}
            >
                <div className="mx-auto max-w-[1300px] px-6 lg:px-10 py-16 lg:py-24">
                    <div className="fsrs-overline mb-4 text-red-400 flex items-center gap-3">
                        <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
                        {sol.kicker}
                    </div>
                    <h1
                        className="fsrs-heading text-white text-4xl sm:text-5xl lg:text-6xl leading-[0.95]"
                        data-testid="solutions-headline"
                    >
                        {sol.title.split(" — ")[0]}&nbsp;—
                        <br />
                        <span className="text-red-500">
                            {sol.title.split(" — ")[1] || "AI-assisted drafts."}
                        </span>
                    </h1>
                    <p
                        className="mt-6 max-w-3xl text-slate-300 text-base lg:text-lg leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: sol.intro }}
                    />

                    <div className="mt-12 grid lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-7">
                            <div className="fsrs-overline mb-4 text-emerald-300">
                                /&nbsp;WHY&nbsp;FSRS&nbsp;FOR&nbsp;{sol.city.toUpperCase()}&nbsp;FPEs
                            </div>
                            <ul className="space-y-3">
                                {sol.bullets.map((b, i) => (
                                    <li
                                        key={i}
                                        className="flex gap-3 text-slate-300 text-lg leading-relaxed"
                                        data-testid={`solutions-bullet-${i}`}
                                    >
                                        <span className="fsrs-mono text-red-400 mt-0.5 shrink-0">
                                            ▍
                                        </span>
                                        <span>{b}</span>
                                    </li>
                                ))}
                            </ul>

                            <div
                                className="mt-10 border-l-4 border-amber-400 bg-amber-400/[0.08] px-5 py-4"
                                data-testid="solutions-ahj-note"
                            >
                                <div className="fsrs-overline mb-2 text-amber-300 flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />
                                    AHJ&nbsp;NOTE
                                </div>
                                <p className="text-amber-100 text-lg leading-snug">
                                    FSRS surfaces the relevant Florida AHJ
                                    portal context but does not auto-merge
                                    local amendments. Every export still
                                    requires licensed PE review and stamping
                                    before submittal.
                                </p>
                            </div>
                        </div>

                        <aside
                            className="lg:col-span-5 border border-white/10 bg-black p-6 lg:p-7"
                            data-testid="solutions-stat-card"
                        >
                            <div className="fsrs-overline mb-4 text-slate-400 flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5" strokeWidth={2} />
                                {sol.city.toUpperCase()}&nbsp;CONTEXT
                            </div>
                            <ul className="divide-y divide-white/10">
                                {sol.contextStats.map((s, i) => (
                                    <li
                                        key={i}
                                        className="flex items-baseline justify-between gap-4 py-3 fsrs-mono text-base"
                                    >
                                        <span className="text-slate-500">{s.k}</span>
                                        <span className="text-white text-right">
                                            {s.v}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </aside>
                    </div>

                    <div
                        className="mt-16 border-t border-white/10 pt-10"
                        data-testid="solutions-faq"
                    >
                        <h2 className="fsrs-heading text-white text-3xl tracking-tight leading-tight">
                            {sol.city} FPE — frequently asked questions
                        </h2>
                        <div className="mt-6 divide-y divide-white/10 border border-white/10">
                            {sol.faqs.map((f, i) => (
                                <details
                                    key={i}
                                    className="group px-5 py-4"
                                    data-testid={`solutions-faq-${i}`}
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
                            <h3 className="fsrs-heading text-white text-2xl lg:text-3xl tracking-tight leading-tight">
                                Start a {sol.city} retrofit draft in minutes —
                                stamp it in hours.
                            </h3>
                            <p className="mt-3 text-slate-400 text-lg leading-relaxed max-w-xl">
                                Founding Beta is $249 one-time with 10 SRUs
                                included — enough to pilot FSRS on real {sol.city}
                                {" "}projects before scaling to the Firm Plan.
                            </p>
                        </div>
                        <div className="lg:col-span-4 flex lg:justify-end">
                            <Link
                                to="/app"
                                className="fsrs-cta-claim"
                                data-testid={`solutions-cta-${slug}`}
                            >
                                <Sparkles className="w-4 h-4" strokeWidth={2} />
                                Start Founding Beta — $249 one-time
                                <ArrowRight className="w-4 h-4" strokeWidth={2} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </PageShell>
    );
}
