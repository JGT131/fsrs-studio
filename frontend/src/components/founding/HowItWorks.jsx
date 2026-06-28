import { Scan, Boxes, FileCheck2, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const HOW_BG =
    "https://static.prod-images.emergentagent.com/jobs/128abae8-a09d-412a-a1e2-c3f5643e5632/images/6ec82aca54c792e89a7a33cd2fc734dd67ed11dd54c7a670a45628295ecd6cec.png";

const STEPS = [
    {
        id: "01",
        title: "AI SCAN",
        body: "Upload point clouds, floor plans, or walkthrough video. FSRS extracts geometry, structural members, and existing pipework.",
        icon: Scan,
        meta: "INPUT: .E57 / .PDF / .MP4",
        link: "/studio#scan",
        cta: "OPEN UPLOAD PANEL",
    },
    {
        id: "02",
        title: "3D MODEL",
        body: "Parametric pipe routing with obstacle avoidance. Heads placed per occupancy hazard. Editable in-browser, exportable to BIM.",
        icon: Boxes,
        meta: "OUTPUT: .IFC / .DWG / .RVT",
        link: "/studio#model",
        cta: "OPEN 3D VIEWER",
    },
    {
        id: "03",
        title: "NFPA REPORT",
        body: "Hydraulic calculations, head schedule, hanger plan, and a PE-ready submittal package — referenced to NFPA 13 / 13R / 13D.",
        icon: FileCheck2,
        meta: "OUTPUT: PE-REVIEW PACKAGE",
        link: "/studio#report",
        cta: "OPEN HYDRAULICS",
    },
];

export default function HowItWorks() {
    return (
        <section
            id="how-it-works"
            className="relative border-b border-white/10 bg-black overflow-hidden"
            data-testid="how-it-works-section"
        >
            <div
                className="absolute right-0 top-0 bottom-0 w-1/2 opacity-[0.18] pointer-events-none"
                style={{
                    backgroundImage: `url(${HOW_BG})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center right",
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent pointer-events-none" />

            <div className="relative mx-auto max-w-[1400px] px-6 lg:px-10 py-20 lg:py-28">
                <div className="flex items-end justify-between flex-wrap gap-6 mb-14">
                    <div>
                        <div className="fsrs-overline mb-4">
                            /&nbsp;PROCESS&nbsp;FLOW
                        </div>
                        <h2 className="fsrs-heading text-white text-3xl sm:text-4xl lg:text-5xl xl:text-6xl leading-[0.98]">
                            HOW TO RETROFIT AN EXISTING BUILDING
                            <br />
                            WITH <span className="text-red-500">AI-ASSISTED FIRE SPRINKLERS</span>
                            <br />
                            — IN THREE PE-REVIEWED STAGES.
                        </h2>
                    </div>
                    <div className="max-w-lg space-y-4">
                        <p
                            className="text-slate-400 text-lg leading-relaxed"
                            data-testid="howitworks-supporting-text"
                        >
                            FSRS turns your existing-building drawings into{" "}
                            <span className="text-white">
                                NFPA 13 existing-building retrofit ideas
                            </span>{" "}
                            in three deterministic stages — AI hazard
                            classification, 3D layout suggestions, and
                            hydraulic summaries — each with its own audit
                            trail. Click any step to open the Studio DEMO and
                            walk the workflow yourself.
                        </p>
                        <p
                            className="border-l-2 border-amber-400 bg-amber-400/[0.06] pl-4 pr-3 py-3 text-amber-100 text-base lg:text-lg font-semibold leading-snug tracking-tight"
                            data-testid="howitworks-disclaimer"
                        >
                            <span className="block fsrs-label text-amber-300 mb-1">
                                IMPORTANT
                            </span>
                            Outputs are AI-suggested ideas only. They are{" "}
                            <span className="underline decoration-amber-400/70 decoration-2 underline-offset-4">
                                not certifiable
                            </span>{" "}
                            and not suitable for submission. All final
                            designs, modifications, and stamping must be
                            performed by a licensed professional engineer.
                        </p>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 border border-white/10 relative">
                    {STEPS.map((s, idx) => (
                        <Link
                            to={s.link}
                            key={s.id}
                            className={`relative p-8 lg:p-10 group transition-all duration-300 bg-black outline-none ${idx < STEPS.length - 1 ? "md:border-r border-white/10" : ""} ${idx > 0 ? "border-t md:border-t-0 border-white/10" : ""} cursor-pointer block hover:bg-red-500/[0.05] focus-visible:bg-red-500/[0.08] hover:shadow-[inset_0_0_0_1px_rgba(239,68,68,0.5),inset_0_0_80px_-20px_rgba(239,68,68,0.18),0_0_40px_-10px_rgba(239,68,68,0.35)] focus-visible:shadow-[inset_0_0_0_2px_rgba(239,68,68,0.7),inset_0_0_80px_-20px_rgba(239,68,68,0.25),0_0_50px_-10px_rgba(239,68,68,0.5)] hover:z-10 focus-visible:z-10`}
                            data-testid={`step-${s.id}`}
                            aria-label={`${s.title}: open Studio DEMO`}
                        >
                            {/* Crosshair corner ticks revealed on hover (thicker + longer) */}
                            <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300" />
                            <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300" />
                            <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300" />
                            <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300" />

                            {/* Animated scan line on hover */}
                            <span className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="flex items-center justify-between mb-8 relative">
                                <span className="fsrs-mono text-base text-slate-600 group-hover:text-red-500 transition-colors duration-300">
                                    STEP&nbsp;{s.id}
                                </span>
                                <div className="w-10 h-10 border border-white/10 flex items-center justify-center group-hover:border-red-500 group-hover:bg-red-500/15 group-hover:shadow-[0_0_20px_-2px_rgba(239,68,68,0.6)] transition-all duration-300">
                                    <s.icon
                                        className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform duration-300"
                                        strokeWidth={1.5}
                                    />
                                </div>
                            </div>
                            <div className="fsrs-heading text-white text-2xl lg:text-3xl mb-4 group-hover:translate-x-1 transition-transform duration-300">
                                {s.title}
                            </div>
                            <p className="text-slate-400 text-lg leading-relaxed mb-8 min-h-[80px] group-hover:text-slate-300 transition-colors duration-300">
                                {s.body}
                            </p>
                            <div className="pt-4 border-t border-white/10 group-hover:border-red-500/60 transition-colors duration-300 relative">
                                <div className="fsrs-label text-slate-500 mb-3">
                                    {s.meta}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="fsrs-label text-red-500 group-hover:text-red-400 transition-colors flex items-center gap-2">
                                        {s.cta}
                                        <ArrowUpRight
                                            className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                                            strokeWidth={2}
                                        />
                                    </span>
                                    <span className="fsrs-mono text-lg text-slate-700 group-hover:text-red-500 transition-colors duration-300">
                                        ENTER&nbsp;↵
                                    </span>
                                </div>
                                {/* Animated bottom progress bar */}
                                <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-red-500 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
