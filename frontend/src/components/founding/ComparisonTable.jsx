// Plan G — "Demo vs Real" Capability Matrix, benefit-led.
import { CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ROWS = [
    {
        k: "Project Context",
        demo: "Pre-loaded sample projects only",
        real: "Upload YOUR actual drawings & RFP packages",
    },
    {
        k: "NFPA 13 Compliance Speed",
        demo: "Simulated, instant results",
        real: "AI-suggested layouts ready in minutes",
    },
    {
        k: "Coordination Depth",
        demo: "Interactive mock with canned data",
        real: "Fully generated & editable 3D routing",
    },
    {
        k: "Official Deliverables",
        demo: "Watermarked PDFs (DEMO stamped)",
        real: "Professional DXF · IFC · PDF for submittals",
    },
    {
        k: "Design Capacity",
        demo: "1 demo project per session",
        real: "Unlimited drafts · 10 exported reports included (Founding)",
    },
    {
        k: "PE Review & Stamping",
        demo: "Always required (preliminary only)",
        real: "Always required — FSRS assists, you certify",
    },
];

export default function ComparisonTable() {
    return (
        <section
            id="demo-vs-real"
            className="relative border-b border-white/10 bg-black"
            data-testid="comparison-table-section"
        >
            <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-16 lg:py-24">
                <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
                    <div>
                        <div className="fsrs-overline mb-4">
                            /&nbsp;CAPABILITY&nbsp;MATRIX
                        </div>
                        <h2 className="fsrs-heading text-white text-3xl sm:text-4xl lg:text-5xl leading-[1.0]">
                            WHAT YOU GET&nbsp;
                            <span className="text-slate-600">VS.</span>
                            &nbsp;WHAT YOU&nbsp;
                            <span className="text-red-500">UNLOCK</span>.
                        </h2>
                    </div>
                    <p className="max-w-md text-slate-400 text-lg leading-relaxed">
                        Compare the simulated demo against the real Founding
                        Beta experience — at a benefit level, not just a
                        feature level.
                    </p>
                </div>

                <div className="border border-white/10 overflow-hidden">
                    {/* Header row */}
                    <div className="grid grid-cols-1 md:grid-cols-12 bg-white/[0.02] border-b border-white/10">
                        <div className="md:col-span-4 p-4 fsrs-label text-slate-500">
                            FEATURE&nbsp;/&nbsp;BENEFIT
                        </div>
                        <div className="md:col-span-4 p-4 border-t md:border-t-0 md:border-l border-white/10 flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" strokeWidth={2} />
                            <span className="fsrs-label text-amber-300 font-bold">
                                DEMO&nbsp;EXPERIENCE
                            </span>
                        </div>
                        <div className="md:col-span-4 p-4 border-t md:border-t-0 md:border-l border-white/10 flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} />
                            <span className="fsrs-label text-emerald-300 font-bold">
                                REAL&nbsp;PAID&nbsp;EXPERIENCE
                            </span>
                        </div>
                    </div>

                    {ROWS.map((r, i) => (
                        <div
                            key={i}
                            className="grid grid-cols-1 md:grid-cols-12 border-b border-white/5 last:border-b-0 hover:bg-white/[0.015] transition-colors"
                            data-testid={`comparison-row-${i}`}
                        >
                            <div className="md:col-span-4 p-4 fsrs-mono text-white text-lg font-semibold">
                                {r.k}
                            </div>
                            <div className="md:col-span-4 p-4 border-t md:border-t-0 md:border-l border-white/5 fsrs-mono text-amber-200 text-lg leading-snug">
                                {r.demo}
                            </div>
                            <div className="md:col-span-4 p-4 border-t md:border-t-0 md:border-l border-white/5 fsrs-mono text-emerald-200 text-lg leading-snug">
                                {r.real}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer with CTAs */}
                <div className="mt-8 flex items-center justify-between flex-wrap gap-4">
                    <p className="fsrs-mono text-slate-500 text-base max-w-md leading-relaxed">
                        <span className="text-amber-300 font-bold">DEMO EXPERIENCE:</span>{" "}
                        no real AI processing, no real uploads, sample data only.
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                        <Link
                            to="/studio?example=parking-garage-mechanical"
                            className="fsrs-cta-ghost border-emerald-400/40 text-emerald-300 hover:text-emerald-200 hover:border-emerald-400"
                            data-testid="comparison-try-demo"
                        >
                            Try Demo · Garage Project&nbsp;↗
                        </Link>
                        <Link
                            to="/app"
                            className="fsrs-cta-claim"
                            data-testid="comparison-upgrade"
                        >
                            Start Founding Beta — $249 one-time
                            <ArrowRight className="w-4 h-4" strokeWidth={2} />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
