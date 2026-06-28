import { ArrowRight, Cpu, Box, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import MiniDisclaimer from "@/components/founding/MiniDisclaimer";

const HERO_BG =
    "https://static.prod-images.emergentagent.com/jobs/128abae8-a09d-412a-a1e2-c3f5643e5632/images/cddc4fb5693867e8ea999e487da7b80c05a3571e018bdee5a3d194048a5ce1a0.png";

export default function Hero({ onCtaClick }) {
    return (
        <section
            className="relative overflow-hidden border-b border-white/10"
            data-testid="hero-section"
        >
            {/* Background blueprint */}
            <div
                className="absolute inset-0 opacity-25"
                style={{
                    backgroundImage: `url(${HERO_BG})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            />
            <div className="absolute inset-0 fsrs-grid-bg-fine opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />
            <div className="fsrs-scanline" />

            <div className="relative mx-auto max-w-[1400px] px-6 lg:px-10 pt-20 pb-16 lg:pt-32 lg:pb-24">
                {/* Coordinates header */}
                <div className="flex items-center justify-between mb-12 fsrs-label text-slate-500">
                    <span>X:&nbsp;000.000&nbsp;&nbsp;Y:&nbsp;000.000</span>
                    <span className="hidden sm:inline">
                        SECT-01&nbsp;//&nbsp;FOUNDING-BETA
                    </span>
                </div>

                <div className="grid lg:grid-cols-12 gap-10 items-end">
                    <div className="lg:col-span-8 fsrs-rise">
                        <div className="fsrs-overline mb-6 flex items-center gap-3">
                            <span className="fsrs-dot" />
                            FOUNDING&nbsp;BETA&nbsp;PROGRAM
                            <span className="text-slate-600">
                                //&nbsp;30&nbsp;DAYS&nbsp;ONLY
                            </span>
                        </div>

                        <h1
                            className="fsrs-heading text-white text-3xl sm:text-4xl lg:text-5xl xl:text-6xl leading-[1.02]"
                            data-testid="hero-headline"
                        >
                            RAPIDLY EVALUATE&nbsp;
                            <span className="text-red-500">NFPA&nbsp;13</span>
                            &nbsp;EXISTING-BUILDING RETROFITS.
                            <span className="block mt-4 text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-white/90">
                                Built for the&nbsp;
                                <span className="text-red-500">
                                    Florida high-rise fire suppression retrofit
                                </span>
                                <br className="hidden lg:block" />
                                &nbsp;deadline — secure your founding spot.
                            </span>
                        </h1>

                        <p
                            className="mt-5 max-w-2xl text-slate-300 text-lg sm:text-base leading-relaxed"
                            data-testid="hero-subheadline"
                        >
                            <span className="text-white">
                                $249 one-time · 10 exports included · no
                                monthly fee.
                            </span>{" "}
                            <span className="text-slate-400">
                                The AI fire suppression retrofit studio for
                                licensed engineers — generate hazard
                                classifications, 3D layout suggestions, and
                                CAD-ready exports from existing-building
                                drawings. PE review, modification, and
                                stamping remain with you.
                            </span>
                        </p>

                        {/* Primary CTA group — moved up for the 8-second rule */}
                        <div
                            className="mt-6 flex flex-col gap-4 max-w-2xl"
                            data-testid="hero-cta-group"
                        >
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    onClick={onCtaClick}
                                    className="fsrs-cta-claim group relative text-[13px] sm:text-lg py-4 px-7 sm:py-[18px] sm:px-8"
                                    data-testid="hero-cta-button"
                                >
                                    <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-red-300/80" />
                                    <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-red-300/80" />
                                    <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-red-300/80" />
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-red-300/80" />
                                    Claim My Founding Spot
                                    <ArrowRight
                                        className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                                        strokeWidth={2.5}
                                    />
                                </button>

                                <Link
                                    to="/studio?example=parking-garage-mechanical"
                                    className="fsrs-cta-ghost group relative text-[13px] sm:text-lg py-4 px-7 sm:py-[18px] sm:px-8 border-emerald-400/60 text-emerald-300 hover:text-emerald-200 hover:border-emerald-400 shadow-[0_0_0_1px_rgba(16,185,129,0.35),0_0_24px_-8px_rgba(16,185,129,0.55)] hover:shadow-[0_0_0_1px_rgba(16,185,129,0.85),0_0_36px_-2px_rgba(16,185,129,0.8)] transition-shadow duration-300"
                                    data-testid="hero-experience-live"
                                >
                                    <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-emerald-300/70" />
                                    <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-emerald-300/70" />
                                    <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-emerald-300/70" />
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-emerald-300/70" />
                                    <span className="uppercase tracking-[0.18em] font-bold">
                                        Experience FSRS Live — Interactive Demo
                                    </span>
                                    <ArrowRight
                                        className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                                        strokeWidth={2.5}
                                    />
                                </Link>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                <div
                                    className="flex items-center gap-2 fsrs-label text-red-400"
                                    data-testid="hero-urgency"
                                >
                                    <span className="fsrs-dot bg-red-500" />
                                    FIRST&nbsp;100&nbsp;ENGINEERS&nbsp;·&nbsp;$249&nbsp;ONE-TIME
                                </div>
                                <MiniDisclaimer testId="hero-mini-disclaimer" />
                            </div>
                        </div>
                    </div>

                    {/* Right column - data card */}
                    <div className="lg:col-span-4 fsrs-rise" style={{ animationDelay: "120ms" }}>
                        <div className="relative border border-white/10 bg-black/60 backdrop-blur">
                            <div className="border-b border-white/10 px-5 py-3 flex items-center justify-between">
                                <span className="fsrs-label text-slate-400">
                                    /&nbsp;CAPABILITY&nbsp;MATRIX
                                </span>
                                <span className="fsrs-label text-red-500">
                                    ACTIVE
                                </span>
                            </div>
                            <ValueRow
                                icon={
                                    <Cpu
                                        className="w-4 h-4 text-red-500"
                                        strokeWidth={1.5}
                                    />
                                }
                                id="01"
                                label="AI INFERENCE"
                                value="Site scans → bill of materials"
                            />
                            <ValueRow
                                icon={
                                    <Box
                                        className="w-4 h-4 text-red-500"
                                        strokeWidth={1.5}
                                    />
                                }
                                id="02"
                                label="3D ROUTING"
                                value="Auto-generated pipe networks"
                            />
                            <ValueRow
                                icon={
                                    <ShieldCheck
                                        className="w-4 h-4 text-red-500"
                                        strokeWidth={1.5}
                                    />
                                }
                                id="03"
                                label="NFPA 13"
                                value="Hydraulic calcs + spec sheet"
                                last
                            />
                            <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between">
                                <span className="fsrs-label text-slate-500">
                                    SEATS
                                </span>
                                <span className="fsrs-mono text-white text-base">
                                    FIRST&nbsp;100&nbsp;ENGINEERS
                                </span>
                            </div>
                            <div className="h-1 bg-red-500/20">
                                <div className="h-1 bg-red-500 w-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function ValueRow({ icon, id, label, value, last }) {
    return (
        <div
            className={`px-5 py-4 flex items-start gap-4 ${last ? "" : "border-b border-white/10"}`}
        >
            <div className="w-8 h-8 border border-white/10 flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <span className="fsrs-label text-slate-200">{label}</span>
                    <span className="fsrs-label text-slate-600">{id}</span>
                </div>
                <p className="mt-1 text-slate-400 text-base font-mono">
                    {value}
                </p>
            </div>
        </div>
    );
}
